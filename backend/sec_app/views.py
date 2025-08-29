from django.shortcuts import render
from rest_framework.response import Response
from rest_framework import viewsets, filters
from rest_framework.views import APIView
from rest_framework import status
from django_filters.rest_framework import DjangoFilterBackend
from .models.company import Company
from .models.analysis import SentimentAnalysis
from .models.period import FinancialPeriod
from .models.filling import FilingDocument
from .models.metric import FinancialMetric
from .models.chatlog import ChatLog
from django.db import models
from django.db.models import Avg, Sum
from .models.query import Query
from .serializer import * 
from rest_framework.decorators import api_view,permission_classes
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated
from .api_client import fetch_financial_data
from .utility.utils import *
from django.http import JsonResponse
import logging
import requests
from django.conf import settings
import pandas as pd
import os
import math
from .utility.chatbox import answer_question
import traceback
from django.http import StreamingHttpResponse
import json

logger = logging.getLogger(__name__)
from .utility.bot import *
from django.db import transaction
from django.http import JsonResponse,HttpResponse
from django.core.management import call_command
from django.views.decorators.csrf import csrf_exempt
from .utility.bot import fetch_google_news
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from datetime import datetime
from django.utils import timezone
import stripe
stripe.api_key = settings.STRIPE_SECRET_KEY
from account.models import User
from .models.stripe_event import StripeEvent
from datetime import timedelta
#stripe webhook
@csrf_exempt
def create_checkout_session(request):
    if request.method == 'GET':
        return JsonResponse({"message": "Stripe checkout endpoint is working"}, status=200)
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
    try:
        data = json.loads(request.body)
        tier = data.get('tier')  # "pro" or "pro_plus"

        if tier not in settings.SUBSCRIPTION_PLAN_QUOTAS:
            return JsonResponse({"error": "Invalid tier"}, status=400)

        price_id = settings.STRIPE_PRICE_PRO if tier == 'pro' else settings.STRIPE_PRICE_PRO_PLUS

        if not price_id:
            return JsonResponse({"error": f"Stripe price ID not configured for {tier} plan"}, status=500)

        client_reference_id = None
        customer = None
        customer_email = None

        if getattr(request.user, 'is_authenticated', False):
            client_reference_id = str(request.user.id)
            stripe_customer_id = getattr(request.user, 'stripe_customer_id', None)
            if stripe_customer_id:
                customer = stripe_customer_id
            if not customer:
                customer_email = getattr(request.user, 'email', None)
        else:
            customer_email = data.get('email')

        session_params = {
            'payment_method_types': ['card'],
            'mode': 'subscription',
            'line_items': [{
                'price': price_id,
                'quantity': 1,
            }],
            'success_url': 'https://sec-frontend-791634680391.us-central1.run.app/success?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url': 'https://sec-frontend-791634680391.us-central1.run.app/cancel',
            'metadata': {
                'tier': tier,
                'user_id': client_reference_id or '',
                'email': customer_email or '',
            }
        }

        if customer:
            session_params['customer'] = customer
        elif customer_email:
            session_params['customer_email'] = customer_email

        if client_reference_id:
            session_params['client_reference_id'] = client_reference_id

        session = stripe.checkout.Session.create(**session_params)
        
        return JsonResponse({'sessionId': session.id})

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def stripe_webhook(request):
    if request.method != 'POST':
        return HttpResponse(status=405)

    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    webhook_secret = settings.STRIPE_WEBHOOK_SECRET

    if not webhook_secret:
        # Misconfiguration safeguard
        return HttpResponse(status=500)

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        return HttpResponse(status=400)

    # Idempotency: prevent duplicate handling
    event_id = event.get('id')
    if event_id and StripeEvent.objects.filter(event_id=event_id).exists():
        return HttpResponse(status=200)

    # Persist event for auditing and idempotency
    StripeEvent.objects.create(
        event_id=event_id or '',
        type=event.get('type', ''),
        payload=event
    )

    event_type = event.get('type')

    if event_type == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get("metadata", {}).get("user_id")
        tier = session.get("metadata", {}).get("tier")

        if user_id and tier:
            try:
                user = User.objects.get(id=user_id)
                quota = settings.SUBSCRIPTION_PLAN_QUOTAS.get(tier)
                user.stripe_customer_id = session.get('customer')
                user.stripe_subscription_id = session.get('subscription')
                user.subscription_status = 'active'
                user.set_plan(tier, quota)
            except User.DoesNotExist:
                pass

    elif event_type == 'invoice.paid':
        invoice = event['data']['object']
        customer_id = invoice.get('customer')
        subscription_id = invoice.get('subscription')
        billing_reason = invoice.get('billing_reason')  # e.g., subscription_cycle
        user = None
        if customer_id:
            user = User.objects.filter(stripe_customer_id=customer_id).first()
        if not user and subscription_id:
            user = User.objects.filter(stripe_subscription_id=subscription_id).first()
        if user:
            user.subscription_status = 'active'
            # Derive period end from invoice lines if available
            try:
                lines = invoice.get('lines', {}).get('data', [])
                if lines:
                    period_end_ts = lines[0].get('period', {}).get('end')
                    if period_end_ts:
                        user.subscription_period_end = timezone.make_aware(
                            datetime.utcfromtimestamp(int(period_end_ts))
                        )
            except Exception:
                pass
            # Determine plan from price id on the invoice to keep in sync
            plan_tier = None
            try:
                lines = invoice.get('lines', {}).get('data', [])
                if lines:
                    price_id = lines[0].get('price', {}).get('id')
                    if price_id == settings.STRIPE_PRICE_PRO:
                        plan_tier = 'pro'
                    elif price_id == settings.STRIPE_PRICE_PRO_PLUS:
                        plan_tier = 'pro_plus'
            except Exception:
                pass
            if subscription_id:
                user.stripe_subscription_id = subscription_id
            if customer_id and not user.stripe_customer_id:
                user.stripe_customer_id = customer_id
            # Reset monthly quota on billing cycle invoices
            try:
                if billing_reason in ('subscription_cycle', 'subscription_create'):
                    if plan_tier:
                        user.set_plan(plan_tier)
                    else:
                        # Fall back to current plan reset
                        user.set_plan(user.subscription_plan)
            except Exception:
                pass
            user.save(update_fields=[
                'subscription_status', 'subscription_period_end',
                'stripe_subscription_id', 'stripe_customer_id'
            ])

    elif event_type == 'customer.subscription.updated':
        sub = event['data']['object']
        customer_id = sub.get('customer')
        subscription_id = sub.get('id')
        status = sub.get('status')
        period_end_ts = sub.get('current_period_end')
        # Determine plan from price id
        plan_tier = None
        try:
            items = sub.get('items', {}).get('data', [])
            if items:
                price_id = items[0].get('price', {}).get('id')
                if price_id == settings.STRIPE_PRICE_PRO:
                    plan_tier = 'pro'
                elif price_id == settings.STRIPE_PRICE_PRO_PLUS:
                    plan_tier = 'pro_plus'
        except Exception:
            pass

        user = None
        if customer_id:
            user = User.objects.filter(stripe_customer_id=customer_id).first()
        if not user and subscription_id:
            user = User.objects.filter(stripe_subscription_id=subscription_id).first()
        if user:
            if status:
                user.subscription_status = status
            if period_end_ts:
                try:
                    user.subscription_period_end = timezone.make_aware(
                        datetime.utcfromtimestamp(int(period_end_ts))
                    )
                except Exception:
                    pass
            if plan_tier:
                user.set_plan(plan_tier)
            if subscription_id:
                user.stripe_subscription_id = subscription_id
            if customer_id and not user.stripe_customer_id:
                user.stripe_customer_id = customer_id
            user.save(update_fields=[
                'subscription_status', 'subscription_period_end',
                'stripe_subscription_id', 'stripe_customer_id'
            ])

    elif event_type == 'customer.subscription.deleted':
        sub = event['data']['object']
        customer_id = sub.get('customer')
        subscription_id = sub.get('id')
        user = None
        if customer_id:
            user = User.objects.filter(stripe_customer_id=customer_id).first()
        if not user and subscription_id:
            user = User.objects.filter(stripe_subscription_id=subscription_id).first()
        if user:
            user.subscription_status = 'canceled'
            # Optionally downgrade to free plan
            try:
                user.set_plan('free')
            except Exception:
                pass
            user.save(update_fields=['subscription_status'])

    elif event_type == 'invoice.payment_failed':
        # Optional: mark user as past_due
        invoice = event['data']['object']
        customer_id = invoice.get('customer')
        user = None
        if customer_id:
            user = User.objects.filter(stripe_customer_id=customer_id).first()
        if user:
            user.subscription_status = 'past_due'
            user.save(update_fields=['subscription_status'])

    return HttpResponse(status=200)


class FileUploadView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            if 'files' not in request.FILES:
                return Response({'error': 'No files provided'}, status=status.HTTP_400_BAD_REQUEST)
            files = request.FILES.getlist('files')
            if not files:
                return Response({'error': 'No files selected'}, status=status.HTTP_400_BAD_REQUEST)
            # Validate and prepare files
            files_data = []
            allowed_extensions = ['.pdf', '.txt', '.csv']
            for file in files:
                file_extension = os.path.splitext(file.name)[1].lower()
                if file_extension not in allowed_extensions:
                    return Response({
                        'error': f'File type {file_extension} not supported. Allowed: {", ".join(allowed_extensions)}'
                    }, status=status.HTTP_400_BAD_REQUEST)
                files_data.append(('files', (file.name, file.read(), file.content_type)))
            # Required session ID for the external API
            session_id = request.data.get('session_id')
            if not session_id:
                return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            # Add session_id as a regular form field
            files_data.append(('session_id', (None, session_id, 'text/plain')))
            # POST to external API
            external_url = "http://34.68.84.147:8080/api/user_data_upload"
            logger.info(f"Uploading {len(files)} files to external service with session_id {session_id}")
            response = requests.post(
                external_url,
                files=files_data,
                timeout=120
            )
            if response.status_code == 200:
                return Response({
                    'message': 'Files uploaded and processed successfully',
                    'details': response.json(),
                    'files_processed': len(files)
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'External file processing service returned an error',
                    'details': response.json() if response.headers.get('Content-Type') == 'application/json' else response.text,
                    'files_received': len(files)
                }, status=status.HTTP_502_BAD_GATEWAY)
        except requests.exceptions.Timeout:
            return Response({
                'error': 'File processing timeout. Please try again later.',
                'files_received': len(files)
            }, status=status.HTTP_504_GATEWAY_TIMEOUT)
        except requests.exceptions.ConnectionError:
            return Response({
                'error': 'Unable to connect to file processing service.',
                'files_received': len(files)
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            logger.error(f"Unexpected file upload error: {str(e)}")
            return Response({
                'error': 'Internal server error during file upload.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ContactView(APIView):
    def post(self, request):
        fullname = request.data.get('fullname')
        email = request.data.get('email')
        company = request.data.get('company')
        phone = request.data.get('phone')
        message = request.data.get('message')
        if not all([fullname, email, message, company, phone]):
            return Response({'error': 'All fields required'}, status=status.HTTP_400_BAD_REQUEST)

        result = contact_mail(fullname, email, company, phone, message)
        if result.get('success'):
            return Response({"message": "Contact form submitted successfully"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": result.get('error')}, status=status.HTTP_400_BAD_REQUEST)

@csrf_exempt
@api_view(["GET"])
def load_data(request):
    if request.GET.get("secret") != "letmein":
        return Response({"error": "Unauthorized"}, status=401)

    try:
        fixture_path = os.path.join(
            settings.BASE_DIR, "sec_app", "fixtures", "all_data.json"
        )
        call_command("loaddata", fixture_path, verbosity=1)
        return Response({"status": "success"})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

class ExternalChatbotProxyView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get_user_file_context(self, user_id):
        """
        Fetch context from user's uploaded files via external endpoint
        """
        try:
            external_url = "http://34.68.84.147:8080/api/user_data_context"
            response = requests.get(
                external_url,
                params={'user_id': user_id},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('context', '')
            else:
                logger.warning(f"Failed to fetch user file context: {response.status_code}")
                return ''
                
        except Exception as e:
            logger.error(f"Error fetching user file context: {str(e)}")
            return ''
    
    def post(self, request):
        user = request.user
        question = request.data.get("question", "").strip()
        if not question:
            return Response({"error": "Question cannot be empty"}, status=400)
        
        # Enforce quotas: allow unlimited for pro_plus, otherwise require remaining > 0
        user_plan = getattr(user, 'subscription_plan', 'free') or 'free'
        is_unlimited = user_plan == 'pro_plus'
        questions_remaining = getattr(user, 'questions_remaining', 0)
        
        if not is_unlimited and questions_remaining <= 0:
            # Return a user-friendly message for the chatbot to display
            quota_message = (
                "🚀 Free Plan Limit Reached\n\n"
                "You've used all 10 questions per day from your free plan! To continue asking questions, "
                "please upgrade to one of our premium plans:\n\n"
                "• Pro Plan: 50 questions/month\n"
                "• Pro Plus Plan: Unlimited questions\n\n"
                "Click the upgrade button on your profile or GoPro to continue!"
                "You can also wait till next day to ask more questions."
            )
            return Response({
                "data": {
                    "final_text_answer": quota_message
                },
                "quota_exceeded": True,
                "plan": user_plan,
                "questions_remaining": 0
            }, status=200)  # Return 200 so the frontend handles it as a normal chat response
        
        # Optional contextual filtering
        company_id = request.data.get("company", "").strip()
        metric_list = request.data.get("metrics", [])
        payload = request.data.get("payload", {})
        selected_peers = payload.get("companies", [])
        sector, industry = "", ""
        
        try:
            company = Company.objects.get(ticker__iexact=company_id)
        except Company.DoesNotExist:
            company = Company.objects.filter(name__iexact=company_id).first()
        if company:
            sector = company.sector or ""
            industry = company.industry or ""
        
        # Get user's uploaded file context
        user_file_context = self.get_user_file_context(user.id)
        
        filtered_context = request.data.get("filtered_context", {
            "company": company_id,
            "metric": metric_list[0] if metric_list else "",
            "sector": sector,
            "industry": industry,
            "selected_peers": selected_peers,
            "user_uploaded_files_context": user_file_context,  # Add file context
        })
        
        chatbot_payload = {
            "question": question,
            "chat_history": request.data.get("chat_history", []),
            "filtered_context": filtered_context,
            "user_id": user.id,  # Include user ID for context retrieval
        }
        try:
            response = requests.post("https://api.arvatech.info/api/qa_bot", json=chatbot_payload, timeout=60)
            data = response.json()
        except Exception as e:
            return Response({"error": "Chatbot failed", "details": str(e)}, status=502)
        
        ai_response = data.get("data", {}).get("final_text_answer") or data.get("answer") or "[No answer]"
        
        # Decrement quota only on successful chatbot response for non-unlimited plans
        if not is_unlimited:
            try:
                user.consume_question()
            except Exception:
                pass
        
        return Response(data, status=200)


class ChatSessionListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all chat sessions for the current user"""
        try:
            from .models.chat_session import ChatSession
            
            sessions = ChatSession.objects.filter(user=request.user, is_active=True)
            session_data = []
            for session in sessions:
                session_data.append({
                    'id': session.id,
                    'title': session.title,
                    'created_at': session.created_at.isoformat(),
                    'updated_at': session.updated_at.isoformat(),
                    'message_count': session.message_count
                })
            return Response(session_data, status=200)
        except ImportError:
            return Response([], status=200)
        except Exception as e:
            logger.error(f"Error fetching chat sessions: {str(e)}")
            return Response({'error': 'Failed to fetch chat sessions'}, status=500)


class ChatSessionDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, session_id):
        """Get all messages for a specific chat session"""
        try:
            from .models import ChatSession, ChatHistory
            
            session = get_object_or_404(ChatSession, id=session_id, user=request.user)
            messages = ChatHistory.objects.filter(session=session)
            
            formatted_messages = []
            for msg in messages:
                # Add user message
                if msg.question:
                    formatted_messages.append({
                        'id': f"{msg.id}_user",
                        'role': 'user',
                        'content': msg.question,
                        'timestamp': msg.timestamp.isoformat() if msg.timestamp else None
                    })
                
                # Add assistant message
                if msg.answer:
                    formatted_messages.append({
                        'id': f"{msg.id}_assistant",
                        'role': 'assistant',
                        'content': msg.answer,
                        'timestamp': msg.timestamp.isoformat() if msg.timestamp else None
                    })
            
            return Response({
                'session_id': session.id,
                'title': session.title,
                'messages': formatted_messages
            }, status=200)
            
        except ImportError:
            return Response({'error': 'Chat models not available'}, status=500)
        except Exception as e:
            logger.error(f"Error fetching chat session {session_id}: {str(e)}")
            return Response({'error': 'Failed to fetch chat session'}, status=500)

    def delete(self, request, session_id):
        """Delete a chat session"""
        try:
            from .models import ChatSession
            
            session = get_object_or_404(ChatSession, id=session_id, user=request.user)
            session.is_active = False
            session.save()
            
            return Response({'message': 'Chat session deleted successfully'}, status=200)
            
        except ImportError:
            return Response({'error': 'Chat models not available'}, status=500)
        except Exception as e:
            logger.error(f"Error deleting chat session {session_id}: {str(e)}")
            return Response({'error': 'Failed to delete chat session'}, status=500)


@api_view(["GET"])
async def extract_financials(request):
    ticker = request.GET.get("ticker", "AAPL")

    data = fetch_financial_data(ticker)
    if data and data.get("filings"):
        try:
            sample_filing = data["filings"][0]

            if "data" in sample_filing:
                logger.info(f"Sample metrics: {list(sample_filing['data'].keys())[:5]}")
            else:
                logger.warning(
                    "No 'data' field found in filing - metrics may not be saved"
                )

            await save_financial_data_to_db(data)
            return JsonResponse(
                {
                    "message": f"Data fetched and saved for {ticker}",
                    "filings_count": len(data["filings"]),
                    "sample_filing": {
                        "type": sample_filing.get("formType"),
                        "date": sample_filing.get("filedAt"),
                        "docs": sample_filing.get("documentFormatFiles"),
                    },
                }
            )
        except Exception as e:
            return JsonResponse({"error": f"Error saving data: {str(e)}"}, status=500)
    return JsonResponse({"error": "No valid 10-K filings found"}, status=500)


class CompanyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["ticker", "cik"]
    search_fields = ["ticker", "name", "cik"]


class FilingViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FilingDocument.objects.all()
    serializer_class = FilingDocumentSerializer


class FinancialMetricViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FinancialMetric.objects.all()
    serializer_class = FinancialMetricSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["company__ticker", "company__name", "metric_name", "period__id"]
    search_fields = ["company__name", "company__ticker", "metric_name"]

    def get_queryset(self):
        queryset = FinancialMetric.objects.all()
        count = queryset.count()
        logger.info(f"FinancialMetricViewSet: Found {count} metrics in database")
        if count == 0:
            company_count = Company.objects.count()
            period_count = FinancialPeriod.objects.count()
            logger.info(
                f"Diagnostic: Found {company_count} companies and {period_count} periods"
            )
        return queryset


class ChartDataAPIView(APIView):
    def get(self, request):
        try:
            tickers = request.GET.get("tickers", "").split(",")
            metric = request.GET.get("metric", "revenue")

            if (
                not tickers or not tickers[0]
            ):  # Check if tickers list is empty or contains empty string 
                return Response(
                    {"error": "Tickers are required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            all_metrics = []
            all_periods = set()

            for ticker in tickers:
                company = Company.objects.filter(ticker=ticker).first()
                if company:
                    metrics = FinancialMetric.objects.filter(
                        company=company, metric_name=metric
                    ).select_related("period")

                    # Log the number of metrics found
                    logger.info(f"Found {metrics.count()} metrics for {ticker}")

                    for m in metrics:
                        period = m.period.period
                        all_periods.add(period)
                        all_metrics.append(
                            {
                                "ticker": ticker,
                                "period": period,
                                "value": float(m.value) if m.value is not None else 0,
                            }
                        )

            # Organize data by period
            period_data = []
            for period in sorted(all_periods):
                period_values = {
                    "period": period,
                    "values": {
                        metric["ticker"]: metric["value"]
                        for metric in all_metrics
                        if metric["period"] == period
                    },
                }
                period_data.append(period_values)

            # Log the response data
            return Response(
                {"tickers": tickers, "metrics": period_data, "selected_metric": metric},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": f"Internal server error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @staticmethod
    def get_available_metrics(request):
        metrics = FinancialMetric.objects.values_list(
            "metric_name", flat=True
        ).distinct()
        return Response({"metrics": list(metrics)})


class InsightsAPIView(APIView):
    def get(self, request):
        ticker = request.GET.get("ticker")
        if not ticker:
            return Response(
                {"error": "Ticker is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        company = Company.objects.filter(ticker=ticker).first()
        if not company:
            return Response(
                {"error": "Company not found."}, status=status.HTTP_404_NOT_FOUND
            )

        insights = []
        revenue_trend = FinancialMetric.objects.filter(
            period__company=company,metric_name="Revenue"
        ).order_by("period__year")

        if revenue_trend.count() >= 5:
            last_5_years = [rev.value for rev in revenue_trend][-5:]
            if last_5_years == sorted(last_5_years, reverse=True):
                insights.append("Revenue has declined for the last 5 years.")

        return Response(
            {"ticker": ticker, "insights": insights}, status=status.HTTP_200_OK
        )


class CustomQueryAPIView(APIView):
    def post(self, request):
        ticker = request.data.get("ticker")
        metrics = request.data.get("metrics", [])
        periods = request.data.get("periods", [])

        if not ticker:
            return Response(
                {"error": "Ticker is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        company = Company.objects.filter(ticker=ticker).first()
        if not company:
            return Response(
                {"error": "Company not found."}, status=status.HTTP_404_NOT_FOUND
            )

        data = {}
        for metric in metrics:
            data[metric] = {}
            for period in periods:
                fm = FinancialMetric.objects.filter(
                    period__company=company, metric_name=metric, period__year=period
                ).first()
                data[metric][period] = fm.value if fm else None

        return Response({"ticker": ticker, "data": data}, status=status.HTTP_200_OK)


class IndustryComparisonAPIView(APIView):
    def get(self, request):
        try:
            industries = request.GET.get("industries", "").split(",")
            metric = request.GET.get("metric", "revenue")

            # Read industry mappings from Excel
            df = pd.read_excel(os.path.join("sec_app", "data", "stocks_perf_data.xlsx"))

            # Create industry-ticker mapping
            industry_tickers = {}
            for industry in industries:
                industry_tickers[industry] = df[df["Industry"] == industry][
                    "Symbol"
                ].tolist()

            # Get all metrics for these companies
            all_metrics = []
            for industry, tickers in industry_tickers.items():
                metrics = (
                    FinancialMetric.objects.filter(
                        company__ticker__in=tickers, metric_name=metric
                    )
                    .values("period__period")
                    .annotate(
                        avg_value=Avg("value")  # Calculate average instead of sum
                    )
                    .order_by("period__period")
                )

                # Add to all metrics
                for m in metrics:
                    all_metrics.append(
                        {
                            "period": m["period__period"],
                            "industry": industry,
                            "value": float(m["avg_value"] or 0),  # Use average value
                        }
                    )

            # Get unique periods
            all_periods = sorted(set(m["period"] for m in all_metrics))

            # Format data for chart
            chart_data = []
            for period in all_periods:
                data_point = {"period": period}
                for industry in industries:
                    avg = next(
                        (
                            m["value"]
                            for m in all_metrics
                            if m["period"] == period and m["industry"] == industry
                        ),
                        0,
                    )
                    data_point[f"{industry}_total"] = (
                        avg  # Keep the key name for frontend compatibility
                    )
                chart_data.append(data_point)

            return Response({"industries": industries, "comparisons": chart_data})

        except Exception as e:
            return Response({"error": str(e)}, status=500)


class FinancialMetricsAPIView(APIView):
    def get(self, request):
        ticker = request.GET.get("company__ticker")
        if not ticker:
            return Response(
                {"error": "Ticker is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        metrics = FinancialMetric.objects.filter(company__ticker=ticker)

        if not metrics.exists():
            return Response(
                {"error": "No financial data available for this ticker."},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = [
            {
                "id": metric.id,
                "company": metric.company.id,
                "period": metric.period.id,
                "metric_name": metric.metric_name,
                "value": metric.value,
                "unit": metric.unit,
                "xbrl_tag": metric.xbrl_tag,
                "company_name": metric.company.name,
                "company_ticker": metric.company.ticker,
            }
            for metric in metrics
        ]

        return Response(data, status=status.HTTP_200_OK)


class IndustryAPIView(APIView):
    def get(self, request):
        try:
            # Get companies we have data for
            companies_with_data = Company.objects.values_list("ticker", flat=True)

            # Read the Excel file
            file_path = os.path.join("sec_app", "data", "stocks_perf_data.xlsx")
            df = pd.read_excel(file_path)

            # Filter DataFrame to only include companies we have data for
            df = df[df["Symbol"].isin(companies_with_data)]

            # Get industries that have companies with data
            industries = (
                df[["Industry", "Symbol"]]
                .dropna()
                .groupby("Industry")["Symbol"]
                .apply(list)
                .to_dict()
            )

            return Response(
                {
                    "industries": [
                        {"name": industry, "companies": companies}
                        for industry, companies in industries.items()
                        if len(companies) > 0  # Only include industries with companies
                    ]
                }
            )
        except Exception as e:
            return Response(
                {"error": "Failed to fetch industries"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class BoxPlotDataAPIView(APIView):
    def get(self, request):
        metrics = request.GET.getlist("metric[]")
        period = request.GET.get("period")
        industry = request.GET.get("industry")

        if metrics and period:
            try:
                file_path = os.path.join("sec_app", "data", "stocks_perf_data.xlsx")
                df = pd.read_excel(file_path)

                if industry:
                    industry_companies = df[df["Industry"] == industry][
                        "Symbol"
                    ].tolist()

                    current_year = 2024
                    period_str = ""
                    if period == "1Y":
                        period_str = str(current_year)
                    elif period == "2Y":
                        period_str = f"{current_year - 1}-{str(current_year)[-2:]}"
                    elif period == "3Y":
                        period_str = f"{current_year - 2}-{str(current_year)[-2:]}"
                    elif period == "4Y":
                        period_str = f"{current_year - 3}-{str(current_year)[-2:]}"
                    elif period == "5Y":
                        period_str = f"{current_year - 4}-{str(current_year)[-2:]}"
                    elif period == "10Y":
                        period_str = f"{current_year - 9}-{str(current_year)[-2:]}"
                    elif period == "15Y":
                        period_str = f"{current_year - 14}-{str(current_year)[-2:]}"
                    elif period == "20Y":
                        period_str = f"{current_year - 19}-{str(current_year)[-2:]}"
                    else:
                        return Response({"error": "Invalid period format"}, status=400)

                    # Process each metric
                    result_data = {}
                    result_companies = {}

                    for metric in metrics:
                        metrics_query = (
                            FinancialMetric.objects.filter(
                                metric_name=metric,
                                period__period__contains=period_str,
                                company__ticker__in=industry_companies,
                            )
                            .select_related("company")
                            .order_by("company__ticker")
                        )

                        values = []
                        company_names = []
                        for metric_obj in metrics_query:
                            if metric_obj.value is not None:
                                try:
                                    value = float(metric_obj.value)
                                    if not math.isfinite(value):
                                        continue
                                    values.append(value)
                                    company_names.append(metric_obj.company.ticker)
                                except (ValueError, TypeError):
                                    logger.warning(
                                        f"could not convert value '{metric_obj.value}' to float for {metric_obj.company.ticker}. Skipping."
                                    )
                                    continue

                        # Sort and store data for this metric
                        if values and company_names:
                            zipped = sorted(
                                zip(company_names, values), key=lambda x: x[0]
                            )
                            company_names, values = zip(*zipped)
                            result_data[metric] = list(values)
                            result_companies[metric] = list(company_names)

                    data = {"values": result_data, "companyNames": result_companies}
                    return Response(data, status=status.HTTP_200_OK)

                return Response(
                    {"error": "Industry parameter required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            except Exception as e:
                return Response(
                    {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            return Response(
                {"error": "Invalid parameters"}, status=status.HTTP_400_BAD_REQUEST
            )


class AggregatedDataAPIView(APIView):
    def get(self, request):
        tickers = request.GET.get("tickers", "").split(",")
        metric = request.GET.get(
            "metric", "Revenue"
        )  
        period = request.GET.get("period", "1Y").strip('"')
        if not tickers or not tickers[0]:
            return Response({"error": "Tickers are required."}, status=400)
        print(
            f"Fetching data for tickers: {tickers}, metric: {metric}, period: {period}"
        )
        # Capitalize first letter of metric to match database
        metric = metric[0].upper() + metric[1:] if metric else ""
        # Check if companies exist
        companies = Company.objects.filter(ticker__in=tickers)
        print(f"Found companies in DB: {list(companies.values_list('ticker', flat=True))}")
        # Get metrics based on period type
        metrics = FinancialMetric.objects.filter(
            company__ticker__in=tickers, metric_name=metric
        ).select_related("period")
        print(f"Found {metrics.count()} total metrics")
        print(f"SQL Query: {metrics.query}")
        # Filter metrics based on period type
        if period == "1Y":
            metrics = metrics.filter(period__period__regex=r"^\d{4}$")
        else:
            # Filter by exact period type (2Y, 3Y, 4Y, etc.)
            metrics = metrics.filter(period__period__startswith=f"{period}: ")
            

        print(f"After period filtering: {metrics.count()} metrics")

        # Group by period and calculate aggregates
        aggregated_data = []
        for ticker in tickers:
            ticker_metrics = metrics.filter(company__ticker=ticker)
            print(f"\nProcessing {ticker}:")
            print(f"Found {ticker_metrics.count()} metrics")
            if ticker_metrics.exists():
                print(
                    "Sample periods:",
                    list(ticker_metrics.values_list("period__period", flat=True))[:5],
                )

            for metric_obj in ticker_metrics:
                try:
                    value_raw = (
                        float(metric_obj.value)
                        if metric_obj.value is not None
                        else None
                    )
                    value = (
                        None
                        if value_raw is None
                        or math.isnan(value_raw)
                        or math.isinf(value_raw)
                        else value_raw
                    )

                    period_str = metric_obj.period.period
                    print(f"Adding data point: {ticker}, {period_str}, {value}")

                    # For frontend compatibility, extract just the year part from period names
                    display_name = period_str
                    if ": " in period_str:
                        display_name = period_str.split(": ")[1]  # "2Y: 2023-24" -> "2023-24"
                    
                    aggregated_data.append(
                        {"name": display_name, "ticker": ticker, "value": value}
                    )
                except Exception as e:
                    print(f"Error processing metric: {str(e)}")

        # Sort data chronologically
        aggregated_data.sort(key=lambda x: x["name"])

        if not aggregated_data:
            print("No data was aggregated")

        return Response(aggregated_data, status=200)


@api_view(["GET"])
def get_available_metrics(request):
    try:
        company_ticker = request.GET.get("company__ticker", None)

        if company_ticker:
            company = Company.objects.filter(ticker=company_ticker).first()
            if not company:
                return Response({"metrics": []})

            metrics_qs = (
                FinancialMetric.objects.filter(company=company)
                .values_list("metric_name", flat=True)
                .distinct()
            )
        else:
            metrics_qs = FinancialMetric.objects.values_list(
                "metric_name", flat=True
            ).distinct()

        # Convert to set to guarantee uniqueness, then back to sorted list
        unique_metrics = sorted(set(metrics_qs))

        return Response({"metrics": unique_metrics})

    except Exception as e:
        return Response(
            {"error": f"Failed to fetch metrics: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def check_company(request, ticker):
    try:
        company = Company.objects.get(ticker=ticker)
        metrics_count = FinancialMetric.objects.filter(company=company).count()

        if metrics_count == 0:
            return Response(
                {"error": f"No financial data available for {ticker}"}, status=404
            )

        return Response(
            {
                "ticker": company.ticker,
                "name": company.name,
                "metrics_count": metrics_count,
            }
        )
    except Company.DoesNotExist:
        return Response({"error": f"Company {ticker} not found"}, status=404)


class ChatBatchListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all chat batches for the current user"""
        try:
            from .models import ChatBatch
            
            batches = ChatBatch.objects.filter(user=request.user)[:10]  # Get latest 10
            
            batch_data = []
            for batch in batches:
                batch_data.append({
                    'id': batch.id,
                    'title': batch.title,
                    'message_count': batch.message_count,
                    'created_at': batch.created_at.isoformat() if batch.created_at else None,
                    'updated_at': batch.updated_at.isoformat() if batch.updated_at else None
                })
            
            return Response(batch_data, status=200)
            
        except ImportError:
            return Response({'error': 'ChatBatch model not available'}, status=500)
        except Exception as e:
            logger.error(f"Error fetching chat batches: {str(e)}")
            return Response({'error': 'Failed to fetch chat batches'}, status=500)

    def post(self, request):
        """Save a new chat batch"""
        try:
            from .models import ChatBatch
            
            messages = request.data.get('messages', [])
            title = request.data.get('title', 'New Chat')
            
            if not messages:
                return Response({'error': 'Messages cannot be empty'}, status=400)
            
            # Create new chat batch
            batch = ChatBatch.objects.create(
                user=request.user,
                title=title,
                messages=messages
            )
            
            # Update title from first message if title is default
            if title == 'New Chat':
                batch.update_title_from_first_message()
            
            return Response({
                'id': batch.id,
                'title': batch.title,
                'message_count': batch.message_count,
                'created_at': batch.created_at.isoformat(),
                'updated_at': batch.updated_at.isoformat()
            }, status=201)
            
        except ImportError:
            return Response({'error': 'ChatBatch model not available'}, status=500)
        except Exception as e:
            logger.error(f"Error saving chat batch: {str(e)}")
            return Response({'error': 'Failed to save chat batch'}, status=500)


class ChatBatchDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, batch_id):
        """Get messages for a specific chat batch"""
        try:
            from .models import ChatBatch
            
            batch = get_object_or_404(ChatBatch, id=batch_id, user=request.user)
            
            return Response({
                'batch_id': batch.id,
                'title': batch.title,
                'messages': batch.messages,
                'created_at': batch.created_at.isoformat() if batch.created_at else None,
                'updated_at': batch.updated_at.isoformat() if batch.updated_at else None
            }, status=200)
            
        except ImportError:
            return Response({'error': 'ChatBatch model not available'}, status=500)
        except Exception as e:
            logger.error(f"Error fetching chat batch {batch_id}: {str(e)}")
            return Response({'error': 'Failed to fetch chat batch'}, status=500)

    def delete(self, request, batch_id):
        """Delete a chat batch"""
        try:
            from .models import ChatBatch
            
            batch = get_object_or_404(ChatBatch, id=batch_id, user=request.user)
            batch.delete()
            
            return Response({'message': 'Chat batch deleted successfully'}, status=200)
            
        except ImportError:
            return Response({'error': 'ChatBatch model not available'}, status=500)
        except Exception as e:
            logger.error(f"Error deleting chat batch {batch_id}: {str(e)}")
            return Response({'error': 'Failed to delete chat batch'}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate_free_plan(request):
    try:
        user = request.user
        
        if user.subscription_plan in ['pro', 'pro_plus']:
            return Response({
                'message': 'User already has an active paid plan',
                'current_plan': user.subscription_plan
            }, status=200)
        
        # Check if 24 hours have passed since registration
        hours_since_registration = (timezone.now() - user.date_joined).total_seconds() / 3600
        
        # For development/testing: allow activation after 1 minute if DEBUG is True
        min_hours_required = 1/60 if settings.DEBUG else 24  # 1 minute vs 24 hours
        
        if hours_since_registration < min_hours_required:
            return Response({
                'message': 'User not eligible for auto-activation yet',
                'hours_remaining': min_hours_required - hours_since_registration,
                'current_plan': user.subscription_plan,
                'min_hours_required': min_hours_required
            }, status=400)
        
        # Activate free plan
        user.set_plan('free', quota=10)
        user.subscription_status = 'active'
        user.save(update_fields=['subscription_status'])
        
        logger.info(f"Auto-activated free plan for user {user.email} after {hours_since_registration:.2f} hours")
        
        return Response({
            'message': 'Free plan activated successfully',
            'plan': 'free',
            'questions_remaining': user.questions_remaining,
            'activation_time': timezone.now().isoformat(),
            'hours_since_registration': hours_since_registration
        }, status=200)
        
    except Exception as e:
        logger.error(f"Error activating free plan for user {request.user.email}: {str(e)}")
        return Response({
            'error': 'Failed to activate free plan',
            'details': str(e)
        }, status=500)
