from django.db import models
import uuid


class Constituency(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=200, unique=True)
    region = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'constituencies'
        verbose_name_plural = 'Constituencies'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.region})"


class Citizen(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE, related_name='citizen_profile', null=True, blank=True)
    full_name = models.CharField(max_length=255, default='Unknown')
    phone = models.CharField(max_length=50, blank=True, default='')  # Allow blank for initial registration
    address = models.TextField(default='Not specified')
    district = models.CharField(max_length=100, blank=True, default='')
    constituency = models.ForeignKey(Constituency, on_delete=models.SET_NULL, null=True, blank=True, related_name='citizens')
    telegram_user_id = models.BigIntegerField(unique=True, null=True, blank=True) # Keep nullable to avoid migration pain, but bot will always provide it
    telegram_chat_id = models.BigIntegerField(null=True, blank=True)
    assigned_deputy = models.ForeignKey('deputies.Deputy', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_citizens')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'citizens'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.full_name} ({self.phone or 'No phone'})"


class CitizenDocument(models.Model):
    """
    Documents associated with a citizen.
    """
    DOCUMENT_TYPE_CHOICES = [
        ('national_id', 'National ID'),
        ('passport', 'Passport'),
        ('birth_certificate', 'Birth Certificate'),
        ('other', 'Other'),
    ]
    
    citizen = models.ForeignKey(Citizen, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES)
    document_number = models.CharField(max_length=50)
    issue_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    issued_by = models.CharField(max_length=100)
    file = models.FileField(upload_to='citizen_documents/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.document_type} - {self.document_number} for {self.citizen}"