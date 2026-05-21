"""
POS Serializers
"""
from rest_framework import serializers
from .models import (
    CashRegister, POSSession, POSTransaction, 
    POSTransactionItem, POSReceipt, POSRefund, Barcode
)


class CashRegisterSerializer(serializers.ModelSerializer):
    total_sales = serializers.SerializerMethodField()
    
    class Meta:
        model = CashRegister
        fields = [
            'id', 'store', 'name', 'register_code', 'is_active',
            'opened_at', 'closed_at', 'starting_cash', 'ending_cash',
            'expected_cash', 'actual_cash', 'difference',
            'cashier', 'total_sales', 'created_at', 'updated_at'
        ]
        read_only_fields = ['total_sales']
    
    def get_total_sales(self, obj):
        return obj.total_sales


class POSSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = POSSession
        fields = [
            'id', 'register', 'cashier', 'started_at', 'ended_at',
            'starting_cash', 'ending_cash', 'status', 'notes'
        ]
        read_only_fields = ['started_at']


class POSTransactionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = POSTransactionItem
        fields = [
            'id', 'transaction', 'product', 'product_name', 'barcode',
            'quantity', 'unit_price', 'discount', 'tax_rate',
            'subtotal', 'total'
        ]


class POSTransactionSerializer(serializers.ModelSerializer):
    items = POSTransactionItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = POSTransaction
        fields = [
            'id', 'store', 'register', 'session', 'cashier',
            'transaction_number', 'status',
            'subtotal', 'tax_amount', 'discount_amount', 'total',
            'payment_method', 'amount_paid', 'change_amount',
            'customer_name', 'customer_phone', 'notes',
            'items', 'created_at', 'completed_at'
        ]
        read_only_fields = ['transaction_number', 'change_amount', 'created_at']


class POSTransactionCreateSerializer(serializers.ModelSerializer):
    items = POSTransactionItemSerializer(many=True)
    
    class Meta:
        model = POSTransaction
        fields = [
            'store', 'register', 'session', 'cashier',
            'payment_method', 'amount_paid',
            'customer_name', 'customer_phone', 'notes',
            'items'
        ]
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        # Calculate totals
        subtotal = sum(item['quantity'] * item['unit_price'] for item in items_data)
        tax_amount = sum(item.get('tax_rate', 0) for item in items_data)
        discount_amount = sum(item.get('discount', 0) for item in items_data)
        total = subtotal + tax_amount - discount_amount
        
        validated_data['subtotal'] = subtotal
        validated_data['tax_amount'] = tax_amount
        validated_data['discount_amount'] = discount_amount
        validated_data['total'] = total
        
        if validated_data['amount_paid'] >= total:
            validated_data['status'] = 'completed'
        
        # Create transaction
        transaction = POSTransaction.objects.create(**validated_data)
        
        # Create items
        for item_data in items_data:
            POSTransactionItem.objects.create(transaction=transaction, **item_data)
        
        # Update stock
        if transaction.status == 'completed':
            for item_data in items_data:
                if item_data.get('product'):
                    product = item_data['product']
                    product.stock_quantity -= item_data['quantity']
                    product.save()
        
        return transaction


class POSReceiptSerializer(serializers.ModelSerializer):
    transaction = POSTransactionSerializer(read_only=True)
    
    class Meta:
        model = POSReceipt
        fields = [
            'id', 'transaction', 'receipt_number', 'fiscal_number',
            'qr_code', 'printed', 'printed_at', 'emailed', 'emailed_at',
            'created_at'
        ]


class POSRefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = POSRefund
        fields = [
            'id', 'original_transaction', 'refund_transaction',
            'reason', 'reason_details', 'refund_amount',
            'refund_method', 'approved_by', 'processed_at'
        ]
        read_only_fields = ['processed_at']


class BarcodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Barcode
        fields = ['id', 'product', 'barcode', 'barcode_type', 'is_primary', 'created_at']
