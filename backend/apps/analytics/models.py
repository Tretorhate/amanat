from django.db import models
from apps.accounts.models import User
from apps.appeals.models import Appeal


class DashboardWidget(models.Model):
    """
    Represents a widget on the analytics dashboard.
    """
    WIDGET_TYPE_CHOICES = [
        ('chart', 'Chart'),
        ('metric', 'Metric'),
        ('table', 'Table'),
        ('map', 'Map'),
        ('text', 'Text'),
    ]
    
    name = models.CharField(max_length=100)
    widget_type = models.CharField(max_length=10, choices=WIDGET_TYPE_CHOICES)
    configuration = models.JSONField(default=dict)  # Store widget-specific config
    position = models.IntegerField(default=0)  # Order of the widget on the dashboard
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name


class AnalyticsReport(models.Model):
    """
    Represents a saved analytics report.
    """
    REPORT_TYPE_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('custom', 'Custom'),
    ]
    
    name = models.CharField(max_length=200)
    report_type = models.CharField(max_length=10, choices=REPORT_TYPE_CHOICES)
    description = models.TextField(blank=True)
    filters = models.JSONField(default=dict)  # Store report filters and parameters
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name


class AppealAnalytics(models.Model):
    """
    Stores pre-calculated analytics data for appeals.
    """
    appeal = models.ForeignKey(Appeal, on_delete=models.CASCADE)
    resolution_time_hours = models.FloatField(null=True, blank=True)  # Time from submission to resolution
    satisfaction_score = models.FloatField(null=True, blank=True)  # Satisfaction rating if collected
    reopened_count = models.IntegerField(default=0)  # Number of times appeal was reopened
    interaction_count = models.IntegerField(default=0)  # Number of messages/comments
    calculated_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Analytics for Appeal #{self.appeal.id}"


class UserActivityLog(models.Model):
    """
    Tracks user activities for analytics purposes.
    """
    ACTION_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('create_appeal', 'Create Appeal'),
        ('update_appeal', 'Update Appeal'),
        ('send_message', 'Send Message'),
        ('view_dashboard', 'View Dashboard'),
        ('export_report', 'Export Report'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    metadata = models.JSONField(default=dict)  # Store additional action-specific data
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user} - {self.action} at {self.timestamp}"


class SystemPerformanceMetrics(models.Model):
    """
    Stores system performance metrics.
    """
    metric_type = models.CharField(max_length=50)  # e.g., 'response_time', 'db_queries', 'cache_hit_rate'
    value = models.FloatField()
    unit = models.CharField(max_length=20, default='')  # e.g., 'seconds', 'count', 'percentage'
    recorded_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict)  # Additional context about the metric
    
    def __str__(self):
        return f"{self.metric_type}: {self.value} {self.unit} at {self.recorded_at}"