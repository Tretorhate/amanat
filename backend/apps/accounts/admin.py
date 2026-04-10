import csv
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django import forms
from django.http import HttpResponseRedirect
from django.urls import path, reverse
from django.shortcuts import render, redirect
from django.contrib import messages
from .models import User
from apps.citizens.models import Citizen, Constituency
from apps.deputies.models import Deputy


class CustomUserForm(forms.ModelForm):
    constituency = forms.ModelChoiceField(
        queryset=Constituency.objects.all(),
        required=False,
        empty_label="No constituency assigned",
        label="Constituency"
    )
    
    class Meta:
        model = User
        fields = '__all__'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Pre-populate constituency field if user has a profile
        if self.instance.pk:
            if self.instance.user_type == 'citizen':
                try:
                    citizen = self.instance.citizen_profile
                    if citizen.constituency:
                        self.fields['constituency'].initial = citizen.constituency
                except Citizen.DoesNotExist:
                    pass
            elif self.instance.user_type == 'deputy':
                try:
                    deputy = self.instance.deputy_profile
                    if deputy.constituency:
                        self.fields['constituency'].initial = deputy.constituency
                except Deputy.DoesNotExist:
                    pass


def import_users_from_csv(modeladmin, request, queryset):
    import os
    
    # Path to the sample CSV file
    csv_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'sample_users.csv')
    
    if not os.path.exists(csv_file_path):
        messages.error(request, f'CSV file not found at {csv_file_path}')
        return
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            created_count = 0
            skipped_count = 0
            error_count = 0
            
            for row in reader:
                try:
                    phone_number = row.get('phone_number', '').strip()
                    full_name = row.get('full_name', '').strip()
                    role = row.get('role', '').strip().lower()
                    constituency_name = row.get('constituency', '').strip()
                    
                    if not all([phone_number, full_name, role]):
                        error_count += 1
                        continue
                    
                    if role not in ['citizen', 'deputy']:
                        error_count += 1
                        continue
                    
                    # Check if user already exists
                    if User.objects.filter(phone=phone_number).exists():
                        skipped_count += 1
                        continue
                    
                    # Find or create constituency
                    if not constituency_name:
                        error_count += 1
                        continue
                    
                    constituency, created = Constituency.objects.get_or_create(
                        name=constituency_name,
                        defaults={
                            'region': 'Unknown',
                            'district': 'Unknown',
                            'description': 'Auto-created from CSV import'
                        }
                    )
                    
                    # Create user
                    username = f"{role}_{phone_number}"
                    user = User.objects.create_user(
                        username=username,
                        phone=phone_number,
                        user_type=role
                    )
                    
                    # Create profile based on role
                    if role == 'citizen':
                        Citizen.objects.create(
                            user=user,
                            full_name=full_name,
                            phone=phone_number,
                            constituency=constituency
                        )
                    elif role == 'deputy':
                        Deputy.objects.create(
                            user=user,
                            full_name=full_name,
                            phone=phone_number,
                            constituency=constituency
                        )
                    
                    created_count += 1
                except Exception:
                    error_count += 1
                    
        messages.success(request, f'Successfully imported {created_count} users, skipped {skipped_count}, errors {error_count}')
        
    except Exception as e:
        messages.error(request, f'Error importing CSV: {str(e)}')
        
import_users_from_csv.short_description = "Import users from sample_users.csv"


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    form = CustomUserForm
    list_display = ['username', 'email', 'user_type', 'phone', 'is_staff', 'is_active', 'date_joined']
    list_filter = ['user_type', 'is_staff', 'is_active', 'date_joined']
    search_fields = ['username', 'email', 'phone']
    readonly_fields = ['date_joined', 'last_login']
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('user_type', 'phone', 'telegram_user_id', 'telegram_chat_id', 'constituency')}),
    )
    ordering = ['-date_joined']
    actions = [import_users_from_csv]
    
    def save_model(self, request, obj, form, change):
        constituency = form.cleaned_data.get('constituency')
        super().save_model(request, obj, form, change)
        
        # Handle constituency assignment if provided
        if constituency:
            if obj.user_type == 'citizen':
                try:
                    citizen, created = Citizen.objects.get_or_create(user=obj)
                    citizen.constituency = constituency
                    citizen.save()
                except:
                    pass  # Silently fail if constituency assignment fails
            elif obj.user_type == 'deputy':
                try:
                    deputy, created = Deputy.objects.get_or_create(user=obj)
                    deputy.constituency = constituency
                    deputy.save()
                except:
                    pass  # Silently fail if constituency assignment fails
