from django.db import models
from apps.accounts.models import User
from apps.appeals.models import Appeal


class NotificationTemplate(models.Model):
    """
    Template for different types of notifications.
    """
    NOTIFICATION_TYPE_CHOICES = [
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('push', 'Push Notification'),
        ('in_app', 'In-App Notification'),
    ]
    
    EVENT_TYPE_CHOICES = [
        ('appeal_submitted', 'Appeal Submitted'),
        ('appeal_assigned', 'Appeal Assigned'),
        ('appeal_updated', 'Appeal Updated'),
        ('appeal_resolved', 'Appeal Resolved'),
        ('message_received', 'Message Received'),
        ('system_announcement', 'System Announcement'),
    ]
    
    name = models.CharField(max_length=100)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPE_CHOICES)
    event_type = models.CharField(max_length=30, choices=EVENT_TYPE_CHOICES)
    subject = models.CharField(max_length=200, blank=True)  # For email
    body_template = models.TextField()  # Template with placeholders
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.notification_type})"


class Notification(models.Model):
    """
    Individual notification record.
    """
    NOTIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    template = models.ForeignKey(NotificationTemplate, on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=NOTIFICATION_STATUS_CHOICES, default='pending')
    appeal = models.ForeignKey(Appeal, on_delete=models.CASCADE, null=True, blank=True)  # Link to related appeal
    data = models.JSONField(default=dict, blank=True)  # Additional data for personalization
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Notification for {self.recipient} - {self.title}"


class UserNotificationPreference(models.Model):
    """
    User preferences for receiving notifications.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    push_notifications = models.BooleanField(default=True)
    in_app_notifications = models.BooleanField(default=True)
    appeal_submitted = models.BooleanField(default=True)
    appeal_assigned = models.BooleanField(default=True)
    appeal_updated = models.BooleanField(default=True)
    appeal_resolved = models.BooleanField(default=True)
    message_received = models.BooleanField(default=True)
    system_announcements = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Preferences for {self.user}"


class NotificationLog(models.Model):
    """
    Log of notification delivery attempts.
    """
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='logs')
    status = models.CharField(max_length=20)
    error_message = models.TextField(blank=True)
    processed_at = models.DateTimeField(auto_now_add=True)
    provider_response = models.JSONField(default=dict, blank=True)  # Response from notification provider
    
    def __str__(self):
        return f"Log for notification {self.notification.id} - {self.status}"