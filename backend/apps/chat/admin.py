from django.contrib import admin
from .models import MessageThread, Message, MessageReadReceipt, MessageNotification


@admin.register(MessageThread)
class MessageThreadAdmin(admin.ModelAdmin):
    list_display = ['appeal', 'subject', 'is_active', 'created_at', 'updated_at']
    list_filter = ['is_active', 'created_at', 'updated_at']
    search_fields = ['subject', 'appeal__title']
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['appeal', 'participants']
    ordering = ['-updated_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'appeal', 'sender_type', 'sender_id', 'created_at']
    list_filter = ['sender_type', 'created_at']
    search_fields = ['content', 'appeal__title']
    readonly_fields = ['created_at']
    autocomplete_fields = ['appeal']
    ordering = ['-created_at']


@admin.register(MessageReadReceipt)
class MessageReadReceiptAdmin(admin.ModelAdmin):
    list_display = ['message', 'reader', 'read_at']
    list_filter = ['read_at']
    search_fields = ['message__content', 'reader__username']
    readonly_fields = ['read_at']
    autocomplete_fields = ['message', 'reader']
    ordering = ['-read_at']


@admin.register(MessageNotification)
class MessageNotificationAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'message', 'notification_type', 'is_sent', 'sent_at']
    list_filter = ['notification_type', 'is_sent', 'sent_at']
    search_fields = ['recipient__username', 'message__content']
    readonly_fields = ['sent_at', 'delivered_at']
    autocomplete_fields = ['recipient', 'message']
    ordering = ['-sent_at']