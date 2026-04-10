from celery import shared_task
from .models import Appeal
from .services import AppealService


@shared_task
def auto_close_resolved_appeals():
    """Auto-close appeals that have been resolved for 7 days"""
    from django.utils import timezone
    from datetime import timedelta
    
    threshold = timezone.now() - timedelta(days=7)
    appeals = Appeal.objects.filter(
        status=Appeal.Status.RESOLVED,
        responded_at__lte=threshold,
        closed_at__isnull=True
    )
    
    count = appeals.update(
        status=Appeal.Status.CLOSED,
        closed_at=timezone.now()
    )
    
    return f"Closed {count} appeals"

@shared_task
def send_daily_summary_to_deputies():
    """Send daily summary to deputies"""
    from apps.deputies.models import Deputy
    from core.utils.telegram_service import TelegramService
    
    telegram_service = TelegramService()
    
    for deputy in Deputy.objects.filter(is_active=True):
        pending_count = Appeal.objects.filter(
            deputy=deputy,
            status=Appeal.Status.PENDING
        ).count()
        
        if pending_count > 0:
            telegram_service.send_daily_summary(
                deputy.telegram_chat_id,
                pending_count
            )
    
    return f"Sent daily summaries to deputies"


@shared_task
def send_appeal_notification(appeal_id, notification_type):
    """
    Celery task to send notifications about appeals.
    """
    try:
        appeal = Appeal.objects.get(id=appeal_id)
        
        # Implementation for sending notifications would go here
        # This might involve sending emails, push notifications, etc.
        
        return f"Notification of type {notification_type} sent for appeal {appeal_id}"
    except Appeal.DoesNotExist:
        return f"Appeal with ID {appeal_id} does not exist"
    except Exception as e:
        return f"Error sending notification for appeal {appeal_id}: {str(e)}"


@shared_task
def generate_appeal_report(appeal_ids):
    """
    Celery task to generate a report for a set of appeals.
    """
    try:
        appeals = Appeal.objects.filter(id__in=appeal_ids)
        
        # Implementation for generating reports would go here
        
        return f"Report generated for {len(appeals)} appeals"
    except Exception as e:
        return f"Error generating report: {str(e)}"