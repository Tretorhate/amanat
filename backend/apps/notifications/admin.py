from django.contrib import admin
from .models import NotificationTemplate, Notification, UserNotificationPreference


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'notification_type', 'event_type', 'is_active', 'created_at']
    list_filter = ['notification_type', 'event_type', 'is_active', 'created_at']
    search_fields = ['name', 'subject', 'body_template']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'recipient', 'notification_type', 'status', 'created_at']
    list_filter = ['notification_type', 'status', 'created_at']
    search_fields = ['title', 'message', 'recipient__username']
    readonly_fields = ['created_at', 'sent_at', 'delivered_at']
    autocomplete_fields = ['recipient', 'template', 'appeal']
    ordering = ['-created_at']


@admin.register(UserNotificationPreference)
class UserNotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_notifications', 'push_notifications', 'in_app_notifications']
    list_filter = ['email_notifications', 'push_notifications', 'in_app_notifications', 'sms_notifications']
    search_fields = ['user__username', 'user__email']
    autocomplete_fields = ['user']
    ordering = ['user__username']