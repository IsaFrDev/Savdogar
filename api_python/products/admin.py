from django.contrib import admin
from .inventory_models import (
    Warehouse, WarehouseZone, StockLocation, WarehouseProduct,
    Batch, StockMovement, StockTransfer, StockTransferItem, StockAlert
)
from .product_enhancements import (
    ProductVideo, ProductImage360, SizeGuide, ProductBundle, BundleItem,
    ProductSubscription, CustomerSubscription, ProductPreOrder, BackInStockNotification
)

@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'manager', 'total_capacity', 'utilization_percentage', 'is_active']
    list_filter = ['is_active', 'is_default']
    search_fields = ['name', 'address']

@admin.register(WarehouseZone)
class WarehouseZoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'warehouse', 'zone_type', 'capacity']
    list_filter = ['zone_type']

@admin.register(StockLocation)
class StockLocationAdmin(admin.ModelAdmin):
    list_display = ['location_code', 'warehouse', 'zone', 'location_type', 'capacity', 'is_available']
    list_filter = ['location_type', 'is_available']

@admin.register(WarehouseProduct)
class WarehouseProductAdmin(admin.ModelAdmin):
    list_display = ['product', 'warehouse', 'quantity', 'available_quantity', 'needs_reorder']
    list_filter = ['warehouse']
    search_fields = ['product__name']

@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ['batch_number', 'warehouse_product', 'quantity', 'remaining_quantity', 'expiry_date', 'status']
    list_filter = ['status', 'expiry_date']
    search_fields = ['batch_number']

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['warehouse_product', 'movement_type', 'quantity', 'stock_before', 'stock_after', 'created_at']
    list_filter = ['movement_type', 'created_at']

@admin.register(StockTransfer)
class StockTransferAdmin(admin.ModelAdmin):
    list_display = ['transfer_number', 'from_warehouse', 'to_warehouse', 'status', 'requested_at']
    list_filter = ['status']
    search_fields = ['transfer_number']

@admin.register(StockTransferItem)
class StockTransferItemAdmin(admin.ModelAdmin):
    list_display = ['transfer', 'product', 'quantity_requested', 'quantity_sent', 'quantity_received']

@admin.register(StockAlert)
class StockAlertAdmin(admin.ModelAdmin):
    list_display = ['alert_type', 'warehouse_product', 'severity', 'is_resolved', 'created_at']
    list_filter = ['alert_type', 'severity', 'is_resolved']

# Product Enhancements Admin
@admin.register(ProductVideo)
class ProductVideoAdmin(admin.ModelAdmin):
    list_display = ['product', 'title', 'is_primary', 'is_active', 'order']
    list_filter = ['is_primary', 'is_active']

@admin.register(ProductImage360)
class ProductImage360Admin(admin.ModelAdmin):
    list_display = ['product', 'angle', 'order']
    list_filter = ['product']

@admin.register(SizeGuide)
class SizeGuideAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'unit']
    list_filter = ['category']

@admin.register(ProductBundle)
class ProductBundleAdmin(admin.ModelAdmin):
    list_display = ['name', 'bundle_price', 'original_price', 'discount_percentage', 'is_active', 'featured']
    list_filter = ['is_active', 'featured']
    search_fields = ['name']

@admin.register(BundleItem)
class BundleItemAdmin(admin.ModelAdmin):
    list_display = ['bundle', 'product', 'quantity']

@admin.register(ProductSubscription)
class ProductSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['product', 'frequencies', 'monthly_discount', 'is_active']
    list_filter = ['is_active']

@admin.register(CustomerSubscription)
class CustomerSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['customer', 'subscription', 'status', 'frequency', 'next_delivery_date']
    list_filter = ['status', 'frequency']

@admin.register(ProductPreOrder)
class ProductPreOrderAdmin(admin.ModelAdmin):
    list_display = ['product', 'expected_release_date', 'preorder_price', 'preorder_count', 'is_available_for_preorder']
    list_filter = ['is_available_for_preorder']

@admin.register(BackInStockNotification)
class BackInStockNotificationAdmin(admin.ModelAdmin):
    list_display = ['product', 'customer', 'notified', 'created_at']
    list_filter = ['notified']
