import csv
import os
from datetime import date
from django.core.management.base import BaseCommand
from django.db import transaction
from sec_app.models import Company, FinancialPeriod, FinancialMetric


class Command(BaseCommand):
    help = 'Load EquityValue from ValuationSummary CSV files into the database'

    def handle(self, *args, **options):
        # Find data_financials directory
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
        
        # Scan subdirectories for ValuationSummary.csv files
        company_folders = [d for d in os.listdir(data_financials_dir) 
                          if os.path.isdir(os.path.join(data_financials_dir, d)) and not d.startswith('__')]
        
        if not company_folders:
            self.stdout.write(self.style.ERROR('No company folders found in data_financials'))
            return
        
        self.stdout.write(self.style.SUCCESS(f'Found {len(company_folders)} company folders'))
        
        loaded_count = 0
        error_count = 0
        skipped_count = 0
        
        for ticker in company_folders:
            # Look for {TICKER}_ValuationSummary.csv in the company folder
            csv_filename = f'{ticker}_ValuationSummary.csv'
            file_path = os.path.join(data_financials_dir, ticker, csv_filename)
            
            if not os.path.exists(file_path):
                self.stdout.write(self.style.WARNING(f'ValuationSummary.csv not found for {ticker}, skipping'))
                skipped_count += 1
                continue
            
            try:
                with transaction.atomic():
                    equity_value = self.load_valuation_summary(file_path, ticker)
                    if equity_value is not None:
                        self.stdout.write(self.style.SUCCESS(f'Loaded {ticker.upper()}: EquityValue = {equity_value:,.2f}'))
                        loaded_count += 1
                    else:
                        self.stdout.write(self.style.WARNING(f'EquityValue not found in {ticker}, skipping'))
                        skipped_count += 1
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error loading {ticker}: {str(e)}'))
                error_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully loaded {loaded_count} companies'))
        if skipped_count > 0:
            self.stdout.write(self.style.WARNING(f'Skipped {skipped_count} companies (no EquityValue found)'))
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f'Failed to load {error_count} companies'))
    
    def load_valuation_summary(self, file_path, ticker):
        """Load EquityValue from ValuationSummary CSV file into database"""
        # Get or create Company
        company, created = Company.objects.get_or_create(
            ticker=ticker.upper(),
            defaults={'name': ticker.upper()}
        )
        
        equity_value = None
        
        # Parse CSV file
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            
            # Skip header row (first row with column names)
            next(reader, None)
            
            # Read metric rows
            for row in reader:
                if not row or len(row) < 2:
                    continue
                
                metric_name = row[0].strip() if row[0] else None
                if not metric_name:
                    continue
                
                # Look for EquityValue metric
                if metric_name == 'EquityValue':
                    value_str = row[1].strip() if len(row) > 1 else ''
                    
                    if not value_str or value_str == '':
                        continue
                    
                    try:
                        equity_value = float(value_str)
                    except ValueError:
                        raise ValueError(f"Invalid EquityValue for {ticker}: {value_str}")
                    
                    # Create a special period for valuation summary (period "0" or "valuation")
                    period, _ = FinancialPeriod.objects.get_or_create(
                        company=company,
                        period='valuation',
                        defaults={
                            'period_type': 'valuation',
                            'start_date': date.today(),
                            'end_date': date.today()
                        }
                    )
                    
                    # Create or update FinancialMetric
                    FinancialMetric.objects.update_or_create(
                        company=company,
                        period=period,
                        metric_name='EquityValue',
                        defaults={
                            'value': equity_value,
                            'unit': 'USD'
                        }
                    )
                    
                    break  # Found EquityValue, no need to continue
        
        return equity_value

