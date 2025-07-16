#!/usr/bin/env python3
"""
Setup script for Google OAuth environment variables
"""

import os
import sys

def create_env_file():
    """Create a .env file in the backend directory with the required variables"""
    
    env_content = """# Google OAuth Configuration
GOOGLE_CLIENT_ID=791634680391-j71tp9g348el3j1k1c9fdt9op95eo76s.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Django Settings
SECRET_KEY=django-insecure-development-key-change-in-production
DEBUG=True

# Database Settings (for local development)
DB_NAME=sec_insights_db
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=127.0.0.1
DB_PORT=5432

# Email Settings
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password_here
DEFAULT_FROM_EMAIL=your_email@gmail.com

# SEC API Settings
SEC_API_KEY=your_sec_api_key_here
SEC_API_BASE_URL=https://api.sec-api.io
SEC_USER_AGENT=Nanik Workforce paul@nanikworkforce.com

# Redis Settings
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# Site URL
SITE_URL=http://localhost:5173
"""
    
    backend_dir = os.path.join(os.getcwd(), 'backend')
    env_file_path = os.path.join(backend_dir, '.env')
    
    if os.path.exists(env_file_path):
        print(f"⚠️  .env file already exists at {env_file_path}")
        response = input("Do you want to overwrite it? (y/N): ")
        if response.lower() != 'y':
            print("Skipping .env file creation.")
            return
    
    try:
        with open(env_file_path, 'w') as f:
            f.write(env_content)
        print(f"✅ Created .env file at {env_file_path}")
        print("📝 Please edit the file and replace the placeholder values with your actual credentials.")
    except Exception as e:
        print(f"❌ Error creating .env file: {e}")

def main():
    print("🔧 Google OAuth Environment Setup")
    print("=" * 40)
    
    create_env_file()
    
    print("\n📋 Next Steps:")
    print("1. Edit the .env file in the backend/ directory")
    print("2. Replace placeholder values with your actual credentials")
    print("3. Configure Google OAuth Console (see GOOGLE_OAUTH_SETUP.md)")
    print("4. Start your backend server: cd backend && python manage.py runserver")
    print("5. Start your frontend: cd sec_frontend && npm run dev")
    
    print("\n🔗 Google OAuth Console Setup:")
    print("- Go to: https://console.cloud.google.com/")
    print("- Add these origins to your OAuth client:")
    print("  * http://localhost:5173")
    print("  * http://127.0.0.1:5173")
    print("  * http://localhost:3000")
    print("  * http://127.0.0.1:3000")

if __name__ == "__main__":
    main() 