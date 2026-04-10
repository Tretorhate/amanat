from rest_framework import serializers
from .models import DashboardWidget, AnalyticsReport, AppealAnalytics, UserActivityLog


class DashboardWidgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardWidget
        fields = '__all__'


class AnalyticsReportSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = AnalyticsReport
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at', 'created_by_name')
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class AppealAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppealAnalytics
        fields = '__all__'


class UserActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivityLog
        fields = '__all__'
        read_only_fields = ('timestamp', 'ip_address', 'user_agent')
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request:
            validated_data['ip_address'] = self.get_client_ip(request)
            validated_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
        return super().create(validated_data)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class AppealStatisticsSerializer(serializers.Serializer):
    """
    Serializer for aggregated appeal statistics.
    """
    total_appeals = serializers.IntegerField()
    resolved_appeals = serializers.IntegerField()
    pending_appeals = serializers.IntegerField()
    average_resolution_time = serializers.FloatField()
    resolution_rate = serializers.FloatField()


class UserActivitySummarySerializer(serializers.Serializer):
    """
    Serializer for user activity summary.
    """
    active_users_today = serializers.IntegerField()
    total_logins_today = serializers.IntegerField()
    most_active_user = serializers.CharField()
    top_actions = serializers.ListField(child=serializers.DictField())