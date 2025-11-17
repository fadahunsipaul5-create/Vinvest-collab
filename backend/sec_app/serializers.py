from rest_framework import serializers
from .models import CompanyMultiples


class CompanyMultiplesSerializer(serializers.ModelSerializer):
    """
    Serializer for CompanyMultiples model.
    Returns data in the format expected by the frontend.
    """
    
    class Meta:
        model = CompanyMultiples
        fields = ['ticker', 'numerators', 'denominators', 'roic_metrics', 'revenue_growth', 'updated_at']
        read_only_fields = ['updated_at']
    
    def to_representation(self, instance):
        """
        Customize the output format to match frontend expectations
        """
        data = super().to_representation(instance)
        
        # Ensure consistent structure even if data is missing
        data['numerators'] = data.get('numerators') or {}
        data['denominators'] = data.get('denominators') or {}
        data['roicMetrics'] = data.pop('roic_metrics', {})  # Convert snake_case to camelCase
        data['revenueGrowth'] = data.pop('revenue_growth', {})  # Convert snake_case to camelCase
        
        return data

