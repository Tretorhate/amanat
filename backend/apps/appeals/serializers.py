from rest_framework import serializers
from django.conf import settings as django_settings
from .models import AppealCategory, AppealStatus, Appeal, AppealAttachment, AppealComment, AppealActivityLog, AppealMessage
from apps.citizens.serializers import CitizenSerializer
from apps.deputies.serializers import DeputySerializer


class AppealCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AppealCategory
        fields = '__all__'


class AppealStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppealStatus
        fields = '__all__'


class AppealAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppealAttachment
        fields = '__all__'
        read_only_fields = ('uploaded_at',)


class AppealCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    
    class Meta:
        model = AppealComment
        fields = '__all__'
        read_only_fields = ('author', 'created_at', 'updated_at', 'author_name')


class AppealMessageSerializer(serializers.ModelSerializer):
    sender_user_name = serializers.CharField(source='sender_user.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = AppealMessage
        fields = '__all__'
        read_only_fields = ('id', 'appeal', 'sender_type', 'sender_user', 'created_at', 'sender_user_name')


class AppealMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppealMessage
        fields = ('message',)
        
    def create(self, validated_data):
        appeal = self.context.get('appeal')
        user = self.context.get('request').user
        
        validated_data['appeal'] = appeal
        validated_data['sender_type'] = 'deputy'
        validated_data['sender_user'] = user
        validated_data['is_visible_to_citizen'] = True
        
        return super().create(validated_data)


class AppealActivityLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    
    class Meta:
        model = AppealActivityLog
        fields = '__all__'
        read_only_fields = ('changed_at', 'changed_by_name')


class AppealSerializer(serializers.ModelSerializer):
    citizen = CitizenSerializer(read_only=True)
    deputy = DeputySerializer(read_only=True)
    attachments = AppealAttachmentSerializer(many=True, read_only=True)
    comments = AppealCommentSerializer(many=True, read_only=True)
    activity_logs = AppealActivityLogSerializer(many=True, read_only=True)
    dialogue_messages = AppealMessageSerializer(many=True, read_only=True)
    appeal_comments = AppealCommentSerializer(source='comments', many=True, read_only=True)
    message_limit = serializers.SerializerMethodField()

    class Meta:
        model = Appeal
        fields = '__all__'
        read_only_fields = ('citizen', 'created_at', 'responded_at', 'closed_at')

    def get_message_limit(self, obj):
        return django_settings.APPEAL_MESSAGE_LIMIT


class AppealCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appeal
        fields = ('title', 'description')

    def create(self, validated_data):
        # Set the citizen to the current user
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            citizen = request.user.citizen_profile
            validated_data['citizen'] = citizen

            # Auto-assign category to "other" (not identified yet)
            # This can be updated later by AI categorization or admin
            validated_data['category'] = 'other'

            # Auto-assign priority to "normal" by default
            validated_data['priority'] = 'normal'

            # Try to assign deputy based on citizen's assigned deputy
            if hasattr(citizen, 'assigned_deputy') and citizen.assigned_deputy:
                validated_data['deputy'] = citizen.assigned_deputy
            else:
                # Fallback: Use the "not_identified_deputy" system user
                from apps.deputies.models import Deputy
                from apps.accounts.models import User

                # Get the "not_identified_deputy" user (should always exist)
                try:
                    not_identified_user = User.objects.get(username='not_identified_deputy')
                    not_identified_deputy = not_identified_user.deputy_profile
                    validated_data['deputy'] = not_identified_deputy
                except (User.DoesNotExist, Deputy.DoesNotExist):
                    # System user doesn't exist - this is a configuration error
                    raise serializers.ValidationError(
                        'System configuration error: not_identified_deputy user is missing. '
                        'Please run: python manage.py create_not_identified_deputy'
                    )

        return super().create(validated_data)


class AppealUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appeal
        fields = ('title', 'description', 'category', 'deputy', 'status', 'priority')


class AppealDetailSerializer(AppealSerializer):
    class Meta(AppealSerializer.Meta):
        pass