"""
Telegram Webhook Handler
Handles incoming webhook requests from Telegram
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import HttpResponse
import logging

from stores.models import Store
from stores.bot_service import bot_service

logger = logging.getLogger('savdoon')


@api_view(['POST'])
@permission_classes([AllowAny])
def telegram_webhook(request, store_id):
    """
    Handle Telegram webhook for a specific store
    This endpoint receives updates from Telegram Bot API
    """
    try:
        store = Store.objects.get(id=store_id)
    except Store.DoesNotExist:
        logger.warning(f"Webhook received for non-existent store: {store_id}")
        return Response({'status': 'error', 'message': 'Store not found'}, status=404)
    
    if not store.telegram_bot_token:
        logger.warning(f"Webhook received but store {store_id} has no bot token")
        return Response({'status': 'error', 'message': 'Bot not configured'}, status=400)
    
    update = request.data
    logger.info(f"Webhook received from store {store_id}: {update.get('update_id')}")
    
    # Handle different update types
    if 'message' in update:
        return handle_message(update['message'], store)
    elif 'callback_query' in update:
        return handle_callback_query(update['callback_query'], store)
    elif 'inline_query' in update:
        return handle_inline_query(update['inline_query'], store)
    
    return Response({'status': 'ok'})


def handle_message(message, store):
    """Handle incoming message"""
    chat_id = message.get('chat', {}).get('id')
    text = message.get('text', '').lower()
    
    if not chat_id:
        return Response({'status': 'error', 'message': 'No chat_id'})
    
    # Handle commands
    if text == '/start':
        return handle_start_command(chat_id, store)
    elif text == '/help':
        return handle_help_command(chat_id, store)
    elif text == '/orders':
        return handle_orders_command(chat_id, store)
    
    # Default: Send Mini App button
    mini_app_url = bot_service.get_mini_app_url(store)
    bot_service.send_mini_app_button(
        store.telegram_bot_token,
        chat_id,
        f"🛍 <b>{store.name}</b> ga xush kelibsiz!\n\nDo'konimizni ko'rish uchun tugmani bosing:",
        mini_app_url,
        f"{store.name} ochish"
    )
    
    return Response({'status': 'ok'})


def handle_start_command(chat_id, store):
    """Handle /start command"""
    mini_app_url = bot_service.get_mini_app_url(store)
    
    welcome_text = f"""
🛍 <b>{store.name}</b> ga xush kelibsiz!

Sizning sevimli do'koningiz endi Telegram'da!

✨ <b>Imkoniyatlar:</b>
• Mahsulotlarni ko'rish
• Buyurtma berish
• Chegirmalar va aksiyalar
• Tezkor yetkazib berish

Do'konni ochish uchun pastdagi tugmani bosing! 👇
    """.strip()
    
    bot_service.send_mini_app_button(
        store.telegram_bot_token,
        chat_id,
        welcome_text,
        mini_app_url,
        "🛒 Do'konni ochish"
    )
    
    return Response({'status': 'ok'})


def handle_help_command(chat_id, store):
    """Handle /help command"""
    help_text = f"""
📱 <b>{store.name} - Yordam</b>

<b>Buyurtma berish:</b>
1. "Do'konni ochish" tugmasini bosing
2. Mahsulotlarni ko'ring va savatga qo'shing
3. Buyurtma bering

<b>Bog'lanish:</b>
• Telefon: {store.phone or "Ko'rsatilmagan"}
• Telegram: {store.telegram_channel or "Ko'rsatilmagan"}

<b>Buyurtma holatini tekshirish:</b>
/orders komandasini yuboring
    """.strip()
    
    bot_service.send_message(
        store.telegram_bot_token,
        chat_id,
        help_text
    )
    
    return Response({'status': 'ok'})


def handle_orders_command(chat_id, store):
    """Handle /orders command"""
    # Get user's orders (simplified - in production, link Telegram user to orders)
    from orders.models import Order
    
    # This is a placeholder - you'd need to link Telegram user_id to orders
    orders = Order.objects.filter(store=store).order_by('-created_at')[:5]
    
    if not orders:
        bot_service.send_message(
            store.telegram_bot_token,
            chat_id,
            "📦 Sizda hali buyurtmalar yo'q.\n\nDo'konimizdan birinchi buyurtmangizni qiling!"
        )
    else:
        orders_text = "📦 <b>Sizning buyurtmalaringiz:</b>\n\n"
        for order in orders:
            status_emoji = {
                'pending': '⏳',
                'confirmed': '✅',
                'processing': '🔄',
                'shipped': '🚚',
                'delivered': '✓',
                'cancelled': '❌'
            }.get(order.status, '📦')
            
            orders_text += f"{status_emoji} <b>#{order.id}</b> - {order.total:,.0f} UZS\n"
            orders_text += f"Holat: {order.get_status_display()}\n\n"
        
        bot_service.send_message(
            store.telegram_bot_token,
            chat_id,
            orders_text
        )
    
    return Response({'status': 'ok'})


def handle_callback_query(callback_query, store):
    """Handle inline button callback"""
    chat_id = callback_query.get('message', {}).get('chat', {}).get('id')
    data = callback_query.get('data', '')
    
    if not chat_id:
        return Response({'status': 'error'})
    
    # Handle different callbacks
    if data.startswith('order_'):
        order_id = data.replace('order_', '')
        # Handle order status check
        pass
    elif data == 'open_store':
        mini_app_url = bot_service.get_mini_app_url(store)
        bot_service.send_mini_app_button(
            store.telegram_bot_token,
            chat_id,
            "Do'kon ochilmoqda...",
            mini_app_url
        )
    
    # Answer callback query
    bot_service.make_request(
        store.telegram_bot_token,
        'answerCallbackQuery',
        {'callback_query_id': callback_query['id']}
    )
    
    return Response({'status': 'ok'})


def handle_inline_query(inline_query, store):
    """Handle inline query (search products)"""
    query = inline_query.get('query', '')
    query_id = inline_query.get('id')
    
    if not query_id:
        return Response({'status': 'error'})
    
    # Search products (simplified)
    from products.models import Product
    
    products = Product.objects.filter(
        store=store,
        is_active=True,
        name__icontains=query
    )[:10]
    
    results = []
    for product in products:
        results.append({
            'type': 'article',
            'id': str(product.id),
            'title': product.name,
            'description': f"{product.price:,.0f} UZS",
            'input_message_content': {
                'message_text': f"🛍 {product.name}\n💰 Narxi: {product.price:,.0f} UZS\n\nMini App'dan buyurtma bering!"
            }
        })
    
    bot_service.make_request(
        store.telegram_bot_token,
        'answerInlineQuery',
        {
            'inline_query_id': query_id,
            'results': results
        }
    )
    
    return Response({'status': 'ok'})
