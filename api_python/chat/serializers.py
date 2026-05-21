from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'sender_type', 'sender_id', 'content', 'is_read', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    class Meta:
        model = Conversation
        fields = '__all__'


class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField()


class StartConversationSerializer(serializers.Serializer):
    store_id = serializers.IntegerField()
    customer_name = serializers.CharField()
    message = serializers.CharField()
