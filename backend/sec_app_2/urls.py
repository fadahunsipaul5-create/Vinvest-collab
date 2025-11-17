from django.urls import path
from .views import (
    IncomeStatementView,
    DependentFieldsView,
    BalanceSheetDependentFieldsView,
    BalanceSheetCalculateAllView,
    serve_multiples_csv,
    ValuationSummaryView,
    MultipleDataView,
)

urlpatterns = [
    path('income-statement/', IncomeStatementView.as_view(), name='income_statement'),
    path('dependent-fields/', DependentFieldsView.as_view(), name='dependent_fields'),
    path('balance-sheet/dependent-fields/', BalanceSheetDependentFieldsView.as_view(), name='balance_sheet_dependent_fields'),
    path('balance-sheet/calculate-all/', BalanceSheetCalculateAllView.as_view(), name='balance_sheet_calculate_all'),
    path('data/multiples/<str:filename>', serve_multiples_csv, name='serve_multiples_csv'),
    path('valuation-summary/<str:ticker>/', ValuationSummaryView.as_view(), name='valuation_summary'),
    path('multiples/<str:ticker>/', MultipleDataView.as_view(), name='multiples_data'),
]
