import logging

from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.conf import settings as django_settings
from .models import Appeal, AppealMessage
from apps.chat.models import Message
from .serializers import AppealSerializer, AppealDetailSerializer, AppealCreateSerializer, AppealMessageSerializer, AppealMessageCreateSerializer
from apps.accounts.models import User
from apps.accounts.permissions import IsOwnerOrDeputy, IsDeputy
from apps.citizens.models import Citizen, Constituency
from apps.deputies.models import Deputy
from core.utils.openai_service import OpenAIService
from core.utils.telegram_service import TelegramService

logger = logging.getLogger(__name__)


class AppealViewSet(viewsets.ModelViewSet):
    serializer_class = AppealSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDeputy]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'category']
    
    def perform_create(self, serializer):
        """Create appeal with constituency-based deputy assignment"""
        user = self.request.user
        
        # Only citizens can create appeals
        if user.user_type != 'citizen':
            raise serializers.ValidationError('Only citizens can create appeals')
        
        # Get citizen profile
        try:
            citizen = user.citizen_profile
        except type(user).citizen_profile.RelatedObjectDoesNotExist:
            raise serializers.ValidationError('Citizen profile does not exist')
        
        # Validate citizen has phone number
        if not citizen.phone or not citizen.phone.strip():
            raise serializers.ValidationError('Phone number is required')
        
        # Validate citizen has constituency
        if not citizen.constituency:
            raise serializers.ValidationError('Citizen must have a constituency assigned')
        
        # Find deputy for the citizen's constituency
        try:
            deputy = Deputy.objects.filter(
                constituency=citizen.constituency,
                is_active=True
            ).first()
        except Exception as e:
            deputy = None
        
        # If no deputy found for constituency, use assigned deputy or fallback
        if not deputy:
            if citizen.assigned_deputy and citizen.assigned_deputy.is_active:
                deputy = citizen.assigned_deputy
            else:
                # Fallback: Assign a random deputy
                deputy = Deputy.objects.filter(is_active=True).order_by('?').first()
                
                # If still no deputy, raise error
                if not deputy:
                    raise serializers.ValidationError('No deputy available to handle your appeal')
        
        # AI Categorization (optional - fallback to 'other' if fails)
        description = serializer.validated_data.get('description', '')
        try:
            openai_service = OpenAIService()
            categorization = openai_service.categorize_appeal(description)
            category = categorization.get('category', 'other')
            priority = categorization.get('priority', 'normal')
        except Exception as e:
            logger.warning(f"OpenAI categorization failed: {e}")
            category = 'other'
            priority = 'normal'
        
        # Create appeal
        appeal = serializer.save(
            citizen=citizen,
            deputy=deputy,
            category=category,
            priority=priority,
            status='pending'
        )
        
        # Notify deputy via Telegram (optional)
        try:
            telegram_service = TelegramService()
            if deputy.telegram_chat_id:
                telegram_service.notify_deputy_new_appeal(
                    deputy.telegram_chat_id,
                    appeal
                )
        except Exception as e:
            logger.warning(f"Failed to notify deputy: {e}")
        
        return appeal
        
    def get_queryset(self):
        user = self.request.user
        
        # Admin sees all appeals
        if user.is_staff:
            return Appeal.objects.all()
        
        # Deputy sees assigned appeals
        if user.user_type == 'deputy':
            try:
                # Check if deputy profile exists
                _ = user.deputy_profile
                return Appeal.objects.filter(deputy=user.deputy_profile)
            except type(user).deputy_profile.RelatedObjectDoesNotExist:
                # Deputy profile doesn't exist
                return Appeal.objects.none()
        
        # Citizen sees own appeals
        if user.user_type == 'citizen':
            try:
                # Check if citizen profile exists
                _ = user.citizen_profile
                return Appeal.objects.filter(citizen=user.citizen_profile)
            except type(user).citizen_profile.RelatedObjectDoesNotExist:
                # Citizen profile doesn't exist
                return Appeal.objects.none()
        
        return Appeal.objects.none()
        
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AppealDetailSerializer
        elif self.action == 'create':
            return AppealCreateSerializer
        return AppealSerializer
    
    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        """Add message to appeal"""
        appeal = self.get_object()
        content = request.data.get('content')
        
        if not content:
            return Response({'error': 'Content is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Simple message creation (you can expand this later)
        return Response({'id': str(appeal.id), 'content': content})
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages for an appeal"""
        appeal = self.get_object()
        messages = appeal.dialogue_messages.all()
        serializer = AppealMessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message from deputy to citizen"""
        if request.user.user_type != 'deputy' and not request.user.is_staff:
            return Response(
                {'error': 'Only deputies can send messages'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        appeal = self.get_object()
        
        # Check message limit
        if appeal.message_count >= django_settings.APPEAL_MESSAGE_LIMIT:
            return Response(
                {'error': f'Message limit reached ({django_settings.APPEAL_MESSAGE_LIMIT} messages per appeal)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = AppealMessageCreateSerializer(data=request.data, context={
            'appeal': appeal,
            'request': request
        })
        
        if serializer.is_valid():
            message = serializer.save()
            
            # Update appeal message count
            appeal.message_count += 1
            appeal.save()
            
            # Also create a Message record for the chat system to detect active dialogs
            from apps.chat.models import Message
            chat_message = Message.objects.create(
                appeal=appeal,
                sender_type='deputy',
                sender_user=request.user,
                receiver_user=appeal.citizen.user,
                channel='web',
                content=message.message
            )
            
            logger.info(f'[dialog] deputy_message_sent appeal_id={appeal.id} citizen_id={appeal.citizen.id} message_id={chat_message.id}')
            
            # Send message to citizen via Telegram
            try:
                telegram_service = TelegramService()
                if appeal.citizen.telegram_chat_id:
                    telegram_service.notify_citizen_new_message(
                        chat_id=appeal.citizen.telegram_chat_id,
                        appeal=appeal,
                        message=message.message
                    )
            except Exception as e:
                logger.warning(f"Failed to send Telegram message: {e}")
            
            return Response(AppealMessageSerializer(message).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update appeal status - Only deputies can update"""
        if request.user.user_type != 'deputy' and not request.user.is_staff:
            return Response(
                {'error': 'Only deputies can update appeal status'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        appeal = self.get_object()
        new_status = request.data.get('status')
        citizen_message = request.data.get('citizen_message')
        internal_notes = request.data.get('internal_notes')
        comment = request.data.get('comment')
        
        # Save comment if provided
        if comment:
            from apps.appeals.models import AppealComment
            AppealComment.objects.create(
                appeal=appeal,
                author=request.user,
                content=comment
            )
        
        # Save internal notes if provided
        if internal_notes:
            # This would typically be saved to a separate field or log
            logger.info(f"Internal notes for appeal {appeal.id}: {internal_notes}")
        
        if new_status:
            old_status = appeal.status
            appeal.status = new_status
            if new_status in ['resolved', 'rejected', 'closed']:
                appeal.closed_at = timezone.now()
                
                # If citizen_message is provided, create a system message
                if citizen_message:
                    AppealMessage.objects.create(
                        appeal=appeal,
                        sender_type='system',
                        message=citizen_message,
                        is_visible_to_citizen=True
                    )
                    
                    # Send message to citizen via Telegram
                    try:
                        telegram_service = TelegramService()
                        if appeal.citizen.telegram_chat_id:
                            telegram_service.notify_citizen_new_message(
                                chat_id=appeal.citizen.telegram_chat_id,
                                appeal=appeal,
                                message=citizen_message
                            )
                    except Exception as e:
                        logger.warning(f"Failed to send Telegram message: {e}")
            
            appeal.save()
            return Response({'status': appeal.status})
        
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
    

@api_view(['POST'])
@permission_classes([AllowAny])
def create_appeal_bot(request):
    """Create appeal from Telegram bot"""
    
    telegram_user_id = request.data.get('telegram_user_id')
    description = request.data.get('description')
    
    if not telegram_user_id or not description:
        return Response(
            {'error': 'telegram_user_id and description are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get citizen by telegram_user_id
    try:
        citizen = Citizen.objects.get(telegram_user_id=telegram_user_id)
    except Citizen.DoesNotExist:
        logger.warning(f"Citizen with telegram_user_id {telegram_user_id} not found")
        return Response(
            {
                'error': 'Вы не зарегистрированы в системе. Обратитесь к администратору.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # Check citizen is pre-registered (has linked User from admin CSV upload)
    if not citizen.user:
        logger.warning(f"Citizen {citizen.id} has no linked User (not pre-registered)")
        return Response(
            {
                'error': 'Вы не зарегистрированы в системе. Обратитесь к администратору.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # Check if citizen has phone number
    if not citizen.phone or not citizen.phone.strip():
        return Response(
            {
                'error': 'You cannot create an appeal. Please contact our support team via Telegram.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # 1. Try to find deputy by citizen's constituency
    deputy = None
    if citizen.constituency:
        deputy = Deputy.objects.filter(
            constituency=citizen.constituency,
            is_active=True
        ).first()

    # 2. Fall back to assigned deputy
    if not deputy and citizen.assigned_deputy and citizen.assigned_deputy.is_active:
        deputy = citizen.assigned_deputy

    # 3. No deputy available — show support message
    if not deputy:
        return Response(
            {
                'error': 'Депутат не назначен. Обратитесь в нашу службу поддержки: @amanat_support'
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Update citizen's assigned deputy for consistency
    if citizen.assigned_deputy != deputy:
        citizen.assigned_deputy = deputy
        citizen.save()
    
    # AI Categorization (optional - fallback to 'other' if fails)
    try:
        openai_service = OpenAIService()
        categorization = openai_service.categorize_appeal(description)
        category = categorization.get('category', 'other')
        priority = categorization.get('priority', 'normal')
    except Exception as e:
        logger.warning(f"OpenAI categorization failed: {e}")
        category = 'other'
        priority = 'normal'
    
    # Create appeal
    appeal = Appeal.objects.create(
        citizen=citizen,
        deputy=citizen.assigned_deputy,
        title=description[:100],
        description=description,
        category=category,
        priority=priority,
        status='pending'
    )
    
    # Notify deputy via Telegram (optional)
    try:
        telegram_service = TelegramService()
        if appeal.deputy.telegram_chat_id:
            telegram_service.notify_deputy_new_appeal(
                appeal.deputy.telegram_chat_id,
                appeal
            )
    except Exception as e:
        logger.warning(f"Failed to notify deputy: {e}")

    return Response({
        'id': str(appeal.id),
        'category': appeal.category,
        'status': appeal.status,
        'created_at': appeal.created_at.isoformat(),
        'message_count': appeal.message_count,
        'message_limit': django_settings.APPEAL_MESSAGE_LIMIT,
        'deputy': {
            'full_name': appeal.deputy.full_name or '',
            'position': appeal.deputy.position or '',
            'district': appeal.deputy.district or '',
        }
    }, status=status.HTTP_201_CREATED)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deputy_respond_to_appeal(request, appeal_id):
    """
    Deputy can:
    1. Change appeal status
    2. Send message/answer to citizen
    
    Request body:
    {
        "status": "in_progress",  // optional: pending, in_progress, resolved, closed, rejected
        "message": "Your response text here"  // optional
    }
    """
    
    # Get appeal
    appeal = get_object_or_404(Appeal, id=appeal_id)
    
    # Check if request user is the assigned deputy or staff
    is_deputy = hasattr(request.user, 'deputy_profile') and appeal.deputy == request.user.deputy_profile
    if not is_deputy and not request.user.is_staff:
        return Response(
            {'error': 'You are not authorized to respond to this appeal'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    new_status = request.data.get('status')
    message_content = request.data.get('message') or request.data.get('citizen_message')  # Support both field names for compatibility
    
    # Validate that at least one action is provided
    if not new_status and not message_content:
        return Response(
            {'error': 'Either status or message must be provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    telegram_service = TelegramService()
    notifications_sent = []
    
    # 1. Handle status change
    if new_status:
        # Validate status
        valid_statuses = [choice[0] for choice in Appeal.Status.choices]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = appeal.status
        appeal.status = new_status
        
        # Update timestamps based on status
        if new_status == Appeal.Status.IN_PROGRESS and not appeal.responded_at:
            appeal.responded_at = timezone.now()
        elif new_status in [Appeal.Status.RESOLVED, Appeal.Status.CLOSED]:
            appeal.closed_at = timezone.now()
        
        appeal.save()
        
        # Notify citizen about status change
        if appeal.citizen.telegram_chat_id:
            status_notification = telegram_service.notify_status_change(
                chat_id=appeal.citizen.telegram_chat_id,
                appeal=appeal,
                old_status=old_status,
                new_status=new_status
            )
            if status_notification:
                notifications_sent.append('status_change')
    
    # 2. Handle message/answer
    if message_content:
        # Check message limit
        if appeal.message_count >= django_settings.APPEAL_MESSAGE_LIMIT:
            return Response(
                {'error': f'Message limit reached ({django_settings.APPEAL_MESSAGE_LIMIT} messages per appeal)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create message in both systems
        appeal_message = AppealMessage.objects.create(
            appeal=appeal,
            sender_type='deputy',
            sender_user=request.user,
            message=message_content,
            is_visible_to_citizen=True
        )
        
        # Also create a Message record for the chat system to detect active dialogs
        chat_message = Message.objects.create(
            appeal=appeal,
            sender_type='deputy',
            sender_user=request.user,
            receiver_user=appeal.citizen.user,
            channel='web',
            content=message_content
        )
        
        # Update appeal message count and responded_at
        appeal.message_count += 1
        if not appeal.responded_at:
            appeal.responded_at = timezone.now()
        appeal.save()
        
        logger.info(f'[dialog] deputy_message_sent appeal_id={appeal.id} citizen_id={appeal.citizen.id} message_id={chat_message.id}')

        # Notify citizen about new message
        if appeal.citizen.telegram_chat_id:
            message_notification = telegram_service.notify_citizen_new_message(
                chat_id=appeal.citizen.telegram_chat_id,
                appeal=appeal,
                message=message_content  # Pass the message content directly
            )
            if message_notification:
                notifications_sent.append('new_message')
    
    # Prepare response
    response_data = {
        'success': True,
        'appeal': {
            'id': str(appeal.id),
            'status': appeal.status,
            'message_count': appeal.message_count,
            'responded_at': appeal.responded_at.isoformat() if appeal.responded_at else None,
            'closed_at': appeal.closed_at.isoformat() if appeal.closed_at else None
        },
        'notifications_sent': notifications_sent
    }
    
    if message_content:
        response_data['message'] = {
            'id': str(chat_message.id),
            'content': chat_message.content,
            'created_at': chat_message.created_at.isoformat()
        }
    
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_my_appeals_bot(request):
    """Get appeals for Telegram user"""
    telegram_user_id = request.GET.get('telegram_user_id')
    
    if not telegram_user_id:
        return Response(
            {'error': 'telegram_user_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        citizen = Citizen.objects.get(telegram_user_id=telegram_user_id)
    except Citizen.DoesNotExist:
        return Response([], status=status.HTTP_200_OK)
    
    appeals = Appeal.objects.filter(citizen=citizen).order_by('-created_at')[:20]
    
    appeals_data = [{
        'id': str(appeal.id),
        'description': appeal.description,
        'category': appeal.category,
        'status': appeal.status,
        'message_count': appeal.message_count,
        'message_limit': django_settings.APPEAL_MESSAGE_LIMIT,
        'created_at': appeal.created_at.isoformat()
    } for appeal in appeals]
    
    return Response(appeals_data, status=status.HTTP_200_OK)
