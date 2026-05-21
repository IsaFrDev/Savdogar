import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
import jwt
from django.conf import settings
from orders.models import Order

class OrderTrackingConsumer(AsyncWebsocketConsumer):
    """
    Real-time order tracking WebSocket consumer.
    
    Usage:
    - Customer: ws://host/ws/orders/customer/
    - Store: ws://host/ws/orders/store/{store_id}/
    - Specific order: ws://host/ws/orders/{order_id}/
    """
    
    async def connect(self):
        self.order_id = self.scope['url_route']['kwargs'].get('order_id')
        self.store_id = self.scope['url_route']['kwargs'].get('store_id')
        self.user = self.scope.get('user', AnonymousUser())
        
        # Get user from token (for anonymous WebSocket)
        if self.user.is_anonymous:
            query_string = self.scope['query_string'].decode()
            token = self._get_token_from_query(query_string)
            if token:
                self.user = await self._get_user_from_token(token)
        
        # Join appropriate groups
        self.groups = []
        
        if self.order_id:
            # Track specific order
            self.order_group = f"order_{self.order_id}"
            await self.channel_layer.group_add(self.order_group, self.channel_name)
            self.groups.append(self.order_group)
        
        if self.store_id:
            # Store admin - track all orders for this store
            self.store_group = f"store_orders_{self.store_id}"
            await self.channel_layer.group_add(self.store_group, self.channel_name)
            self.groups.append(self.store_group)
        
        if not self.order_id and not self.store_id:
            # Customer - track all their orders
            if not self.user.is_anonymous:
                self.customer_group = f"customer_orders_{self.user.id}"
                await self.channel_layer.group_add(self.customer_group, self.channel_name)
                self.groups.append(self.customer_group)
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to order tracking'
        }))
    
    async def disconnect(self, close_code):
        # Leave all groups
        for group in self.groups:
            await self.channel_layer.group_discard(group, self.channel_name)
    
    async def receive(self, text_data):
        """Receive message from WebSocket"""
        try:
            data = json.loads(text_data)
            action = data.get('action')
            
            if action == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
            
        except json.JSONDecodeError:
            pass
    
    # Receive message from group
    async def order_status_update(self, event):
        """Handle order status update events"""
        await self.send(text_data=json.dumps({
            'type': 'order_status_update',
            'order_id': event['order_id'],
            'status': event['status'],
            'status_label': event.get('status_label', ''),
            'message': event.get('message', ''),
            'timestamp': event.get('timestamp', ''),
            'data': event.get('data', {})
        }))
    
    async def order_created(self, event):
        """Handle new order created events"""
        await self.send(text_data=json.dumps({
            'type': 'order_created',
            'order_id': event['order_id'],
            'order_number': event.get('order_number', ''),
            'status': event['status'],
            'total': event.get('total', 0),
            'message': event.get('message', 'Yangi buyurtma!'),
            'timestamp': event.get('timestamp', ''),
            'data': event.get('data', {})
        }))
    
    async def order_cancelled(self, event):
        """Handle order cancelled events"""
        await self.send(text_data=json.dumps({
            'type': 'order_cancelled',
            'order_id': event['order_id'],
            'reason': event.get('reason', ''),
            'message': event.get('message', 'Buyurtma bekor qilindi'),
            'timestamp': event.get('timestamp', ''),
            'data': event.get('data', {})
        }))
    
    # Helper methods
    def _get_token_from_query(self, query_string):
        """Extract token from query string"""
        if 'token=' in query_string:
            return query_string.split('token=')[1].split('&')[0]
        return None
    
    @database_sync_to_async
    def _get_user_from_token(self, token):
        """Get user from JWT token"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            from django.contrib.auth import get_user_model
            User = get_user_model()
            return User.objects.get(id=payload.get('user_id'))
        except:
            return AnonymousUser()
