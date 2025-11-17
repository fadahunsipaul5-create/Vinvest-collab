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
        # Find data_financials directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(current_dir, '..', '..', '..', '..'))
        
        possible_paths = [
            os.path.join(project_root, 'backend', 'sec_app', 'data', 'data_financials'),
            os.path.join(project_root, 'sec_app', 'data', 'data_financials'),
            os.path.join(os.path.dirname(project_root), 'backend', 'sec_app', 'data', 'data_financials')
        ]
        
        directory_path = None
        for path in possible_paths:
            if os.path.exists(path):
                directory_path = path
                break
        
        if not directory_path:
            self.stdout.write(self.style.ERROR("Could not find data_financials directory. Tried:"))
            for path in possible_paths:
                self.stdout.write(self.style.ERROR(f"- {path}"))
            return
        
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

        # Scan subdirectories for MasterFinancials.csv files
        csv_files = []  # Will store tuples: (ticker, filepath, filename)
        for ticker_folder in os.listdir(directory_path):
            ticker_path = os.path.join(directory_path, ticker_folder)
            if not os.path.isdir(ticker_path):
                continue
            
            ticker = ticker_folder.upper()
            # Look for {TICKER}_MasterFinancials.csv
            csv_filename = f"{ticker}_MasterFinancials.csv"
            csv_filepath = os.path.join(ticker_path, csv_filename)
            
            if os.path.exists(csv_filepath):
                csv_files.append((ticker, csv_filepath, csv_filename))
        
        total_files = len(csv_files)
        self.stdout.write(f"Found {total_files} MasterFinancials.csv files to process")

        # Pre-load all necessary data
        self.stdout.write("Pre-loading existing data...")
        companies_cache = {company.ticker: company for company in Company.objects.all()}
        companies_id_cache = {company.id: company for company in Company.objects.all()}
        
        if skip_existing:
            self.stdout.write(f"Will skip individual metrics that already exist in database (not entire files)")
        
        # Filter out files for companies that don't exist in our database
        csv_files = [(ticker, filepath, filename) for ticker, filepath, filename in csv_files if ticker in companies_cache]
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
            batch_metrics = self.process_batch(batch_files, i, len(csv_files), companies_cache, companies_id_cache, max_workers, db_batch_size, turbo_mode, turbo_visible, skip_existing)
            total_metrics_created += batch_metrics
            if not turbo_mode or turbo_visible or (i // batch_size + 1) % 5 == 0:  # Log every batch in turbo_visible, every 5th in turbo
                self.stdout.write(f"Batch {i//batch_size + 1}/{(len(csv_files) + batch_size - 1) // batch_size}: Created {batch_metrics} metrics (Total: {total_metrics_created:,})")
        
        self.stdout.write(f"✅ Completed! Total metrics created: {total_metrics_created:,}")

    def process_batch(self, batch_files, batch_start, total_files, companies_cache, companies_id_cache, max_workers, db_batch_size, turbo_mode, turbo_visible, skip_existing):
        # batch_files is now list of tuples: (ticker, filepath, filename)
        current_batch_tickers = {ticker for ticker, _, _ in batch_files}
        companies_in_current_batch = [companies_cache[ticker] for ticker in current_batch_tickers if ticker in companies_cache]
        company_ids_in_batch = [company.id for company in companies_in_current_batch]

        # Get existing metrics for this batch more efficiently (only if skip_existing is True)
        if skip_existing:
            if not turbo_mode or turbo_visible:
                self.stdout.write(f"🔍 Checking existing metrics for batch...")
            existing_metrics_for_batch = set(
                FinancialMetric.objects.filter(company_id__in=company_ids_in_batch)
                .values_list('period__period', 'metric_name', 'company_id')
            )
            if not turbo_mode or turbo_visible:
                self.stdout.write(f"Found {len(existing_metrics_for_batch)} existing metrics to skip")
        else:
            existing_metrics_for_batch = set()  # Empty set when not skipping existing
            if not turbo_mode or turbo_visible:
                self.stdout.write(f"🔄 Replacing all existing data (not skipping any metrics)")

        # Process CSV files in parallel
        file_data = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_file = {
                executor.submit(self.read_csv_fast, filepath): (ticker, filename) 
                for ticker, filepath, filename in batch_files
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
                ticker, filename = future_to_file[future]
                try:
                    file_data[(ticker, filename)] = future.result()
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error reading {filename} for {ticker}: {str(e)}"))

        # Process all data and return metrics count
        if not turbo_mode or turbo_visible:
            self.stdout.write(f"💾 Processing data for database insertion...")
        return self._process_batch_data(file_data, companies_cache, companies_id_cache, existing_metrics_for_batch, db_batch_size, turbo_mode, turbo_visible, skip_existing)

    def read_csv_fast(self, filepath):
        """Fast CSV reader for MasterFinancials format: metric name in first column, headers are years/AVG/CAGR"""
        data = defaultdict(dict)
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                reader = csv.reader(file)
                headers = next(reader)  # First row: empty, then years, AVG, CAGR, TableName
                
                # Skip the first header (empty cell), process rest as column headers
                column_headers = headers[1:] if len(headers) > 1 else []
                
                for row in reader:
                    if not row or len(row) == 0:
                        continue
                    
                    # First column is metric name
                    metric_name = row[0].strip() if len(row) > 0 else None
                    if not metric_name or metric_name == '':
                        continue
                    
                    # Skip TableName column if present
                    if metric_name == 'TableName':
                        continue
                    
                    # Process values for each column header
                    for i, col_header in enumerate(column_headers, 1):
                        if i >= len(row):
                            continue
                        
                        # Skip TableName column
                        if col_header == 'TableName':
                            continue
                        
                        cell_value = row[i].strip() if i < len(row) else ''
                        
                        # Skip empty cells
                        if not cell_value or cell_value == '':
                            continue
                        
                        try:
                            # Parse numeric value (remove commas, $, handle scientific notation)
                            val_str = str(cell_value).replace(',', '').replace('$', '').strip()
                            val = float(val_str)
                            data[metric_name][col_header] = val
                        except (ValueError, TypeError):
                            # Skip non-numeric values
                            continue
        except Exception as e:
            raise Exception(f"Error reading CSV file {filepath}: {str(e)}")
        return data

    def _process_batch_data(self, file_data, companies_cache, companies_id_cache, existing_metrics, db_batch_size, turbo_mode, turbo_visible, skip_existing):
        """Process all batch data with chunked database operations"""
        periods_to_create = {}
        metrics_data = []  # Store metric data without period objects initially
        
        # First pass: collect all periods and metric data
        if not turbo_mode or turbo_visible:
            self.stdout.write(f"📊 Collecting data from {len(file_data)} files...")
        for (ticker, filename), csv_data in file_data.items():
            company = companies_cache.get(ticker)
            if not company:
                if not turbo_mode or turbo_visible:
                    self.stdout.write(self.style.WARNING(f"Skipping {filename}: Company {ticker} not found."))
                continue

            # Collect periods and metric data separately
            self.collect_periods_and_metric_data(csv_data, company, periods_to_create, metrics_data, existing_metrics, skip_existing)

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

    def collect_periods_and_metric_data(self, csv_data, company, periods_to_create, metrics_data, existing_metrics, skip_existing):
        """Collect periods and metric data from MasterFinancials format: years, AVG, and CAGR columns"""
        
        # Collect all unique column headers (periods) from all metrics
        all_periods = set()
        for metric_name, values in csv_data.items():
            all_periods.update(values.keys())
        
        # Process each period (column header)
        for period_name in all_periods:
            # Skip TableName column
            if period_name == 'TableName':
                continue
            
            # Determine period type and create period object
            period_key = (company.id, period_name)
            
            # Check if period is a year (2005-2035)
            is_year = False
            year_int = None
            if period_name.isdigit():
                year_int = int(period_name)
                if 2005 <= year_int <= 2035:
                    is_year = True
            
            # Create period if needed
            if period_key not in periods_to_create:
                if is_year:
                    # Year period: set start_date and end_date
                    periods_to_create[period_key] = FinancialPeriod(
                        company=company,
                        period=period_name,  # Store as "2024", "2023", etc.
                        start_date=f'{year_int}-01-01',
                        end_date=f'{year_int}-12-31'
                    )
                elif period_name.startswith('Last') and ('_AVG' in period_name or '_CAGR' in period_name):
                    # AVG or CAGR period: no specific dates, use period name as-is
                    periods_to_create[period_key] = FinancialPeriod(
                        company=company,
                        period=period_name,  # Store as "Last1Y_AVG", "Last2Y_CAGR", etc.
                        start_date=None,
                        end_date=None
                    )
                else:
                    # Unknown period type, skip
                    continue
            
            # Collect metric data for this period
            for metric_name, values in csv_data.items():
                if period_name not in values:
                    continue
                
                value = values[period_name]
                
                # Skip if value is None or empty
                if value is None:
                    continue
                
                # Check if we should skip existing metrics
                if skip_existing and (period_name, metric_name, company.id) in existing_metrics:
                    continue
                
                metrics_data.append({
                    'company': company,
                    'company_id': company.id,
                    'period_name': period_name,
                    'metric_name': metric_name,
                    'value': value
                })
                
                if skip_existing:
                    existing_metrics.add((period_name, metric_name, company.id))
