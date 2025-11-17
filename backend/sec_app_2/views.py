from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
import logging
import os
from django.http import HttpResponse, HttpResponseNotFound
from django.conf import settings
from sec_app.models.multiples import CompanyMultiples
from sec_app.serializer import CompanyMultiplesSerializer

from .utils import (
    calculate_income_statement_field,
    update_income_statement_calculations,
    recalculate_dependent_fields,
    update_balance_sheet_calculations,
    recalculate_balance_sheet_dependent_fields,
)

logger = logging.getLogger(__name__)
FIELD_MAP = {
    "revenue": "Revenue",
    "cost_of_revenue": "CostOfRevenue",
    "sga": "SellingGeneralAdministrative",
    "selling_general_administrative": "SellingGeneralAdministrative",
    "depreciation": "Depreciation",
    "interest_expense": "InterestExpense",
    "interest_income": "InterestIncome",
    "other_income": "OtherIncome",
    "tax_provision": "TaxProvision",
    "net_income_noncontrolling": "NetIncomeNoncontrolling",
}


def normalize_fields(year_data: dict) -> dict:
    normalized = {}
    for key, value in year_data.items():
        std_key = FIELD_MAP.get(key.lower(), key)  # fallback to original key
        normalized[std_key] = value
    return normalized


class IncomeStatementView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            income_data = request.data.get("data", {})
            year = str(request.data.get("year"))
            field_name = request.data.get("field_name")

            if not year:
                return Response(
                    {"error": "Year is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if year not in income_data:
                income_data = {year: income_data}

            income_data[year] = normalize_fields(income_data.get(year, {}))

            if field_name:
                result = calculate_income_statement_field(income_data, year, field_name)
                if result is not None:
                    return Response(
                        {
                            "success": True,
                            "field_name": field_name,
                            "year": year,
                            "value": result,
                        }
                    )
                return Response(
                    {"error": f"Could not calculate {field_name} for year {year}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            updated_data = update_income_statement_calculations(income_data, year)
            calculated_field_names = [
                "GrossIncome",
                "OperatingExpense",
                "OperatingIncome",
                "NetNonOperatingInterestIncome",
                "PretaxIncome",
                "ProfitLossControlling",
                "NetIncome",
            ]

            year_data = updated_data.get(year, {})
            calculated_fields = {
                field: year_data.get(field)
                for field in calculated_field_names
                if field in year_data
            }

            return Response(
                {
                    "success": True,
                    "year": year,
                    "calculated_fields": calculated_fields,
                    "updated_data": updated_data,
                }
            )

        except Exception as e:
            logger.exception("Error in calculate_income_statement")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DependentFieldsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            income_data = request.data.get("data", {})
            year = str(request.data.get("year"))
            changed_field = request.data.get("changed_field")

            if not year or not changed_field:
                return Response(
                    {"error": "Year and changed_field are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if year not in income_data:
                income_data = {year: income_data}

            income_data[year] = normalize_fields(income_data.get(year, {}))

            updated_data = recalculate_dependent_fields(
                income_data, year, changed_field
            )

            calculated_field_names = [
                "GrossIncome",
                "OperatingExpense",
                "OperatingIncome",
                "NetNonOperatingInterestIncome",
                "PretaxIncome",
                "ProfitLossControlling",
                "NetIncome",
            ]

            year_data = updated_data.get(year, {})
            recalculated_fields = {
                field: year_data.get(field)
                for field in calculated_field_names
                if field in year_data
            }

            return Response(
                {
                    "success": True,
                    "year": year,
                    "changed_field": changed_field,
                    "recalculated_fields": recalculated_fields,
                    "updated_data": updated_data,
                }
            )

        except Exception as e:
            logger.exception("Error in recalculate_dependent_fields_api")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BalanceSheetDependentFieldsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            bs_data = request.data.get("data", {})
            year = str(request.data.get("year"))
            changed_field = request.data.get("changed_field")

            if not year or not changed_field:
                return Response(
                    {"error": "Year and changed_field are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if year not in bs_data:
                bs_data = {year: bs_data}

            # No normalization schema yet; use as-is

            updated_data = recalculate_balance_sheet_dependent_fields(
                bs_data, year, changed_field
            )

            calculated_field_names = [
                "AssetsCurrent",
                "AssetsNoncurrent",
                "TotalAssets",
                "LiabilitiesCurrent",
                "LiabilitiesNoncurrent",
                "TotalLiabilities",
                "StockholdersEquity",
                "LiabilitiesAndStockholdersEquity",
            ]

            year_data = updated_data.get(year, {})
            recalculated_fields = {}
            for field in calculated_field_names:
                if field in year_data:
                    value = year_data.get(field)
                    # Map API result keys to UI aliases where needed
                    if field == "TotalAssets":
                        recalculated_fields["Assets"] = value
                    elif field == "TotalLiabilities":
                        recalculated_fields["Liabilities"] = value
                    elif field == "AssetsCurrent":
                        recalculated_fields["CurrentAssets"] = value
                    elif field == "AssetsNoncurrent":
                        recalculated_fields["TotalNonCurrentAssets"] = value
                    elif field == "LiabilitiesCurrent":
                        recalculated_fields["CurrentLiabilities"] = value
                    recalculated_fields[field] = value

            return Response(
                {
                    "success": True,
                    "year": year,
                    "changed_field": changed_field,
                    "recalculated_fields": recalculated_fields,
                    "updated_data": updated_data,
                }
            )

        except Exception as e:
            logger.exception("Error in balance_sheet_dependent_fields_api")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BalanceSheetCalculateAllView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            bs_data = request.data.get("data", {})
            year = str(request.data.get("year"))

            if not year:
                return Response(
                    {"error": "Year is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if year not in bs_data:
                bs_data = {year: bs_data}

            updated_data = update_balance_sheet_calculations(bs_data, year)

            calculated_field_names = [
                "AssetsCurrent",
                "AssetsNoncurrent",
                "TotalAssets",
                "LiabilitiesCurrent",
                "LiabilitiesNoncurrent",
                "TotalLiabilities",
                "StockholdersEquity",
                "LiabilitiesAndStockholdersEquity",
            ]

            year_data = updated_data.get(year, {})
            calculated_fields = {
                field: year_data.get(field)
                for field in calculated_field_names
                if field in year_data
            }

            return Response(
                {"success": True, "year": year, "calculated_fields": calculated_fields}
            )

        except Exception as e:
            logger.exception("Error in balance_sheet_calculate_all_api")
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


def serve_multiples_csv(request, filename):
    """Serve multiples CSV files from the data directory"""
    try:
        # Get the base directory
        base_dir = settings.BASE_DIR
        # Construct file path
        file_path = os.path.join(base_dir, 'data', 'multiples', filename)
        
        # Security check - ensure filename doesn't contain path traversal
        if '..' in filename or '/' in filename or '\\' in filename:
            return HttpResponseNotFound("Invalid filename")
        
        # Check if file exists
        if not os.path.exists(file_path):
            logger.warning(f"Multiples CSV file not found: {file_path}")
            return HttpResponseNotFound("File not found")
        
        # Read the entire file content
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Return as HttpResponse with proper headers
        response = HttpResponse(content, content_type='text/csv')
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        response['Content-Length'] = len(content)
        return response
        
    except Exception as e:
        logger.error(f"Error serving multiples CSV: {str(e)}")
        return HttpResponseNotFound("Error serving file")


class ValuationSummaryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, ticker):
        """Get EquityValue from ValuationSummary CSV file"""
        try:
            # Normalize ticker to uppercase
            ticker = ticker.upper()
            
            # Security check - ensure ticker doesn't contain path traversal
            if '..' in ticker or '/' in ticker or '\\' in ticker:
                return Response(
                    {"error": "Invalid ticker"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the base directory (where manage.py is)
            base_dir = settings.BASE_DIR
            # Construct file path to sec_app_2/files directory
            file_path = os.path.join(base_dir, 'sec_app_2', 'files', f'{ticker}_ValuationSummary.csv')
            
            # Check if file exists
            if not os.path.exists(file_path):
                logger.warning(f"ValuationSummary CSV file not found: {file_path}")
                return Response(
                    {"error": f"Valuation summary not found for ticker {ticker}"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Read and parse the CSV file
            equity_value = None
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('EquityValue,'):
                        # Extract the value after the comma
                        value_str = line.split(',', 1)[1].strip()
                        try:
                            # Handle "inf" case
                            if value_str.lower() == 'inf':
                                equity_value = float('inf')
                            else:
                                equity_value = float(value_str)
                        except (ValueError, TypeError):
                            logger.error(f"Could not parse EquityValue: {value_str}")
                            return Response(
                                {"error": f"Invalid EquityValue format in file"},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR
                            )
                        break
            
            if equity_value is None:
                return Response(
                    {"error": "EquityValue not found in file"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if equity_value == float('inf'):
                equity_value_in_billions = 1000.0  # Use 1000B as a placeholder for infinity
                equity_value_for_response = None  # Mark as infinity in response
            elif equity_value == float('-inf'):
                equity_value_in_billions = -1000.0  # Use -1000B as a placeholder for negative infinity
                equity_value_for_response = None  # Mark as infinity in response
            else:
                equity_value_in_billions = equity_value / 1_000_000_000
                equity_value_for_response = equity_value
            
            return Response({
                "ticker": ticker,
                "equityValue": equity_value_for_response,
                "equityValueInBillions": equity_value_in_billions,
                "isInfinity": equity_value == float('inf') or equity_value == float('-inf')
            })
            
        except Exception as e:
            logger.exception(f"Error reading ValuationSummary for {ticker}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class MultipleDataView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, ticker):
        try:
            ticker = ticker.upper()
            multiples = CompanyMultiples.objects.filter(ticker__iexact=ticker).first()
            if not multiples:
                return Response(
                    {'error': f'Multiples data not found for ticker: {ticker}'},
                    status=status.HTTP_404_NOT_FOUND
                )
            serializer = CompanyMultiplesSerializer(multiples)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as exc:
            logger.exception(f'Error retrieving multiples for {ticker}: {exc}')
            return Response(
                {'error': 'Failed to retrieve multiples data', 'details': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    