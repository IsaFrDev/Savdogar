from django.contrib import admin
from .models import Courier, DeliveryZone, DeliveryProvider, DeliveryTimeSlot, PickupPoint, DeliveryRoute, DeliveryPricing

@admin.register(Courier)
class CourierAdmin(admin.ModelAdmin):
    list_display = ['user', 'store', 'status', 'vehicle_type', 'rating', 'completed_deliveries']
    list_filter = ['status', 'vehicle_type', 'is_active']
    search_fields = ['user__username', 'user__email']

@admin.register(DeliveryZone)
class DeliveryZoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'base_price', 'estimated_time_minutes', 'is_active']
    list_filter = ['is_active', 'store']
    search_fields = ['name', 'name_uz']

@admin.register(DeliveryProvider)
class DeliveryProviderAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'provider_type', 'commission_percentage', 'is_active']
    list_filter = ['provider_type', 'is_active']
    search_fields = ['name']

@admin.register(DeliveryTimeSlot)
class DeliveryTimeSlotAdmin(admin.ModelAdmin):
    list_display = ['store', 'day_of_week', 'start_time', 'end_time', 'max_orders', 'current_orders', 'is_available']
    list_filter = ['day_of_week', 'is_available']

@admin.register(PickupPoint)
class PickupPointAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'address', 'is_open_now', 'is_active']
    list_filter = ['is_active', 'is_24_7']
    search_fields = ['name', 'address']

@admin.register(DeliveryRoute)
class DeliveryRouteAdmin(admin.ModelAdmin):
    list_display = ['courier', 'date', 'status', 'total_orders', 'completed_orders']
    list_filter = ['status', 'date']

@admin.register(DeliveryPricing)
class DeliveryPricingAdmin(admin.ModelAdmin):
    list_display = ['store', 'pricing_method', 'base_price', 'free_delivery_min_order', 'is_active']
    list_filter = ['pricing_method', 'is_active']
