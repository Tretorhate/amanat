"""
Development settings for amanat project.
"""

from .base import *

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DEV_DB_NAME', 'amanat_dev'),
        'USER': os.getenv('DEV_DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DEV_DB_PASSWORD', ''),
        'HOST': os.getenv('DEV_DB_HOST', 'localhost'),
        'PORT': os.getenv('DEV_DB_PORT', '5432'),
    }
}

# Email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Additional development settings
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
        'level': 'DEBUG',
    },
}