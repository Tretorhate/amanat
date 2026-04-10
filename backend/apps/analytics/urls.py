from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    path('widgets/', views.DashboardWidgetListView.as_view(), name='dashboard-widget-list'),
    path('widgets/<int:pk>/', views.DashboardWidgetDetailView.as_view(), name='dashboard-widget-detail'),
    path('reports/', views.AnalyticsReportListView.as_view(), name='analytics-report-list'),
    path('reports/<int:pk>/', views.AnalyticsReportDetailView.as_view(), name='analytics-report-detail'),
    path('appeal-statistics/', views.get_appeal_statistics, name='appeal-statistics'),
    path('user-activity-summary/', views.get_user_activity_summary, name='user-activity-summary'),
    path('appeal-trends/', views.get_appeal_trends, name='appeal-trends'),
    path('user-engagement-metrics/', views.get_user_engagement_metrics, name='user-engagement-metrics'),
    path('reports/custom/', views.create_custom_report, name='create-custom-report'),
    path('ai-detailed/', views.get_ai_detailed_analytics, name='ai-detailed-analytics'),
]