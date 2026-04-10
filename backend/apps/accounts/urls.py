from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import views_admin

app_name = 'accounts'

router = DefaultRouter()
router.register(r'admin/users', views_admin.AdminUserViewSet, basename='admin-users')

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('profile/', views.get_user_profile, name='user-profile'),
    path('me/', views.UserDetailView.as_view(), name='user-detail'),
    path('admin/all-users/', views_admin.get_all_users, name='all-users'),
    path('admin/toggle-active/<uuid:user_id>/', views_admin.toggle_user_active, name='toggle-active'),
    path('admin/sample-csv/', views_admin.get_sample_csv, name='sample-csv'),
    path('admin/users/import-csv/', views_admin.import_users_csv, name='import-users-csv'),
    path('telegram-auth/', views.TelegramAuthView.as_view(), name='telegram-auth'),
    path('generate-link-code/', views.GenerateTelegramLinkCodeView.as_view(), name='generate-link-code'),
    path('verify-link-code/', views.VerifyTelegramLinkCodeView.as_view(), name='verify-link-code'),
] + router.urls