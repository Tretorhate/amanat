from django.contrib import admin
from .models import DashboardWidget, AnalyticsReport, AppealAnalytics, UserActivityLog, SystemPerformanceMetrics


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = ['name', 'widget_type', 'position', 'is_active', 'created_at']
    list_filter = ['widget_type', 'is_active', 'created_at']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['position']


@admin.register(AnalyticsReport)
class AnalyticsReportAdmin(admin.ModelAdmin):
    list_display = ['name', 'report_type', 'created_by', 'created_at']
    list_filter = ['report_type', 'created_at']
    search_fields = ['name', 'description', 'created_by__username']
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['created_by']
    ordering = ['-created_at']


@admin.register(AppealAnalytics)
class AppealAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['appeal', 'resolution_time_hours', 'satisfaction_score', 'reopened_count', 'calculated_at']
    list_filter = ['calculated_at']
    search_fields = ['appeal__title']
    readonly_fields = ['calculated_at']
    autocomplete_fields = ['appeal']
    ordering = ['-calculated_at']


@admin.register(UserActivityLog)
class UserActivityLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'timestamp', 'ip_address']
    list_filter = ['action', 'timestamp', 'ip_address']
    search_fields = ['user__username', 'metadata', 'ip_address']
    readonly_fields = ['timestamp']
    autocomplete_fields = ['user']
    ordering = ['-timestamp']


@admin.register(SystemPerformanceMetrics)
class SystemPerformanceMetricsAdmin(admin.ModelAdmin):
    list_display = ['metric_type', 'value', 'unit', 'recorded_at']
    list_filter = ['metric_type', 'unit', 'recorded_at']
    search_fields = ['metric_type', 'unit']
    readonly_fields = ['recorded_at']
    ordering = ['-recorded_at']