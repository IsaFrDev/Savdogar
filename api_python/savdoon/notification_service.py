import requests
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    def send_telegram_message(bot_token, chat_id, message, reply_markup=None):
        if not bot_token or not chat_id: return False
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        data = {"chat_id": chat_id, "text": message, "parse_mode": "HTML"}
        if reply_markup:
            import json
            data["reply_markup"] = json.dumps(reply_markup)
        try:
            requests.post(url, data=data, timeout=10)
            return True
        except Exception: return False

    @classmethod
    def notify_new_order(cls, order):
        store = order.store
        if not store.telegram_bot_token or not store.telegram_chat_id: return False
        message = f"🛍 <b>Yangi Buyurtma!</b>\nID: #{order.id}\nMijoz: {order.customer_name}\nJami: {order.total:,.0f} UZS"
        return cls.send_telegram_message(store.telegram_bot_token, store.telegram_chat_id, message)

notification_service = NotificationService()
