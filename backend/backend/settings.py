# backend/backend/settings.py

import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# Basic Settings
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-development-key-change-in-production')
DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'

GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
DOMAIN = os.getenv('DOMAIN')
STRIPE_PRICE_PRO_PLUS = os.getenv('STRIPE_PRICE_PRO_PLUS')
STRIPE_PRICE_PRO = os.getenv('STRIPE_PRICE_PRO')
# Allowed Hosts
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '[::1]',
    'sec-insights-backend-791634680391.us-central1.run.app',
]

# Database Configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
    }
}

# Check if running in the Google Cloud environment.
# This uses the 'IS_CLOUD_ENV=True' flag from your cloudbuild.yaml
if os.environ.get('IS_CLOUD_ENV'):
    DATABASES['default'].update({
        'HOST': '/cloudsql/getdeepaiapp:us-central1:sec-db'
    })
else:
    DATABASES['default'].update({
        'HOST': '127.0.0.1',
        'PORT': '5432',
    })


INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Your apps
    "account",
    'backend', # Assuming 'backend' is also an app, or your 'sec_app' if it's main
    'sec_app', # Example app
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    'channels_redis',
    'drf_yasg',
    'django_filters',  
    'whitenoise', 

    #google auth
    'django.contrib.sites',
    'rest_framework.authtoken',
    'allauth',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'dj_rest_auth',
    'dj_rest_auth.registration',

]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', 
    'whitenoise.middleware.WhiteNoiseMiddleware', 
    'django.middleware.common.CommonMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CSRF settings for API endpoints
CSRF_COOKIE_SECURE = False  # Set to True in production with HTTPS
CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = False

SITE_ID = 1


ROOT_URLCONF = 'backend.urls' # Assuming your main urls.py is in backend/backend/urls.py

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

WSGI_APPLICATION = 'backend.wsgi.application' # Matches your Dockerfile CMD

# Channel settings for websockets (if you're using them)
ASGI_APPLICATION = 'backend.asgi.application' # Assuming your asgi.py is in backend/backend/asgi.py

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.pubsub.RedisPubSubChannelLayer",
        "CONFIG": {
            "hosts": [(os.environ.get('REDIS_HOST', '127.0.0.1'), os.environ.get('REDIS_PORT', 6379))],
            "password": os.environ.get('REDIS_PASSWORD'), # If your Redis has a password
        },
    },
}
# If you use Redis for Channels, you might need to set REDIS_HOST etc. as environment variables too.


AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# --- Static files (CSS, JavaScript, Images) ---
# https://docs.djangoproject.com/en/5.0/howto/static-files/
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles' # Location where collectstatic gathers files
STATICFILES_DIRS = [
    # BASE_DIR / 'static_dev', # Example: if you have static files outside app folders
]

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# --- Your existing SEC API Settings ---
SEC_API_KEY = os.getenv('SEC_API_KEY')
SEC_API_BASE_URL = os.getenv('SEC_API_BASE_URL', 'https://api.sec-api.io')
SEC_USER_AGENT = os.getenv('SEC_USER_AGENT', 'Nanik Workforce paul@nanikworkforce.com')


# CORS Headers configuration
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]


CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://sec-frontend-791634680391.us-central1.run.app",
    "https://sec-insights-backend-791634680391.us-central1.run.app",
    "https://sec-insights-app-d9wp.vercel.app",
]

# CSRF settings for API endpoints
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS


AUTH_USER_MODEL = "account.User"

# Django REST Framework Simple JWT settings

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": False,
    "UPDATE_LAST_LOGIN": False,


    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "VERIFYING_KEY": None,
    "AUDIENCE": None,
    "ISSUER": None,
    "JWK_URL": None,


    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "USER_AUTHENTICATION_RULE": "rest_framework_simplejwt.authentication.default_user_authentication_rule",


     "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
   "TOKEN_USER_CLASS": "rest_framework_simplejwt.models.TokenUser",

    "JTI_CLAIM": "jti",

    "SLIDING_TOKEN_LIFETIME": timedelta(minutes=5),
    "SLIDING_TOKEN_REFRESH_LIFETIME": timedelta(days=1),
 }

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'sec_app.renderers.CustomJSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
    ]
}

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com" # Or your SMTP provider's host
EMAIL_PORT = 587
EMAIL_USE_TLS = True # Use TLS for port 587 okay
# EMAIL_USE_SSL = False # Only one of TLS or SSL should be True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER or 'info@valueaccel.com')

ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_EMAIL_VERIFICATION = 'mandatory'
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_USERNAME_REQUIRED = False

# Fix for dj_rest_auth with custom User model
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = 'email'

REST_USE_JWT = True

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'ERROR',
    },
}

# SERVER_EMAIL = DEFAULT_FROM_EMAIL # For error reporting emails (optional)

# Set SITE_URL based on environment
if DEBUG:
    SITE_URL = "http://127.0.0.1:8000"
    CORS_ALLOW_ALL_ORIGINS = True
else:
    SITE_URL = "https://sec-insights-backend-791634680391.us-central1.run.app"