from django.contrib import admin
from .models import Order, OrderItem, OrderStatusHistory

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'store', 'total', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['customer_name', 'customer_phone']

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product_name', 'quantity', 'subtotal']

@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['order', 'status', 'created_at']
