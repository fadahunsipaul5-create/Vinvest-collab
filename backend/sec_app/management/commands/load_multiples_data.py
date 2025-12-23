import csv
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from sec_app.models import CompanyMultiples


class Command(BaseCommand):
    help = 'Load multiples data from CSV files into the database'

    def handle(self, *args, **options):
        # Find data_financials directory (same logic as fetch_financial_data.py)
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(current_dir, '..', '..', '..', '..'))
        
        possible_paths = [
            os.path.join(project_root, 'backend', 'sec_app', 'data', 'data_financials'),
            os.path.join(project_root, 'sec_app', 'data', 'data_financials'),
            os.path.join(os.path.dirname(project_root), 'backend', 'sec_app', 'data', 'data_financials')
        ]
        
        data_financials_dir = None
        for path in possible_paths:
            if os.path.exists(path):
                data_financials_dir = path
                break
        
        if not data_financials_dir:
            self.stdout.write(self.style.ERROR("Could not find data_financials directory. Tried:"))
            for path in possible_paths:
                self.stdout.write(self.style.ERROR(f"- {path}"))
            return
        
        # Scan subdirectories for MultiplesTable.csv files
        company_folders = [d for d in os.listdir(data_financials_dir) 
                          if os.path.isdir(os.path.join(data_financials_dir, d))]
        
        if not company_folders:
            self.stdout.write(self.style.ERROR('No company folders found in data_financials'))
            return
        
        self.stdout.write(self.style.SUCCESS(f'Found {len(company_folders)} company folders'))
        
        loaded_count = 0
        for ticker in company_folders:
            # Look for {TICKER}_MultiplesTable.csv in the company folder
            csv_filename = f'{ticker}_MultiplesTable.csv'
            file_path = os.path.join(data_financials_dir, ticker, csv_filename)
            
            if not os.path.exists(file_path):
                self.stdout.write(self.style.WARNING(f'MultiplesTable.csv not found for {ticker}, skipping'))
                continue
            
            try:
                data = self.parse_csv(file_path, ticker)
                
                # Create or update the record
                obj, created = CompanyMultiples.objects.update_or_create(
                    ticker=ticker.upper(),
                    defaults=data
                )
                
                action = 'Created' if created else 'Updated'
                self.stdout.write(self.style.SUCCESS(f'{action} {ticker.upper()}'))
                loaded_count += 1
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error loading {ticker}: {str(e)}'))
        
        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully loaded {loaded_count} companies'))
    
    def parse_csv(self, file_path, ticker):
        """Parse CSV file and return structured data"""
        numerators = {}
        denominators = {}
        roic_metrics = {}
        revenue_growth = {}
        
        periods = ['1Y', '2Y', '3Y', '4Y', '5Y', '10Y', '15Y']
        
        # Initialize period dictionaries
        for period in periods:
            denominators[period] = {}
            roic_metrics[period] = {}
        
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                name = row.get('Name', '').strip()
                metric_type = row.get('Type', '').strip()
                value = row.get('Value', '').strip()
                
                if not name or not metric_type:
                    continue
                
                # Parse value
                parsed_value = self.parse_value(value)
                
                # Handle Numerators
                if metric_type == 'Numerator':
                    if name == 'EnterpriseValue_Fundamental':
                        numerators['enterpriseValue_Fundamental'] = parsed_value
                    elif name == 'MarketCap_Fundamental':
                        numerators['marketCap_Fundamental'] = parsed_value
                    elif name == 'EnterpriseValue_Current':
                        numerators['enterpriseValue_Current'] = parsed_value
                    elif name == 'MarketCap_Current':
                        numerators['marketCap_Current'] = parsed_value
                
                # Handle Denominators
                elif metric_type == 'Denominator':
                    for period in periods:
                        suffix = f'_Last{period}_AVG'
                        if name.endswith(suffix):
                            metric_name = name.replace(suffix, '')
                            metric_key = self.get_metric_key(metric_name)
                            denominators[period][metric_key] = parsed_value
                            break
                
                # Handle ROIC metrics (X_axis)
                elif metric_type == 'X_axis':
                    for period in periods:
                        if name == f'ROICExcludingGoodwill_Last{period}_AVG':
                            roic_metrics[period]['excludingGoodwill'] = parsed_value
                            break
                        elif name == f'ROICIncludingGoodwill_Last{period}_AVG':
                            roic_metrics[period]['includingGoodwill'] = parsed_value
                            break
                
                # Handle Revenue Growth (Y_axis)
                elif metric_type == 'Y_axis':
                    for period in periods:
                        if name == f'RevenueGrowth_Last{period}_CAGR':
                            revenue_growth[period] = parsed_value
                            break
        
        return {
            'numerators': numerators,
            'denominators': denominators,
            'roic_metrics': roic_metrics,
            'revenue_growth': revenue_growth
        }
    
    def parse_value(self, value):
        """Parse value from CSV, handling special cases"""
        if not value or value.strip() == '':
            return None
        
        value = value.strip()
        
        # Handle special string values
        if value in ['inf', 'Inf', 'INF']:
            return 'inf'
        if value == 'Call_API':
            return 'Call_API'
        
        # Try to convert to float
        try:
            return float(value)
        except ValueError:
            return value
    
    def get_metric_key(self, metric_name):
        """Convert CSV metric name to JSON key format"""
        mapping = {
            'GrossMargin': 'grossMargin',
            'OperatingIncome': 'operatingIncome',
            'PretaxIncome': 'pretaxIncome',
            'NetIncome': 'netIncome',
            'Revenue': 'revenue',
            'EBITAAdjusted': 'ebitaAdjusted',
            'EBITDAAdjusted': 'ebitdaAdjusted',
            'NetOperatingProfitAfterTaxes': 'netOperatingProfitAfterTaxes'
        }
        return mapping.get(metric_name, metric_name)

