from django.db import models
import uuid
from apps.appeals.models import Appeal
from apps.accounts.models import User


class MessageThread(models.Model):
    """
    Represents a thread of messages between users, typically related to an appeal.
    """
    appeal = models.ForeignKey(Appeal, on_delete=models.CASCADE, related_name='message_threads')
    participants = models.ManyToManyField(User, related_name='message_threads')
    subject = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Thread for Appeal #{self.appeal.id}"


class Message(models.Model):
    class SenderType(models.TextChoices):
        CITIZEN = 'citizen', 'Citizen'
        DEPUTY = 'deputy', 'Deputy'
    
    class ChannelType(models.TextChoices):
        TELEGRAM = 'telegram', 'Telegram'
        WEB = 'web', 'Web'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    appeal = models.ForeignKey('appeals.Appeal', on_delete=models.CASCADE, related_name='messages')
    sender_type = models.CharField(max_length=20, choices=SenderType.choices)
    sender_user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='sent_messages', null=True, blank=True)
    receiver_user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='received_messages', null=True, blank=True)
    sender_id = models.UUIDField(null=True, blank=True)  # Kept for backward compatibility
    channel = models.CharField(max_length=20, choices=ChannelType.choices, default='web')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'messages'
        ordering = ['created_at']


class MessageReadReceipt(models.Model):
    """
    Track read receipts for messages.
    """
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='read_receipts')
    reader = models.ForeignKey(User, on_delete=models.CASCADE, related_name='read_receipts')
    read_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('message', 'reader')
    
    def __str__(self):
        return f"Read receipt for message {self.message.id} by {self.reader}"


class MessageNotification(models.Model):
    """
    Notification about new messages.
    """
    NOTIFICATION_TYPE_CHOICES = [
        ('email', 'Email'),
        ('push', 'Push Notification'),
        ('sms', 'SMS'),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_notifications')
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=10, choices=NOTIFICATION_TYPE_CHOICES)
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Notification for {self.recipient} about message {self.message.id}"