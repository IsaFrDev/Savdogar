from django.contrib import admin
from .models import Store, Contract

@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'owner', 'status', 'created_at']
    list_filter = ['status', 'business_type']
    search_fields = ['name', 'slug']

@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ['store', 'language', 'signed', 'signed_at']
    list_filter = ['signed', 'language']
