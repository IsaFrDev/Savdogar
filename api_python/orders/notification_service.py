from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone
import json

class OrderNotificationService:
    """
    Real-time order notifications via WebSocket.
    Sends updates to customers and stores instantly.
    """
    
    @staticmethod
    def notify_order_status_change(order_id, new_status, status_label, message, order=None):
        """
        Notify when order status changes.
        Sends to:
        - Customer who made the order
        - Store that received the order
        - Specific order tracking group
        """
        channel_layer = get_channel_layer()
        
        event = {
            'type': 'order_status_update',
            'order_id': order_id,
            'status': new_status,
            'status_label': status_label,
            'message': message,
            'timestamp': timezone.now().isoformat(),
            'data': {
                'order_number': order.order_number if order else f'#{order_id}',
            }
        }
        
        # Send to specific order group
        async_to_sync(channel_layer.group_send)(
            f'order_{order_id}',
            event
        )
        
        # Send to customer's group
        if order and order.customer:
            async_to_sync(channel_layer.group_send)(
                f'customer_orders_{order.customer.id}',
                event
            )
        
        # Send to store's group (Admin Dashboard)
        if order and order.store_id:
            async_to_sync(channel_layer.group_send)(
                f'store_{order.store_id}',
                {
                    'type': 'store_event',
                    'message': event
                }
            )
    
    @staticmethod
    def notify_order_created(order):
        """
        Notify when new order is created.
        Sends to store admin.
        """
        channel_layer = get_channel_layer()
        
        event = {
            'type': 'order_created',
            'order_id': order.id,
            'order_number': order.order_number,
            'status': order.status,
            'total': float(order.total_amount) if hasattr(order, 'total_amount') else 0,
            'message': f'Yangi buyurtma #{order.order_number}!',
            'timestamp': timezone.now().isoformat(),
            'data': {
                'customer_name': order.customer.get_full_name() if hasattr(order, 'customer') and order.customer else 'Anonymous',
                'items_count': order.items.count() if hasattr(order, 'items') else 0,
            }
        }
        
        # Send to store (Admin Dashboard)
        if order.store_id:
            async_to_sync(channel_layer.group_send)(
                f'store_{order.store_id}',
                {
                    'type': 'store_event',
                    'message': event
                }
            )
    
    @staticmethod
    def notify_order_cancelled(order, reason=''):
        """
        Notify when order is cancelled.
        Sends to both customer and store.
        """
        channel_layer = get_channel_layer()
        
        event = {
            'type': 'order_cancelled',
            'order_id': order.id,
            'reason': reason,
            'message': f'Buyurtma #{order.order_number} bekor qilindi',
            'timestamp': timezone.now().isoformat(),
            'data': {}
        }
        
        # Send to customer
        if order.customer:
            async_to_sync(channel_layer.group_send)(
                f'customer_orders_{order.customer.id}',
                event
            )
        
        # Send to store (Admin Dashboard)
        if order.store_id:
            async_to_sync(channel_layer.group_send)(
                f'store_{order.store_id}',
                {
                    'type': 'store_event',
                    'message': event
                }
            )
    
    @staticmethod
    def notify_all_order_statuses(order):
        """
        Send all status updates for an order (useful for reconnection).
        """
        statuses = [
            ('pending', 'Kutilmoqda', 'Buyurtma qabul qilindi'),
            ('confirmed', 'Tasdiqlandi', 'Do\'kon buyurtmani tasdiqladi'),
            ('preparing', 'Tayyorlanmoqda', 'Buyurtma tayyorlanmoqda'),
            ('shipped', 'Yo\'lda', 'Buyurtma yo\'lda'),
            ('delivered', 'Yetkazildi', 'Buyurtma muvaffaqiyatli yetkazildi'),
        ]
        
        for status, label, msg in statuses:
            # In real scenario, you'd only send actual status history
            # This is just for demo
            pass
