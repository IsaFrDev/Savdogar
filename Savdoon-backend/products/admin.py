from django.contrib import admin
from .models import Category, Product, ProductImage, ProductAttribute, ProductVariant, Discount, PromoCode, Review

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'store', 'parent', 'order', 'active']
    list_filter = ['store', 'active']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'category', 'price', 'stock', 'active', 'featured']
    list_filter = ['store', 'category', 'active', 'featured', 'is_service']
    search_fields = ['name', 'sku', 'description', 'barcode']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(ProductAttribute)
class ProductAttributeAdmin(admin.ModelAdmin):
    list_display = ['name', 'store']
    list_filter = ['store']

@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ['product', 'sku', 'price', 'stock', 'active']
    list_filter = ['active']
    search_fields = ['sku', 'barcode']

@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'discount_type', 'value', 'start_date', 'end_date', 'active']
    list_filter = ['store', 'active', 'discount_type']

@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'store', 'discount_type', 'value', 'valid_to', 'active']
    list_filter = ['store', 'active']
    search_fields = ['code']

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
