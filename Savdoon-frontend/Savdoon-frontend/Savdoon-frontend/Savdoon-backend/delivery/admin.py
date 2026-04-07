from django.contrib import admin
from .models import Courier

@admin.register(Courier)
class CourierAdmin(admin.ModelAdmin):
    list_display = ['user', 'store', 'status', 'vehicle_type', 'rating']
    list_filter = ['status', 'vehicle_type']
    search_fields = ['user__username', 'user__email']
