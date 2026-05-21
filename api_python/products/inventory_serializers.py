"""
Inventory & Warehouse Serializers
"""
from rest_framework import serializers
from .inventory_models import (
    Warehouse, WarehouseZone, StockLocation, WarehouseProduct,
    Batch, StockMovement, StockTransfer, StockTransferItem, StockAlert
)


class WarehouseSerializer(serializers.ModelSerializer):
    utilization_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Warehouse
        fields = '__all__'


class WarehouseZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = WarehouseZone
        fields = '__all__'


class StockLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockLocation
        fields = '__all__'


class WarehouseProductSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    available_quantity = serializers.ReadOnlyField()
    needs_reorder = serializers.ReadOnlyField()
    
    class Meta:
        model = WarehouseProduct
        fields = '__all__'


class BatchSerializer(serializers.ModelSerializer):
    is_expired = serializers.ReadOnlyField()
    days_until_expiry = serializers.ReadOnlyField()
    
    class Meta:
        model = Batch
        fields = '__all__'


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='warehouse_product.product.name', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ['stock_before', 'stock_after']


class StockTransferSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockTransfer
        fields = '__all__'
        read_only_fields = ['transfer_number']


class StockTransferItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockTransferItem
        fields = '__all__'


class StockAlertSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='warehouse_product.product.name', read_only=True)
    
    class Meta:
        model = StockAlert
        fields = '__all__'
        read_only_fields = ['created_at']
