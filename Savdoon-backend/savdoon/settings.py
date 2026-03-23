"""
Django settings for Savdoon project.
"""

from pathlib import Path
from datetime import timedelta
import base64
import os
import dj_database_url
from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(BASE_DIR, '.env'))


def _env_bool(name: str, default: bool) -> bool:
    v = os.environ.get(name, '').strip().lower()
    if v in ('true', '1', 'yes'):
        return True
    if v in ('false', '0', 'no'):
        return False
    return default


SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-savdoon-dev-key-change-in-production')
DEBUG = os.environ.get('DJANGO_DEBUG', 'True') == 'True'

if not DEBUG and SECRET_KEY.startswith('django-insecure'):
    raise ImproperlyConfigured('DJANGO_SECRET_KEY must be set to a strong value when DEBUG=False')


def _derive_field_encryption_key_from_secret(secret: str) -> bytes:
    """Stable Fernet key from SECRET_KEY when FIELD_ENCRYPTION_KEY is unset (e.g. Railway)."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b'savdoon-field-enc-v1',
        iterations=480_000,
    )
    return base64.urlsafe_b64encode(kdf.derive(secret.encode('utf-8')))


ALLOWED_HOSTS = ['*']
CSRF_TRUSTED_ORIGINS = [
    "https://savdoon.vercel.app",
    "https://*.railway.app",
    "https://*.vercel.app",
    "http://localhost:5173",
]
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Application definition
INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'drf_spectacular',
    'channels',
    # 'django_user_agents',
    # Local apps
    'accounts',
    'stores',
    'products',
    'orders',
    'chat',
    'delivery',
    'marketing',
    'notifications',
    'savdoon.apps.SavdoonConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # 'django_user_agents.middleware.UserAgentMiddleware',
    # 'axes.middleware.AxesMiddleware',
    # Ultimate Security Suite - Temporarily disabled to fix CORS
    # 'savdoon.security_middleware.HoneypotMiddleware',
    # 'savdoon.security_middleware.SecurityHeadersMiddleware',
    # 'csp.middleware.CSPMiddleware',
]

AUTHENTICATION_BACKENDS = [
    # 'axes.backends.AxesStandaloneBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# Axes Configuration
AXES_FAILURE_LIMIT = 5
AXES_COOLOFF_TIME = timedelta(minutes=15)
AXES_RESET_ON_SUCCESS = True
# AXES_LOCK_OUT_BY_COMBINATION_USER_AND_IP is deprecated
AXES_LOCKOUT_PARAMETERS = ["username", "ip_address"]

# Password Hashers
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]

ROOT_URLCONF = 'savdoon.urls'

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

WSGI_APPLICATION = 'savdoon.wsgi.application'
ASGI_APPLICATION = 'savdoon.asgi.application'

# Channels Configuration
if os.environ.get('REDIS_URL'):
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                "hosts": [os.environ.get('REDIS_URL')],
            },
        },
    }
else:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }

# Database - PostgreSQL on Railway, SQLite for local
DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR / "db_prod_v1.sqlite3"}',
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Custom User model
AUTH_USER_MODEL = 'accounts.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    # {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 6}},
    # {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    # {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Tashkent'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

# Media files
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS settings
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = [
    "https://savdoon.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
]
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.railway\.app$",
    r"^https://.*\.vercel\.app$",
]

CORS_ALLOW_CREDENTIALS = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = False
# Secure cookies break HTTP localhost; default off in DEBUG, on in production
SESSION_COOKIE_SECURE = _env_bool('SESSION_COOKIE_SECURE', default=not DEBUG)
CSRF_COOKIE_SECURE = SESSION_COOKIE_SECURE
from corsheaders.defaults import default_headers

CORS_ALLOW_HEADERS = list(default_headers) + [
    'x-api-key',
    'content-type',
    'ngrok-skip-browser-warning',
    'authorization',
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'stores.authentication.StoreApiKeyAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
    'DEFAULT_THROTTLE_CLASSES': [],
    'DEFAULT_THROTTLE_RATES': {},
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Fernet key for phone field encryption (32-byte url-safe base64)
_field_key = os.environ.get('FIELD_ENCRYPTION_KEY', '').strip()
if _field_key:
    try:
        Fernet(_field_key.encode('ascii'))
    except Exception as exc:
        raise ImproperlyConfigured('FIELD_ENCRYPTION_KEY must be a valid Fernet key') from exc
    FIELD_ENCRYPTION_KEY = _field_key.encode('ascii')
elif DEBUG:
    # Fixed dev-only key so local data stays decryptable across restarts
    FIELD_ENCRYPTION_KEY = b'v2S2rIlVQGgWQAqmEutJGQVI3rsdPW5p9eTjwmXaHQ4='
else:
    # Production without explicit key: derive from DJANGO_SECRET_KEY (set FIELD_ENCRYPTION_KEY to override)
    FIELD_ENCRYPTION_KEY = _derive_field_encryption_key_from_secret(SECRET_KEY)

# Swagger/OpenAPI settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'Savdoon API',
    'DESCRIPTION': 'Multi-store e-commerce platform API with Face ID authentication',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'TAGS': [
        {'name': 'Auth', 'description': 'Authentication endpoints'},
        {'name': 'Face ID', 'description': 'WebAuthn Face ID authentication'},
        {'name': 'Stores', 'description': 'Store management'},
        {'name': 'Products', 'description': 'Product management'},
        {'name': 'Orders', 'description': 'Order management'},
        {'name': 'Super Admin', 'description': 'Super admin operations'},
    ],
}

# WebAuthn settings (comma-separated WEBAUTHN_ORIGIN for multiple frontends)
WEBAUTHN_RP_ID = os.environ.get('WEBAUTHN_RP_ID', 'localhost')
WEBAUTHN_RP_NAME = 'Savdoon'
_webauthn_origin_env = os.environ.get('WEBAUTHN_ORIGIN', 'http://localhost:5173')
if ',' in _webauthn_origin_env:
    WEBAUTHN_ORIGIN = [o.strip() for o in _webauthn_origin_env.split(',') if o.strip()]
else:
    WEBAUTHN_ORIGIN = _webauthn_origin_env.strip()

# Security Settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Content Security Policy (CSP)
CSP_DEFAULT_SRC = ("'self'",)
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'", "https://fonts.googleapis.com")
CSP_FONT_SRC = ("'self'", "https://fonts.gstatic.com")
CSP_IMG_SRC = ("'self'", "data:", "https:", "http:")
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'", "'unsafe-eval'")
CSP_CONNECT_SRC = ("'self'", "https:", "http:")

# SMTP Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
EMAIL_TIMEOUT = 10 # seconds
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)

# Logging Configuration with Data Masking
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'mask_sensitive_data': {
            '()': 'savdoon.logging_filters.SensitiveDataFilter',
        },
    },
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'filters': ['mask_sensitive_data'],
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'level': 'INFO',
            'filters': ['mask_sensitive_data'],
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs/security.log',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'savdoon': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}

# Create logs directory if it doesn't exist
os.makedirs(BASE_DIR / 'logs', exist_ok=True)
