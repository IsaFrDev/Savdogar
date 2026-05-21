from django.db import models
from django.conf import settings

# Import inventory and product enhancement models
from .inventory_models import (
    Warehouse,
    WarehouseZone,
    StockLocation,
    WarehouseProduct,
    Batch,
    StockMovement,
    StockTransfer,
    StockTransferItem,
    StockAlert,
)

from .product_enhancements import (
    ProductVideo,
    ProductImage360,
    SizeGuide,
    ProductBundle,
    BundleItem,
    ProductSubscription,
    CustomerSubscription,
    ProductPreOrder,
    BackInStockNotification,
)


class Category(models.Model):
    """Product category."""
    
    name = models.CharField(max_length=100)
    name_uz = models.CharField(max_length=100, blank=True)
    name_ru = models.CharField(max_length=100, blank=True)
    slug = models.SlugField(max_length=100)
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='categories')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'categories'
        ordering = ['order', 'name']
        verbose_name_plural = 'Categories'
    
    def __str__(self):
        return self.name


class Product(models.Model):
    """Product model."""
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    
    name = models.CharField(max_length=200)
    name_uz = models.CharField(max_length=200, blank=True)
    name_ru = models.CharField(max_length=200, blank=True)
    
    slug = models.SlugField(max_length=200, blank=True)
    sku = models.CharField(max_length=50, blank=True)
    
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    
    description = models.TextField(blank=True)
    description_uz = models.TextField(blank=True)
    description_ru = models.TextField(blank=True)
    
    seo_tags = models.TextField(blank=True)
    seo_tags_uz = models.TextField(blank=True)
    seo_tags_ru = models.TextField(blank=True)
    
    price = models.DecimalField(max_digits=12, decimal_places=2)
    compare_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Service & POS fields
    is_service = models.BooleanField(default=False)
    barcode = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    service_duration = models.PositiveIntegerField(null=True, blank=True, help_text='Duration in minutes')
    
    stock = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=5)  # Alert when stock <= this
    track_stock = models.BooleanField(default=True)
    
    active = models.BooleanField(default=True)
    featured = models.BooleanField(default=False)
    
    # New fields for units and branches
    unit = models.CharField(max_length=50, blank=True, null=True, help_text="e.g., litr, kg, dona")
    branches = models.ManyToManyField('stores.Branch', related_name='products', blank=True)
    
    # Delivery info
    weight = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)  # kg
    dimensions = models.JSONField(default=dict, blank=True)  # {"length": 10, "width": 5, "height": 3} cm
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    
    class Meta:
        db_table = 'products'
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name, allow_unicode=True)
            
        # Ensure slug is not empty even if slugify results in empty (e.g. non-ascii without allow_unicode)
        if not self.slug:
            import uuid
            self.slug = f"product-{uuid.uuid4().hex[:8]}"
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.store.name}"
    
    @property
    def in_stock(self):
        if not self.track_stock:
            return True
        return self.stock > 0
    
    @property
    def low_stock(self):
        return self.track_stock and 0 < self.stock <= self.low_stock_threshold


class ProductAttribute(models.Model):
    """Product attributes like Color, Size, Material."""
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='product_attributes')
    name = models.CharField(max_length=100)  # 'Color', 'Size'
    name_uz = models.CharField(max_length=100, blank=True)
    name_ru = models.CharField(max_length=100, blank=True)
    values = models.JSONField(default=list)  # ['Red', 'Blue', 'Green'] or ['S', 'M', 'L', 'XL']
    is_multiple_choice = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'product_attributes'
        unique_together = ['store', 'name']

    
    def __str__(self):
        return f"{self.name} ({self.store.name})"


class ProductVariant(models.Model):
    """Product variant with specific attributes."""
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    sku = models.CharField(max_length=50, unique=True)
    barcode = models.CharField(max_length=100, blank=True)
    
    # Variant-specific pricing
    price = models.DecimalField(max_digits=12, decimal_places=2)
    compare_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    stock = models.IntegerField(default=0)
    
    # Attributes as JSON {"Color": "Red", "Size": "XL"}
    attributes = models.JSONField(default=dict)
    
    # Variant-specific image
    image = models.ImageField(upload_to='product_variants/', blank=True, null=True)
    
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'product_variants'
        ordering = ['product', 'sku']
    
    def __str__(self):
        attrs = ', '.join([f"{k}: {v}" for k, v in self.attributes.items()])
        return f"{self.product.name} - {attrs}"


class ProductImage(models.Model):
    """Product image model."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=200, blank=True)
    order = models.IntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_images'
        ordering = ['order']


class Discount(models.Model):
    """Product/Category discount."""
    
    DISCOUNT_TYPE_CHOICES = [
        ('percent', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    ]
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='discounts')
    name = models.CharField(max_length=200)
    name_uz = models.CharField(max_length=200, blank=True)
    name_ru = models.CharField(max_length=200, blank=True)
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPE_CHOICES, default='percent')
    value = models.DecimalField(max_digits=12, decimal_places=2)  # percent or fixed sum
    
    # Apply to specific products or categories
    products = models.ManyToManyField(Product, blank=True, related_name='discounts')
    categories = models.ManyToManyField(Category, blank=True, related_name='discounts')
    apply_to_all = models.BooleanField(default=False)
    
    min_order_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'discounts'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.value}{'%' if self.discount_type == 'percent' else ' sum'}"
    
    @property
    def is_active(self):
        from django.utils import timezone
        now = timezone.now()
        return self.active and self.start_date <= now <= self.end_date


class PromoCode(models.Model):
    """Promo code for discounts."""
    
    DISCOUNT_TYPE_CHOICES = [
        ('percent', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    ]
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='promo_codes')
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPE_CHOICES, default='percent')
    value = models.DecimalField(max_digits=12, decimal_places=2)
    
    min_order_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    max_discount_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    usage_limit = models.IntegerField(default=0)  # 0 = unlimited
    used_count = models.IntegerField(default=0)
    one_per_customer = models.BooleanField(default=True)
    
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'promo_codes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.code} - {self.value}{'%' if self.discount_type == 'percent' else ' sum'}"
    
    @property
    def is_valid(self):
        from django.utils import timezone
        now = timezone.now()
        if not self.active:
            return False
        if self.valid_from > now or self.valid_to < now:
            return False
        if self.usage_limit > 0 and self.used_count >= self.usage_limit:
            return False
        return True


class Wishlist(models.Model):
    """User wishlist."""
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'wishlists'
        unique_together = ['user', 'product']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} ❤️ {self.product.name}"


class RecentlyViewed(models.Model):
    """Recently viewed products."""
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recently_viewed')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='viewed_by')
    viewed_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'recently_viewed'
        unique_together = ['user', 'product']
        ordering = ['-viewed_at']
    
    def __str__(self):
        return f"{self.user.username} viewed {self.product.name}"


class Review(models.Model):
    """Product review and rating."""
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])  # 1-5 stars
    comment = models.TextField(blank=True)
    reply_text = models.TextField(blank=True)
    replied_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reviews'
        unique_together = ['user', 'product']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.product.name}: {self.rating}⭐"
