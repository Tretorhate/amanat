from celery import shared_task
from .models import Notification
from .services import NotificationService


@shared_task
def send_notification_async(notification_id):
    """
    Asynchronously send a notification.
    """
    try:
        notification = Notification.objects.get(id=notification_id)
        service = NotificationService()
        
        success = False
        if notification.notification_type == 'email':
            success = service._send_email_notification(notification)
        elif notification.notification_type == 'push':
            success = service._send_push_notification(notification)
        elif notification.notification_type == 'sms':
            success = service._send_sms_notification(notification)
        elif notification.notification_type == 'in_app':
            success = True  # In-app notifications are already created in DB
        
        if success:
            notification.status = 'sent'
            notification.sent_at = timezone.now()
        else:
            notification.status = 'failed'
        
        notification.save()
        return f"Notification {notification_id} processing completed with status: {notification.status}"
    except Notification.DoesNotExist:
        return f"Notification with ID {notification_id} does not exist"
    except Exception as e:
        return f"Error processing notification {notification_id}: {str(e)}"


@shared_task
def send_bulk_notifications_async(notification_ids):
    """
    Asynchronously send multiple notifications.
    """
    results = []
    for nid in notification_ids:
        result = send_notification_async(nid)
        results.append(result)
    return results


@shared_task
def schedule_notification_reminders():
    """
    Scheduled task to send reminder notifications for unresolved appeals.
    """
    from apps.appeals.models import Appeal
    from django.utils import timezone
    from datetime import timedelta
    
    # Find appeals that have been pending for more than 7 days
    week_ago = timezone.now() - timedelta(days=7)
    pending_appeals = Appeal.objects.filter(
        created_at__lt=week_ago,
        status='pending'
    )

    service = NotificationService()
    sent_count = 0

    for appeal in pending_appeals:
        # Notify the deputy about the pending appeal
        if appeal.deputy:
            service.send_notification(
                recipient=appeal.deputy.user,
                title=f"Reminder: Appeal #{appeal.id} Pending Resolution",
                message=f"The appeal '{appeal.title}' has been pending for more than a week. Please review and take appropriate action.",
                notification_type='email',
                appeal=appeal
            )
            sent_count += 1
    
    return f"Sent {sent_count} reminder notifications for pending appeals"


@shared_task
def cleanup_old_notifications():
    """
    Clean up old notifications that are older than a certain threshold.
    """
    from django.utils import timezone
    from datetime import timedelta
    
    # Delete notifications older than 90 days
    cutoff_date = timezone.now() - timedelta(days=90)
    deleted_count = Notification.objects.filter(
        created_at__lt=cutoff_date
    ).delete()[0]
    
    return f"Cleaned up {deleted_count} old notifications"


# Import timezone at the top of the file
from django.utils import timezone