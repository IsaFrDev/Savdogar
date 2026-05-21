import uuid
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer, SendMessageSerializer, StartConversationSerializer
from stores.models import Store


from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(store__owner=user)
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        conv = self.get_object()
        serializer = SendMessageSerializer(data=request.data)
        if serializer.is_valid():
            msg = Message.objects.create(
                conversation=conv, sender_type='store', sender_id=request.user.id,
                content=serializer.validated_data['content']
            )
            conv.save()
            
            # Broadcast to Customer Chat WebSocket
            channel_layer = get_channel_layer()
            data = MessageSerializer(msg).data
            data['type'] = 'message' # Customer hook expects this
            
            async_to_sync(channel_layer.group_send)(
                f'chat_{conv.id}',
                {
                    'type': 'chat_message',
                    'message': data
                }
            )
            
            # Also broadcast to Store WebSocket (to update last message/unread in Dashboard)
            async_to_sync(channel_layer.group_send)(
                f'store_{conv.store.id}',
                {
                    'type': 'store_event',
                    'message': {
                        'type': 'chat_event',
                        'event': 'new_message',
                        'conversation_id': conv.id,
                        'message': MessageSerializer(msg).data
                    }
                }
            )
            
            return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        conv = self.get_object()
        conv.messages.filter(sender_type='customer', is_read=False).update(is_read=True)
        return Response({'status': 'messages marked as read'})


@api_view(['POST'])
@permission_classes([AllowAny])
def start_conversation(request):
    serializer = StartConversationSerializer(data=request.data)
    if serializer.is_valid():
        store = get_object_or_404(Store, id=serializer.validated_data['store_id'])
        session_id = request.data.get('session_id') or str(uuid.uuid4())
        
        # Check for existing active conversation with this session_id
        is_new = False
        conv = Conversation.objects.filter(customer_session_id=session_id, store=store).first()
        
        if not conv:
            conv = Conversation.objects.create(
                store=store, 
                customer_session_id=session_id,
                customer_name=serializer.validated_data['customer_name']
            )
            is_new = True
        
        msg = Message.objects.create(
            conversation=conv, 
            sender_type='customer', 
            content=serializer.validated_data['message']
        )
        conv.save() # Update updated_at
        
        channel_layer = get_channel_layer()
        # Broadcast to Customer Chat
        data = MessageSerializer(msg).data
        data['type'] = 'message'
        async_to_sync(channel_layer.group_send)(
            f'chat_{conv.id}',
            {
                'type': 'chat_message',
                'message': data
            }
        )
        
        # Broadcast to Store
        if is_new:
            # New conversation event
            async_to_sync(channel_layer.group_send)(
                f'store_{store.id}',
                {
                    'type': 'store_event',
                    'message': {
                        'type': 'chat_event',
                        'event': 'new_conversation',
                        'conversation': ConversationSerializer(conv).data
                    }
                }
            )
        else:
            # Existing conversation new message event
            async_to_sync(channel_layer.group_send)(
                f'store_{store.id}',
                {
                    'type': 'store_event',
                    'message': {
                        'type': 'chat_event',
                        'event': 'new_message',
                        'conversation_id': conv.id,
                        'message': MessageSerializer(msg).data
                    }
                }
            )
        
        return Response({'conversation': ConversationSerializer(conv).data, 'session_id': session_id}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_conversation(request):
    store_id = request.query_params.get('store_id')
    session_id = request.query_params.get('session_id')
    if not store_id or not session_id:
        return Response({'error': 'Missing parameters'}, status=status.HTTP_400_BAD_REQUEST)
    
    conv = get_object_or_404(Conversation, store_id=store_id, customer_session_id=session_id)
    return Response({'conversation': ConversationSerializer(conv).data})


@api_view(['POST'])
@permission_classes([AllowAny])
def send_customer_message(request):
    session_id = request.data.get('session_id')
    content = request.data.get('content')
    if not session_id or not content:
        return Response({'error': 'Missing parameters'}, status=status.HTTP_400_BAD_REQUEST)
    
    conv = get_object_or_404(Conversation, customer_session_id=session_id)
    msg = Message.objects.create(conversation=conv, sender_type='customer', content=content)
    conv.save() # Update updated_at
    
    # Broadcast to Customer Chat WebSocket
    channel_layer = get_channel_layer()
    data = MessageSerializer(msg).data
    data['type'] = 'message'
    
    async_to_sync(channel_layer.group_send)(
        f'chat_{conv.id}',
        {
            'type': 'chat_message',
            'message': data
        }
    )
    
    # Broadcast to Store WebSocket
    async_to_sync(channel_layer.group_send)(
        f'store_{conv.store.id}',
        {
            'type': 'store_event',
            'message': {
                'type': 'chat_event',
                'event': 'new_message',
                'conversation_id': conv.id,
                'message': MessageSerializer(msg).data
            }
        }
    )
    
    return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def poll_messages(request):
    session_id = request.query_params.get('session_id')
    last_id = request.query_params.get('last_message_id', 0)
    if not session_id:
        return Response({'error': 'Missing session_id'}, status=status.HTTP_400_BAD_REQUEST)
    
    conv = get_object_or_404(Conversation, customer_session_id=session_id)
    messages = conv.messages.filter(id__gt=last_id)
    return Response({'messages': MessageSerializer(messages, many=True).data})
