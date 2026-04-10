from django.contrib import admin
from .models import Deputy, DeputyConstituency, DeputySpecialization


@admin.register(Deputy)
class DeputyAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'user', 'district', 'constituency', 'position', 'phone', 'is_active']
    list_filter = ['is_active', 'district', 'constituency']
    search_fields = ['full_name', 'user__username', 'user__email', 'phone', 'position']
    readonly_fields = []
    autocomplete_fields = ['user', 'constituency']
    ordering = ['full_name']


@admin.register(DeputyConstituency)
class DeputyConstituencyAdmin(admin.ModelAdmin):
    list_display = ['name', 'region', 'district', 'deputy', 'population', 'created_at']
    list_filter = ['region', 'district', 'created_at']
    search_fields = ['name', 'region', 'district', 'deputy__full_name']
    readonly_fields = ['created_at']
    autocomplete_fields = ['deputy']
    ordering = ['-created_at']


@admin.register(DeputySpecialization)
class DeputySpecializationAdmin(admin.ModelAdmin):
    list_display = ['deputy', 'specialization', 'is_primary']
    list_filter = ['specialization', 'is_primary']
    search_fields = ['deputy__full_name', 'specialization']
    autocomplete_fields = ['deputy']
    ordering = ['-is_primary', 'specialization']