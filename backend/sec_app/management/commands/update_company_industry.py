from django.core.management.base import BaseCommand
from sec_app.models.company import Company
import os
import csv
from django.db import transaction

class Command(BaseCommand):
    help = 'Update company names and industry from CompanyBELONG_TOIndustry.csv file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--update-names',
            action='store_true',
            help='Update company names from CSV',
        )
        parser.add_argument(
            '--update-industry',
            action='store_true',
            help='Update industry from CSV',
        )
        parser.add_argument(
            '--csv-path',
            type=str,
            help='Path to CompanyBELONG_TOIndustry.csv file (default: sec_app/data/CompanyBELONG_TOIndustry.csv)',
        )

    def handle(self, *args, **options):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(current_dir, '..', '..', '..', '..'))

        # Determine CSV file path
        if options['csv_path']:
            csv_path = options['csv_path']
        else:
            possible_csv_paths = [
                os.path.join(project_root, 'backend', 'sec_app', 'data', 'CompanyBELONG_TOIndustry.csv'),
                os.path.join(project_root, 'sec_app', 'data', 'CompanyBELONG_TOIndustry.csv'),
                os.path.join(os.path.dirname(project_root), 'backend', 'sec_app', 'data', 'CompanyBELONG_TOIndustry.csv'),
            ]
            csv_path = None
            for path in possible_csv_paths:
                if os.path.exists(path):
                    csv_path = path
                    break

        if not csv_path or not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR("Could not find CompanyBELONG_TOIndustry.csv file. Tried:"))
            for path in possible_csv_paths:
                self.stdout.write(self.style.ERROR(f"- {path}"))
            return

        self.stdout.write(f"Found CSV file at: {csv_path}")

        # Get all tickers from data_financials directory
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
                         if os.path.isdir(os.path.join(tickers_dir, f)) and not f.startswith('__')]
        
        tickers_from_folder = {folder.upper() for folder in ticker_folders}
        self.stdout.write(f"Found {len(tickers_from_folder)} company folders in data_financials")

        # Read CSV file
        self.stdout.write("Reading CSV file...")
        csv_data = {}
        tickers_in_csv = set()
        
        try:
            with open(csv_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    ticker = row.get('ticker', '').strip().upper()
                    company_name = row.get('companyName', '').strip()
                    industry_name = row.get('industryName', '').strip()
                    
                    if ticker:
                        csv_data[ticker] = {
                            'name': company_name,
                            'industry': industry_name
                        }
                        tickers_in_csv.add(ticker)
            
            self.stdout.write(self.style.SUCCESS(f"Loaded {len(csv_data)} companies from CSV"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error reading CSV file: {str(e)}"))
            return

        # Determine what to update
        # If flags are not specified, update both by default
        # If flags are specified, only update what's requested
        update_names_flag = options.get('update_names', False)
        update_industry_flag = options.get('update_industry', False)
        
        # If no flags specified, update both by default
        if not update_names_flag and not update_industry_flag:
            update_names = True
            update_industry = True
        else:
            update_names = update_names_flag
            update_industry = update_industry_flag

        if not update_names and not update_industry:
            self.stdout.write(self.style.WARNING("Both --update-names and --update-industry are False. Nothing to update."))
            return

        # Find companies that exist in both database and CSV
        matching_tickers = tickers_from_folder.intersection(tickers_in_csv)
        self.stdout.write(f"Found {len(matching_tickers)} companies that exist in both data_financials and CSV")

        # Get existing companies from database (case-insensitive matching)
        # Build a lookup dictionary for efficient access
        existing_companies_qs = Company.objects.filter(ticker__in=matching_tickers)
        existing_companies_dict = {c.ticker.upper(): c for c in existing_companies_qs}
        
        companies_to_update = []
        companies_not_found = []
        companies_updated_stats = {'names': 0, 'industry': 0}

        for ticker in matching_tickers:
            company_obj = existing_companies_dict.get(ticker.upper())
            
            if not company_obj:
                companies_not_found.append(ticker)
                continue
            csv_info = csv_data[ticker]
            
            needs_update = False
            
            # Update name if requested and different
            if update_names and csv_info['name']:
                if company_obj.name != csv_info['name']:
                    company_obj.name = csv_info['name']
                    needs_update = True
                    companies_updated_stats['names'] += 1
            
            # Update industry if requested and different
            if update_industry and csv_info['industry']:
                if company_obj.industry != csv_info['industry']:
                    company_obj.industry = csv_info['industry']
                    needs_update = True
                    companies_updated_stats['industry'] += 1
            
            if needs_update:
                companies_to_update.append(company_obj)

        # Perform bulk update
        if companies_to_update:
            update_fields = []
            if update_names:
                update_fields.append('name')
            if update_industry:
                update_fields.append('industry')

            with transaction.atomic():
                Company.objects.bulk_update(companies_to_update, update_fields, batch_size=1000)
            
            self.stdout.write(self.style.SUCCESS(
                f"Updated {len(companies_to_update)} companies"
            ))
            if update_names:
                self.stdout.write(self.style.SUCCESS(f"  - Names updated: {companies_updated_stats['names']}"))
            if update_industry:
                self.stdout.write(self.style.SUCCESS(f"  - Industry updated: {companies_updated_stats['industry']}"))
        else:
            self.stdout.write(self.style.SUCCESS("No companies needed updating"))

        # Report statistics
        tickers_only_in_folder = tickers_from_folder - tickers_in_csv
        tickers_only_in_csv = tickers_in_csv - tickers_from_folder

        self.stdout.write("\n" + "="*60)
        self.stdout.write("Summary:")
        self.stdout.write(f"  Companies in data_financials: {len(tickers_from_folder)}")
        self.stdout.write(f"  Companies in CSV: {len(tickers_in_csv)}")
        self.stdout.write(f"  Companies matched: {len(matching_tickers)}")
        self.stdout.write(f"  Companies updated: {len(companies_to_update)}")
        
        if companies_not_found:
            self.stdout.write(self.style.WARNING(
                f"\n{len(companies_not_found)} companies in CSV not found in database:"
            ))
            for t in sorted(companies_not_found)[:20]:  # Show first 20
                self.stdout.write(f"  - {t}")
            if len(companies_not_found) > 20:
                self.stdout.write(f"  ... and {len(companies_not_found) - 20} more")

        if tickers_only_in_folder:
            self.stdout.write(self.style.WARNING(
                f"\n{len(tickers_only_in_folder)} companies in data_financials but not in CSV:"
            ))
            for t in sorted(tickers_only_in_folder)[:20]:  # Show first 20
                self.stdout.write(f"  - {t}")
            if len(tickers_only_in_folder) > 20:
                self.stdout.write(f"  ... and {len(tickers_only_in_folder) - 20} more")

        if tickers_only_in_csv:
            self.stdout.write(
                f"\n{len(tickers_only_in_csv)} companies in CSV but not in data_financials (skipped)"
            )

        self.stdout.write(self.style.SUCCESS("\nUpdate completed successfully!"))

