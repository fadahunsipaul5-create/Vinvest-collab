from django.db import models


class CompanyMultiples(models.Model):
    """
    Store valuation multiples data for companies.
    Uses JSON fields to store period-based data efficiently.
    """
    ticker = models.CharField(max_length=10, unique=True, db_index=True)
    
    # Numerators (stored as flat fields for key metrics)
    numerators = models.JSONField(default=dict, help_text="Enterprise Value and Market Cap data")
    
    # Period-based data (stored as JSON for flexibility)
    denominators = models.JSONField(default=dict, help_text="Financial metrics by period (1Y-15Y)")
    roic_metrics = models.JSONField(default=dict, help_text="ROIC metrics by period")
    revenue_growth = models.JSONField(default=dict, help_text="Revenue growth CAGR by period")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'company_multiples'
        verbose_name = 'Company Multiples'
        verbose_name_plural = 'Company Multiples'
        ordering = ['ticker']
    
    def __str__(self):
        return f"{self.ticker} Multiples"
    
    def get_denominator(self, period, metric):
        """Helper method to get specific denominator value"""
        return self.denominators.get(period, {}).get(metric)
    
    def get_roic(self, period, include_goodwill=False):
        """Helper method to get ROIC value"""
        key = 'includingGoodwill' if include_goodwill else 'excludingGoodwill'
        return self.roic_metrics.get(period, {}).get(key)
    
    def get_revenue_growth(self, period):
        """Helper method to get revenue growth CAGR"""
        return self.revenue_growth.get(period)

