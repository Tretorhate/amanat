from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.conf import settings as django_settings
from .models import MessageThread, Message, MessageReadReceipt
from .serializers import MessageThreadSerializer, MessageSerializer
from apps.appeals.models import Appeal
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


class MessageThreadListView(generics.ListAPIView):
    serializer_class = MessageThreadSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return MessageThread.objects.filter(participants=user, is_active=True)


class MessageThreadDetailView(generics.RetrieveAPIView):
    serializer_class = MessageThreadSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return MessageThread.objects.filter(participants=user, id=self.kwargs['pk'])


class MessageListView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        thread_id = self.kwargs['thread_id']
        user = self.request.user
        # Ensure user has access to this thread
        return Message.objects.filter(thread_id=thread_id, thread__participants=user).order_by('sent_at')
    
    def perform_create(self, serializer):
        thread_id = self.kwargs['thread_id']
        user = self.request.user
        thread = MessageThread.objects.get(id=thread_id)
        
        # Verify user is part of the thread
        if user not in thread.participants.all():
            return Response(
                {'error': 'You are not authorized to send messages in this thread'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        message = serializer.save(sender=user, thread=thread)
        
        # Mark message as read for the sender
        MessageReadReceipt.objects.get_or_create(message=message, reader=user)
        
        # Send WebSocket notification
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"thread_{thread_id}",
            {
                'type': 'new_message',
                'message_id': message.id,
            }
        )
        
        return message


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_message_as_read(request, pk):
    """
    Mark a specific message as read by the current user.
    """
    try:
        message = Message.objects.get(pk=pk)
        
        # Verify user is part of the thread
        if request.user not in message.thread.participants.all():
            return Response(
                {'error': 'You are not authorized to access this message'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create read receipt if it doesn't exist
        MessageReadReceipt.objects.get_or_create(message=message, reader=request.user)
        
        return Response({'status': 'Message marked as read'})
    except Message.DoesNotExist:
        return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_thread_for_appeal(request, appeal_id):
    """
    Create a new message thread for an appeal.
    """
    try:
        appeal = Appeal.objects.get(pk=appeal_id)
        
        # Verify user is either the citizen who created the appeal or the assigned deputy
        user = request.user
        is_authorized = (
            user == appeal.citizen.user or 
            (appeal.deputy and user == appeal.deputy.user) or
            user.is_staff
        )
        
        if not is_authorized:
            return Response(
                {'error': 'You are not authorized to create a thread for this appeal'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create the thread
        thread, created = MessageThread.objects.get_or_create(
            appeal=appeal,
            defaults={'subject': appeal.title}
        )
        
        if not created:
            # Thread already exists
            return Response(
                MessageThreadSerializer(thread).data, 
                status=status.HTTP_200_OK
            )
        
        # Add participants to the thread
        thread.participants.add(appeal.citizen.user)
        if appeal.deputy:
            thread.participants.add(appeal.deputy.user)
        
        return Response(
            MessageThreadSerializer(thread).data, 
            status=status.HTTP_201_CREATED
        )
    except Appeal.DoesNotExist:
        return Response({'error': 'Appeal not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_active_appeal_for_citizen_response(request, telegram_user_id):
    """
    Get active appeal where last message was from deputy and citizen can respond.
    Optimized: uses Subquery to avoid N+1 queries.
    """
    import logging
    logger = logging.getLogger(__name__)

    try:
        from apps.citizens.models import Citizen
        from apps.appeals.models import AppealMessage
        from django.db.models import Subquery, OuterRef

        # Get citizen by telegram_user_id
        citizen = Citizen.objects.get(telegram_user_id=telegram_user_id)

        # Subquery: get sender_type of the last Message for each appeal
        last_msg_sender = Message.objects.filter(
            appeal=OuterRef('pk')
        ).order_by('-created_at').values('sender_type')[:1]

        # Single query: annotate appeals with last message sender_type, filter for deputy
        appeals = Appeal.objects.filter(
            citizen=citizen,
            status__in=['pending', 'in_progress', 'resolved'],
            message_count__lt=django_settings.APPEAL_MESSAGE_LIMIT
        ).annotate(
            last_msg_sender=Subquery(last_msg_sender)
        ).filter(
            last_msg_sender='deputy'
        ).order_by('-created_at')

        appeal = appeals.first()

        if appeal:
            logger.info(f'[dialog] citizen_id={citizen.id} active_dialog={appeal.id} status=active')
            return Response({
                'appeal': {
                    'id': str(appeal.id),
                    'title': appeal.title,
                    'description': appeal.description,
                    'status': appeal.status,
                    'message_count': appeal.message_count,
                    'message_limit': django_settings.APPEAL_MESSAGE_LIMIT,
                    'created_at': appeal.created_at,
                }
            })

        # Fallback: check AppealMessage table as well
        last_appeal_msg_sender = AppealMessage.objects.filter(
            appeal=OuterRef('pk')
        ).order_by('-created_at').values('sender_type')[:1]

        appeals_fallback = Appeal.objects.filter(
            citizen=citizen,
            status__in=['pending', 'in_progress', 'resolved'],
            message_count__lt=django_settings.APPEAL_MESSAGE_LIMIT
        ).annotate(
            last_appeal_msg_sender=Subquery(last_appeal_msg_sender)
        ).filter(
            last_appeal_msg_sender='deputy'
        ).order_by('-created_at')

        appeal = appeals_fallback.first()

        if appeal:
            logger.info(f'[dialog] citizen_id={citizen.id} active_dialog={appeal.id} status=active (via AppealMessage)')
            return Response({
                'appeal': {
                    'id': str(appeal.id),
                    'title': appeal.title,
                    'description': appeal.description,
                    'status': appeal.status,
                    'message_count': appeal.message_count,
                    'message_limit': django_settings.APPEAL_MESSAGE_LIMIT,
                    'created_at': appeal.created_at,
                }
            })

        logger.info(f'[dialog] citizen_id={citizen.id} active_dialog=None status=no_active_dialog')
        return Response({'appeal': None})

    except Citizen.DoesNotExist:
        return Response({'appeal': None})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def send_message_from_citizen_to_deputy(request):
    """
    Handle message from citizen to deputy via Telegram.
    """
    try:
        from apps.citizens.models import Citizen
        from apps.appeals.models import AppealActivityLog
        from django.db import transaction
        
        citizen_telegram_id = request.data.get('citizen_telegram_id')
        appeal_title = request.data.get('appeal_title')
        message_text = request.data.get('message_text')
        message_count = request.data.get('message_count', 1)
        
        if not all([citizen_telegram_id, message_text]):
            return Response(
                {'error': 'Missing required fields'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get citizen by telegram_user_id
        citizen = Citizen.objects.get(telegram_user_id=citizen_telegram_id)
        
        # Find the active appeal where last message was from deputy
        appeals = Appeal.objects.filter(
            citizen=citizen,
            status__in=['pending', 'in_progress', 'resolved'],  # Not 'closed'
            message_count__lt=django_settings.APPEAL_MESSAGE_LIMIT
        ).order_by('-created_at')
        
        appeal = None
        for ap in appeals:
            # First check Message table
            last_message = Message.objects.filter(appeal=ap).order_by('-created_at').first()
            if last_message and last_message.sender_type == 'deputy':
                appeal = ap
                break
        
        if not appeal:
            # Also check AppealMessage table
            for ap in appeals:
                last_appeal_message = ap.dialogue_messages.order_by('-created_at').first()
                if last_appeal_message and last_appeal_message.sender_type == 'deputy':
                    appeal = ap
                    break
        
        if not appeal:
            return Response(
                {'error': 'No active appeal found for response'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check message limit
        if appeal.message_count >= django_settings.APPEAL_MESSAGE_LIMIT:
            return Response(
                {'error': 'Message limit reached'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find the deputy for this appeal
        deputy = appeal.deputy
        if not deputy:
            return Response(
                {'error': 'No deputy assigned to this appeal'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the message in a transaction
        with transaction.atomic():
            message = Message.objects.create(
                appeal=appeal,
                sender_type='citizen',
                sender_user=citizen.user,
                receiver_user=deputy.user,
                channel='telegram',
                content=message_text
            )

            # Also create AppealMessage so deputies see citizen replies in dialogue_messages
            from apps.appeals.models import AppealMessage
            AppealMessage.objects.create(
                appeal=appeal,
                sender_type='citizen',
                sender_user=citizen.user,
                message=message_text,
                is_visible_to_citizen=True
            )

            # Update appeal metadata
            appeal.message_count += 1

            # Change status to in_progress if it was pending
            if appeal.status == 'pending':
                appeal.status = 'in_progress'
            
            appeal.save()
            
            # Create activity log
            AppealActivityLog.objects.create(
                appeal=appeal,
                changed_by=citizen.user,
                notes=f'Citizen sent message to deputy via Telegram: {message_text[:100]}'
            )
            
            # Send notification to deputy
            if deputy.telegram_chat_id:
                from core.utils.telegram_service import TelegramService
                telegram_service = TelegramService()
                telegram_service.notify_deputy_new_message(
                    deputy.telegram_chat_id,
                    appeal,
                    message_text
                )
            
            # Create system notification for deputy
            from apps.notifications.models import Notification
            Notification.objects.create(
                recipient=deputy.user,
                notification_type='in_app',
                title='\u041d\u043e\u0432\u043e\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u043e\u0442 \u0433\u0440\u0430\u0436\u0434\u0430\u043d\u0438\u043d\u0430',
                message=f'\u041d\u043e\u0432\u043e\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u043e\u0442 \u0433\u0440\u0430\u0436\u0434\u0430\u043d\u0438\u043d\u0430 \u043f\u043e \u043e\u0431\u0440\u0430\u0449\u0435\u043d\u0438\u044e: {appeal.title}',
                appeal=appeal
            )
        
        return Response({
            'status': 'success',
            'message_id': str(message.id),
            'appeal_id': str(appeal.id)
        })
        
    except Citizen.DoesNotExist:
        return Response(
            {'error': 'Citizen not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Appeal.DoesNotExist:
        return Response(
            {'error': 'Appeal not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def mark_message_as_read(request, message_id):
    """
    Mark a specific message as read by the current user.
    """
    try:
        message = Message.objects.get(pk=message_id)
        user = request.user
        
        # Verify user has permission to mark this message as read
        # User should be the receiver of the message
        if message.receiver_user != user:
            return Response(
                {'error': 'You are not authorized to mark this message as read'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Mark the message as read
        message.is_read = True
        message.save()
        
        return Response({'status': 'Message marked as read'})
        
    except Message.DoesNotExist:
        return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def mark_appeal_messages_as_read(request, appeal_id):
    """
    Mark all unread messages for an appeal as read by the current user.
    """
    try:
        from apps.appeals.models import Appeal
        
        appeal = Appeal.objects.get(pk=appeal_id)
        user = request.user
        
        # Verify user has permission to mark messages as read
        # User should be either the citizen or deputy associated with the appeal
        is_authorized = (
            user == appeal.citizen.user or 
            (appeal.deputy and user == appeal.deputy.user) or
            user.is_staff
        )
        
        if not is_authorized:
            return Response(
                {'error': 'You are not authorized to mark messages as read for this appeal'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update all messages in the appeal that are directed to the current user and are unread
        Message.objects.filter(
            appeal=appeal,
            receiver_user=user,
            is_read=False
        ).update(is_read=True)
        
        return Response({'status': 'All unread messages for this appeal marked as read'})
        
    except Appeal.DoesNotExist:
        return Response({'error': 'Appeal not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)