import json
from channels.generic.websocket import AsyncWebsocketConsumer

class StoreConsumer(AsyncWebsocketConsumer):
    async def range_group_name(self, store_id):
        return f"store_{store_id}"

    async def connect(self):
        self.store_id = self.scope['url_route']['kwargs']['store_id']
        self.store_group_name = f"store_{self.store_id}"

        # Join store group
        await self.channel_layer.group_add(
            self.store_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave store group
        await self.channel_layer.group_discard(
            self.store_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            # Handle messages from client if needed
        except json.JSONDecodeError:
            pass

    # Receive message from group
    async def store_event(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps(event['message']))
