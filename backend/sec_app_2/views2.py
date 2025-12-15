from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
import requests
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

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
