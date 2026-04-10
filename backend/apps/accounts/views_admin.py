from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import User
from .serializers import UserSerializer, AdminUserSerializer
from .permissions import IsAdmin
from apps.citizens.models import Citizen, Constituency
from apps.deputies.models import Deputy, DeputyConstituency
from apps.appeals.models import Appeal
from django.http import JsonResponse
from django.db import transaction
import csv
import logging

logger = logging.getLogger(__name__)


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Admin-only viewset for managing all users
    """
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get_queryset(self):
        """Include constituency information in the queryset"""
        queryset = super().get_queryset()
        return queryset.select_related('citizen_profile__constituency', 'deputy_profile__constituency')
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get platform statistics for admin dashboard"""
        total_users = User.objects.count()
        total_citizens = User.objects.filter(user_type='citizen').count()
        total_deputies = User.objects.filter(user_type='deputy').count()
        total_appeals = Appeal.objects.count()
        pending_appeals = Appeal.objects.filter(status='pending').count()
        resolved_appeals = Appeal.objects.filter(status__in=['resolved', 'closed']).count()
        
        return Response({
            'total_users': total_users,
            'total_citizens': total_citizens,
            'total_deputies': total_deputies,
            'total_appeals': total_appeals,
            'pending_appeals': pending_appeals,
            'resolved_appeals': resolved_appeals,
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def get_all_users(request):
    """Get all users with role information"""
    users = User.objects.all().order_by('-date_joined')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def toggle_user_active(request, user_id):
    """Toggle user active status"""
    try:
        user = User.objects.get(id=user_id)
        user.is_active = not user.is_active
        user.save()
        return Response({
            'success': True,
            'is_active': user.is_active
        })
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def get_sample_csv(request):
    """Return sample CSV file for user import"""
    import io
    import csv
    from django.http import HttpResponse
    
    # Sample data
    sample_data = [
        ['phone_number', 'full_name', 'role', 'constituency'],
        ['77011234567', 'Ivan Ivanov', 'citizen', 'Almaty-1'],
        ['77021234568', 'Aigerim Tursynova', 'citizen', 'Almaty-2'],
        ['77031234569', 'Nurlan Sadykov', 'deputy', 'Almaty-1'],
        ['77041234570', 'Serik Akhmetov', 'citizen', 'Astana-3'],
        ['77051234571', 'Aruzhan Bekova', 'deputy', 'Astana-3']
    ]
    
    # Create CSV in memory
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerows(sample_data)
    
    # Prepare response
    csv_content = buffer.getvalue()
    buffer.close()
    
    response = HttpResponse(csv_content, content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="sample_users.csv"'
    
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def import_users_csv(request):
    """Import users from uploaded CSV file with auto-profile creation and validation"""
    logger.info(f"Received FILES keys: {list(request.FILES.keys())}")
    logger.info(f"FILES dict: {request.FILES}")
    
    if 'file' not in request.FILES:
        logger.error("No 'file' key in FILES")
        return Response(
            {'error': 'No file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    file = request.FILES['file']
    
    # Check if it's a CSV file
    if not file.name.endswith('.csv'):
        return Response(
            {'error': 'File must be a CSV'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check file size (5MB max)
    if file.size > 5 * 1024 * 1024:  # 5MB in bytes
        return Response(
            {'error': 'File size exceeds 5MB limit'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        decoded_file = file.read().decode('utf-8-sig')
        reader = csv.DictReader(decoded_file.splitlines())
        
        # Validate CSV headers
        required_headers = ['phone_number', 'full_name', 'role', 'constituency']
        if not all(header in reader.fieldnames for header in required_headers):
            missing = set(required_headers) - set(reader.fieldnames or [])
            return Response(
                {'error': f'Missing required CSV columns: {", ".join(missing)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_count = 0
        citizens_created = 0
        deputies_created = 0
        skipped_count = 0
        error_count = 0
        errors_list = []
        
        for row_num, row in enumerate(reader, start=2):  # Start from 2 to account for header row
            try:
                phone_number = row.get('phone_number', '').strip()
                full_name = row.get('full_name', '').strip()
                role = row.get('role', '').strip().lower()
                constituency_name = row.get('constituency', '').strip()
                
                # Validate required fields
                if not all([phone_number, full_name, role]):
                    error_count += 1
                    errors_list.append(f'Row {row_num}: Missing required fields (phone_number, full_name, role)')
                    continue
                
                # Validate role
                if role not in ['citizen', 'deputy']:
                    error_count += 1
                    errors_list.append(f'Row {row_num}: Invalid role "{role}". Must be citizen or deputy')
                    continue
                
                # Check if user already exists
                if User.objects.filter(phone=phone_number).exists():
                    skipped_count += 1
                    errors_list.append(f'Row {row_num}: User with phone {phone_number} already exists')
                    continue
                
                # Validate constituency requirement
                if not constituency_name:
                    error_count += 1
                    errors_list.append(f'Row {row_num}: Constituency is required for {role} role')
                    continue
                
                # Find constituency
                try:
                    constituency = Constituency.objects.get(name=constituency_name)
                except Constituency.DoesNotExist:
                    error_count += 1
                    errors_list.append(f'Row {row_num}: Constituency "{constituency_name}" does not exist')
                    continue
                
                # Process with transaction atomic
                with transaction.atomic():
                    # Create user
                    username = f"{role}_{phone_number.replace('+', '').replace('-', '')}"
                    user = User.objects.create_user(
                        username=username,
                        phone=phone_number,
                        user_type=role,
                        first_name=full_name.split()[0] if full_name.split() else '',
                        last_name=' '.join(full_name.split()[1:]) if len(full_name.split()) > 1 else '',
                        is_active=True,  # Active by default for bulk import
                    )
                    
                    # Create role-specific profile
                    if role == 'citizen':
                        # Check for existing citizen profile
                        if hasattr(user, 'citizen_profile'):
                            logger.warning(f"User {user.id} already has citizen profile")
                            # Rollback user creation
                            user.delete()
                            error_count += 1
                            errors_list.append(f'Row {row_num}: User already has citizen profile')
                            continue
                        
                        # Create citizen profile
                        Citizen.objects.create(
                            user=user,
                            full_name=full_name,
                            phone=phone_number,
                            constituency=constituency,
                            address='',
                            district=constituency.district if constituency else '',
                            telegram_user_id=None,
                            telegram_chat_id=None
                        )
                        citizens_created += 1
                        
                    elif role == 'deputy':
                        # Check for existing deputy profile
                        if hasattr(user, 'deputy_profile'):
                            logger.warning(f"User {user.id} already has deputy profile")
                            # Rollback user creation
                            user.delete()
                            error_count += 1
                            errors_list.append(f'Row {row_num}: User already has deputy profile')
                            continue
                        
                        # Create deputy profile
                        deputy = Deputy.objects.create(
                            user=user,
                            full_name=full_name,
                            phone=phone_number,
                            constituency=constituency,
                            position='Deputy',
                            district=constituency.district if constituency else '',
                            is_active=True
                        )
                        
                        # Create deputy constituency relationship
                        DeputyConstituency.objects.create(
                            deputy=deputy,
                            name=constituency.name,
                            region=constituency.region,
                            district=constituency.district,
                            population=None
                        )
                        deputies_created += 1
                    
                    created_count += 1
                    logger.info(f"Successfully created {role} user: {full_name} ({phone_number})")
                
            except Exception as e:
                error_count += 1
                error_msg = f'Row {row_num}: {str(e)}'
                errors_list.append(error_msg)
                logger.error(f"Error processing row {row_num}: {error_msg}")
                continue
        
        # Post-import integrity check
        integrity_errors = []
        for user in User.objects.filter(id__in=[u.id for u in User.objects.all()]):
            if user.user_type == 'citizen' and not hasattr(user, 'citizen_profile'):
                integrity_errors.append(f"User {user.username} (citizen) missing citizen profile")
            elif user.user_type == 'deputy' and not hasattr(user, 'deputy_profile'):
                integrity_errors.append(f"User {user.username} (deputy) missing deputy profile")
        
        if integrity_errors:
            logger.warning("Post-import integrity check failed:")
            for error in integrity_errors:
                logger.warning(f"  {error}")
        
        response_data = {
            'message': 'Import completed successfully',
            'users_created': created_count,
            'citizens_created': citizens_created,
            'deputies_created': deputies_created,
            'skipped_count': skipped_count,
            'error_count': error_count,
            'errors': errors_list,
            'integrity_check_passed': len(integrity_errors) == 0
        }
        
        if integrity_errors:
            response_data['integrity_errors'] = integrity_errors
        
        return Response(response_data, status=status.HTTP_201_CREATED)
        
    except UnicodeDecodeError:
        logger.error("File encoding error")
        return Response(
            {'error': 'File encoding error. Please use UTF-8 encoding.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        return Response(
            {'error': f'Error processing file: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
