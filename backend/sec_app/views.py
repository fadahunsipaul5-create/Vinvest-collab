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
from django.http import JsonResponse
from django.core.management import call_command
from django.views.decorators.csrf import csrf_exempt
from .utility.bot import fetch_google_news


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
    def post(self, request):
        try:
            logger.info(f"Incoming data: {request.data}")

            raw_question = request.data.get("question")
            question = raw_question.strip() if isinstance(raw_question, str) else ""
            if not question:
                return Response(
                    {"error": "Question cannot be empty", "success": False},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            chat_history = request.data.get("chat_history", [])

            if "filtered_context" in request.data:
                filtered_context = request.data["filtered_context"]
            else:
                payload = request.data.get("payload", {})
                company_identifier = request.data.get("company", "").strip()
                metric_list = request.data.get("metrics", [])
                selected_peers = payload.get("companies", [])

                sector = ""
                industry = ""
                if company_identifier:
                    try:
                        company = Company.objects.get(ticker__iexact=company_identifier)
                    except Company.DoesNotExist:
                        try:
                            company = Company.objects.get(name__iexact=company_identifier)
                        except Company.DoesNotExist:
                            company = None
                            logger.warning(f"Company '{company_identifier}' not found in DB.")

                    if company:
                        sector = company.sector or ""
                        industry = company.industry or ""

                filtered_context = {
                    "company": company_identifier,
                    "metric": metric_list[0] if metric_list else "",
                    "sector": sector,
                    "industry": industry,
                    "selected_peers": selected_peers,
                }

            chatbot_payload = {
                "question": question,
                "chat_history": chat_history,
                "filtered_context": filtered_context,
            }

            logger.info(f"Forwarding to chatbot: {chatbot_payload}")

            response = requests.post(
                "https://api.arvatech.info/api/qa_bot",
                json=chatbot_payload,
                timeout=60,
            )

            try:
                data = response.json()
            except ValueError:
                logger.error(f"Non-JSON response from chatbot: {response.text}")
                return Response(
                    {
                        "error": "Invalid response from chatbot service",
                        "raw_response": response.text,
                    },
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            logger.info(f"Chatbot returned {response.status_code}: {data}")
            return Response(data, status=response.status_code)

        except requests.exceptions.RequestException as e:
            logger.error("Chatbot request failed: %s", str(e))
            traceback.print_exc()
            return Response(
                {"error": "Chatbot service unavailable", "details": str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        except Exception as ex:
            logger.exception("Unexpected error")
            traceback.print_exc()
            return Response(
                {"error": "Internal error occurred", "details": str(ex)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

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
            ):  # Check if tickers list is empty or contains empty string or not
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
        )  # Default to "Revenue" with capital R
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
        print(
            f"Found companies in DB: {list(companies.values_list('ticker', flat=True))}"
        )

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
            year_span = int(period.replace("Y", ""))
            metrics = metrics.filter(
                period__period__regex=rf"^\d{{4}}-\d{{2}}$",
                period__period__contains="-",
            )

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

                    aggregated_data.append(
                        {"name": period_str, "ticker": ticker, "value": value}
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
