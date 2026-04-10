from django.core.mail import send_mail
from django.conf import settings
from .models import Notification, NotificationTemplate, UserNotificationPreference
from apps.accounts.models import User
from apps.appeals.models import Appeal
from string import Template
import logging


logger = logging.getLogger(__name__)


class NotificationService:
    """
    Service class for handling all notification-related functionality.
    """
    
    def __init__(self):
        pass
    
    def send_notification(self, recipient, title, message, notification_type='in_app', appeal=None, data=None):
        """
        Send a notification to a user.
        """
        if data is None:
            data = {}
        
        # Check user preferences
        try:
            prefs = recipient.notification_preferences
            if not self._should_send_notification(prefs, notification_type):
                logger.info(f"Notification not sent to {recipient.email} due to preferences")
                return None
        except UserNotificationPreference.DoesNotExist:
            # If no preferences set, use default behavior
            pass
        
        # Create notification record
        notification = Notification.objects.create(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=notification_type,
            appeal=appeal,
            data=data
        )
        
        # Attempt to send based on type
        success = False
        if notification_type == 'email':
            success = self._send_email_notification(notification)
        elif notification_type == 'push':
            success = self._send_push_notification(notification)
        elif notification_type == 'sms':
            success = self._send_sms_notification(notification)
        elif notification_type == 'in_app':
            success = True  # In-app notifications are created in DB, no external service needed
            notification.status = 'sent'
            notification.sent_at = timezone.now()
            notification.save()
        
        if success:
            notification.status = 'sent'
            notification.sent_at = timezone.now()
            notification.save()
        else:
            notification.status = 'failed'
            notification.save()
        
        return notification
    
    def send_notification_by_template(self, recipient, template_name, context=None, appeal=None):
        """
        Send a notification using a predefined template.
        """
        if context is None:
            context = {}
        
        try:
            template = NotificationTemplate.objects.get(name=template_name, is_active=True)
        except NotificationTemplate.DoesNotExist:
            logger.error(f"Notification template '{template_name}' not found")
            return None
        
        # Substitute placeholders in template
        try:
            body_template = Template(template.body_template)
            message = body_template.safe_substitute(**context)
        except Exception as e:
            logger.error(f"Error substituting template placeholders: {e}")
            message = template.body_template
        
        title = template.subject if template.subject else template.name
        return self.send_notification(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=template.notification_type,
            appeal=appeal,
            data=context
        )
    
    def _should_send_notification(self, preferences, notification_type):
        """
        Check if a notification should be sent based on user preferences.
        """
        if notification_type == 'email' and not preferences.email_notifications:
            return False
        elif notification_type == 'sms' and not preferences.sms_notifications:
            return False
        elif notification_type == 'push' and not preferences.push_notifications:
            return False
        elif notification_type == 'in_app' and not preferences.in_app_notifications:
            return False
        
        return True
    
    def _send_email_notification(self, notification):
        """
        Send email notification.
        """
        try:
            send_mail(
                subject=notification.title,
                message=notification.message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[notification.recipient.email],
                fail_silently=False,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")
            return False
    
    def _send_push_notification(self, notification):
        """
        Send push notification.
        Note: This is a placeholder implementation.
        In a real application, you would integrate with a push notification service
        like Firebase Cloud Messaging (FCM) or Apple Push Notification Service (APNs).
        """
        try:
            # Placeholder for actual push notification service integration
            # Example with FCM:
            # from pyfcm import FCMNotification
            # push_service = FCMNotification(api_key=settings.FCM_SERVER_KEY)
            # result = push_service.notify_single_device(
            #     registration_id=device_token,
            #     message_title=notification.title,
            #     message_body=notification.message
            # )
            
            # For now, just log that we attempted to send a push notification
            logger.info(f"Push notification sent to {notification.recipient.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send push notification: {e}")
            return False
    
    def _send_sms_notification(self, notification):
        """
        Send SMS notification.
        Note: This is a placeholder implementation.
        In a real application, you would integrate with an SMS service
        like Twilio, AWS SNS, or a local provider.
        """
        try:
            # Placeholder for actual SMS service integration
            # Example with Twilio:
            # from twilio.rest import Client
            # client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            # message = client.messages.create(
            #     body=notification.message,
            #     from_=settings.TWILIO_PHONE_NUMBER,
            #     to=notification.recipient.profile.phone_number
            # )
            
            # For now, just log that we attempted to send an SMS
            logger.info(f"SMS notification sent to {notification.recipient.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS notification: {e}")
            return False
    
    def send_appeal_notification(self, appeal, event_type, recipients=None):
        """
        Send notification about an appeal event.
        """
        if recipients is None:
            # Default to the citizen who submitted the appeal
            recipients = [appeal.citizen.user]
        
        # Add assigned deputy if available
        if appeal.deputy:
            recipients.append(appeal.deputy.user)
        
        # Select appropriate template based on event type
        template_name = f"appeal_{event_type.replace(' ', '_').lower()}"
        
        context = {
            'appeal_title': appeal.title,
            'appeal_description': appeal.description,
            'appeal_id': appeal.id,
            'citizen_name': f"{appeal.citizen.user.first_name} {appeal.citizen.user.last_name}",
            'deputy_name': f"{appeal.deputy.user.first_name} {appeal.deputy.user.last_name}" if appeal.deputy else 'Unassigned',
        }
        
        notifications = []
        for recipient in recipients:
            notification = self.send_notification_by_template(
                recipient=recipient,
                template_name=template_name,
                context=context,
                appeal=appeal
            )
            if notification:
                notifications.append(notification)
        
        return notifications
    
    def send_bulk_notification(self, recipients, title, message, notification_type='in_app', data=None):
        """
        Send the same notification to multiple recipients.
        """
        if data is None:
            data = {}
        
        notifications = []
        for recipient in recipients:
            notification = self.send_notification(
                recipient=recipient,
                title=title,
                message=message,
                notification_type=notification_type,
                data=data
            )
            if notification:
                notifications.append(notification)
        
        return notifications
    
    def mark_as_read(self, notification_id, user):
        """
        Mark a notification as read by the user.
        """
        try:
            notification = Notification.objects.get(id=notification_id, recipient=user)
            # In a real implementation, you might add an 'is_read' field
            # For now, we'll just return the notification
            return notification
        except Notification.DoesNotExist:
            return None


# Import timezone at the top of the file
from django.utils import timezone