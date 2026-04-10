from django.contrib import admin
from .models import Appeal, AppealCategory, AppealStatus, AppealAttachment, AppealComment, AppealActivityLog


@admin.register(AppealCategory)
class AppealCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at']
    ordering = ['name']


@admin.register(AppealStatus)
class AppealStatusAdmin(admin.ModelAdmin):
    list_display = ['name', 'color', 'is_final', 'created_at']
    list_filter = ['is_final', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at']
    ordering = ['name']


@admin.register(Appeal)
class AppealAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'citizen', 'deputy', 'category', 'status', 'priority', 'created_at']
    list_filter = ['status', 'category', 'priority', 'created_at']
    search_fields = ['title', 'description', 'citizen__full_name', 'deputy__full_name']
    readonly_fields = ['created_at', 'responded_at', 'closed_at']
    autocomplete_fields = ['citizen', 'deputy']
    ordering = ['-created_at']
    list_per_page = 25


@admin.register(AppealAttachment)
class AppealAttachmentAdmin(admin.ModelAdmin):
    list_display = ['appeal', 'filename', 'file_size', 'uploaded_at']
    list_filter = ['uploaded_at']
    search_fields = ['appeal__title', 'filename']
    readonly_fields = ['uploaded_at']
    autocomplete_fields = ['appeal']
    ordering = ['-uploaded_at']


@admin.register(AppealComment)
class AppealCommentAdmin(admin.ModelAdmin):
    list_display = ['appeal', 'author', 'created_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['content', 'appeal__title', 'author__username']
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['appeal', 'author']
    ordering = ['-created_at']



@admin.register(AppealActivityLog)
class AppealActivityLogAdmin(admin.ModelAdmin):
    list_display = ['appeal', 'changed_by', 'status_from', 'status_to', 'changed_at']
    list_filter = ['changed_at', 'status_from', 'status_to']
    search_fields = ['appeal__title', 'changed_by__username', 'notes']
    readonly_fields = ['changed_at']
    autocomplete_fields = ['appeal', 'status_from', 'status_to', 'changed_by']
    ordering = ['-changed_at']