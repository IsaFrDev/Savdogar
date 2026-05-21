from rest_framework import serializers
from .models import PaymentTransaction

class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'order', 'provider', 'status', 'amount', 
            'currency', 'remote_transaction_id', 'created_at', 
            'completed_at', 'error_message'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'completed_at', 'error_message']

class InitiatePaymentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    provider = serializers.ChoiceField(choices=['payme', 'click', 'uzum'])
