from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'citizens'

# Create router for viewsets
router = DefaultRouter()
router.register(r'constituencies', views.ConstituencyViewSet, basename='constituency')

urlpatterns = [
    path('', views.CitizenDetailView.as_view(), name='citizen-detail'),
    path('documents/', views.CitizenDocumentListView.as_view(), name='citizen-documents-list'),
    path('documents/<int:pk>/', views.CitizenDocumentDetailView.as_view(), name='citizen-document-detail'),
    path('check/', views.check_citizen, name='check-citizen'),
    path('register/', views.register_citizen, name='register-citizen'),
] + router.urls