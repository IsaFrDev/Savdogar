from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet, start_conversation, get_conversation, send_customer_message, poll_messages

router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='chat-conversations')

urlpatterns = [
    path('start/', start_conversation, name='start-chat'),
    path('get/', get_conversation, name='get-chat'),
    path('send/', send_customer_message, name='send-customer-message'),
    path('poll/', poll_messages, name='poll-chat'),
    path('', include(router.urls)),
]
