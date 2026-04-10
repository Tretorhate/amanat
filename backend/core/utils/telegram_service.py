import requests
from django.conf import settings as django_settings
import logging


import json

logger = logging.getLogger(__name__)

WEBAPP_BASE_URL = 'https://digital-deputat.birqadam.kz/ru/deputy/appeals'


class TelegramService:
    """
    Service class for interacting with Telegram Bot API.
    """
    
    def __init__(self):
        self.bot_token = getattr(django_settings, 'TELEGRAM_BOT_TOKEN', None)
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}" if self.bot_token else None
    
    def send_message(self, chat_id, text, parse_mode=None, reply_markup=None):
        """
        Send a message to a Telegram chat.
        """
        if not self.bot_token:
            logger.error("Telegram bot token not configured")
            return None
        
        url = f"{self.base_url}/sendMessage"
        payload = {
            'chat_id': chat_id,
            'text': text
        }
        
        if parse_mode:
            payload['parse_mode'] = parse_mode
        if reply_markup:
            payload['reply_markup'] = reply_markup
        
        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error sending Telegram message: {str(e)}")
            return None
    
    def send_notification_to_user(self, telegram_id, message):
        """
        Send a notification to a specific user via Telegram.
        """
        return self.send_message(chat_id=telegram_id, text=message)
    
    def send_bulk_notifications(self, telegram_ids, message):
        """
        Send the same message to multiple Telegram users.
        """
        results = []
        for tg_id in telegram_ids:
            result = self.send_message(chat_id=tg_id, text=message)
            results.append(result)
        return results
    
    def get_bot_info(self):
        """
        Get information about the bot.
        """
        if not self.bot_token:
            logger.error("Telegram bot token not configured")
            return None
        
        url = f"{self.base_url}/getMe"
        try:
            response = requests.get(url)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting bot info: {str(e)}")
            return None
    
    def get_updates(self, offset=None, limit=None, timeout=None):
        """
        Get updates for the bot.
        """
        if not self.bot_token:
            logger.error("Telegram bot token not configured")
            return None
        
        url = f"{self.base_url}/getUpdates"
        params = {}
        if offset:
            params['offset'] = offset
        if limit:
            params['limit'] = limit
        if timeout:
            params['timeout'] = timeout
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting updates: {str(e)}")
            return None
    
    def set_webhook(self, webhook_url):
        """
        Set a webhook for the bot.
        """
        if not self.bot_token:
            logger.error("Telegram bot token not configured")
            return None
        
        url = f"{self.base_url}/setWebhook"
        payload = {'url': webhook_url}
        
        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error setting webhook: {str(e)}")
            return None
    
    def notify_deputy_new_appeal(self, chat_id, appeal):
        """Notify deputy about new appeal with WebApp button"""
        category_map = {
            'infrastructure': 'Инфраструктура',
            'safety': 'Безопасность',
            'healthcare': 'Здравоохранение',
            'education': 'Образование',
            'environment': 'Экология',
            'transport': 'Транспорт',
            'housing': 'ЖКХ',
            'utilities': 'Коммунальные услуги',
            'social_services': 'Социальные услуги',
            'other': 'Другое'
        }

        category = category_map.get(appeal.category, 'Другое')

        message = f"""🔔 *Новое обращение!*

От: {appeal.citizen.full_name}
📱 Телефон: {appeal.citizen.phone}
📁 Категория: {category}
📊 Статус: Ожидает рассмотрения

📝 Описание:
{appeal.description[:300]}{'...' if len(appeal.description) > 300 else ''}"""

        reply_markup = {
            'inline_keyboard': [[{
                'text': '📋 Открыть обращение',
                'web_app': {'url': f'{WEBAPP_BASE_URL}/{appeal.id}'}
            }]]
        }

        return self.send_message(chat_id, message, parse_mode='Markdown', reply_markup=reply_markup)

    def notify_status_change(self, chat_id, appeal, old_status, new_status):
        """Notify citizen about appeal status change"""
        status_map = {
            'pending': '🕐 Ожидает рассмотрения',
            'in_progress': '🔄 В работе',
            'resolved': '✅ Решено',
            'closed': '✔️ Закрыто',
            'rejected': '❌ Отклонено'
        }
        
        old_status_text = status_map.get(old_status, old_status)
        new_status_text = status_map.get(new_status, new_status)
        
        message = f"""
🔔 *Изменение статуса обращения*

📋 Обращение: {appeal.title or 'Обращение #' + str(appeal.id)[:8]}

Статус изменен:
{old_status_text} → {new_status_text}

💬 Сообщений: {appeal.message_count}/{django_settings.APPEAL_MESSAGE_LIMIT}

Посмотреть детали: /myappeals
        """
        
        return self.send_message(chat_id, message, parse_mode='Markdown')
    
    def notify_citizen_new_message(self, chat_id, appeal, message):
        """Notify citizen about deputy's response"""
        # Handle both string messages and message objects
        message_content = message.content if hasattr(message, 'content') else message
        
        text = f"""
💬 *Новое сообщение от депутата*

📋 По обращению: {appeal.title or 'Обращение #' + str(appeal.id)[:8]}

{message_content}

💬 Сообщений: {appeal.message_count}/{django_settings.APPEAL_MESSAGE_LIMIT}

Чтобы ответить депутату, просто напишите сообщение в этот чат.
        """
        
        return self.send_message(chat_id, text, parse_mode='Markdown')
    
    def notify_deputy_new_message(self, chat_id, appeal, message):
        """Notify deputy about new message from citizen with WebApp button"""
        message_content = message.content if hasattr(message, 'content') else message

        appeal_title = appeal.title or 'Обращение #' + str(appeal.id)[:8]

        text = f"""💬 *Новое сообщение от гражданина*

📋 По обращению: {appeal_title}

{message_content[:300]}{'...' if len(str(message_content)) > 300 else ''}

💬 Сообщений: {appeal.message_count}/{django_settings.APPEAL_MESSAGE_LIMIT}"""

        reply_markup = {
            'inline_keyboard': [[{
                'text': '📋 Открыть обращение',
                'web_app': {'url': f'{WEBAPP_BASE_URL}/{appeal.id}'}
            }]]
        }

        return self.send_message(chat_id, text, parse_mode='Markdown', reply_markup=reply_markup)

    def send_daily_summary(self, telegram_chat_id, pending_count):
        """
        Send daily summary to deputy
        """
        message = f"Добрый день! У вас {pending_count} нерассмотренных обращений на данный момент."
        return self.send_message(chat_id=telegram_chat_id, text=message)