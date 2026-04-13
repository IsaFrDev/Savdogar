"""
Product Enhancements Serializers
"""
from rest_framework import serializers
from .product_enhancements import (
    ProductVideo, ProductImage360, SizeGuide, ProductBundle, BundleItem,
    ProductSubscription, CustomerSubscription, ProductPreOrder, BackInStockNotification
)


class ProductVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVideo
        fields = '__all__'


class ProductImage360Serializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage360
        fields = '__all__'


class SizeGuideSerializer(serializers.ModelSerializer):
    class Meta:
        model = SizeGuide
        fields = '__all__'


class BundleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BundleItem
        fields = '__all__'


class ProductBundleSerializer(serializers.ModelSerializer):
    items = BundleItemSerializer(many=True, read_only=True)
    discount_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = ProductBundle
        fields = '__all__'


class ProductSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSubscription
        fields = '__all__'


class CustomerSubscriptionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='subscription.product.name', read_only=True)
    
    class Meta:
        model = CustomerSubscription
        fields = '__all__'


class ProductPreOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductPreOrder
        fields = '__all__'


class BackInStockNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BackInStockNotification
        fields = '__all__'
        read_only_fields = ['notified', 'notified_at']
