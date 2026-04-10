from django.core.management.base import BaseCommand
from apps.accounts.models import User
from apps.citizens.models import Citizen
from apps.deputies.models import Deputy
from apps.appeals.models import Appeal
from django.utils import timezone
import random


class Command(BaseCommand):
    help = 'Create test users for different roles'

    def handle(self, *args, **options):
        # Create admin user
        if not User.objects.filter(username='admin').exists():
            admin = User.objects.create_superuser(
                username='admin',
                email='admin@amanat.kz',
                password='admin123',
                first_name='Admin',
                last_name='User',
                user_type='citizen',
                phone='+77770000000'
            )
            self.stdout.write(self.style.SUCCESS(f'Created admin user: admin/admin123'))
        
        # Create deputies
        deputies_data = [
            {
                'username': 'deputy',
                'email': 'deputy@amanat.kz',
                'first_name': 'Депутат',
                'last_name': 'Тестовый',
                'phone': '+77000000001',
                'district': 'Алмалинский район'
            },
            {
                'username': 'deputy1',
                'email': 'deputy1@amanat.kz',
                'first_name': 'Айбек',
                'last_name': 'Нуров',
                'phone': '+77001234567',
                'district': 'Алмалинский район'
            },
            {
                'username': 'deputy2',
                'email': 'deputy2@amanat.kz',
                'first_name': 'Данияр',
                'last_name': 'Касымов',
                'phone': '+77001234568',
                'district': 'Бостандыкский район'
            },
        ]
        
        created_deputies = []
        for dep_data in deputies_data:
            if not User.objects.filter(username=dep_data['username']).exists():
                user = User.objects.create_user(
                    username=dep_data['username'],
                    email=dep_data['email'],
                    password='password123',
                    first_name=dep_data['first_name'],
                    last_name=dep_data['last_name'],
                    user_type='deputy',
                    phone=dep_data['phone']
                )
                deputy = Deputy.objects.create(
                    user=user,
                    district=dep_data['district'],
                    position='Депутат маслихата'
                )
                created_deputies.append(deputy)
                self.stdout.write(self.style.SUCCESS(f"Created deputy: {dep_data['username']}/password123"))
            else:
                deputy = Deputy.objects.filter(user__username=dep_data['username']).first()
                if deputy:
                    created_deputies.append(deputy)
        
        # Create citizens
        citizens_data = [
            {
                'username': 'citizen',
                'email': 'citizen@amanat.kz',
                'first_name': 'Гражданин',
                'last_name': 'Тестовый',
                'phone': '+77000000002',
                'district': 'Алмалинский район'
            },
            {
                'username': 'citizen1',
                'email': 'citizen1@amanat.kz',
                'first_name': 'Асем',
                'last_name': 'Сарсенова',
                'phone': '+77007654321',
                'district': 'Алмалинский район'
            },
            {
                'username': 'citizen2',
                'email': 'citizen2@amanat.kz',
                'first_name': 'Ержан',
                'last_name': 'Мухамедов',
                'phone': '+77007654322',
                'district': 'Бостандыкский район'
            },
            {
                'username': 'citizen3',
                'email': 'citizen3@amanat.kz',
                'first_name': 'Гульнара',
                'last_name': 'Искакова',
                'phone': '+77007654323',
                'district': 'Алмалинский район'
            },
            {
                'username': 'citizen4',
                'email': 'citizen4@amanat.kz',
                'first_name': 'Нурлан',
                'last_name': 'Абдуллаев',
                'phone': '+77007654324',
                'district': 'Бостандыкский район'
            },
            {
                'username': 'citizen5',
                'email': 'citizen5@amanat.kz',
                'first_name': 'Алия',
                'last_name': 'Оразова',
                'phone': '+77007654325',
                'district': 'Медеуский район'
            },
        ]
        
        created_citizens = []
        for cit_data in citizens_data:
            if not User.objects.filter(username=cit_data['username']).exists():
                user = User.objects.create_user(
                    username=cit_data['username'],
                    email=cit_data['email'],
                    password='password123',
                    first_name=cit_data['first_name'],
                    last_name=cit_data['last_name'],
                    user_type='citizen',
                    phone=cit_data['phone']
                )
                citizen = Citizen.objects.create(
                    user=user,
                    district=cit_data['district']
                )
                created_citizens.append(citizen)
                self.stdout.write(self.style.SUCCESS(f"Created citizen: {cit_data['username']}/password123"))
            else:
                citizen = Citizen.objects.filter(user__username=cit_data['username']).first()
                if citizen:
                    created_citizens.append(citizen)
        
        # Create appeals (1-2 per deputy)
        if created_deputies and created_citizens:
            categories = ['infrastructure', 'safety', 'utilities', 'transport', 'education', 'healthcare']
            statuses = ['pending', 'in_progress', 'resolved']
            
            appeals_data = [
                {
                    'title': 'Ремонт дорожного покрытия',
                    'description': 'На улице Абая между домами 45 и 50 требуется срочный ремонт дорожного покрытия. Большие ямы создают опасность для водителей.',
                    'category': 'infrastructure',
                    'status': 'in_progress'
                },
                {
                    'title': 'Установка дополнительного освещения',
                    'description': 'В парке Первого Президента недостаточное освещение в вечернее время. Прошу установить дополнительные фонари.',
                    'category': 'safety',
                    'status': 'pending'
                },
                {
                    'title': 'Проблемы с водоснабжением',
                    'description': 'В нашем доме по адресу ул. Толе би, 125 регулярно отключают воду без предупреждения. Требуется решение проблемы.',
                    'category': 'utilities',
                    'status': 'resolved'
                },
                {
                    'title': 'Организация пешеходного перехода',
                    'description': 'Возле школы №45 необходим регулируемый пешеходный переход для безопасности детей.',
                    'category': 'transport',
                    'status': 'in_progress'
                },
            ]
            
            for i, appeal_data in enumerate(appeals_data):
                citizen = created_citizens[i % len(created_citizens)]
                deputy = created_deputies[i % len(created_deputies)]
                
                if not Appeal.objects.filter(title=appeal_data['title']).exists():
                    appeal = Appeal.objects.create(
                        citizen=citizen,
                        deputy=deputy,
                        title=appeal_data['title'],
                        description=appeal_data['description'],
                        category=appeal_data['category'],
                        status=appeal_data['status'],
                        created_at=timezone.now()
                    )
                    
                    # Set responded_at for in_progress and resolved appeals
                    if appeal.status in ['in_progress', 'resolved']:
                        appeal.responded_at = timezone.now()
                        appeal.save()
                    
                    self.stdout.write(self.style.SUCCESS(f'Created appeal: {appeal.title}'))
        
        self.stdout.write(self.style.SUCCESS('\nAll test data created successfully!'))
        self.stdout.write(self.style.SUCCESS('\nTest credentials:'))
        self.stdout.write(self.style.SUCCESS('Admin: admin / admin123'))
        self.stdout.write(self.style.SUCCESS('Deputy: deputy / password123'))
        self.stdout.write(self.style.SUCCESS('Citizen: citizen / password123'))
        self.stdout.write(self.style.SUCCESS('Other Deputies: deputy1/password123, deputy2/password123'))
        self.stdout.write(self.style.SUCCESS('Other Citizens: citizen1-5/password123'))
