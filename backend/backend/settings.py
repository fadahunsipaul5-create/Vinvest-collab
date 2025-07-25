import os
from pathlib import Path
from dotenv import load_dotenv
from datetime import timedelta
#comment
# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')


# --- Environment Detection ---
# This is the single source of truth. It's True in Cloud Build and Cloud Run.
IS_PROD_ENV = os.environ.get('IS_CLOUD_ENV', 'False') == 'True'


# --- Secret Key ---
# Simplified and safer secret key handling
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-development-key-change-in-production')
if IS_PROD_ENV and SECRET_KEY == 'django-insecure-development-key-change-in-production':
    raise ValueError("ERROR: A real SECRET_KEY must be set in production environments.")


# --- Debug ---
DEBUG = not IS_PROD_ENV


# --- Allowed Hosts ---
# Simplified and safer ALLOWED_HOSTS handling
ALLOWED_HOSTS = []
if IS_PROD_ENV:
    # This automatically gets the Cloud Run URL
    ALLOWED_HOSTS = ['sec-insights-backend-791634680391.us-central1.run.app','sec-frontend-791634680391.us-central1.run.app','sec-insights-app-d9wp.vercel.app',]
    cloud_run_url = os.environ.get('K_SERVICE_URL')
    if cloud_run_url:
        ALLOWED_HOSTS.append(cloud_run_url.split("://")[1])
    else:
        # Fallback for the migrate step where K_SERVICE_URL might not be set
        ALLOWED_HOSTS.append('sec-insights-backend-791634680391.us-central1.run.app')
else:
    # For local development
    ALLOWED_HOSTS = ['localhost', '127.0.0.1','localhost:5173','localhost:3000',]


# --- Database Configuration ---
# This is the corrected logic that will fix your migration errors.
if IS_PROD_ENV:
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
    "users",  # Changed from "account" to fix naming conflict
    'sec_app',
    # 3rd Party Apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    'channels_redis',
    'drf_yasg',
    'django_filters',

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
]
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

AUTH_USER_MODEL = "users.User" # Changed from "account.User"

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
    ]
}

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)


ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_EMAIL_VERIFICATION = 'mandatory'
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_UNIQUE_EMAIL = True

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
