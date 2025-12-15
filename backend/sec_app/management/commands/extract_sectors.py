import csv
import os
from django.core.management.base import BaseCommand
from sec_app.models import Sector, Company

class Command(BaseCommand):
    help = 'Extracts sectors from CSV and populates the Sector model.'

    def handle(self, *args, **options):
        # Assuming script is run from backend root, so data is in 'data/' not 'backend/data/'
        # Or better, use settings.BASE_DIR if available, or relative to this file
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        file_path = os.path.join(base_dir, 'data', 'IndustryBELONG_TOSector.csv')
        
        if not os.path.exists(file_path):
            # Fallback for different execution contexts
            file_path = os.path.join('data', 'IndustryBELONG_TOSector.csv')
            if not os.path.exists(file_path):
                 self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
                 return

        sectors_created = 0
        companies_updated = 0
        
        # Clear existing sectors to remove potentially incorrect ID-based entries
        Sector.objects.all().delete()
        self.stdout.write("Cleared existing Sector data.")
        
        try:
            with open(file_path, mode='r', encoding='utf-8-sig') as csvfile:
                reader = csv.DictReader(csvfile)
                
                headers = [h.lower() for h in reader.fieldnames]
                
                # Explicitly look for sector name columns to avoid IDs
                sector_key = next((h for h in headers if 'sector' in h and 'name' in h), None)
                
                # Fallback: try just 'sector' but be careful if it contains IDs
                if not sector_key:
                    sector_key = next((h for h in headers if 'sector' in h and 'id' not in h), None)
                
                # Industry key for mapping
                industry_key = next((h for h in headers if 'industry' in h and 'name' in h), None)
                
                if not sector_key:
                    self.stdout.write(self.style.ERROR("Could not find a suitable 'Sector Name' column."))
                    return

                if not industry_key:
                    self.stdout.write(self.style.WARNING("Could not find 'Industry Name' column for mapping."))

                unique_sectors = set()
                industry_sector_map = {}

                for row in reader:
                    # Map lower keys back to original keys
                    row_lower = {k.lower(): v for k, v in row.items()}
                    
                    sector_name = row_lower.get(sector_key, '').strip()
                    industry_name = row_lower.get(industry_key, '').strip() if industry_key else None
                    
                    if sector_name:
                        unique_sectors.add(sector_name)
                        if industry_name:
                            industry_sector_map[industry_name] = sector_name

                # Create Sectors
                for sector_name in unique_sectors:
                    _, created = Sector.objects.get_or_create(name=sector_name)
                    if created:
                        sectors_created += 1
                        self.stdout.write(f"Created sector: {sector_name}")

                # Update Companies based on Industry-Sector mapping
                if industry_sector_map:
                    self.stdout.write("Updating company sectors based on industry mapping...")
                    # Get all companies that have an industry set
                    companies = Company.objects.exclude(industry__isnull=True).exclude(industry='')
                    
                    for company in companies:
                        # Find the sector corresponding to the company's industry
                        # The industry in DB might match the industry name in CSV
                        # We try exact match first
                        
                        mapped_sector = industry_sector_map.get(company.industry)
                        
                        # If not found, try case-insensitive or partial? 
                        # For now, strict mapping is safer, but let's try to be a bit flexible if needed.
                        # The CSV has 'Apparel Retail', DB might have 'Apparel Retail'.
                        
                        if mapped_sector and company.sector != mapped_sector:
                            company.sector = mapped_sector
                            company.save()
                            companies_updated += 1
                            if companies_updated % 100 == 0:
                                self.stdout.write(f"Updated {companies_updated} companies...")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error processing: {str(e)}'))
            return

        self.stdout.write(self.style.SUCCESS(f'Successfully created {sectors_created} new sectors.'))
        self.stdout.write(self.style.SUCCESS(f'Successfully updated {companies_updated} companies with sector info.'))
