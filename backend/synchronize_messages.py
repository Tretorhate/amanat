#!/usr/bin/env python
"""
Script to synchronize existing AppealMessage records with the Chat Message system
to ensure that the dialog detection works properly for existing appeals.
"""

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'amanat.settings.development')
django.setup()

from apps.appeals.models import Appeal, AppealMessage
from apps.chat.models import Message
from apps.accounts.models import User
from django.db import transaction
from datetime import datetime

def synchronize_existing_messages():
    """Synchronize existing AppealMessage records with Chat Message records."""
    print("Starting message synchronization...")
    
    appeals_with_messages = Appeal.objects.prefetch_related('dialogue_messages').all()
    
    total_synchronized = 0
    
    for appeal in appeals_with_messages:
        appeal_messages = appeal.dialogue_messages.all()
        
        for appeal_msg in appeal_messages:
            # Check if a corresponding chat message already exists
            chat_msg_exists = Message.objects.filter(
                appeal=appeal,
                content=appeal_msg.message,
                created_at=appeal_msg.created_at
            ).exists()
            
            if not chat_msg_exists:
                # Create a corresponding chat message
                citizen_user = appeal.citizen.user if appeal.citizen and appeal.citizen.user else None
                deputy_user = appeal.deputy.user if appeal.deputy and appeal.deputy.user else None
                
                if appeal_msg.sender_type == 'citizen' and citizen_user and deputy_user:
                    chat_message = Message.objects.create(
                        appeal=appeal,
                        sender_type='citizen',
                        sender_user=citizen_user,
                        receiver_user=deputy_user,
                        channel='web',  # Could be 'web', 'telegram', etc.
                        content=appeal_msg.message,
                        created_at=appeal_msg.created_at
                    )
                    print(f"Created chat message for appeal {appeal.id}, citizen message: {chat_message.id}")
                    total_synchronized += 1
                    
                elif appeal_msg.sender_type == 'deputy' and deputy_user and citizen_user:
                    chat_message = Message.objects.create(
                        appeal=appeal,
                        sender_type='deputy',
                        sender_user=deputy_user,
                        receiver_user=citizen_user,
                        channel='web',  # Could be 'web', 'telegram', etc.
                        content=appeal_msg.message,
                        created_at=appeal_msg.created_at
                    )
                    print(f"Created chat message for appeal {appeal.id}, deputy message: {chat_message.id}")
                    total_synchronized += 1
                    
                elif appeal_msg.sender_type == 'system' and deputy_user and citizen_user:
                    # System messages are usually from deputy to citizen
                    chat_message = Message.objects.create(
                        appeal=appeal,
                        sender_type='deputy',  # System messages are treated as deputy messages
                        sender_user=deputy_user,
                        receiver_user=citizen_user,
                        channel='web',
                        content=appeal_msg.message,
                        created_at=appeal_msg.created_at
                    )
                    print(f"Created chat message for appeal {appeal.id}, system message: {chat_message.id}")
                    total_synchronized += 1
    
    print(f"Synchronization complete! Total messages created: {total_synchronized}")

if __name__ == "__main__":
    synchronize_existing_messages()