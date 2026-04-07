from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusHistory


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'variant', 'product_name', 'product_price', 'quantity', 'subtotal']


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    order_number = serializers.ReadOnlyField()
    
    class Meta:
        model = Order
        fields = '__all__'


class OrderCreateSerializer(serializers.Serializer):
    store_id = serializers.IntegerField()
    customer_name = serializers.CharField()
    customer_phone = serializers.CharField()
    delivery_type = serializers.ChoiceField(choices=['pickup', 'delivery'])
    items = serializers.ListField(child=serializers.DictField())


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.CharField()
    note = serializers.CharField(required=False, allow_blank=True)


class CancelOrderSerializer(serializers.Serializer):
    reason = serializers.CharField()


class OrderAssignCourierSerializer(serializers.Serializer):
    courier_id = serializers.IntegerField()
