from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CompanyViewSet, FinancialMetricViewSet,
    BoxPlotDataAPIView,
    get_available_metrics, check_company,load_data,ExternalChatbotProxyView,
    ContactView, FileUploadView,
    ChatBatchListView, ChatBatchDetailView,create_checkout_session,stripe_webhook,
    activate_free_plan, CompanyMultiplesAPIView,
    SectorAPIView
)
from sec_app_2.views import ValuationSummaryView

# Create a router and register only ViewSets.
router = DefaultRouter()
router.register(r'companies', CompanyViewSet)

router.register(r'financial-metrics', FinancialMetricViewSet)

urlpatterns = [
    path('load-data/', load_data, name='load_data'),
    path('available-metrics/', get_available_metrics, name='available_metrics'),
    path('sectors/', SectorAPIView.as_view(), name='sectors'),
    path('boxplot-data/', BoxPlotDataAPIView.as_view(), name='boxplot_data'),
    path('companies/<str:ticker>/', check_company, name='check-company'),
    path('chat/', ExternalChatbotProxyView.as_view(), name='chat'),
    path('chat/batches/', ChatBatchListView.as_view(), name='chat-batches'),
    path('chat/batches/<int:batch_id>/', ChatBatchDetailView.as_view(), name='chat-batch-detail'),
    path('contact/', ContactView.as_view(), name='contact'),
    path('file-upload/', FileUploadView.as_view(), name='file_upload'),
    path('create-checkout-session/', create_checkout_session, name='create_checkout_session'),
    path('stripe/webhook/', stripe_webhook, name='stripe_webhook'),
    path('activate-free-plan/', activate_free_plan, name='activate_free_plan'),
    path('multiples/', CompanyMultiplesAPIView.as_view(), name='multiples_list'),
    path('multiples/<str:ticker>/', CompanyMultiplesAPIView.as_view(), name='multiples_detail'),
    path('equity-value/<str:ticker>/', ValuationSummaryView.as_view(), name='equity_value'),
    path('', include(router.urls)),
]
