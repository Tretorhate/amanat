from django.db.models import Count, Avg, Q, F
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Appeal


@api_view(['GET'])
@permission_classes([AllowAny])
def get_platform_statistics(request):
    """
    Get real-time platform statistics for landing page
    """
    # Total appeals
    total_appeals = Appeal.objects.count()
    
    # Resolved appeals
    resolved_appeals = Appeal.objects.filter(
        status__in=[Appeal.Status.RESOLVED, Appeal.Status.CLOSED]
    ).count()
    
    # Active deputies (deputies who have handled at least one appeal)
    active_deputies = Appeal.objects.values('deputy').distinct().count()
    
    # Average response time (in hours)
    appeals_with_response = Appeal.objects.filter(
        responded_at__isnull=False
    ).annotate(
        response_time=F('responded_at') - F('created_at')
    )
    
    avg_response_seconds = 0
    if appeals_with_response.exists():
        total_seconds = sum([
            (appeal.responded_at - appeal.created_at).total_seconds() 
            for appeal in appeals_with_response
        ])
        avg_response_seconds = total_seconds / appeals_with_response.count()
    
    avg_response_hours = int(avg_response_seconds / 3600) if avg_response_seconds > 0 else 0
    
    return Response({
        'total_appeals': total_appeals,
        'resolved': resolved_appeals,
        'active_deputies': active_deputies,
        'avg_response_time': avg_response_hours
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_category_distribution(request):
    """
    Get appeal distribution by category
    """
    # Category name mapping (English to Russian)
    category_names = {
        'infrastructure': 'Инфраструктура',
        'safety': 'Безопасность',
        'utilities': 'ЖКХ',
        'transport': 'Транспорт',
        'education': 'Образование',
        'healthcare': 'Здравоохранение',
        'housing': 'Жилье',
        'environment': 'Экология',
        'social_services': 'Соц. услуги',
        'other': 'Другое'
    }
    
    category_data = Appeal.objects.values('category').annotate(
        count=Count('id')
    ).order_by('-count')
    
    result = []
    for item in category_data:
        category_key = item['category']
        result.append({
            'name': category_names.get(category_key, category_key.title()),
            'value': item['count']
        })
    
    return Response(result)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_recent_appeals(request):
    """
    Get recent appeals for landing page
    """
    # Get last 10 appeals
    recent = Appeal.objects.select_related('citizen', 'deputy').order_by('-created_at')[:10]
    
    # Category name mapping
    category_names = {
        'infrastructure': 'Инфраструктура',
        'safety': 'Безопасность',
        'utilities': 'ЖКХ',
        'transport': 'Транспорт',
        'education': 'Образование',
        'healthcare': 'Здравоохранение',
        'housing': 'Жилье',
        'environment': 'Экология',
        'social_services': 'Соц. услуги',
        'other': 'Другое'
    }
    
    # Status mapping
    status_names = {
        'pending': 'Ожидает',
        'in_progress': 'В работе',
        'resolved': 'Решено',
        'closed': 'Закрыто',
        'rejected': 'Отклонено'
    }
    
    result = []
    for appeal in recent:
        # Calculate time ago
        time_diff = timezone.now() - appeal.created_at
        if time_diff.days > 0:
            time_ago = f"{time_diff.days} {'день' if time_diff.days == 1 else 'дня' if time_diff.days < 5 else 'дней'} назад"
        elif time_diff.seconds >= 3600:
            hours = time_diff.seconds // 3600
            time_ago = f"{hours} {'час' if hours == 1 else 'часа' if hours < 5 else 'часов'} назад"
        else:
            minutes = time_diff.seconds // 60
            time_ago = f"{minutes} {'минуту' if minutes == 1 else 'минуты' if minutes < 5 else 'минут'} назад"
        
        # Get district from citizen or deputy
        district = "Район не указан"
        if hasattr(appeal.citizen, 'district') and appeal.citizen.district:
            district = appeal.citizen.district
        
        result.append({
            'id': str(appeal.id),
            'category': category_names.get(appeal.category, appeal.category),
            'district': district,
            'status': status_names.get(appeal.status, appeal.status),
            'time': time_ago
        })
    
    return Response(result)
