from django.urls import path
from . import views

app_name = 'deputies'

urlpatterns = [
    path('', views.DeputyDetailView.as_view(), name='deputy-detail'),
    path('constituencies/', views.DeputyConstituencyListView.as_view(), name='deputy-constituency-list'),
    path('constituencies/<uuid:id>/', views.DeputyConstituencyDetailView.as_view(), name='deputy-constituency-detail'),
    path('specializations/', views.DeputySpecializationListView.as_view(), name='deputy-specialization-list'),
    path('specializations/<uuid:id>/', views.DeputySpecializationDetailView.as_view(), name='deputy-specialization-detail'),
    path('register/', views.register_deputy, name='deputy-register'),
]