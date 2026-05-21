from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/stores/(?P<store_id>\d+)/$', consumers.StoreConsumer.as_asgi()),
    re_path(r'ws/store/(?P<store_id>\d+)/$', consumers.StoreConsumer.as_asgi()),
]
