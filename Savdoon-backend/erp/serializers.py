"""
ERP Serializers
"""
from rest_framework import serializers
from .models import (
    Vendor, ERPPurchaseOrder, ERPPurchaseOrderItem,
    StockReorderRule, Shipment, WarehouseTransfer,
    WarehouseTransferItem, ExpenseCategory, Expense
)


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = [
            'id', 'store', 'name', 'contact_person', 'email', 'phone',
            'address', 'tax_id', 'payment_terms', 'rating', 'is_active',
            'notes', 'created_at', 'updated_at'
        ]


class ERPPurchaseOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ERPPurchaseOrderItem
        fields = [
            'id', 'purchase_order', 'product', 'product_name', 'sku',
            'quantity_ordered', 'quantity_received', 'quantity_pending',
            'unit_cost', 'total_cost', 'expected_date', 'received_date'
        ]


class ERPPurchaseOrderSerializer(serializers.ModelSerializer):
    items = ERPPurchaseOrderItemSerializer(many=True, read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    
    class Meta:
        model = ERPPurchaseOrder
        fields = [
            'id', 'store', 'vendor', 'vendor_name', 'po_number', 'status',
            'priority', 'order_date', 'expected_delivery', 'actual_delivery',
            'subtotal', 'tax_amount', 'shipping_cost', 'discount_amount',
            'total', 'payment_status', 'created_by', 'approved_by',
            'approved_at', 'notes', 'internal_notes', 'items',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['po_number', 'approved_at']


class ERPPurchaseOrderCreateSerializer(serializers.ModelSerializer):
    items = ERPPurchaseOrderItemSerializer(many=True)
    
    class Meta:
        model = ERPPurchaseOrder
        fields = [
            'vendor', 'priority', 'order_date', 'expected_delivery',
            'shipping_cost', 'discount_amount', 'notes', 'items'
        ]
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        validated_data['created_by'] = self.context['request'].user
        
        # Calculate subtotal from items
        subtotal = sum(item['quantity_ordered'] * item['unit_cost'] for item in items_data)
        validated_data['subtotal'] = subtotal
        
        po = ERPPurchaseOrder.objects.create(**validated_data)
        
        for item_data in items_data:
            ERPPurchaseOrderItem.objects.create(purchase_order=po, **item_data)
        
        return po


class StockReorderRuleSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    current_stock = serializers.DecimalField(source='product.stock_quantity', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = StockReorderRule
        fields = [
            'id', 'store', 'product', 'product_name', 'current_stock',
            'trigger_type', 'min_stock_level', 'reorder_quantity',
            'preferred_vendor', 'is_active', 'auto_create_po',
            'last_triggered', 'created_at', 'updated_at'
        ]


class ShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = [
            'id', 'purchase_order', 'tracking_number', 'carrier',
            'carrier_name', 'status', 'shipped_date', 'estimated_arrival',
            'actual_arrival', 'origin_address', 'destination_warehouse',
            'package_count', 'weight_kg', 'notes', 'created_at', 'updated_at'
        ]


class WarehouseTransferItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = WarehouseTransferItem
        fields = [
            'id', 'transfer', 'product', 'product_name',
            'quantity_requested', 'quantity_sent', 'quantity_received', 'notes'
        ]


class WarehouseTransferSerializer(serializers.ModelSerializer):
    items = WarehouseTransferItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = WarehouseTransfer
        fields = [
            'id', 'store', 'transfer_number', 'status',
            'source_warehouse', 'destination_warehouse',
            'requested_by', 'approved_by', 'transfer_date',
            'completed_date', 'notes', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['transfer_number']


class ExpenseCategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()
    
    class Meta:
        model = ExpenseCategory
        fields = ['id', 'store', 'name', 'name_uz', 'name_ru', 'code', 'is_active', 'parent', 'subcategories']
    
    def get_subcategories(self, obj):
        if obj.subcategories.exists():
            return ExpenseCategorySerializer(obj.subcategories, many=True).data
        return []


class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Expense
        fields = [
            'id', 'store', 'category', 'category_name', 'vendor', 'purchase_order',
            'amount', 'currency', 'expense_date', 'payment_method',
            'receipt_number', 'description', 'receipt_image',
            'approved', 'approved_by', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at']
