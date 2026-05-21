from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Track specific order
    re_path(r'ws/orders/(?P<order_id>\d+)/$', consumers.OrderTrackingConsumer.as_asgi()),
    # Track all orders for a store
    re_path(r'ws/orders/store/(?P<store_id>\d+)/$', consumers.OrderTrackingConsumer.as_asgi()),
    # Track customer's orders (requires authentication)
    re_path(r'ws/orders/customer/$', consumers.OrderTrackingConsumer.as_asgi()),
]
