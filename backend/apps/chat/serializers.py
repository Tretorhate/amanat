from rest_framework import serializers
from .models import MessageThread, Message, MessageReadReceipt
from apps.accounts.serializers import UserSerializer
from apps.appeals.serializers import AppealSerializer


class MessageReadReceiptSerializer(serializers.ModelSerializer):
    reader_name = serializers.CharField(source='reader.get_full_name', read_only=True)
    
    class Meta:
        model = MessageReadReceipt
        fields = '__all__'
        read_only_fields = ('read_at', 'reader_name')


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    read_receipts = MessageReadReceiptSerializer(many=True, read_only=True)
    
    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ('sent_at', 'sender_name')
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Add additional context like sender's avatar or role
        data['sender_avatar'] = instance.sender.profile.avatar.url if hasattr(instance.sender, 'profile') and instance.sender.profile.avatar else None
        return data


class MessageThreadSerializer(serializers.ModelSerializer):
    appeal = AppealSerializer(read_only=True)
    participants = UserSerializer(many=True, read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = MessageThread
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'participants')
    
    def create(self, validated_data):
        # The participants are typically determined by the appeal's citizen and assigned deputy
        thread = MessageThread.objects.create(**validated_data)
        
        # Automatically add the citizen and deputy to the thread
        appeal = validated_data['appeal']
        thread.participants.add(appeal.citizen.user)
        if appeal.deputy:
            thread.participants.add(appeal.deputy.user)
        
        return thread