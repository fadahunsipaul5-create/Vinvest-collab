from rest_framework import serializers
from .models.company import Company
from .models.analysis import SentimentAnalysis
from .models.period import FinancialPeriod
from .models.filling import FilingDocument
from .models.metric import FinancialMetric
from .models.query import Query
from .models.contact import Contact
from .models.multiples import CompanyMultiples

class CompanySerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = ['id', 'name', 'ticker', 'cik', 'sector', 'industry', 'display_name']

    def get_display_name(self, obj):
        return obj.name if obj.name else obj.ticker
    
class FinancialPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialPeriod
        fields = ['id', 'company', 'period', 'period_type', 'start_date', 'end_date', 'filing_date']


class FilingDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FilingDocument
        fields = ['id', 'company', 'period', 'section_name', 'content']


class FinancialMetricSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_ticker = serializers.CharField(source='company.ticker', read_only=True)

    class Meta:
        model = FinancialMetric
        fields = ['id','company', 'period', 'metric_name', 'value', 'unit', 'xbrl_tag', 'company_name', 'company_ticker']


class SentimentAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = SentimentAnalysis
        fields = '__all__'  

class QuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = Query
        fields = '__all__'


        
class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'


class CompanyMultiplesSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyMultiples
        fields = ['ticker', 'numerators', 'denominators', 'roic_metrics', 'revenue_growth', 'updated_at']
        read_only_fields = ['updated_at']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['numerators'] = data.get('numerators') or {}
        data['denominators'] = data.get('denominators') or {}
        data['roicMetrics'] = data.pop('roic_metrics', {})  # Convert snake_case to camelCase
        data['revenueGrowth'] = data.pop('revenue_growth', {})  # Convert snake_case to camelCase
        
        return data

