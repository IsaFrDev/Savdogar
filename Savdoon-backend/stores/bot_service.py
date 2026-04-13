"""
Telegram Bot Service
Handles automatic bot creation and configuration for stores
"""
import requests
import logging
from django.conf import settings

logger = logging.getLogger('savdoon')


class BotService:
    """Service for managing Telegram bots"""
    
    BOT_API_BASE = "https://api.telegram.org/bot"
    
    @classmethod
    def make_request(cls, bot_token, method, data=None):
        """Make request to Telegram Bot API"""
        url = f"{cls.BOT_API_BASE}{bot_token}/{method}"
        try:
            response = requests.post(url, json=data, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Telegram API error: {e}")
            raise Exception(f"Telegram API request failed: {str(e)}")
    
    @classmethod
    def setup_store_bot(cls, store, bot_token):
        """
        Setup Telegram bot for a store
        This assumes the store owner has already created a bot via @BotFather
        and provided the token. We configure it automatically.
        """
        if not bot_token:
            raise Exception("Bot token is required")
        
        # Get bot info
        bot_info = cls.get_bot_info(bot_token)
        bot_username = bot_info['result']['username']
        
        # Set bot description
        cls.set_bot_description(bot_token, store.name, store.description)
        
        # Set menu button with Mini App
        mini_app_url = cls.get_mini_app_url(store)
        cls.set_menu_button(bot_token, mini_app_url, store.name)
        
        # Set webhook
        webhook_url = cls.get_webhook_url(store.id)
        cls.set_webhook(bot_token, webhook_url)
        
        # Set commands
        cls.set_bot_commands(bot_token)
        
        return {
            'username': bot_username,
            'mini_app_url': mini_app_url,
            'webhook_url': webhook_url
        }
    
    @classmethod
    def get_bot_info(cls, bot_token):
        """Get bot information"""
        return cls.make_request(bot_token, 'getMe')
    
    @classmethod
    def set_bot_description(cls, bot_token, store_name, description):
        """Set bot description"""
        cls.make_request(bot_token, 'setMyDescription', {
            'description': f"{store_name} - Savdoon do'koni"
        })
        cls.make_request(bot_token, 'setMyShortDescription', {
            'short_description': f"{store_name} online do'koni"
        })
    
    @classmethod
    def set_menu_button(cls, bot_token, mini_app_url, store_name):
        """Set menu button to open Mini App"""
        cls.make_request(bot_token, 'setChatMenuButton', {
            'menu_button': {
                'type': 'web_app',
                'text': f"{store_name} ochish",
                'web_app': {
                    'url': mini_app_url
                }
            }
        })
    
    @classmethod
    def set_webhook(cls, bot_token, webhook_url):
        """Set webhook URL (resilient to localhost/HTTP errors)"""
        # Telegram requires HTTPS for webhooks. In local dev (HTTP), this will fail.
        # We catch the error so it doesn't break the whole setup process.
        try:
            result = cls.make_request(bot_token, 'setWebhook', {
                'url': webhook_url,
                'allowed_updates': ['message', 'callback_query', 'inline_query'],
                'drop_pending_updates': True
            })
            logger.info(f"Webhook set for bot: {webhook_url}")
            return result
        except Exception as e:
            logger.warning(f"Failed to set webhook (Expected on HTTP/localhost): {e}")
            return {'ok': False, 'error': str(e)}
    
    @classmethod
    def delete_webhook(cls, bot_token):
        """Delete webhook"""
        return cls.make_request(bot_token, 'deleteWebhook')
    
    @classmethod
    def set_bot_commands(cls, bot_token):
        """Set default bot commands"""
        commands = [
            {'command': 'start', 'description': 'Mini App ochish'},
            {'command': 'help', 'description': 'Yordam'},
            {'command': 'orders', 'description': 'Buyurtmalarim'},
        ]
        cls.make_request(bot_token, 'setMyCommands', {
            'commands': commands
        })
    
    @classmethod
    def send_message(cls, bot_token, chat_id, text, reply_markup=None):
        """Send message to chat"""
        data = {
            'chat_id': chat_id,
            'text': text,
            'parse_mode': 'HTML'
        }
        if reply_markup:
            data['reply_markup'] = reply_markup
        
        return cls.make_request(bot_token, 'sendMessage', data)
    
    @classmethod
    def send_mini_app_button(cls, bot_token, chat_id, text, web_app_url, button_text="Do'konni ochish"):
        """Send message with Mini App button"""
        reply_markup = {
            'inline_keyboard': [[
                {
                    'text': button_text,
                    'web_app': {'url': web_app_url}
                }
            ]]
        }
        return cls.send_message(bot_token, chat_id, text, reply_markup)
    
    @classmethod
    def get_mini_app_url(cls, store):
        """Get Mini App URL for store"""
        # Use frontend URL from settings or construct it
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        return f"{frontend_url}/storefront/?storeId={store.id}&twa=true"
    
    @classmethod
    def get_webhook_url(cls, store_id):
        """Get webhook URL for store"""
        backend_url = getattr(settings, 'BACKEND_URL', 'http://localhost:8000')
        return f"{backend_url}/api/stores/telegram/webhook/{store_id}/"


# Singleton instance
bot_service = BotService()
