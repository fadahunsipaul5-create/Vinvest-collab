import os
from pathlib import Path
from dotenv import load_dotenv
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# Basic Settings
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-development-key-change-in-production')
DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'

GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')

# Stripe Configuration
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
DOMAIN = os.getenv('DOMAIN')
STRIPE_PRICE_PRO_PLUS = os.getenv('STRIPE_PRICE_PRO_PLUS')
STRIPE_PRICE_PRO = os.getenv('STRIPE_PRICE_PRO')

# Centralized plan to quota mapping
SUBSCRIPTION_PLAN_QUOTAS = {
    "free": 10,
    "pro": 50,
    "pro_plus": 9999,
}

# --- Environment Detection ---
# This is the single source of truth. It's True in Cloud Build and Cloud Run.
IS_PROD_ENV = os.environ.get('IS_CLOUD_ENV', 'False') == 'True'

# --- Secret Key ---
# Simplified and safer secret key handling
if IS_PROD_ENV and SECRET_KEY == 'django-insecure-development-key-change-in-production':
    raise ValueError("ERROR: A real SECRET_KEY must be set in production environments.")

# --- Debug ---
DEBUG = not IS_PROD_ENV

# --- Allowed Hosts ---
# Include both production and development hosts
ALLOWED_HOSTS = [
    # Local development
    'localhost',
    '127.0.0.1',
    '[::1]',
    'localhost:5173',
    'localhost:3000',
    # Production domains
    'sec-insights-backend-791634680391.us-central1.run.app',
    'sec-frontend-791634680391.us-central1.run.app',
    'sec-insights-app-d9wp.vercel.app',
    'api.getdeep.ai',
    'getdeep.ai',
    'get-deep-ai.vercel.app',
    'sec-insights-app.onrender.com',
]

# Add Cloud Run URL if available
cloud_run_url = os.environ.get('K_SERVICE_URL')
if cloud_run_url:
    ALLOWED_HOSTS.append(cloud_run_url.split("://")[1])

# --- Database Configuration ---
# Priority: DATABASE_URL (Render) > Cloud SQL (GCP) > SQLite (local)
# Neo4j is used separately for company/financial data (not Django models)

# Check for DATABASE_URL first (Render PostgreSQL)
if os.environ.get('DATABASE_URL'):
    print("INFO: Using DATABASE_URL (Render PostgreSQL)")
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.config(
            default=os.environ.get('DATABASE_URL'),
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
elif IS_PROD_ENV:
    # Production database configuration for Cloud Run and Cloud Build
    print("INFO: Using Cloud SQL PostgreSQL config.")
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME'),
            'USER': os.environ.get('DB_USER'),
            'PASSWORD': os.environ.get('DB_PASSWORD'),
            'HOST': f"/cloudsql/{os.environ.get('INSTANCE_CONNECTION_NAME')}",
            'PORT': '5432',
        }
    }
else:
    # Local development database configuration
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# --- Application definition ---
INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Your apps
    "accounts",
    'sec_app',
    'sec_app_2',
    # 3rd Party Apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    'channels_redis',
    'drf_yasg',
    'django_filters',
    'whitenoise',
    'django_extensions',

    # Google Auth
    'django.contrib.sites',
    'rest_framework.authtoken',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'dj_rest_auth',
    'dj_rest_auth.registration',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

SITE_ID = 1
ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'
ASGI_APPLICATION = 'backend.asgi.application'

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.pubsub.RedisPubSubChannelLayer",
        "CONFIG": {
            "hosts": [(os.environ.get('REDIS_HOST', '127.0.0.1'), os.environ.get('REDIS_PORT', 6379))],
            "password": os.environ.get('REDIS_PASSWORD'),
        },
    },
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- Your existing SEC API Settings ---
SEC_API_KEY = os.getenv('SEC_API_KEY')
SEC_API_BASE_URL = os.getenv('SEC_API_BASE_URL', 'https://api.sec-api.io')
SEC_USER_AGENT = os.getenv('SEC_USER_AGENT', 'ValueAccel info@valueaccel.com')

# CORS Headers configuration
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization', 'content-type', 'dnt',
    'origin', 'user-agent', 'x-csrftoken', 'x-requested-with',
]
CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://sec-frontend-791634680391.us-central1.run.app",
    "https://sec-insights-app-d9wp.vercel.app",
    "https://getdeep.ai",
    "https://api.getdeep.ai",
    "https://get-deep-ai.vercel.app",
    "https://sec-insights-app.onrender.com",
]
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

AUTH_USER_MODEL = "accounts.User"

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}
# Email Configuration - SendGrid via SMTP
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY')

if SENDGRID_API_KEY:
    # Use SendGrid SMTP
    EMAIL_HOST = "smtp.sendgrid.net"
    EMAIL_PORT = 587
    EMAIL_USE_TLS = True
    EMAIL_USE_SSL = False
    EMAIL_HOST_USER = "apikey"  # Always "apikey" for SendGrid
    EMAIL_HOST_PASSWORD = SENDGRID_API_KEY
    DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'admin@nanikworkforce.com')
else:
    # Fallback to Gmail (for local development)
    EMAIL_HOST = "smtp.gmail.com"
    EMAIL_PORT = 465
    EMAIL_USE_TLS = False
    EMAIL_USE_SSL = True  # Use SSL for port 465
    EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
    DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER or 'info@valueaccel.com')

# Django-allauth configuration (updated to new format)
ACCOUNT_EMAIL_VERIFICATION = 'mandatory'
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_UNIQUE_EMAIL = True

# New allauth settings (replaces deprecated ACCOUNT_AUTHENTICATION_METHOD, ACCOUNT_EMAIL_REQUIRED, ACCOUNT_USERNAME_REQUIRED)
ACCOUNT_LOGIN_METHODS = {'email'}
ACCOUNT_SIGNUP_FIELDS = ['email*', 'password1*', 'password2*']

REST_USE_JWT = True

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {'class': 'logging.StreamHandler'},
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

if DEBUG:
    SITE_URL = "http://127.0.0.1:8000"
    CORS_ALLOW_ALL_ORIGINS = True
else:
    SITE_URL = "https://sec-insights-backend-791634680391.us-central1.run.app"

PLAN_QUOTAS = {
    "pro": 100,
    "pro_plus": 200,
}

SECURE_CROSS_ORIGIN_OPENER_POLICY = None
SECURE_CROSS_ORIGIN_EMBEDDER_POLICY = None
