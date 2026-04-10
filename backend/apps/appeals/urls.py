from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import AppealViewSet, create_appeal_bot, get_my_appeals_bot, deputy_respond_to_appeal
from .views_stats import get_platform_statistics, get_category_distribution, get_recent_appeals

router = DefaultRouter()
router.register(r'', AppealViewSet, basename='appeal')

urlpatterns = [
    path('stats/', get_platform_statistics, name='platform-stats'),
    path('stats/categories/', get_category_distribution, name='category-distribution'),
    path('stats/recent/', get_recent_appeals, name='recent-appeals'),
    path('create/', create_appeal_bot, name='create-appeal-bot'),
    path('my-appeals/', get_my_appeals_bot, name='my-appeals-bot'),
    path('<uuid:appeal_id>/respond/', deputy_respond_to_appeal, name='deputy-respond'),
] + router.urls