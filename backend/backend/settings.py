# backend/backend/settings.py

import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))


# --- Environment Detection ---
IS_CLOUD_ENV = os.getenv('K_SERVICE', False) or os.getenv('GAE_APPLICATION', False)
IS_DOCKER_BUILD = os.getenv('DJANGO_BUILD_ENVIRONMENT', 'False') == 'True'


DEBUG = not IS_CLOUD_ENV and not IS_DOCKER_BUILD



if IS_DOCKER_BUILD:
    SECRET_KEY = os.environ.get('SECRET_KEY_BUILD_TIME')
else:
    SECRET_KEY = os.environ.get('SECRET_KEY')

if not SECRET_KEY and not (DEBUG or IS_DOCKER_BUILD): # Check for key if not in dev/build
    raise EnvironmentError("SECRET_KEY environment variable is not set. Required for production.")


# --- ALLOWED_HOSTS ---
ALLOWED_HOSTS = [
    'localhost',                     # For local dev
    '127.0.0.1',                     # Local IPv4
    '[::1]',                         # Local IPv6
    'sec-insights-backend-791634680391.us-central1.run.app', 
]

if IS_CLOUD_ENV:
    cloud_run_url = os.getenv('K_SERVICE_URL')
    if cloud_run_url:
        ALLOWED_HOSTS.append(cloud_run_url.split('//')[1].split('/')[0]) # Hostname
        ALLOWED_HOSTS.append(cloud_run_url) # Full URL
    ALLOWED_HOSTS.append('sec-insights-backend-791634680391.us-central1.run.app') # Explicit URL
elif IS_DOCKER_BUILD:
    ALLOWED_HOSTS.append('127.0.0.1')
    ALLOWED_HOSTS.append('localhost')
else:
    ALLOWED_HOSTS.append('127.0.0.1')
    ALLOWED_HOSTS.append('localhost')
    ALLOWED_HOSTS.append('[::1]') # IPv6
   

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': os.environ.get('DB_NAME'),
#         'USER': os.environ.get('DB_USER'),
#         'PASSWORD': os.environ.get('DB_PASSWORD'),
#     }
# }

# if IS_CLOUD_ENV:
#     DATABASES['default']['HOST'] = f'/cloudsql/{os.environ.get("INSTANCE_CONNECTION_NAME")}'
#     print(f"INFO: Using Cloud Run DB config. Host: {DATABASES['default']['HOST']}")

# elif IS_DOCKER_BUILD:
#     DATABASES['default'] = dj_database_url.config(
#         default='sqlite:///tmp/build_db.sqlite3'
#     )
#     print("INFO: Using SQLite for Docker build environment (collectstatic).")

# else: # Local development
#     DATABASES['default']['HOST'] = os.environ.get('DB_HOST', '127.0.0.1')
#     DATABASES['default']['PORT'] = os.environ.get('DB_PORT', '5432')
#     print(f"INFO: Using Local DB config. Host: {DATABASES['default']['HOST']}:{DATABASES['default']['PORT']}")


DATABASES = {
    'default': {} # Start with an empty default
}

if IS_DOCKER_BUILD:
    print("INFO: Using SQLite for Docker build environment.")
    DATABASES['default'] = dj_database_url.config(
        default='sqlite:///tmp/build_db.sqlite3'
    )

elif IS_CLOUD_ENV:
    print("INFO: Using Cloud Run DB config.")
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': f'/cloudsql/{os.environ.get("INSTANCE_CONNECTION_NAME")}'
    }

else:
    print("INFO: Using local SQLite database.")
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }


print(f"DEBUG DB HOST: {DATABASES['default'].get('HOST')}")
print(f"DEBUG INSTANCE_CONNECTION_NAME: {os.environ.get('INSTANCE_CONNECTION_NAME')}")
print(f"DEBUG DB USER: {os.environ.get('DB_USER')}")
print(f"DEBUG DB PASSWORD: {os.environ.get('DB_PASSWORD')}")
print(f"DEBUG DB NAME: {os.environ.get('DB_NAME')}")


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


CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://sec-frontend-791634680391.us-central1.run.app",
    "https://sec-insights-backend-791634680391.us-central1.run.app",
    "https://sec-insights-app.vercel.app",
    "https://sec-insights-backend.onrender.com",
]




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
EMAIL_USE_TLS = True # Use TLS for port 587
# EMAIL_USE_SSL = False # Only one of TLS or SSL should be True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER or 'paul@nanikworkforce.com')

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
SITE_URL = "https://sec-insights-app.vercel.app"

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
