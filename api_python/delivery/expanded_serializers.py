"""
Delivery Expansion Serializers
"""
from rest_framework import serializers
from .expanded_models import (
    DeliveryZone, DeliveryProvider, DeliveryTimeSlot, 
    PickupPoint, DeliveryRoute, DeliveryPricing
)


class DeliveryZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryZone
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class DeliveryProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryProvider
        fields = '__all__'
        read_only_fields = ['created_at']


class DeliveryTimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryTimeSlot
        fields = '__all__'
        read_only_fields = ['created_at']


class PickupPointSerializer(serializers.ModelSerializer):
    is_open_now = serializers.ReadOnlyField()
    
    class Meta:
        model = PickupPoint
        fields = '__all__'
        read_only_fields = ['is_open_now', 'created_at', 'updated_at']


class DeliveryRouteSerializer(serializers.ModelSerializer):
    courier_name = serializers.CharField(source='courier.user.get_full_name', read_only=True)
    
    class Meta:
        model = DeliveryRoute
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class DeliveryPricingSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryPricing
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def calculate_delivery_price(self, validated_data):
        """Helper to calculate delivery price"""
        distance_km = validated_data.get('distance_km')
        weight_kg = validated_data.get('weight_kg')
        order_value = validated_data.get('order_value')
        
        return self.instance.calculate_price(distance_km, weight_kg, order_value)
