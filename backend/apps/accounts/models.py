from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    phone = models.CharField(max_length=50, unique=True, null=True, blank=True)
    user_type = models.CharField(max_length=20, choices=[
        ('citizen', 'Citizen'),
        ('deputy', 'Deputy'),
    ])
    telegram_user_id = models.BigIntegerField(unique=True, null=True, blank=True)
    telegram_chat_id = models.BigIntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'users'
    
    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"