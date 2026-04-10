from django.db.models import Count, Avg, Sum, Q, F
from django.db.models.functions import TruncMonth, TruncWeek, TruncDay
from django.utils import timezone
from datetime import timedelta
from apps.appeals.models import Appeal, AppealStatus
from apps.accounts.models import User
from apps.citizens.models import Citizen
from apps.deputies.models import Deputy
from .models import AppealAnalytics, UserActivityLog, SystemPerformanceMetrics
import pandas as pd


class AnalyticsService:
    """
    Service class for handling analytics and reporting functionality.
    """
    
    def calculate_appeal_statistics(self, start_date=None, end_date=None, filters=None):
        """
        Calculate comprehensive appeal statistics.
        """
        appeals = Appeal.objects.all()
        
        if start_date:
            appeals = appeals.filter(created_at__gte=start_date)
        if end_date:
            appeals = appeals.filter(created_at__lte=end_date)
        if filters:
            appeals = self.apply_filters(appeals, filters)
        
        stats = {
            'total_appeals': appeals.count(),
            'resolved_appeals': appeals.filter(status__in=['resolved', 'closed']).count(),
            'pending_appeals': appeals.exclude(status__in=['resolved', 'closed', 'rejected']).count(),
            'by_category': list(appeals.values('category').annotate(count=Count('id'))),
            'by_status': list(appeals.values('status').annotate(count=Count('id'))),
            'by_priority': list(appeals.values('priority').annotate(count=Count('id'))),
        }
        
        # Calculate resolution time if AppealAnalytics exist
        appeal_ids = appeals.values_list('id', flat=True)
        avg_resolution_time = AppealAnalytics.objects.filter(
            appeal_id__in=appeal_ids
        ).aggregate(avg_time=Avg('resolution_time_hours'))['avg_time']
        
        stats['average_resolution_time'] = avg_resolution_time or 0
        
        return stats
    
    def calculate_deputy_performance(self, start_date=None, end_date=None):
        """
        Calculate performance metrics for deputies.
        """
        deputies = Deputy.objects.all()
        performance_data = []
        
        for deputy in deputies:
            appeals_assigned = Appeal.objects.filter(
                deputy=deputy
            )
            
            if start_date:
                appeals_assigned = appeals_assigned.filter(created_at__gte=start_date)
            if end_date:
                appeals_assigned = appeals_assigned.filter(created_at__lte=end_date)
            
            resolved_appeals = appeals_assigned.filter(status__in=['resolved', 'closed'])
            
            # Calculate resolution time for resolved appeals
            resolution_times = AppealAnalytics.objects.filter(
                appeal__in=resolved_appeals
            ).aggregate(avg_time=Avg('resolution_time_hours'))
            
            deputy_stats = {
                'deputy_id': deputy.id,
                'deputy_name': f"{deputy.user.first_name} {deputy.user.last_name}",
                'total_appeals_assigned': appeals_assigned.count(),
                'resolved_appeals': resolved_appeals.count(),
                'resolution_rate': (
                    resolved_appeals.count() / appeals_assigned.count() * 100
                    if appeals_assigned.count() > 0 else 0
                ),
                'average_resolution_time': resolution_times['avg_time'] or 0,
            }
            
            performance_data.append(deputy_stats)
        
        return performance_data
    
    def generate_user_engagement_report(self, start_date=None, end_date=None):
        """
        Generate user engagement metrics.
        """
        users = User.objects.all()
        
        if start_date:
            user_activity = UserActivityLog.objects.filter(timestamp__gte=start_date)
        else:
            user_activity = UserActivityLog.objects.all()
        
        if end_date:
            user_activity = user_activity.filter(timestamp__lte=end_date)
        
        engagement_data = {
            'total_users': users.count(),
            'active_users': user_activity.values('user').distinct().count(),
            'total_activities': user_activity.count(),
            'by_action_type': list(user_activity.values('action').annotate(count=Count('id'))),
            'new_registrations': users.filter(date_joined__range=(start_date, end_date)).count() if start_date and end_date else 0,
        }
        
        return engagement_data
    
    def generate_trend_analysis(self, period='month', start_date=None, end_date=None):
        """
        Generate trend analysis for appeals over time.
        """
        if not start_date:
            start_date = timezone.now() - timedelta(days=365)  # Default to last year
        if not end_date:
            end_date = timezone.now()
        
        appeals = Appeal.objects.filter(
            created_at__range=[start_date, end_date]
        )
        
        # Determine the truncation function based on period
        if period == 'day':
            trunc_func = TruncDay('created_at')
        elif period == 'week':
            trunc_func = TruncWeek('created_at')
        else:  # month
            trunc_func = TruncMonth('created_at')
        
        trends = appeals.annotate(
            period=trunc_func
        ).values('period').annotate(
            count=Count('id'),
            resolved_count=Count('id', filter=Q(status__in=['resolved', 'closed'])),
            unresolved_count=Count('id', filter=~Q(status__in=['resolved', 'closed', 'rejected']))
        ).order_by('period')
        
        return list(trends)
    
    def export_report_data(self, report_type, start_date=None, end_date=None, filters=None):
        """
        Export analytics data in various formats.
        """
        data = None
        
        if report_type == 'appeals':
            data = self.calculate_appeal_statistics(start_date, end_date, filters)
        elif report_type == 'deputy_performance':
            data = self.calculate_deputy_performance(start_date, end_date)
        elif report_type == 'user_engagement':
            data = self.generate_user_engagement_report(start_date, end_date)
        elif report_type == 'trends':
            data = self.generate_trend_analysis('month', start_date, end_date)
        
        # Convert to DataFrame for easy export
        df = pd.DataFrame(data) if data else pd.DataFrame()
        
        return df
    
    def calculate_sla_compliance(self, start_date=None, end_date=None):
        """
        Calculate SLA compliance metrics.
        """
        appeals = Appeal.objects.all()
        
        if start_date:
            appeals = appeals.filter(created_at__gte=start_date)
        if end_date:
            appeals = appeals.filter(created_at__lte=end_date)
        
        # Assuming SLA is to resolve appeals within 7 days (adjust as needed)
        sla_threshold_hours = 7 * 24
        
        compliant_appeals = AppealAnalytics.objects.filter(
            appeal__in=appeals,
            resolution_time_hours__lte=sla_threshold_hours
        ).count()
        
        total_resolved = AppealAnalytics.objects.filter(
            appeal__in=appeals
        ).count()
        
        compliance_rate = (compliant_appeals / total_resolved * 100) if total_resolved > 0 else 0
        
        return {
            'total_resolved_appeals': total_resolved,
            'compliant_appeals': compliant_appeals,
            'non_compliant_appeals': total_resolved - compliant_appeals,
            'sla_compliance_rate': compliance_rate
        }
    
    def get_system_performance_metrics(self, metric_type=None, start_date=None, end_date=None):
        """
        Get system performance metrics.
        """
        metrics = SystemPerformanceMetrics.objects.all()
        
        if metric_type:
            metrics = metrics.filter(metric_type=metric_type)
        if start_date:
            metrics = metrics.filter(recorded_at__gte=start_date)
        if end_date:
            metrics = metrics.filter(recorded_at__lte=end_date)
        
        return metrics.values('metric_type', 'value', 'unit', 'recorded_at', 'metadata')
    
    def apply_filters(self, queryset, filters):
        """
        Apply filters to a queryset.
        """
        for field, value in filters.items():
            if field == 'category':
                queryset = queryset.filter(category=value)
            elif field == 'status':
                queryset = queryset.filter(status=value)
            elif field == 'priority':
                queryset = queryset.filter(priority=value)
            elif field == 'assigned_deputy':
                queryset = queryset.filter(deputy_id=value)
            elif field == 'citizen':
                queryset = queryset.filter(citizen_id=value)
        
        return queryset