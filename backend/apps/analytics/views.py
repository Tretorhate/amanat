from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db.models import Count, Avg, Q, F
from django.db.models.functions import ExtractHour, TruncDate
from django.utils import timezone
from datetime import timedelta
from .models import DashboardWidget, AnalyticsReport, AppealAnalytics, UserActivityLog
from .serializers import DashboardWidgetSerializer, AnalyticsReportSerializer, AppealAnalyticsSerializer, AppealStatisticsSerializer, UserActivitySummarySerializer
from .services import AnalyticsService
from core.utils.openai_service import OpenAIService
import json
from apps.appeals.models import Appeal, AppealStatus
from apps.accounts.models import User
from apps.citizens.models import Citizen
from apps.deputies.models import Deputy


class DashboardWidgetListView(generics.ListCreateAPIView):
    queryset = DashboardWidget.objects.all()
    serializer_class = DashboardWidgetSerializer
    permission_classes = [IsAuthenticated]


class DashboardWidgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = DashboardWidget.objects.all()
    serializer_class = DashboardWidgetSerializer
    permission_classes = [IsAuthenticated]


class AnalyticsReportListView(generics.ListCreateAPIView):
    serializer_class = AnalyticsReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return AnalyticsReport.objects.filter(created_by=user)


class AnalyticsReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AnalyticsReport.objects.all()
    serializer_class = AnalyticsReportSerializer
    permission_classes = [IsAuthenticated]


@api_view(['GET'])
@permission_classes([AllowAny])
def get_appeal_statistics(request):
    """
    Get overall appeal statistics.
    """
    # Calculate various statistics
    total_appeals = Appeal.objects.count()
    resolved_appeals = Appeal.objects.filter(status__in=['resolved', 'closed']).count()
    pending_appeals = Appeal.objects.filter(status='pending').count()

    # Calculate average resolution time from AppealAnalytics model
    avg_resolution_time = AppealAnalytics.objects.aggregate(
        avg_time=Avg('resolution_time_hours')
    )['avg_time'] or 0

    resolution_rate = (resolved_appeals / total_appeals * 100) if total_appeals > 0 else 0

    data = {
        'total_appeals': total_appeals,
        'resolved_appeals': resolved_appeals,
        'pending_appeals': pending_appeals,
        'average_resolution_time': avg_resolution_time,
        'resolution_rate': resolution_rate
    }

    serializer = AppealStatisticsSerializer(data=data)
    if serializer.is_valid():
        return Response(serializer.validated_data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_activity_summary(request):
    """
    Get user activity summary.
    """
    today = timezone.now().date()
    
    # Active users today
    active_users_today = UserActivityLog.objects.filter(
        timestamp__date=today
    ).values('user').distinct().count()
    
    # Total logins today
    total_logins_today = UserActivityLog.objects.filter(
        action='login',
        timestamp__date=today
    ).count()
    
    # Most active user
    most_active_user_query = UserActivityLog.objects.filter(
        timestamp__date=today
    ).values('user__username').annotate(
        activity_count=Count('id')
    ).order_by('-activity_count').first()
    
    most_active_user = most_active_user_query['user__username'] if most_active_user_query else 'N/A'
    
    # Top actions
    top_actions = UserActivityLog.objects.filter(
        timestamp__date=today
    ).values('action').annotate(
        count=Count('id')
    ).order_by('-count')[:5]
    
    data = {
        'active_users_today': active_users_today,
        'total_logins_today': total_logins_today,
        'most_active_user': most_active_user,
        'top_actions': list(top_actions)
    }
    
    serializer = UserActivitySummarySerializer(data=data)
    if serializer.is_valid():
        return Response(serializer.validated_data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_appeal_trends(request):
    """
    Get appeal trends over time.
    """
    days_back = int(request.query_params.get('days', 30))
    start_date = timezone.now() - timedelta(days=days_back)

    # Daily appeal counts
    daily_counts = Appeal.objects.filter(
        created_at__gte=start_date
    ).annotate(
        date=TruncDate('created_at')
    ).values('date').annotate(
        count=Count('id')
    ).order_by('date')

    # Status distribution
    status_distribution = Appeal.objects.values(
        'status'
    ).annotate(
        count=Count('id')
    ).order_by('-count')

    # Category distribution
    category_distribution = Appeal.objects.exclude(
        category__isnull=True
    ).values(
        'category'
    ).annotate(
        count=Count('id')
    ).order_by('-count')

    data = {
        'daily_counts': list(daily_counts),
        'status_distribution': list(status_distribution),
        'category_distribution': list(category_distribution),
    }

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_engagement_metrics(request):
    """
    Get user engagement metrics.
    """
    # Registration trends
    registration_trends = User.objects.annotate(
        date=TruncDate('date_joined')
    ).values('date').annotate(
        new_users=Count('id')
    ).order_by('date')
    
    # User types distribution
    user_type_distribution = User.objects.values(
        'user_type'
    ).annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Active users in the last 30 days
    thirty_days_ago = timezone.now() - timedelta(days=30)
    active_users_recent = UserActivityLog.objects.filter(
        timestamp__gte=thirty_days_ago
    ).values('user').distinct().count()
    
    # Average sessions per user in the last 30 days
    avg_sessions = UserActivityLog.objects.filter(
        timestamp__gte=thirty_days_ago,
        action='login'
    ).aggregate(
        avg_sessions=Avg('user')
    )
    
    data = {
        'registration_trends': list(registration_trends),
        'user_type_distribution': list(user_type_distribution),
        'active_users_recent': active_users_recent,
        'avg_sessions_per_user': avg_sessions['avg_sessions'] or 0
    }
    
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_custom_report(request):
    """
    Create a custom analytics report.
    """
    serializer = AnalyticsReportSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        report = serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_ai_detailed_analytics(request):
    """
    Get detailed analytics with AI-generated insights.
    """
    analytics_service = AnalyticsService()
    openai_service = OpenAIService()
    
    # Gather all statistics
    appeal_stats = analytics_service.calculate_appeal_statistics()
    deputy_performance = analytics_service.calculate_deputy_performance()
    user_engagement = analytics_service.generate_user_engagement_report()
    trends = analytics_service.generate_trend_analysis(period='month')
    sla_metrics = analytics_service.calculate_sla_compliance()
    
    # Prepare data summary for AI
    data_summary = {
        'appeals': {
            'total': appeal_stats['total_appeals'],
            'resolved': appeal_stats['resolved_appeals'],
            'pending': appeal_stats['pending_appeals'],
            'categories': appeal_stats['by_category'],
            'avg_resolution_time': appeal_stats['average_resolution_time']
        },
        'performance': deputy_performance,
        'engagement': user_engagement,
        'sla': sla_metrics
    }
    
    # Generate AI insights
    try:
        prompt = f"""
        As an expert data analyst for a citizen-deputy communication platform, analyze the following statistics and provide 3-5 concise, actionable insights in Russian. 
        Focus on trends, bottlenecks, and areas for improvement.
        
        Data Summary:
        {json.dumps(data_summary, ensure_ascii=False)}
        
        Format your response as a JSON object with a single key 'insights' containing an array of strings.
        """
        ai_response_raw = openai_service.generate_response(prompt, temperature=0.5)
        # Attempt to parse JSON from AI response
        try:
            # AI might wrap JSON in backticks
            if '```json' in ai_response_raw:
                ai_response_raw = ai_response_raw.split('```json')[1].split('```')[0].strip()
            elif '```' in ai_response_raw:
                ai_response_raw = ai_response_raw.split('```')[1].split('```')[0].strip()
            
            ai_insights = json.loads(ai_response_raw)
        except:
            ai_insights = {'insights': [ai_response_raw]}
    except Exception as e:
        ai_insights = {'insights': ['Не удалось сгенерировать AI-аналитику в данный момент.']}
    
    return Response({
        'stats': {
            'appeals': appeal_stats,
            'deputy_performance': deputy_performance,
            'user_engagement': user_engagement,
            'trends': trends,
            'sla': sla_metrics
        },
        'ai_analysis': ai_insights
    })