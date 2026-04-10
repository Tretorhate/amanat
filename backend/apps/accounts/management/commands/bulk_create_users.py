import csv
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.accounts.models import User
from apps.citizens.models import Citizen, Constituency
from apps.deputies.models import Deputy
import uuid

UserModel = get_user_model()


class Command(BaseCommand):
    help = 'Bulk create users from CSV file'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to CSV file')
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without actually creating records',
        )

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        dry_run = options['dry_run']

        try:
            with open(csv_file, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                created_count = 0
                skipped_count = 0
                error_count = 0

                for row_num, row in enumerate(reader, start=2):
                    try:
                        phone_number = row.get('phone_number', '').strip()
                        full_name = row.get('full_name', '').strip()
                        role = row.get('role', '').strip().lower()
                        constituency_name = row.get('constituency', '').strip()

                        if not all([phone_number, full_name, role]):
                            self.stdout.write(
                                self.style.WARNING(
                                    f"Row {row_num}: Missing required fields (phone: {phone_number}, name: {full_name}, role: {role})"
                                )
                            )
                            error_count += 1
                            continue

                        if role not in ['citizen', 'deputy']:
                            self.stdout.write(
                                self.style.WARNING(
                                    f"Row {row_num}: Invalid role '{role}'. Must be 'citizen' or 'deputy'"
                                )
                            )
                            error_count += 1
                            continue

                        # Check if user already exists
                        if User.objects.filter(phone=phone_number).exists():
                            self.stdout.write(
                                self.style.WARNING(
                                    f"Row {row_num}: User with phone {phone_number} already exists"
                                )
                            )
                            skipped_count += 1
                            continue

                        # Find or create constituency
                        if not constituency_name:
                            self.stdout.write(
                                self.style.WARNING(
                                    f"Row {row_num}: Missing constituency"
                                )
                            )
                            error_count += 1
                            continue

                        constituency, created = Constituency.objects.get_or_create(
                            name=constituency_name,
                            defaults={
                                'region': 'Unknown',
                                'district': 'Unknown',
                                'description': f'Auto-created from CSV import'
                            }
                        )

                        if dry_run:
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f"Would create {role}: {full_name} ({phone_number}) in {constituency_name}"
                                )
                            )
                            created_count += 1
                            continue

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
                        self.stdout.write(
                            self.style.SUCCESS(
                                f"Created {role}: {full_name} ({phone_number}) in {constituency_name}"
                            )
                        )

                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(
                                f"Row {row_num}: Error processing row - {str(e)}"
                            )
                        )
                        error_count += 1

                if dry_run:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"\nDRY RUN COMPLETE: Would create {created_count} users, skip {skipped_count}, errors {error_count}"
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"\nBULK IMPORT COMPLETE: Created {created_count} users, skipped {skipped_count}, errors {error_count}"
                        )
                    )

        except FileNotFoundError:
            self.stdout.write(
                self.style.ERROR(f"File not found: {csv_file}")
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error reading CSV file: {str(e)}")
            )