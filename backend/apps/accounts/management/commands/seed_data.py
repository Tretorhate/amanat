from django.core.management.base import BaseCommand
from django.core.management import call_command
from apps.deputies.models import Deputy
from apps.citizens.models import Citizen
from apps.accounts.models import User


class Command(BaseCommand):
    help = 'Seed database with initial data'

    def handle(self, *args, **kwargs):
        # Create the not_identified_deputy system user first
        self.stdout.write('Creating not_identified_deputy system user...')
        call_command('create_not_identified_deputy')
        self.stdout.write('')  # Add blank line for readability
        # Create a user for deputy
        deputy_user = User.objects.create_user(
            username='deputy1',
            email='deputy1@amanat.kz',
            password='password123',
            phone='+77001234567',
            user_type='deputy'
        )
        
        # Create deputy
        deputy1 = Deputy.objects.get_or_create(
            user=deputy_user,
            defaults={
                'full_name': 'Алмас Сапаров',
                'district': 'Алмалинский район',
                'phone': '+77001234567',
                'is_active': True
            }
        )[0]
        
        # Create a user for citizen
        citizen_user = User.objects.create_user(
            username='citizen1',
            email='citizen1@example.com',
            password='password123',
            phone='+77007654321',
            user_type='citizen'
        )
        
        # Create citizen
        citizen1 = Citizen.objects.get_or_create(
            user=citizen_user,
            defaults={
                'full_name': 'Айгерим Куанышева',
                'phone': '+77007654321',
                'address': 'г. Алматы, ул. Жибек жолы 123',
                'telegram_user_id': 123456789,
                'telegram_chat_id': 123456789,
                'assigned_deputy': deputy1
            }
        )[0]
        
        self.stdout.write(self.style.SUCCESS('Successfully seeded database'))