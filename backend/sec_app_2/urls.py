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
from .views2 import (
    TopPicksSectorsView,
    TopPicksIndustriesView,
    TopPicksRankingView,
    TopPicksRankingAllView,
    TopPicksRankingAllHistoryView,
    MarketCapView,
    SharesOutstandingView,
    StockPriceView,
    IntrinsicToMarketCapView,
    CompaniesByIndustryView,
    CompaniesView,
    MetricsView,
    IndustriesView,
    AggregatedDataView,
    IndustryComparisonView,
)

urlpatterns = [
    path('income-statement/', IncomeStatementView.as_view(), name='income_statement'),
    path('dependent-fields/', DependentFieldsView.as_view(), name='dependent_fields'),
    path('balance-sheet/dependent-fields/', BalanceSheetDependentFieldsView.as_view(), name='balance_sheet_dependent_fields'),
    path('balance-sheet/calculate-all/', BalanceSheetCalculateAllView.as_view(), name='balance_sheet_calculate_all'),
    path('data/multiples/<str:filename>', serve_multiples_csv, name='serve_multiples_csv'),
    path('valuation-summary/<str:ticker>/', ValuationSummaryView.as_view(), name='valuation_summary'),
    path('multiples/<str:ticker>/', MultipleDataView.as_view(), name='multiples_data'),
    
    # Top Picks / GraphDB API Endpoints
    path('graphdb/sectors', TopPicksSectorsView.as_view(), name='top_picks_sectors'),
    path('graphdb/industries_when_sector_given', TopPicksIndustriesView.as_view(), name='top_picks_industries'),
    path('graphdb/companies_when_industry_given', CompaniesByIndustryView.as_view(), name='companies_by_industry'),
    
    # Special Metrics API Endpoints
    path('special_metrics/market_cap', MarketCapView.as_view(), name='metric_market_cap'),
    path('special_metrics/shares_outstanding', SharesOutstandingView.as_view(), name='metric_shares_outstanding'),
    path('special_metrics/stock_price', StockPriceView.as_view(), name='metric_stock_price'),
    path('special_metrics/intrinsic_to_mc', IntrinsicToMarketCapView.as_view(), name='metric_intrinsic_to_mc'),
    path('special_metrics/investment_factor_ranking_table', TopPicksRankingView.as_view(), name='top_picks_ranking'),
    path('special_metrics/investment_factor_ranking_table_for_all_companies', TopPicksRankingAllView.as_view(), name='top_picks_ranking_all'),
    path('special_metrics/investment_factor_ranking_table_for_all_companies/<str:date>', TopPicksRankingAllHistoryView.as_view(), name='top_picks_ranking_all_history'),
    
    # Centralized API Endpoints
    path('central/companies', CompaniesView.as_view(), name='central_companies'),
    path('central/metrics', MetricsView.as_view(), name='central_metrics'),
    path('central/industries', IndustriesView.as_view(), name='central_industries'),
    path('central/aggregated-data', AggregatedDataView.as_view(), name='central_aggregated_data'),
    path('central/aggregated-data/', AggregatedDataView.as_view(), name='central_aggregated_data_slash'),
    path('central/industry-comparison', IndustryComparisonView.as_view(), name='central_industry_comparison'),
    path('central/industry-comparison/', IndustryComparisonView.as_view(), name='central_industry_comparison_slash'),
]
