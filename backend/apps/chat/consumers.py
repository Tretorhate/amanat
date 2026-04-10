import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import MessageThread, Message
from .serializers import MessageSerializer


class MessageConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.thread_id = self.scope['url_route']['kwargs']['thread_id']
        self.thread_group_name = f'thread_{self.thread_id}'
        
        # Check if user is part of the thread
        # This would require database access which is sync, so we'll accept the connection
        # and validate in receive method
        await self.channel_layer.group_add(
            self.thread_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.thread_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_content = text_data_json['message']
        sender_id = text_data_json.get('sender_id')
        
        # Here we would validate that the user belongs to the thread
        # For simplicity in this example, we'll broadcast the message
        
        # Create message instance (this would typically be done in a background task)
        # For demo purposes, we'll broadcast the message directly
        await self.channel_layer.group_send(
            self.thread_group_name,
            {
                'type': 'new_message',
                'message': message_content,
                'sender_id': sender_id
            }
        )
    
    async def new_message(self, event):
        message_id = event.get('message_id')
        
        # Get the message from DB and send to WebSocket
        if message_id:
            # In a real scenario, we'd fetch the message from DB
            # For now, we'll just send a notification that a new message exists
            await self.send(text_data=json.dumps({
                'type': 'new_message',
                'message_id': message_id,
                'status': 'Message received'
            }))
        else:
            # Send the actual message content
            await self.send(text_data=json.dumps({
                'type': 'new_message',
                'message': event['message'],
                'sender_id': event['sender_id']
            }))


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['user'].id
        self.notification_group_name = f'notifications_{self.user_id}'
        
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.notification_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        
        await self.channel_layer.group_send(
            self.notification_group_name,
            {
                'type': 'send_notification',
                'message': message
            }
        )
    
    async def send_notification(self, event):
        message = event['message']
        
        await self.send(text_data=json.dumps({
            'message': message
        }))