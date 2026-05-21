from rest_framework import serializers
from .models import (
    Category, Product, ProductImage, ProductAttribute, 
    ProductVariant, Discount, PromoCode, Wishlist, RecentlyViewed, Review
)
from .pricing_models import PricingRule, CompetitorPrice, PriceHistory, AIRecommendation


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for product images."""
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'order', 'is_primary']


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for categories."""
    
    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'name_uz', 'name_ru', 'slug', 'store', 'parent', 'image', 'order', 'active', 'children', 'product_count']
        read_only_fields = ['id']
    
    def get_children(self, obj):
        # Prevent deep nesting 
        depth = self.context.get('depth', 0)
        if depth > 3:
            return []
        children = obj.children.filter(active=True)
        return CategorySerializer(children, many=True, context={**self.context, 'depth': depth + 1}).data
    
    def get_product_count(self, obj):
        return obj.products.filter(active=True).count()


class ProductVariantSerializer(serializers.ModelSerializer):
    """Serializer for product variants."""
    
    class Meta:
        model = ProductVariant
        fields = ['id', 'product', 'sku', 'barcode', 'price', 'compare_price', 
                  'cost_price', 'stock', 'attributes', 'image', 'active', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for products."""
    
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    in_stock = serializers.ReadOnlyField()
    low_stock = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'store', 'category', 'category_name', 'name', 'name_uz', 'name_ru',
            'slug', 'sku', 'image', 'description', 'description_uz', 'description_ru',
            'seo_tags', 'seo_tags_uz', 'seo_tags_ru',
            'price', 'compare_price', 'cost_price', 'stock', 'track_stock',
            'active', 'featured', 'images', 'variants', 'in_stock', 'low_stock',
            'unit', 'branches',
            'created_at', 'updated_at'
        ]

        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating products."""
    
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )
    variants = ProductVariantSerializer(many=True, required=False)
    slug = serializers.SlugField(required=False, allow_blank=True)
    sku = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Product
        fields = [
            'store', 'category', 'name', 'name_uz', 'name_ru', 'slug', 'sku', 'image',
            'description', 'description_uz', 'description_ru',
            'seo_tags', 'seo_tags_uz', 'seo_tags_ru',
            'price', 'compare_price', 'cost_price', 'stock', 'track_stock',
            'active', 'featured', 'images', 'variants', 'unit', 'branches'
        ]

    
    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        variants_data = validated_data.pop('variants', [])
        product = Product.objects.create(**validated_data)
        
        for i, image in enumerate(images_data):
            ProductImage.objects.create(
                product=product,
                image=image,
                order=i,
                is_primary=(i == 0)
            )
        
        for variant_data in variants_data:
            ProductVariant.objects.create(product=product, **variant_data)
        
        return product


class ProductAttributeSerializer(serializers.ModelSerializer):
    """Serializer for product attributes."""
    
    class Meta:
        model = ProductAttribute
        fields = ['id', 'store', 'name', 'name_uz', 'name_ru', 'values', 'is_multiple_choice']
        read_only_fields = ['id']



class BulkUpdateSerializer(serializers.Serializer):
    """Serializer for bulk product updates."""
    
    products = serializers.ListField(
        child=serializers.DictField(),
        help_text="List of products to update. Each item should have 'id' and fields to update."
    )


class DiscountSerializer(serializers.ModelSerializer):
    """Serializer for discounts."""
    is_active = serializers.ReadOnlyField()
    
    class Meta:
        model = Discount
        fields = [
            'id', 'store', 'name', 'name_uz', 'name_ru', 'discount_type', 'value',
            'products', 'categories', 'apply_to_all', 'min_order_amount',
            'start_date', 'end_date', 'active', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PromoCodeSerializer(serializers.ModelSerializer):
    """Serializer for promo codes."""
    is_valid = serializers.ReadOnlyField()
    
    class Meta:
        model = PromoCode
        fields = [
            'id', 'store', 'code', 'description', 'discount_type', 'value',
            'min_order_amount', 'max_discount_amount', 'usage_limit', 'used_count',
            'one_per_customer', 'valid_from', 'valid_to', 'active', 'is_valid', 'created_at'
        ]
        read_only_fields = ['id', 'used_count', 'created_at']


class WishlistSerializer(serializers.ModelSerializer):
    """Serializer for wishlist."""
    product_data = ProductSerializer(source='product', read_only=True)
    
    class Meta:
        model = Wishlist
        fields = ['id', 'user', 'product', 'product_data', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class RecentlyViewedSerializer(serializers.ModelSerializer):
    """Serializer for recently viewed products."""
    product_data = ProductSerializer(source='product', read_only=True)
    
    class Meta:
        model = RecentlyViewed
        fields = ['id', 'user', 'product', 'product_data', 'viewed_at']
        read_only_fields = ['id', 'user', 'viewed_at']


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for reviews."""
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 'user', 'product', 'store', 'rating', 'comment',
            'reply_text', 'replied_at', 'user_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'replied_at', 'created_at', 'updated_at']
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email


# Pricing Serializers

class PricingRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingRule
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class CompetitorPriceSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = CompetitorPrice
        fields = '__all__'
        read_only_fields = ['id', 'last_checked', 'created_at']


class PriceHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceHistory
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'change_amount', 'change_percentage']


class AIRecommendationSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    price_change_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = AIRecommendation
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'price_change_percentage']
