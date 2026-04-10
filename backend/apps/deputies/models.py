from django.db import models
import uuid


class Deputy(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE, related_name='deputy_profile')
    full_name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    telegram_chat_id = models.BigIntegerField(unique=True, null=True, blank=True)
    district = models.CharField(max_length=100)
    constituency = models.ForeignKey('citizens.Constituency', on_delete=models.SET_NULL, null=True, blank=True, related_name='deputies')
    position = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'deputies'
    
    def __str__(self):
        return f"{self.full_name or self.user.username} ({self.district})"


class DeputyConstituency(models.Model):
    """
    Model to represent the constituencies a deputy is responsible for.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    deputy = models.ForeignKey(Deputy, on_delete=models.CASCADE, related_name='constituencies')
    name = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    population = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'deputy_constituencies'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name}, {self.region}"


class DeputySpecialization(models.Model):
    """
    Model to represent areas of specialization for a deputy.
    """
    SPECIALIZATION_CHOICES = [
        ('education', 'Education'),
        ('healthcare', 'Healthcare'),
        ('infrastructure', 'Infrastructure'),
        ('economy', 'Economy'),
        ('social_affairs', 'Social Affairs'),
        ('environment', 'Environment'),
        ('law', 'Law and Order'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    deputy = models.ForeignKey(Deputy, on_delete=models.CASCADE, related_name='specializations')
    specialization = models.CharField(max_length=20, choices=SPECIALIZATION_CHOICES)
    description = models.TextField(blank=True)
    is_primary = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'deputy_specializations'
        ordering = ['-is_primary', 'specialization']

    def __str__(self):
        return f"{self.get_specialization_display()} - {self.deputy}"