# backend/sec_app/management/commands/fetch_financial_data.py
import os
import csv
from collections import defaultdict
from django.core.management.base import BaseCommand
from sec_app.models.company import Company
from sec_app.models.metric import FinancialMetric
from sec_app.models.period import FinancialPeriod
from django.db.models import Q
from tqdm import tqdm
import concurrent.futures
from django.db import transaction

class Command(BaseCommand):
    help = 'Import financial data from CSV files'

    def add_arguments(self, parser):
        parser.add_argument('--batch-size', type=int, default=500, help='Number of files to process in each batch')
        parser.add_argument('--workers', type=int, default=12, help='Number of parallel workers for CSV reading')
        parser.add_argument('--skip-existing', action='store_true', help='Skip individual metrics that already exist in database (recommended for incremental updates)')
        parser.add_argument('--db-batch-size', type=int, default=5000, help='Database batch size for bulk operations')
        parser.add_argument('--turbo', action='store_true', help='Maximum speed mode with minimal logging')
        parser.add_argument('--turbo-visible', action='store_true', help='Turbo mode but with visible progress bars and key status updates')

    def handle(self, *args, **kwargs):
        directory_path = 'sec_app/StdMetrics'
        batch_size = kwargs['batch_size']
        max_workers = kwargs['workers']
        skip_existing = kwargs['skip_existing']
        db_batch_size = kwargs['db_batch_size']
        turbo_mode = kwargs['turbo']
        turbo_visible = kwargs['turbo_visible']
        
        # turbo_visible implies turbo mode with visible progress
        if turbo_visible:
            turbo_mode = True
        
        self.stdout.write(f"Looking for CSV files in: {directory_path}")

        csv_files = [f for f in os.listdir(directory_path) if f.endswith('_StdMetrics.csv')]
        total_files = len(csv_files)
        self.stdout.write(f"Found {total_files} files to process")

        # Pre-load all necessary data
        self.stdout.write("Pre-loading existing data...")
        companies_cache = {company.ticker: company for company in Company.objects.all()}
        companies_id_cache = {company.id: company for company in Company.objects.all()}
        
        if skip_existing:
            self.stdout.write(f"Will skip individual metrics that already exist in database (not entire files)")
        
        # Filter out files for companies that don't exist in our database
        csv_files = [f for f in csv_files if f.split('_')[0] in companies_cache]
        self.stdout.write(f"After filtering for existing companies: {len(csv_files)} files to process")
        
        self.stdout.write(f"Pre-loaded {len(companies_cache)} companies.")
        if not turbo_mode:
            self.stdout.write(f"Using batch size: {batch_size} files, DB batch size: {db_batch_size}")
        elif turbo_visible:
            self.stdout.write(f"🚀 TURBO VISIBLE MODE: {batch_size} files/batch, {max_workers} workers, {db_batch_size} DB batch size")
        else:
            self.stdout.write(f"🚀 TURBO MODE: {batch_size} files/batch, {max_workers} workers, {db_batch_size} DB batch size")

        total_metrics_created = 0
        for i in range(0, len(csv_files), batch_size):
            batch_files = csv_files[i:i + batch_size]
            batch_metrics = self.process_batch(batch_files, directory_path, i, len(csv_files), companies_cache, companies_id_cache, max_workers, db_batch_size, turbo_mode, turbo_visible)
            total_metrics_created += batch_metrics
            if not turbo_mode or turbo_visible or (i // batch_size + 1) % 5 == 0:  # Log every batch in turbo_visible, every 5th in turbo
                self.stdout.write(f"Batch {i//batch_size + 1}/{(len(csv_files) + batch_size - 1) // batch_size}: Created {batch_metrics} metrics (Total: {total_metrics_created:,})")
        
        self.stdout.write(f"✅ Completed! Total metrics created: {total_metrics_created:,}")

    def process_batch(self, batch_files, directory_path, batch_start, total_files, companies_cache, companies_id_cache, max_workers, db_batch_size, turbo_mode, turbo_visible):
        current_batch_tickers = {filename.split('_')[0] for filename in batch_files}
        companies_in_current_batch = [companies_cache[ticker] for ticker in current_batch_tickers if ticker in companies_cache]
        company_ids_in_batch = [company.id for company in companies_in_current_batch]

        # Get existing metrics for this batch more efficiently
        if not turbo_mode or turbo_visible:
            self.stdout.write(f"🔍 Checking existing metrics for batch...")
        existing_metrics_for_batch = set(
            FinancialMetric.objects.filter(company_id__in=company_ids_in_batch)
            .values_list('period__period', 'metric_name', 'company_id')
        )
        if not turbo_mode or turbo_visible:
            self.stdout.write(f"Found {len(existing_metrics_for_batch)} existing metrics to skip")

        # Process CSV files in parallel
        file_data = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_file = {
                executor.submit(self.read_csv_fast, os.path.join(directory_path, filename)): filename 
                for filename in batch_files
            }
            
            progress_desc = f"📖 Reading files {batch_start+1}-{batch_start+len(batch_files)} of {total_files}"
            if turbo_mode and not turbo_visible:
                progress_desc = f"🚀 Files {batch_start+1}-{batch_start+len(batch_files)}/{total_files}"
            elif turbo_visible:
                progress_desc = f"🚀 Reading files {batch_start+1}-{batch_start+len(batch_files)} of {total_files}"
            
            for future in tqdm(
                concurrent.futures.as_completed(future_to_file), 
                total=len(batch_files),
                desc=progress_desc,
                disable=turbo_mode and not turbo_visible  # Show progress in turbo_visible mode
            ):
                filename = future_to_file[future]
                try:
                    file_data[filename] = future.result()
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error reading {filename}: {str(e)}"))

        # Process all data and return metrics count
        if not turbo_mode or turbo_visible:
            self.stdout.write(f"💾 Processing data for database insertion...")
        return self._process_batch_data(file_data, companies_cache, companies_id_cache, existing_metrics_for_batch, db_batch_size, turbo_mode, turbo_visible)

    def read_csv_fast(self, filepath):
        """Fast CSV reader using native csv module instead of pandas"""
        data = defaultdict(dict)
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                reader = csv.reader(file)
                headers = next(reader)
                
                for row in reader:
                    if not row:
                        continue
                    key = row[0]
                    for i, col_header in enumerate(headers[1:], 1):
                        if i < len(row):
                            try:
                                val = float(str(row[i]).replace(',', '').replace('$', '').strip())
                                data[key][col_header] = val
                            except (ValueError, TypeError):
                                continue
        except Exception as e:
            raise Exception(f"Error reading CSV file {filepath}: {str(e)}")
        return data

    def _process_batch_data(self, file_data, companies_cache, companies_id_cache, existing_metrics, db_batch_size, turbo_mode, turbo_visible):
        """Process all batch data with chunked database operations"""
        periods_to_create = {}
        metrics_data = []  # Store metric data without period objects initially
        
        # First pass: collect all periods and metric data
        if not turbo_mode or turbo_visible:
            self.stdout.write(f"📊 Collecting data from {len(file_data)} files...")
        for filename, csv_data in file_data.items():
            ticker = filename.split('_')[0]
            company = companies_cache.get(ticker)
            if not company:
                if not turbo_mode or turbo_visible:
                    self.stdout.write(self.style.WARNING(f"Skipping {filename}: Company {ticker} not found."))
                continue

            # Collect periods and metric data separately
            self.collect_periods_and_metric_data(csv_data, company, periods_to_create, metrics_data, existing_metrics)

        if not turbo_mode or turbo_visible:
            self.stdout.write(f"🔄 Collected {len(periods_to_create)} unique periods, {len(metrics_data)} metrics")

        # Get existing periods for this batch
        if periods_to_create:
            if not turbo_mode or turbo_visible:
                self.stdout.write(f"🔍 Checking existing periods...")
            all_company_ids = set(cid for cid, _ in periods_to_create.keys())
            all_period_names = set(period for _, period in periods_to_create.keys())
            
            existing_periods = FinancialPeriod.objects.filter(
                company_id__in=all_company_ids,
                period__in=all_period_names
            )
            periods_cache = {(p.company_id, p.period): p for p in existing_periods}

            # Bulk create new periods in chunks
            new_periods = [
                period_obj for period_key, period_obj in periods_to_create.items()
                if period_key not in periods_cache
            ]
            
            if new_periods:
                if not turbo_mode or turbo_visible:
                    self.stdout.write(f"💾 Creating {len(new_periods)} new periods...")
                # Process periods in larger chunks for speed
                for i in range(0, len(new_periods), db_batch_size):
                    chunk = new_periods[i:i + db_batch_size]
                    FinancialPeriod.objects.bulk_create(chunk, batch_size=db_batch_size, ignore_conflicts=True)
                    if (not turbo_mode or turbo_visible) and len(new_periods) > db_batch_size:
                        self.stdout.write(f"  📝 Created periods {i+1}-{min(i+len(chunk), len(new_periods))} of {len(new_periods)}")
                
                # Refresh periods cache with newly created periods
                new_created_periods = FinancialPeriod.objects.filter(
                    company_id__in=all_company_ids,
                    period__in=all_period_names
                )
                periods_cache = {(p.company_id, p.period): p for p in new_created_periods}
        else:
            periods_cache = {}

        # Now create metrics with proper period objects
        if not turbo_mode or turbo_visible:
            self.stdout.write(f"🔄 Building metrics objects...")
        metrics_to_create = []
        for metric_data in metrics_data:
            period_key = (metric_data['company_id'], metric_data['period_name'])
            if period_key in periods_cache:
                metrics_to_create.append(FinancialMetric(
                    company=metric_data['company'],
                    period=periods_cache[period_key],
                    metric_name=metric_data['metric_name'],
                    value=metric_data['value']
                ))

        # Bulk create metrics in chunks with progress
        total_created = 0
        if metrics_to_create:
            if not turbo_mode or turbo_visible:
                self.stdout.write(f"💾 Creating {len(metrics_to_create)} metrics in chunks of {db_batch_size}...")
            for i in range(0, len(metrics_to_create), db_batch_size):
                chunk = metrics_to_create[i:i + db_batch_size]
                with transaction.atomic():
                    FinancialMetric.objects.bulk_create(chunk, batch_size=db_batch_size, ignore_conflicts=True)
                total_created += len(chunk)
                # Show detailed progress in turbo_visible mode or for large chunks in normal mode
                if (not turbo_mode or turbo_visible) and len(metrics_to_create) > db_batch_size and i % (db_batch_size * 10) == 0:
                    self.stdout.write(f"  📝 Created metrics {i+1}-{min(i+len(chunk), len(metrics_to_create))} of {len(metrics_to_create)}")
        
        return total_created

    def collect_periods_and_metric_data(self, csv_data, company, periods_to_create, metrics_data, existing_metrics):
        """Collect periods and metric data in single pass through data"""
        
        # Process annual data
        for year in range(2005, 2025):
            year_str = str(year)
            if year_str not in csv_data.get('Revenue', {}):
                continue
                
            # Create period if needed
            period_key = (company.id, year_str)
            if period_key not in periods_to_create:
                periods_to_create[period_key] = FinancialPeriod(
                    company=company,
                    period=year_str,
                    start_date=f'{year}-01-01',
                    end_date=f'{year}-12-31'
                )
            
            # Collect metric data for this year
            for metric_name, values in csv_data.items():
                if metric_name == 'statementType':
                    continue
                if year_str in values and (year_str, metric_name, company.id) not in existing_metrics:
                    metrics_data.append({
                        'company': company,
                        'company_id': company.id,
                        'period_name': year_str,
                        'metric_name': metric_name,
                        'value': values[year_str]
                    })
                    existing_metrics.add((year_str, metric_name, company.id))

        # Process period data (2Y, 3Y, etc.)
        for period_type in ['2Y', '3Y', '4Y', '5Y', '10Y', '15Y', '20Y']:
            for metric_name, col_dict in csv_data.items():
                if metric_name == 'statementType':
                    continue
                for col, value in col_dict.items():
                    if not col.startswith(f'{period_type}: '):
                        continue
                    years = col.split(': ')[1]
                    
                    # Create period if needed
                    period_key = (company.id, years)
                    if period_key not in periods_to_create:
                        start_year, end_year = years.split('-')
                        # Handle 2-digit years
                        if len(end_year) == 2:
                            end_year = f'20{end_year}'
                        periods_to_create[period_key] = FinancialPeriod(
                            company=company,
                            period=years,
                            start_date=f'{start_year}-01-01',
                            end_date=f'{end_year}-12-31'
                        )
                    
                    # Collect metric data
                    if (years, metric_name, company.id) not in existing_metrics:
                        metrics_data.append({
                            'company': company,
                            'company_id': company.id,
                            'period_name': years,
                            'metric_name': metric_name,
                            'value': value
                        })
                        existing_metrics.add((years, metric_name, company.id))
