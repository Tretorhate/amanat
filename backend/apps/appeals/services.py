import logging

from django.db.models import Q
from django.utils import timezone
from django.conf import settings as django_settings
from .models import Appeal
from core.utils.openai_service import OpenAIService
from core.utils.telegram_service import TelegramService

logger = logging.getLogger(__name__)


class AppealService:
    """
    Business logic service for handling appeals-related operations.
    """
    
    def __init__(self):
        self.openai_service = OpenAIService()
        self.telegram_service = TelegramService()
    
    def create_appeal(self, citizen, description, title=None):
        """Create and categorize new appeal"""
        # AI Categorization
        categorization = self.openai_service.categorize_appeal(description)
        
        # Create appeal
        appeal = Appeal.objects.create(
            citizen=citizen,
            deputy=citizen.assigned_deputy,
            title=title or description[:100] if description else '',
            description=description,
            category=categorization['category'],
            priority=categorization.get('priority', 'normal')
        )
        
        # Notify deputy via Telegram
        if appeal.deputy and appeal.deputy.telegram_chat_id:
            self.telegram_service.notify_deputy_new_appeal(
                appeal.deputy.telegram_chat_id,
                appeal
            )
        
        return appeal
    
    def add_message(self, appeal, sender_type, sender_id, content):
        """Add message to appeal with 10 message limit"""
        from apps.messages.models import Message
        
        if appeal.message_count >= django_settings.APPEAL_MESSAGE_LIMIT:
            raise ValueError(f"Maximum {django_settings.APPEAL_MESSAGE_LIMIT} messages per appeal reached")
        
        message = Message.objects.create(
            appeal=appeal,
            sender_type=sender_type,
            sender_id=sender_id,
            content=content
        )
        
        appeal.message_count += 1
        if appeal.message_count == 1 and sender_type == 'deputy':
            appeal.responded_at = timezone.now()
        appeal.save()
        
        # Notify other party
        if sender_type == 'citizen':
            if appeal.deputy and appeal.deputy.telegram_chat_id:
                self.telegram_service.notify_deputy_new_message(
                    appeal.deputy.telegram_chat_id,
                    appeal,
                    message
                )
        else:  # sender is deputy
            if appeal.citizen.telegram_chat_id:
                self.telegram_service.notify_citizen_new_message(
                    appeal.citizen.telegram_chat_id,
                    appeal,
                    message
                )
        
        return message
    
    def categorize_appeal_with_ai(self, appeal):
        """
        Use AI to categorize an appeal based on its content.
        """
        prompt = f"""
        Please categorize the following appeal based on its title and description:
        
        Title: {appeal.title}
        Description: {appeal.description}
        
        Available categories:
        """
        
        # Get all available categories
        categories = AppealCategory.objects.filter(is_active=True)
        for cat in categories:
            prompt += f"- {cat.name}: {cat.description}\n"
        
        prompt += "\nRespond with only the category name that best fits this appeal:"
        
        try:
            category_name = self.openai_service.generate_response(prompt).strip()
            
            # Find the matching category
            try:
                category = AppealCategory.objects.get(name__iexact=category_name, is_active=True)
                return category
            except AppealCategory.DoesNotExist:
                # If no exact match, find closest match
                for cat in categories:
                    if category_name.lower() in cat.name.lower() or cat.name.lower() in category_name.lower():
                        return cat
                return None
                
        except Exception as e:
            logger.warning(f"Error in AI categorization: {e}")
            return self._fallback_categorization(appeal)
    
    def _fallback_categorization(self, appeal):
        """
        Fallback method for categorizing appeals if AI fails.
        """
        # Simple keyword-based categorization as fallback
        title_desc = (appeal.title + " " + appeal.description).lower()
        
        # Define keyword mappings
        keyword_categories = {
            'education': ['school', 'university', 'student', 'teacher', 'education', 'learning'],
            'healthcare': ['hospital', 'doctor', 'medical', 'health', 'clinic', 'medicine'],
            'infrastructure': ['road', 'water', 'electricity', 'construction', 'building', 'infrastructure'],
            'economy': ['business', 'employment', 'job', 'economy', 'finance', 'work'],
            'social_affairs': ['family', 'child', 'elderly', 'social', 'community', 'support'],
            'environment': ['environment', 'pollution', 'waste', 'nature', 'park', 'green'],
            'law': ['law', 'legal', 'crime', 'police', 'court', 'rights'],
        }
        
        for category_name, keywords in keyword_categories.items():
            for keyword in keywords:
                if keyword in title_desc:
                    try:
                        return AppealCategory.objects.get(name__iexact=category_name, is_active=True)
                    except AppealCategory.DoesNotExist:
                        continue
        
        return None  # Return None if no category matches
    
    def get_appeals_for_deputy(self, deputy, status_filters=None, category_filters=None):
        """
        Get appeals assigned to a specific deputy with optional filters.
        """
        queryset = Appeal.objects.filter(assigned_deputy=deputy)
        
        if status_filters:
            queryset = queryset.filter(status__name__in=status_filters)
        
        if category_filters:
            queryset = queryset.filter(category__name__in=category_filters)
        
        return queryset.order_by('-submitted_at')
    
    def get_appeals_for_citizen(self, citizen, status_filters=None, category_filters=None):
        """
        Get appeals submitted by a specific citizen with optional filters.
        """
        queryset = Appeal.objects.filter(citizen=citizen)
        
        if status_filters:
            queryset = queryset.filter(status__name__in=status_filters)
        
        if category_filters:
            queryset = queryset.filter(category__name__in=category_filters)
        
        return queryset.order_by('-submitted_at')
    
    def search_appeals(self, query, user):
        """
        Search appeals based on a query string.
        """
        queryset = Appeal.objects.all()
        
        # Filter based on user type
        if user.user_type == 'citizen':
            citizen = user.citizen_profile
            queryset = queryset.filter(citizen=citizen)
        elif user.user_type == 'deputy':
            deputy = user.deputy_profile
            queryset = queryset.filter(assigned_deputy=deputy)
        
        # Apply search query
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query) | 
                Q(description__icontains=query) |
                Q(citizen__user__first_name__icontains=query) |
                Q(citizen__user__last_name__icontains=query)
            )
        
        return queryset.order_by('-submitted_at')
    
    def get_appeal_statistics(self, user):
        """
        Get statistics about appeals for a specific user.
        """
        stats = {}
        
        if user.user_type == 'citizen':
            citizen = user.citizen_profile
            total_appeals = Appeal.objects.filter(citizen=citizen).count()
            resolved_appeals = Appeal.objects.filter(citizen=citizen, status__in=['resolved', 'closed']).count()
            pending_appeals = Appeal.objects.filter(citizen=citizen, status='pending').count()

            stats = {
                'total_appeals': total_appeals,
                'resolved_appeals': resolved_appeals,
                'pending_appeals': pending_appeals,
                'resolution_rate': (resolved_appeals / total_appeals * 100) if total_appeals > 0 else 0
            }
        elif user.user_type == 'deputy':
            deputy = user.deputy_profile
            total_appeals = Appeal.objects.filter(deputy=deputy).count()
            resolved_appeals = Appeal.objects.filter(deputy=deputy, status__in=['resolved', 'closed']).count()
            pending_appeals = Appeal.objects.filter(deputy=deputy, status='pending').count()

            stats = {
                'total_appeals': total_appeals,
                'resolved_appeals': resolved_appeals,
                'pending_appeals': pending_appeals,
                'resolution_rate': (resolved_appeals / total_appeals * 100) if total_appeals > 0 else 0
            }
        
        return stats