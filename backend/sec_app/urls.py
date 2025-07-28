from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CompanyViewSet, FilingViewSet, FinancialMetricViewSet,
    ChartDataAPIView, InsightsAPIView, CustomQueryAPIView, IndustryComparisonAPIView,
     extract_financials, IndustryAPIView,BoxPlotDataAPIView,AggregatedDataAPIView,
    get_available_metrics, check_company,load_data,ExternalChatbotProxyView,
    ContactView, FileUploadView
)

# Create a router and register only ViewSets.
router = DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'filings', FilingViewSet)
router.register(r'financial-metrics', FinancialMetricViewSet)

urlpatterns = [
    path('load-data/', load_data, name='load_data'),
    path('extract-financials/', extract_financials, name='extract_financials'),

    path('chart-data/', ChartDataAPIView.as_view(), name='chart_data'),
    path('insights/', InsightsAPIView.as_view(), name='insights'),
    path('custom-query/', CustomQueryAPIView.as_view(), name='custom_query'),
    path('industry-comparison/', IndustryComparisonAPIView.as_view(), name='industry_comparison'),
    path('available-metrics/', get_available_metrics, name='available_metrics'),
    path('industries/', IndustryAPIView.as_view(), name='industries'),
    path('boxplot-data/', BoxPlotDataAPIView.as_view(), name='boxplot_data'),
    path('aggregated-data/',AggregatedDataAPIView.as_view(),name='aggregate'),
    path('companies/<str:ticker>/', check_company, name='check-company'),
    path('chat/', ExternalChatbotProxyView.as_view(), name='chat'),
    path('contact/', ContactView.as_view(), name='contact'),
    path('file-upload/', FileUploadView.as_view(), name='file_upload'),
    path('', include(router.urls)),
]
