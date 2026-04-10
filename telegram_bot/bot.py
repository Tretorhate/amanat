# bot.py - Simple Telegram Bot for Amanat Platform

import logging
import requests
import os
from dotenv import load_dotenv
from telegram import Update, ReplyKeyboardMarkup, ReplyKeyboardRemove, KeyboardButton
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ConversationHandler,
    ContextTypes,
    filters,
)

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Configuration
load_dotenv()
# bot.py - Simple Telegram Bot for Amanat Platform
# Configuration
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE')
API_URL = os.getenv('API_BASE_URL', 'http://digital-deputat-backend:8000/api')

# Conversation states
WAITING_FOR_PHONE = 1
WAITING_FOR_APPEAL_DESCRIPTION = 2

# ============================================
# Helper Functions - API Calls
# ============================================

def check_citizen_exists(telegram_user_id):
    """Check if citizen exists and has phone number"""
    try:
        response = requests.get(
            f'{API_URL}/citizens/check/',
            params={'telegram_user_id': telegram_user_id},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            return {
                'exists': data.get('exists', False),
                'has_phone': data.get('has_phone', False),
                'citizen': data.get('citizen')
            }
        return {'exists': False, 'has_phone': False, 'citizen': None}
    except Exception as e:
        logger.error(f"Error checking citizen: {e}")
        return {'exists': False, 'has_phone': False, 'citizen': None}


def register_citizen(telegram_user_id, telegram_chat_id, full_name, username, phone=None):
    """Register or update citizen with phone number"""
    try:
        response = requests.post(
            f'{API_URL}/citizens/register/',
            json={
                'telegram_user_id': telegram_user_id,
                'telegram_chat_id': telegram_chat_id,
                'full_name': full_name,
                'username': username,
                'phone': phone
            },
            timeout=10
        )
        if response.status_code in [200, 201]:
            return response.json()
        else:
            logger.error(f"Registration failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        logger.error(f"Error registering citizen: {e}")
        return None


def create_appeal(telegram_user_id, description):
    """Create new appeal via API"""
    try:
        response = requests.post(
            f'{API_URL}/appeals/create/',
            json={
                'telegram_user_id': telegram_user_id,
                'description': description
            },
            timeout=10
        )
        if response.status_code in [200, 201]:
            return response.json()
        else:
            logger.error(f"Appeal creation failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        logger.error(f"Error creating appeal: {e}")
        return None


def get_my_appeals(telegram_user_id):
    """Get user's appeals"""
    try:
        response = requests.get(
            f'{API_URL}/appeals/my-appeals/',
            params={'telegram_user_id': telegram_user_id},
            timeout=10
        )
        if response.status_code == 200:
            return response.json()
        else:
            return []
    except Exception as e:
        logger.error(f"Error getting appeals: {e}")
        return []


# ============================================
# Command Handlers
# ============================================

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    
    # Register user in backend (without phone initially)
    citizen = register_citizen(
        telegram_user_id=user.id,
        telegram_chat_id=update.effective_chat.id,
        full_name=user.full_name,
        username=user.username
    )
    
    welcome_message = f"""
👋 Добро пожаловать в платформу "Аманат"!

Здравствуйте, {user.first_name}!

Я помогу вам отправлять обращения вашему депутату.

📝 Доступные команды:

/appeal - Создать новое обращение
/myappeals - Посмотреть мои обращения
/help - Помощь
/cancel - Отменить текущее действие

Начните с команды /appeal чтобы создать обращение.
    """
    
    await update.message.reply_text(welcome_message)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command"""
    help_text = """
📚 Как пользоваться ботом:

1️⃣ *Создать обращение*
   Используйте /appeal и опишите вашу проблему

2️⃣ *Посмотреть обращения*
   Используйте /myappeals чтобы увидеть все ваши обращения

3️⃣ *Отменить*
   Используйте /cancel чтобы отменить текущее действие

💡 *Подсказки:*
- Описывайте проблему четко и подробно
- Укажите адрес или место проблемы
- Вы можете отправить до 10 сообщений по каждому обращению
- Депутат получит уведомление о вашем обращении

❓ Возникли вопросы? Напишите @amanat_support
    """
    
    await update.message.reply_text(help_text, parse_mode='Markdown')


async def my_appeals_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /myappeals command"""
    user = update.effective_user
    
    appeals = get_my_appeals(user.id)
    
    if not appeals:
        await update.message.reply_text(
            "У вас пока нет обращений.\n\n"
            "Создайте первое обращение командой /appeal"
        )
        return
    
    response = "📋 *Ваши обращения:*\n\n"
    
    status_emoji = {
        'pending': '🕐',
        'in_progress': '🔄',
        'resolved': '✅',
        'closed': '✔️',
        'rejected': '❌'
    }
    
    status_text = {
        'pending': 'Ожидает',
        'in_progress': 'В работе',
        'resolved': 'Решено',
        'closed': 'Закрыто',
        'rejected': 'Отклонено'
    }
    
    for i, appeal in enumerate(appeals[:10], 1):
        emoji = status_emoji.get(appeal.get('status'), '📄')
        status = status_text.get(appeal.get('status'), appeal.get('status'))
        
        response += f"{i}. {emoji} *{status}*\n"
        response += f"   _{appeal.get('description', '')[:60]}..._\n"
        response += f"   📅 {appeal.get('created_at', '')[:10]}\n"
        response += f"   💬 {appeal.get('message_count', 0)}/10 сообщений\n\n"
    
    await update.message.reply_text(response, parse_mode='Markdown')


# ============================================
# Appeal Creation Flow with Phone Check
# ============================================

async def appeal_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start appeal creation - check if user has phone number"""
    user = update.effective_user
    
    # Check if citizen exists and has phone
    citizen_check = check_citizen_exists(user.id)
    
    if not citizen_check['exists'] or not citizen_check['has_phone']:
        # User doesn't exist or doesn't have phone - request it
        contact_button = KeyboardButton(
            text="📱 Поделиться номером телефона",
            request_contact=True
        )
        reply_markup = ReplyKeyboardMarkup(
            [[contact_button]],
            resize_keyboard=True,
            one_time_keyboard=True
        )
        
        await update.message.reply_text(
            "📱 *Регистрация*\n\n"
            "Для создания обращения нам нужен ваш номер телефона.\n\n"
            "Это необходимо для:\n"
            "✅ Идентификации вашего обращения\n"
            "✅ Связи депутата с вами при необходимости\n"
            "✅ Отправки уведомлений\n\n"
            "Нажмите кнопку ниже, чтобы поделиться номером телефона.\n\n"
            "Или отправьте /cancel для отмены.",
            reply_markup=reply_markup,
            parse_mode='Markdown'
        )
        
        return WAITING_FOR_PHONE
    else:
        # User has phone, proceed to appeal description
        await update.message.reply_text(
            "📝 *Создание обращения*\n\n"
            "Опишите вашу проблему или обращение.\n"
            "Постарайтесь быть максимально конкретным:\n\n"
            "• Что случилось?\n"
            "• Где это произошло? (адрес)\n"
            "• Когда вы это заметили?\n\n"
            "Отправьте /cancel для отмены.",
            parse_mode='Markdown',
            reply_markup=ReplyKeyboardRemove()
        )
        
        return WAITING_FOR_APPEAL_DESCRIPTION


async def receive_phone(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Receive and save phone number"""
    user = update.effective_user
    
    # Check if contact was shared
    if not update.message.contact:
        await update.message.reply_text(
            "❌ Пожалуйста, используйте кнопку для отправки номера телефона.\n\n"
            "Или отправьте /cancel для отмены."
        )
        return WAITING_FOR_PHONE
    
    contact = update.message.contact
    
    # Verify that the contact is from the same user
    if contact.user_id != user.id:
        await update.message.reply_text(
            "❌ Пожалуйста, отправьте свой собственный номер телефона.\n\n"
            "Или отправьте /cancel для отмены."
        )
        return WAITING_FOR_PHONE
    
    phone_number = contact.phone_number
    
    # Register/update citizen with phone number
    citizen = register_citizen(
        telegram_user_id=user.id,
        telegram_chat_id=update.effective_chat.id,
        full_name=user.full_name,
        username=user.username,
        phone=phone_number
    )
    
    if citizen:
        await update.message.reply_text(
            f"✅ Спасибо! Номер телефон сохранен: {phone_number}\n\n"
            "Теперь опишите вашу проблему или обращение.\n"
            "Постарайтесь быть максимально конкретным:\n\n"
            "• Что случилось?\n"
            "• Где это произошло? (адрес)\n"
            "• Когда вы это заметили?\n\n"
            "Отправьте /cancel для отмены.",
            reply_markup=ReplyKeyboardRemove()
        )
        return WAITING_FOR_APPEAL_DESCRIPTION
    else:
        await update.message.reply_text(
            "❌ Произошла ошибка при сохранении данных.\n"
            "Пожалуйста, попробуйте позже или обратитесь в поддержку.\n\n"
            "/appeal - попробовать снова",
            reply_markup=ReplyKeyboardRemove()
        )
        return ConversationHandler.END


async def appeal_receive_description(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Receive appeal description and create appeal"""
    user = update.effective_user
    description = update.message.text
    
    # Send "processing" message
    processing_msg = await update.message.reply_text(
        "⏳ Обрабатываю ваше обращение...\n"
        "AI анализирует категорию..."
    )
    
    # Create appeal via API
    appeal = create_appeal(
        telegram_user_id=user.id,
        description=description
    )
    
    if appeal:
        # Delete processing message
        await processing_msg.delete()
        
        # Get category in Russian
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
        
        category = category_map.get(appeal.get('category', 'other'), 'Другое')
        
        success_message = f"""
✅ *Обращение успешно создано!*

📋 *Номер:* #{appeal.get('id', '')[:8]}
📁 *Категория:* {category}
📊 *Статус:* Ожидает рассмотрения

Ваш депутат получил уведомление и скоро ответит.
Вы получите уведомление, когда появится ответ.

Посмотреть все обращения: /myappeals
        """
        
        await update.message.reply_text(success_message, parse_mode='Markdown')
    else:
        await update.message.reply_text(
            "❌ Произошла ошибка при создании обращения.\n"
            "Пожалуйста, попробуйте позже или обратитесь в поддержку."
        )
    
    return ConversationHandler.END


async def cancel_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancel current operation"""
    await update.message.reply_text(
        "❌ Действие отменено.\n\n"
        "Используйте /help для просмотра доступных команд.",
        reply_markup=ReplyKeyboardRemove()
    )
    
    return ConversationHandler.END


# ============================================
# Helper Functions - Message Handling
# ============================================

def send_message_to_deputy(telegram_user_id, message_text, message_count):
    """Send message notification to deputy via API"""
    try:
        response = requests.post(
            f'{API_URL}/chat/send_message_to_deputy/',
            json={
                'citizen_telegram_id': telegram_user_id,
                'message_text': message_text,
                'message_count': message_count
            },
            timeout=10
        )
        if response.status_code in [200, 201]:
            return response.json()
        else:
            logger.error(f"Sending message to deputy failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        logger.error(f"Error sending message to deputy: {e}")
        return None


# ============================================
# Message Handler for Citizen Responses
# ============================================

async def handle_citizen_response(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle citizen responses to deputy messages"""
    user = update.effective_user
    message_text = update.message.text
    
    # Skip if it's a command
    if message_text.startswith('/'):
        return
    
    # Find active appeal where last message was from deputy
    try:
        response = requests.get(
            f'{API_URL}/citizens/{user.id}/active_appeal_for_response/',
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            appeal = data.get('appeal')
            
            if not appeal:
                await update.message.reply_text(
                    "❌ Нет активного диалога с депутатом."
                )
                return
            
            # Check message limit
            message_count = appeal.get('message_count', 0)
            if message_count >= 10:
                await update.message.reply_text(
                    "❌ Лимит сообщений исчерпан (10/10)."
                )
                return
            
            # Send message to deputy via API
            result = send_message_to_deputy(
                user.id,
                message_text,
                message_count + 1
            )
            
            if result:
                await update.message.reply_text(
                    f"✅ Сообщение отправлено депутату."
                )
            else:
                await update.message.reply_text(
                    f"❌ Не удалось отправить сообщение депутату."
                )
        else:
            await update.message.reply_text(
                "❌ Нет активного диалога с депутатом."
            )
    except Exception as e:
        logger.error(f"Error handling citizen response: {e}")
        await update.message.reply_text(
            "❌ Произошла ошибка при отправке сообщения."
        )


# ============================================
# Main Function
# ============================================

def main():
    """Start the bot"""
    # Create application
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    # Add command handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("myappeals", my_appeals_command))
    
    # Appeal creation conversation with phone verification
    appeal_conv_handler = ConversationHandler(
        entry_points=[CommandHandler("appeal", appeal_start)],
        states={
            WAITING_FOR_PHONE: [
                MessageHandler(filters.CONTACT, receive_phone),
                MessageHandler(filters.TEXT & ~filters.COMMAND, receive_phone)
            ],
            WAITING_FOR_APPEAL_DESCRIPTION: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, appeal_receive_description)
            ],
        },
        fallbacks=[CommandHandler("cancel", cancel_command)],
    )
    
    application.add_handler(appeal_conv_handler)
    
    # Add message handler for citizen responses
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_citizen_response))
    
    # Start bot
    logger.info("Bot started!")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == '__main__':
    main()