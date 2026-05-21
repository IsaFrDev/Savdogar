from rest_framework import serializers
from .models import (
    PaymentGateway, PaymentTransaction,
    MarketplaceIntegration, MarketplaceProduct, MarketplaceOrder,
    DeliveryIntegration, DeliveryRequest
)


class PaymentGatewaySerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentGateway
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = '__all__'
        read_only_fields = ['transaction_id', 'created_at', 'updated_at']


class MarketplaceIntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketplaceIntegration
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'last_sync_at']


class MarketplaceProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketplaceProduct
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class MarketplaceOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketplaceOrder
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class DeliveryIntegrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryIntegration
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class DeliveryRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryRequest
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
