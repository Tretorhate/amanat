from django.core.management.base import BaseCommand
from django.db import transaction
from apps.accounts.models import User
from apps.deputies.models import Deputy


class Command(BaseCommand):
    help = 'Create or update the not_identified_deputy system user for fallback appeal assignments'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force-update',
            action='store_true',
            help='Force update existing user with new values',
        )

    def handle(self, *args, **kwargs):
        force_update = kwargs.get('force_update', False)

        # System user field values
        username = 'not_identified_deputy'
        email = 'system.not_identified@amanat.kz'
        first_name = 'Система'
        last_name = 'Неопределенный депутат'
        user_type = 'deputy'
        phone = '+77000000000'  # System reserved number

        # Deputy profile field values
        full_name = 'Система - Неопределенный депутат'
        district = 'Не определено'
        deputy_phone = '+77000000000'
        position = 'Системный депутат-заполнитель'

        try:
            with transaction.atomic():
                # Try to get or create the user
                user, user_created = User.objects.get_or_create(
                    username=username,
                    defaults={
                        'email': email,
                        'first_name': first_name,
                        'last_name': last_name,
                        'user_type': user_type,
                        'phone': phone,
                        'is_active': True,
                        'is_staff': False,
                        'is_superuser': False,
                    }
                )

                # Set password if user was just created
                if user_created:
                    user.set_password('password123')
                    user.save()

                # Update user if force_update is enabled and user already existed
                if not user_created and force_update:
                    user.email = email
                    user.first_name = first_name
                    user.last_name = last_name
                    user.user_type = user_type
                    user.phone = phone
                    user.is_active = True
                    user.set_password('password123')
                    user.save()
                    self.stdout.write(
                        self.style.WARNING(f'Updated existing user: {username}')
                    )

                # Try to get or create the deputy profile
                deputy, deputy_created = Deputy.objects.get_or_create(
                    user=user,
                    defaults={
                        'full_name': full_name,
                        'district': district,
                        'phone': deputy_phone,
                        'position': position,
                        'is_active': True,
                    }
                )

                # Update deputy profile if force_update is enabled and deputy already existed
                if not deputy_created and force_update:
                    deputy.full_name = full_name
                    deputy.district = district
                    deputy.phone = deputy_phone
                    deputy.position = position
                    deputy.is_active = True
                    deputy.save()
                    self.stdout.write(
                        self.style.WARNING(f'Updated existing deputy profile')
                    )

                # Display success message
                if user_created:
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Successfully created user: {username}')
                    )
                elif not force_update:
                    self.stdout.write(
                        self.style.WARNING(f'⚠ User already exists: {username}')
                    )

                if deputy_created:
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Successfully created deputy profile')
                    )
                elif not force_update:
                    self.stdout.write(
                        self.style.WARNING(f'⚠ Deputy profile already exists')
                    )

                # Display verification information
                self.stdout.write('\n' + '='*60)
                self.stdout.write(self.style.SUCCESS('Verification Information:'))
                self.stdout.write('='*60)
                self.stdout.write(f'User ID:        {user.id}')
                self.stdout.write(f'Username:       {user.username}')
                self.stdout.write(f'Email:          {user.email}')
                self.stdout.write(f'User Type:      {user.user_type}')
                self.stdout.write(f'Phone:          {user.phone}')
                self.stdout.write(f'Is Active:      {user.is_active}')
                self.stdout.write('-'*60)
                self.stdout.write(f'Deputy ID:      {deputy.id}')
                self.stdout.write(f'Full Name:      {deputy.full_name}')
                self.stdout.write(f'District:       {deputy.district}')
                self.stdout.write(f'Position:       {deputy.position}')
                self.stdout.write(f'Deputy Active:  {deputy.is_active}')
                self.stdout.write('='*60 + '\n')

                if user_created or deputy_created:
                    self.stdout.write(
                        self.style.SUCCESS(
                            '✓ not_identified_deputy system user is ready for use!'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(
                            '✓ not_identified_deputy system user already exists and is ready!'
                        )
                    )
                    if not force_update:
                        self.stdout.write(
                            self.style.NOTICE(
                                'Use --force-update to update existing values.'
                            )
                        )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Error creating not_identified_deputy: {str(e)}')
            )
            raise
