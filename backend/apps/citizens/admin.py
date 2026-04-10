from django.contrib import admin
from .models import Citizen, CitizenDocument, Constituency


@admin.register(Citizen)
class CitizenAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'phone', 'district', 'constituency', 'user', 'assigned_deputy', 'created_at']
    list_filter = ['district', 'constituency', 'created_at']
    search_fields = ['full_name', 'phone', 'user__username', 'user__email']
    readonly_fields = ['created_at']
    autocomplete_fields = ['user', 'assigned_deputy', 'constituency']
    ordering = ['-created_at']
@admin.register(Constituency)
class ConstituencyAdmin(admin.ModelAdmin):
    list_display = ['name', 'region', 'district', 'is_active', 'created_at']
    list_filter = ['region', 'district', 'is_active', 'created_at']
    search_fields = ['name', 'region', 'district', 'description']
    readonly_fields = ['created_at']
    ordering = ['name']


@admin.register(CitizenDocument)
class CitizenDocumentAdmin(admin.ModelAdmin):
    list_display = ['citizen', 'document_type', 'document_number', 'is_verified', 'created_at']
    list_filter = ['document_type', 'is_verified', 'created_at']
    search_fields = ['document_number', 'citizen__full_name', 'issued_by']
    readonly_fields = ['created_at']
    autocomplete_fields = ['citizen']
    ordering = ['-created_at']