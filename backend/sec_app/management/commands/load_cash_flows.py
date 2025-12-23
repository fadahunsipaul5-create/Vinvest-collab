import csv
import os
from datetime import date
from django.core.management.base import BaseCommand
from django.db import transaction
from sec_app.models import Company, FinancialPeriod, FinancialMetric


class Command(BaseCommand):
    help = 'Load cash flow data from CSV files into the database'

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
        
        # Scan subdirectories for CashFlowExpanded.csv files
        company_folders = [d for d in os.listdir(data_financials_dir) 
                          if os.path.isdir(os.path.join(data_financials_dir, d)) and not d.startswith('__')]
        
        if not company_folders:
            self.stdout.write(self.style.ERROR('No company folders found in data_financials'))
            return
        
        self.stdout.write(self.style.SUCCESS(f'Found {len(company_folders)} company folders'))
        
        loaded_count = 0
        error_count = 0
        
        for ticker in company_folders:
            # Look for {TICKER}_CashFlowExpanded.csv in the company folder
            csv_filename = f'{ticker}_CashFlowExpanded.csv'
            file_path = os.path.join(data_financials_dir, ticker, csv_filename)
            
            if not os.path.exists(file_path):
                self.stdout.write(self.style.WARNING(f'CashFlowExpanded.csv not found for {ticker}, skipping'))
                continue
            
            try:
                with transaction.atomic():
                    self.load_cash_flow(file_path, ticker)
                action = 'Loaded'
                self.stdout.write(self.style.SUCCESS(f'{action} {ticker.upper()}'))
                loaded_count += 1
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error loading {ticker}: {str(e)}'))
                error_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully loaded {loaded_count} companies'))
        if error_count > 0:
            self.stdout.write(self.style.WARNING(f'Failed to load {error_count} companies'))
    
    def load_cash_flow(self, file_path, ticker):
        """Load cash flow data from CSV file into database"""
        # Get or create Company
        company, created = Company.objects.get_or_create(
            ticker=ticker.upper(),
            defaults={'name': ticker.upper()}  # Will be updated if company exists with proper name
        )
        
        # Parse CSV file
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            
            # Read first row to get years
            header_row = next(reader)
            years = []
            for col in header_row[1:]:  # Skip first empty column
                if col and col.strip():
                    try:
                        year = int(col.strip())
                        years.append(year)
                    except ValueError:
                        continue
            
            if not years:
                raise ValueError(f"No valid years found in CSV file for {ticker}")
            
            # Read metric rows
            metrics_created = 0
            metrics_updated = 0
            
            for row in reader:
                if not row or len(row) < 2:
                    continue
                
                metric_name = row[0].strip() if row[0] else None
                if not metric_name:
                    continue
                
                # Skip empty metric names
                if metric_name == '':
                    continue
                
                # Normalize metric name (remove spaces, keep as is for now)
                metric_name = metric_name.strip()
                
                # Process each year's value
                for idx, year in enumerate(years):
                    if idx + 1 >= len(row):
                        continue
                    
                    value_str = row[idx + 1].strip() if len(row) > idx + 1 else ''
                    
                    # Skip empty values
                    if not value_str or value_str == '':
                        continue
                    
                    # Parse value
                    try:
                        value = float(value_str)
                    except ValueError:
                        # Skip non-numeric values
                        continue
                    
                    # Get or create FinancialPeriod
                    period, _ = FinancialPeriod.objects.get_or_create(
                        company=company,
                        period=str(year),
                        defaults={
                            'period_type': 'annual',
                            'start_date': date(year, 1, 1),
                            'end_date': date(year, 12, 31)
                        }
                    )
                    
                    # Create or update FinancialMetric
                    metric, created = FinancialMetric.objects.update_or_create(
                        company=company,
                        period=period,
                        metric_name=metric_name,
                        defaults={
                            'value': value,
                            'unit': 'USD'
                        }
                    )
                    
                    if created:
                        metrics_created += 1
                    else:
                        metrics_updated += 1
            
            self.stdout.write(f'  Created {metrics_created} metrics, updated {metrics_updated} metrics for {ticker}')

