from django.core.management.base import BaseCommand
from sec_app.models.company import Company
import os
from django.db import transaction
import requests
from sec_app.api_client import COMPANY_TICKERS_URL, HEADERS

class Command(BaseCommand):
    help = 'Load company data from tickers directory (fast bulk version)'

    def handle(self, *args, **options):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(current_dir, '..', '..', '..', '..'))

        self.stdout.write(f"Current directory: {current_dir}")
        self.stdout.write(f"Project root: {project_root}")

        possible_paths = [
            os.path.join(project_root, 'backend', 'sec_app', 'data', 'data_financials'),
            os.path.join(project_root, 'sec_app', 'data', 'data_financials'),
            os.path.join(os.path.dirname(project_root), 'backend', 'sec_app', 'data', 'data_financials')
        ]

        tickers_dir = None
        for path in possible_paths:
            if os.path.exists(path):
                tickers_dir = path
                break

        if not tickers_dir:
            self.stdout.write(self.style.ERROR("Could not find data_financials directory. Tried:"))
            for path in possible_paths:
                self.stdout.write(self.style.ERROR(f"- {path}"))
            return

        self.stdout.write(f"Found data_financials directory at: {tickers_dir}")
        
        # Get all subdirectories (each represents a ticker)
        ticker_folders = [f for f in os.listdir(tickers_dir) 
                         if os.path.isdir(os.path.join(tickers_dir, f))]
        self.stdout.write(f"Found {len(ticker_folders)} company folders")

        # Fetch company names from SEC API
        self.stdout.write("Fetching company names from SEC API...")
        ticker_to_name = {}
        try:
            response = requests.get(COMPANY_TICKERS_URL, headers=HEADERS, timeout=30)
            if response.status_code == 200:
                sec_data = response.json()
                # SEC data structure: {numeric_key: {ticker: str, title: str, cik_str: int}}
                for key, company_data in sec_data.items():
                    ticker = company_data.get('ticker', '').upper()
                    company_name = company_data.get('title', '')
                    if ticker and company_name:
                        ticker_to_name[ticker] = company_name
                self.stdout.write(self.style.SUCCESS(
                    f"Successfully loaded {len(ticker_to_name)} company names from SEC API"
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    f"Failed to fetch SEC data: HTTP {response.status_code}"
                ))
        except Exception as e:
            self.stdout.write(self.style.WARNING(
                f"Error fetching company names from SEC API: {str(e)}"
            ))
            self.stdout.write(self.style.WARNING("Will use ticker as company name for all companies"))

        company_objs = []
        unmatched_tickers = []
        matched_tickers = []

        for folder_name in ticker_folders:
            ticker = folder_name.upper()  # Use folder name as ticker
            company_name = ticker  # default fallback

            # Look up company name from SEC API data
            if ticker in ticker_to_name:
                company_name = ticker_to_name[ticker]
                matched_tickers.append(ticker)
            else:
                unmatched_tickers.append(ticker)

            placeholder_cik = f"CIK{ticker}"[:10]
            company_objs.append(
                Company(
                    ticker=ticker,
                    name=company_name,
                    cik=placeholder_cik
                )
            )

        existing_companies = Company.objects.filter(ticker__in=[c.ticker for c in company_objs])
        existing_ticker_set = set(existing_companies.values_list('ticker', flat=True))

        to_create = [c for c in company_objs if c.ticker not in existing_ticker_set]
        to_update = [c for c in company_objs if c.ticker in existing_ticker_set]

        companies_added = 0
        companies_updated = 0

        if to_create:
            with transaction.atomic():
                Company.objects.bulk_create(to_create, batch_size=1000, ignore_conflicts=True)
            companies_added = len(to_create)
            self.stdout.write(self.style.SUCCESS(f"Added {companies_added} new companies"))

        if to_update:
            existing_objs = {c.ticker: c for c in Company.objects.filter(ticker__in=[c.ticker for c in to_update])}
            for c in to_update:
                obj = existing_objs.get(c.ticker)
                if obj:
                    obj.name = c.name
                    obj.cik = c.cik
            with transaction.atomic():
                Company.objects.bulk_update(list(existing_objs.values()), ['name', 'cik'], batch_size=1000)
            companies_updated = len(to_update)
            self.stdout.write(self.style.SUCCESS(f"Updated {companies_updated} companies"))

        self.stdout.write(self.style.SUCCESS(
            f"Successfully processed companies: {companies_added} added, {companies_updated} updated"
        ))

        self.stdout.write(self.style.WARNING(f"{len(unmatched_tickers)} tickers had no SEC API match:"))
        for t in unmatched_tickers:
            self.stdout.write(f" - {t}")
