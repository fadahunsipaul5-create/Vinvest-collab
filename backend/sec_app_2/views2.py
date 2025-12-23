from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
import requests
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import StreamingHttpResponse

# CONSTANT for the external API base URL
EXTERNAL_API_BASE_URL = "http://34.68.84.147:8080"

# --- SECTION: SPECIAL METRICS ---

@method_decorator(csrf_exempt, name='dispatch')
class MarketCapView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        """Get Market Cap (API #1)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/special_metrics/market_cap"
            response = requests.post(url, json=request.data, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@method_decorator(csrf_exempt, name='dispatch')
class SharesOutstandingView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        """Get Shares Outstanding (API #2)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/special_metrics/shares_outstanding"
            response = requests.post(url, json=request.data, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@method_decorator(csrf_exempt, name='dispatch')
class StockPriceView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        """Get Stock Price (API #3)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/special_metrics/stock_price"
            response = requests.post(url, json=request.data, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@method_decorator(csrf_exempt, name='dispatch')
class IntrinsicToMarketCapView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        """Get Intrinsic to Market Cap (API #3b)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/special_metrics/intrinsic_to_mc"
            response = requests.post(url, json=request.data, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@method_decorator(csrf_exempt, name='dispatch')
class TopPicksRankingView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Get investment factor ranking table (API #4)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/special_metrics/investment_factor_ranking_table"
            # Forward the body (tickers list)
            response = requests.post(url, json=request.data, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@method_decorator(csrf_exempt, name='dispatch')
class TopPicksRankingAllView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get investment factor ranking table for all companies"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/special_metrics/investment_factor_ranking_table_for_all_companies"
            # External API requires POST even though this is a read operation
            response = requests.post(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@method_decorator(csrf_exempt, name='dispatch')
class TopPicksRankingAllHistoryView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, date):
        """Get investment factor ranking table for all companies in history dates"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/special_metrics/investment_factor_ranking_table_for_all_companies/{date}"
            # External API requires POST
            response = requests.post(url, json=request.data, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


# --- SECTION: GRAPHDB ---

class TopPicksSectorsView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get all sectors (API #5)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/graphdb/sectors"
            response = requests.get(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class TopPicksIndustriesView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get industries for a sector (API #6)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/graphdb/industries_when_sector_given"
            # Pass query params (sectorId or sectorName)
            response = requests.get(url, params=request.GET, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class CompaniesByIndustryView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get companies for an industry (API #7)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/graphdb/companies_when_industry_given"
            # Pass query params (industryId or industryName)
            response = requests.get(url, params=request.GET, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

# --- SECTION: CENTRALIZED API ---

class CompaniesView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get all available companies (Central API #1)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/central/companies"
            response = requests.get(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class MetricsView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get available financial metrics (Central API #2)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/central/metrics"
            # Forward query params (include_predicted, display_names)
            response = requests.get(url, params=request.GET, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class IndustriesView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get available industries (Central API #3)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/central/industries"
            response = requests.get(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class AggregatedDataView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get aggregated company data (Central API #4)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/central/aggregated-data"
            # Forward all query params (tickers, metric, period, periodType)
            response = requests.get(url, params=request.GET, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class IndustryComparisonView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get historical average performance comparison across industries (Central API #5)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/central/industry-comparison"
            # Forward all query params (industries, metric, period)
            response = requests.get(url, params=request.GET, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class RankingTypesView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get available ranking types (Central API #6)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/central/rankings/types"
            response = requests.get(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class HistoricalRankingView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Get historical company ranking (Central API #7)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/central/rankings/historical"
            # Forward all query params (tickers, rankingType, period)
            response = requests.get(url, params=request.GET, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class FinancialsIncomeStatementView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, ticker):
        """Get income statement data for a company (Central API #8)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/central/financials/income-statement/{ticker}"
            response = requests.get(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class FinancialsBalanceSheetView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, ticker):
        """Get balance sheet data for a company (Central API #9)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/central/financials/balance-sheet/{ticker}"
            response = requests.get(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class FinancialsCashFlowView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, ticker):
        """Get cash flow data for a company (Central API #10)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/central/financials/cash-flow/{ticker}"
            response = requests.get(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class FinancialsNOPATView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, ticker):
        """Get NOPAT analysis data for a company (Central API #11)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/central/analysis/nopat/{ticker}"
            response = requests.get(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class FinancialsInvestedCapitalView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, ticker):
        """Get invested capital data for a company (Central API #12)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/central/analysis/invested-capital/{ticker}"
            response = requests.get(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class FinancialsFreeCashFlowView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, ticker):
        """Get free cash flow analysis data for a company (Central API #13)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/central/analysis/free-cash-flow/{ticker}"
            response = requests.get(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class FinancialsROICView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, ticker):
        """Get ROIC breakdown data for a company (Central API #14)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/central/analysis/roic/{ticker}"
            response = requests.get(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class FinancialsOperationalPerformanceView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, ticker):
        """Get operational performance metrics for a company (Central API #15)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/central/analysis/operational-performance/{ticker}"
            response = requests.get(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class FinancialsFinancingHealthView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, ticker):
        """Get financing health metrics for a company (Central API #16)"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/central/analysis/financing-health/{ticker}"
            response = requests.get(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class DeepQABotReportView(APIView):
    permission_classes = [AllowAny]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        """Generate a report using the Deep QA Bot Report API"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/deep_qa_bot_report"
            
            # Forward the request body to the external API
            response = requests.post(
                url,
                json=request.data,
                headers={'Content-Type': 'application/json'},
                timeout=300  # Increased timeout for report generation
            )
            
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
            return Response(
                {"error": "External API unavailable", "details": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

class DeepQABotView(APIView):
    permission_classes = [AllowAny]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        """Standard QA Chatbot Endpoint"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/deep_qa_bot"
            
            # Forward the request body to the external API
            response = requests.post(
                url,
                json=request.data,
                headers={'Content-Type': 'application/json'},
                timeout=300  # Long timeout for model processing
            )
            
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
            return Response(
                {"error": "External API unavailable", "details": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

class DeepQABotStreamView(APIView):
    permission_classes = [AllowAny]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        """Streaming QA Chatbot Endpoint"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/deep_qa_bot_stream"
            
            # Forward the request to the external API with stream=True
            external_response = requests.post(
                url,
                json=request.data,
                headers={'Content-Type': 'application/json'},
                stream=True,
                timeout=60
            )
            
            # Create a generator to yield chunks from the external response
            def event_stream():
                try:
                    for line in external_response.iter_lines():
                        if line:
                            # Forward the SSE line directly
                            yield line + b'\n'
                except Exception as e:
                     # In case of stream error, try to yield an error event
                     yield f'event: error\ndata: {{"error": "{str(e)}"}}\n\n'.encode('utf-8')

            return StreamingHttpResponse(
                event_stream(),
                content_type='text/event-stream'
            )
        except requests.RequestException as e:
             return Response(
                {"error": "External API unavailable", "details": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

class DeepQABotReportStreamView(APIView):
    permission_classes = [AllowAny]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        """Streaming Report Generation Endpoint"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/deep_qa_bot_stream_report"
            
            # Forward the request to the external API with stream=True
            external_response = requests.post(
                url,
                json=request.data,
                headers={'Content-Type': 'application/json'},
                stream=True,
                timeout=60
            )
            
            # Create a generator to yield chunks from the external response
            def event_stream():
                try:
                    for line in external_response.iter_lines():
                        if line:
                            # Forward the SSE line directly
                            yield line + b'\n'
                except Exception as e:
                     # In case of stream error, try to yield an error event
                     yield f'event: error\ndata: {{"error": "{str(e)}"}}\n\n'.encode('utf-8')

            return StreamingHttpResponse(
                event_stream(),
                content_type='text/event-stream'
            )
        except requests.RequestException as e:
             return Response(
                {"error": "External API unavailable", "details": str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

class ReportSessionsView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """List Report Sessions"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/sessions_report"
            response = requests.get(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    def delete(self, request):
        """Clear All Report Sessions"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/sessions_report"
            response = requests.delete(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class ReportSessionDetailView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, session_id):
        """Get Specific Report Session"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/sessions_report/{session_id}"
            response = requests.get(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    def delete(self, request, session_id):
        """Delete Specific Report Session"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/sessions_report/{session_id}"
            response = requests.delete(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


# ============================================================================
# Chat Sessions Management Endpoints (General/Insights Chat)
# ============================================================================

class ChatSessionsView(APIView):
    """
    Handle listing and clearing all chat sessions
    GET: List all sessions
    DELETE: Clear all sessions
    """
    permission_classes = [AllowAny]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get(self, request):
        """List Chat Sessions"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/sessions"
            response = requests.get(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    def delete(self, request):
        """Clear All Chat Sessions"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/sessions"
            response = requests.delete(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class ChatSessionDetailView(APIView):
    """
    Handle individual chat session operations
    GET: Get specific session
    DELETE: Delete specific session
    """
    permission_classes = [AllowAny]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def get(self, request, session_id):
        """Get Specific Chat Session"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/sessions/{session_id}"
            response = requests.get(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    def delete(self, request, session_id):
        """Delete Specific Chat Session"""
        try:
            url = f"{EXTERNAL_API_BASE_URL}/api/sessions/{session_id}"
            response = requests.delete(url, timeout=10)
            return Response(response.json(), status=response.status_code)
        except requests.RequestException as e:
             return Response({"error": "External API unavailable", "details": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
