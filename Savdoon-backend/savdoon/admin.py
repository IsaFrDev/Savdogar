from django.contrib import admin
from .advanced_models import (
    CorporateAccount, WholesalePrice, BulkOrder, Supplier, PurchaseOrder,
    SupportTicket, TicketMessage, FAQ,
    TaxRate, AuditLog,
    CacheEntry, APIKey, Webhook
)

# B2B Admin
@admin.register(CorporateAccount)
class CorporateAccountAdmin(admin.ModelAdmin):
    list_display = ['company_name', 'contact_person', 'credit_limit', 'current_balance', 'is_active']
    list_filter = ['is_active', 'company_size']
    search_fields = ['company_name', 'contact_person__username']

@admin.register(WholesalePrice)
class WholesalePriceAdmin(admin.ModelAdmin):
    list_display = ['product', 'min_quantity', 'max_quantity', 'price', 'discount_percentage']
    list_filter = ['product']

@admin.register(BulkOrder)
class BulkOrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'corporate_account', 'status', 'total', 'created_at']
    list_filter = ['status']
    search_fields = ['order_number']

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'contact_person', 'reliability_score', 'average_lead_time_days', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']

@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ['po_number', 'supplier', 'store', 'status', 'total', 'expected_delivery_date']
    list_filter = ['status']
    search_fields = ['po_number']

# Customer Support Admin
@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['id', 'store', 'customer', 'subject', 'priority', 'status', 'created_at']
    list_filter = ['status', 'priority', 'category']
    search_fields = ['subject', 'customer__username']

@admin.register(TicketMessage)
class TicketMessageAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'sender', 'is_internal', 'is_read', 'created_at']
    list_filter = ['is_internal', 'is_read']

@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ['question', 'category', 'is_active', 'view_count', 'order']
    list_filter = ['category', 'is_active']
    search_fields = ['question']

# Compliance Admin
@admin.register(TaxRate)
class TaxRateAdmin(admin.ModelAdmin):
    list_display = ['name', 'rate_percentage', 'tax_type', 'is_active', 'effective_from']
    list_filter = ['tax_type', 'is_active']

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'model_name', 'object_id', 'timestamp']
    list_filter = ['action', 'model_name']
    search_fields = ['user__username']

# Developer Tools Admin
@admin.register(CacheEntry)
class CacheEntryAdmin(admin.ModelAdmin):
    list_display = ['key', 'expires_at', 'created_at']
    search_fields = ['key']

@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'key', 'is_active', 'last_used_at', 'expires_at']
    list_filter = ['is_active']
    search_fields = ['name', 'key']

@admin.register(Webhook)
class WebhookAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'url', 'is_active', 'last_triggered_at', 'failure_count']
    list_filter = ['is_active']
