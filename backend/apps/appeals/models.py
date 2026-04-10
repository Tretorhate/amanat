from django.db import models
import uuid


class AppealCategory(models.Model):
    """
    Categories for appeals to organize and classify them.
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class AppealStatus(models.Model):
    """
    Status options for appeals throughout their lifecycle.
    """
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#000000')  # Hex color for UI representation
    is_final = models.BooleanField(default=False)  # Indicates if this is a final status
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class Appeal(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        IN_PROGRESS = 'in_progress', 'In Progress'
        RESOLVED = 'resolved', 'Resolved'
        CLOSED = 'closed', 'Closed'
        REJECTED = 'rejected', 'Rejected'
    
    class Category(models.TextChoices):
        INFRASTRUCTURE = 'infrastructure', 'Infrastructure'
        SAFETY = 'safety', 'Safety'
        HEALTHCARE = 'healthcare', 'Healthcare'
        EDUCATION = 'education', 'Education'
        ENVIRONMENT = 'environment', 'Environment'
        TRANSPORT = 'transport', 'Transport'
        HOUSING = 'housing', 'Housing'
        UTILITIES = 'utilities', 'Utilities'
        SOCIAL_SERVICES = 'social_services', 'Social Services'
        OTHER = 'other', 'Other'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    citizen = models.ForeignKey('citizens.Citizen', on_delete=models.CASCADE, related_name='appeals')
    deputy = models.ForeignKey('deputies.Deputy', on_delete=models.CASCADE, related_name='handled_appeals')
    title = models.CharField(max_length=255, blank=True)
    description = models.TextField()
    category = models.CharField(max_length=100, choices=Category.choices)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.PENDING)
    priority = models.CharField(max_length=20, default='normal')
    message_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    satisfaction_rating = models.IntegerField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['deputy', 'status']),
        ]


class AppealAttachment(models.Model):
    """
    Attachments for appeals (documents, images, etc.).
    """
    appeal = models.ForeignKey(Appeal, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='appeal_attachments/')
    filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()  # Size in bytes
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Attachment for {self.appeal.title}"


class AppealComment(models.Model):
    """
    Comments on appeals for communication between citizen and deputy.
    """
    appeal = models.ForeignKey(Appeal, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Comment by {self.author} on {self.appeal.title}"


class AppealMessage(models.Model):
    """
    Messages in dialogue between citizen and deputy for an appeal.
    """
    class SenderType(models.TextChoices):
        CITIZEN = 'citizen', 'Citizen'
        DEPUTY = 'deputy', 'Deputy'
        SYSTEM = 'system', 'System'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    appeal = models.ForeignKey(Appeal, on_delete=models.CASCADE, related_name='dialogue_messages')
    sender_type = models.CharField(max_length=20, choices=SenderType.choices)
    sender_user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, null=True, blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_visible_to_citizen = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['appeal', 'created_at']),
            models.Index(fields=['sender_type']),
        ]
    
    def __str__(self):
        return f"Message from {self.sender_type} on {self.appeal.title}"


class AppealActivityLog(models.Model):
    """
    Log of activities and status changes for an appeal.
    """
    appeal = models.ForeignKey(Appeal, on_delete=models.CASCADE, related_name='activity_logs')
    status_from = models.ForeignKey(AppealStatus, on_delete=models.SET_NULL, null=True, related_name='status_changes_from')
    status_to = models.ForeignKey(AppealStatus, on_delete=models.SET_NULL, null=True, related_name='status_changes_to')
    changed_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    notes = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Activity log for {self.appeal.title}"