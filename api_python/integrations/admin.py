from django.contrib import admin
from .models import (
    PaymentGateway, PaymentTransaction,
    MarketplaceIntegration, MarketplaceProduct, MarketplaceOrder, MarketplaceInventoryLog,
    DeliveryIntegration, DeliveryRequest
)


@admin.register(PaymentGateway)
class PaymentGatewayAdmin(admin.ModelAdmin):
    list_display = ['store', 'gateway_type', 'is_active', 'created_at']
    list_filter = ['gateway_type', 'is_active']
    search_fields = ['store__name']


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'store', 'gateway', 'order_number', 'amount', 'currency', 'status', 'created_at']
    list_filter = ['status', 'gateway__gateway_type', 'currency']
    search_fields = ['transaction_id', 'order_number', 'customer_name', 'customer_phone']
    readonly_fields = ['transaction_id', 'created_at', 'updated_at', 'completed_at']


@admin.register(MarketplaceIntegration)
class MarketplaceIntegrationAdmin(admin.ModelAdmin):
    list_display = ['store', 'marketplace_type', 'is_active', 'is_syncing', 'last_sync_at', 'created_at']
    list_filter = ['marketplace_type', 'is_active', 'is_syncing']
    search_fields = ['store__name']


@admin.register(MarketplaceProduct)
class MarketplaceProductAdmin(admin.ModelAdmin):
    list_display = ['local_product_id', 'integration', 'marketplace_product_id', 'sync_status', 'last_synced_at']
    list_filter = ['sync_status', 'integration__marketplace_type']
    search_fields = ['marketplace_product_id', 'marketplace_sku']


@admin.register(MarketplaceOrder)
class MarketplaceOrderAdmin(admin.ModelAdmin):
    list_display = ['marketplace_order_number', 'integration', 'status', 'total_amount', 'currency', 'is_synced_to_local', 'created_at']
    list_filter = ['status', 'integration__marketplace_type', 'is_synced_to_local']
    search_fields = ['marketplace_order_id', 'marketplace_order_number', 'customer_name', 'customer_phone']


@admin.register(MarketplaceInventoryLog)
class MarketplaceInventoryLogAdmin(admin.ModelAdmin):
    list_display = ['product_id', 'integration', 'sync_type', 'local_stock', 'marketplace_stock', 'success', 'created_at']
    list_filter = ['sync_type', 'success', 'integration__marketplace_type']


@admin.register(DeliveryIntegration)
class DeliveryIntegrationAdmin(admin.ModelAdmin):
    list_display = ['store', 'service_type', 'is_active', 'created_at']
    list_filter = ['service_type', 'is_active']
    search_fields = ['store__name']


@admin.register(DeliveryRequest)
class DeliveryRequestAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'store', 'status', 'courier_name', 'estimated_cost', 'actual_cost', 'created_at']
    list_filter = ['status', 'delivery_integration__service_type']
    search_fields = ['external_request_id', 'courier_name', 'courier_phone']
    readonly_fields = ['created_at', 'updated_at']
