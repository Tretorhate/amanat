"""
Amanat Project URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/stable/topics/http/urls/
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # API endpoints
    path('api/auth/', include('apps.accounts.urls')),  # Authentication endpoints
    path('api/accounts/', include('apps.accounts.urls')),  # User management
    path('api/appeals/', include('apps.appeals.urls')),
    path('api/chat/', include('apps.chat.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/citizens/', include('apps.citizens.urls')),
    path('api/deputies/', include('apps.deputies.urls')),
]
