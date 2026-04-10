from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Citizen, CitizenDocument, Constituency
from .serializers import CitizenSerializer, CitizenDocumentSerializer, CitizenRegistrationSerializer, ConstituencySerializer
from apps.deputies.models import Deputy


class CitizenDetailView(generics.RetrieveUpdateAPIView):
    queryset = Citizen.objects.all()
    serializer_class = CitizenSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        # Return the citizen profile of the authenticated user
        try:
            return self.request.user.citizen_profile
        except Citizen.DoesNotExist:
            return Response(
                {'error': 'Citizen profile does not exist'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class CitizenDocumentListView(generics.ListCreateAPIView):
    serializer_class = CitizenDocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        try:
            citizen = user.citizen_profile
            return CitizenDocument.objects.filter(citizen=citizen)
        except Citizen.DoesNotExist:
            return CitizenDocument.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user
        try:
            citizen = user.citizen_profile
            serializer.save(citizen=citizen)
        except Citizen.DoesNotExist:
            return Response(
                {'error': 'Citizen profile does not exist'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class CitizenDocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CitizenDocument.objects.all()
    serializer_class = CitizenDocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        try:
            citizen = user.citizen_profile
            return CitizenDocument.objects.filter(citizen=citizen)
        except Citizen.DoesNotExist:
            return CitizenDocument.objects.none()


@api_view(['GET'])
@permission_classes([AllowAny])
def check_citizen(request):
    """Check if citizen exists and has phone number"""
    telegram_user_id = request.GET.get('telegram_user_id')
    
    if not telegram_user_id:
        return Response(
            {'error': 'telegram_user_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        citizen = Citizen.objects.get(telegram_user_id=telegram_user_id)
        is_registered = citizen.user is not None  # Pre-registered = has linked User from CSV
        return Response({
            'exists': True,
            'has_phone': bool(citizen.phone and citizen.phone.strip()),
            'is_registered': is_registered,
            'is_citizen': True,
            'user_type': 'citizen',
            'citizen': {
                'id': str(citizen.id),
                'full_name': citizen.full_name,
                'phone': citizen.phone
            }
        }, status=status.HTTP_200_OK)
    except Citizen.DoesNotExist:
        # Check if it's a deputy instead
        from apps.accounts.models import User
        from apps.deputies.models import Deputy
        try:
            user = User.objects.get(telegram_user_id=telegram_user_id)
            if user.user_type == 'deputy':
                try:
                    deputy = user.deputy_profile
                    return Response({
                        'exists': True,
                        'has_phone': bool(user.phone and user.phone.strip()),
                        'is_registered': True,  # User exists in system
                        'is_citizen': False,
                        'user_type': 'deputy',
                        'deputy': {
                            'id': str(deputy.id),
                            'full_name': deputy.full_name or user.username,
                            'phone': user.phone or deputy.phone
                        }
                    }, status=status.HTTP_200_OK)
                except Deputy.DoesNotExist:
                    # User exists but no deputy profile
                    return Response({
                        'exists': True,
                        'has_phone': bool(user.phone and user.phone.strip()),
                        'is_registered': True,
                        'is_citizen': False,
                        'user_type': 'deputy',
                        'deputy': {
                            'id': None,
                            'full_name': user.username,
                            'phone': user.phone
                        }
                    }, status=status.HTTP_200_OK)
            else:
                # User exists but not a deputy or citizen - treat as non-registered
                return Response({
                    'exists': False,
                    'has_phone': False,
                    'is_registered': False,
                    'is_citizen': True,
                    'user_type': user.user_type,
                    'citizen': None
                }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            # Neither citizen nor user found
            return Response({
                'exists': False,
                'has_phone': False,
                'is_registered': False,
                'is_citizen': True,
                'user_type': None,
                'citizen': None
            }, status=status.HTTP_200_OK)


class ConstituencyViewSet(viewsets.ModelViewSet):
    """Full CRUD viewset for constituencies. Admins can create/update/delete, others read-only."""
    serializer_class = ConstituencySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter constituencies by region or district if provided"""
        # Admins see all, others see only active
        if self.request.user.is_staff:
            queryset = Constituency.objects.all()
        else:
            queryset = Constituency.objects.filter(is_active=True)

        region = self.request.query_params.get('region')
        district = self.request.query_params.get('district')

        if region:
            queryset = queryset.filter(region__icontains=region)
        if district:
            queryset = queryset.filter(district__icontains=district)

        return queryset


@api_view(['POST'])
@permission_classes([AllowAny])
def register_citizen(request):
    """Register or link citizen via Telegram.

    Flow:
    1. If citizen already linked by telegram_user_id → update and return
    2. If phone provided → try to match pre-registered citizen by phone → link telegram_user_id
    3. If no match → reject (only pre-registered citizens allowed)
    """
    telegram_user_id = request.data.get('telegram_user_id')
    telegram_chat_id = request.data.get('telegram_chat_id')
    full_name = request.data.get('full_name')
    username = request.data.get('username')
    phone = request.data.get('phone')

    if not telegram_user_id:
        return Response(
            {'error': 'telegram_user_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # 1. Check if citizen is already linked by telegram_user_id
    try:
        citizen = Citizen.objects.get(telegram_user_id=telegram_user_id)

        # Update existing linked citizen
        citizen.telegram_chat_id = telegram_chat_id
        if phone:
            citizen.phone = phone
        citizen.save()

        # Only return registered=True if citizen has a linked User (pre-registered)
        if citizen.user:
            user = citizen.user
            changed = False
            if not user.telegram_user_id:
                user.telegram_user_id = telegram_user_id
                changed = True
            if not user.telegram_chat_id:
                user.telegram_chat_id = telegram_chat_id
                changed = True
            if changed:
                user.save()

            return Response({
                'id': str(citizen.id),
                'telegram_user_id': citizen.telegram_user_id,
                'full_name': citizen.full_name,
                'phone': citizen.phone,
                'has_phone': bool(citizen.phone and citizen.phone.strip()),
                'registered': True
            }, status=status.HTTP_200_OK)

        # Citizen exists but has no User — orphan record, not pre-registered
        # Fall through to phone matching below
    except Citizen.DoesNotExist:
        pass

    # 2. If phone provided, try to match to pre-registered citizen
    if phone:
        # Normalize phone: strip spaces, dashes
        normalized_phone = phone.strip().replace('-', '').replace(' ', '')
        # Try exact match and common variations
        citizen = Citizen.objects.filter(
            telegram_user_id__isnull=True
        ).filter(
            phone__in=[phone, normalized_phone, f'+{normalized_phone}']
        ).first()

        if citizen:
            # Link telegram to pre-registered citizen
            citizen.telegram_user_id = telegram_user_id
            citizen.telegram_chat_id = telegram_chat_id
            if full_name and citizen.full_name in ['Unknown', '']:
                citizen.full_name = full_name
            citizen.save()

            # Also update linked User model
            if citizen.user:
                user = citizen.user
                user.telegram_user_id = telegram_user_id
                user.telegram_chat_id = telegram_chat_id
                user.save()

            return Response({
                'id': str(citizen.id),
                'telegram_user_id': citizen.telegram_user_id,
                'full_name': citizen.full_name,
                'phone': citizen.phone,
                'has_phone': True,
                'registered': True
            }, status=status.HTTP_200_OK)
        
        # If no citizen found, check if it's a deputy
        from apps.accounts.models import User
        from apps.deputies.models import Deputy
        user = User.objects.filter(
            phone__in=[phone, normalized_phone, f'+{normalized_phone}']
        ).first()
        
        if user and user.user_type == 'deputy':
            # Link telegram to deputy user
            user.telegram_user_id = telegram_user_id
            user.telegram_chat_id = telegram_chat_id
            user.save()
            
            # Also try to update the deputy profile
            try:
                deputy = user.deputy_profile
                if not deputy.telegram_chat_id:
                    deputy.telegram_chat_id = telegram_chat_id
                    deputy.save()
            except Deputy.DoesNotExist:
                # Deputy profile doesn't exist, but that's OK
                pass
            
            return Response({
                'id': str(user.id),
                'telegram_user_id': user.telegram_user_id,
                'full_name': user.full_name or user.username,
                'phone': user.phone,
                'has_phone': bool(user.phone and user.phone.strip()),
                'registered': True
            }, status=status.HTTP_200_OK)

    # 3. Not found - citizen is not pre-registered
    return Response({
        'exists': False,
        'has_phone': False,
        'registered': False,
        'error': 'Вы не зарегистрированы в системе. Обратитесь к администратору для регистрации.'
    }, status=status.HTTP_200_OK)
