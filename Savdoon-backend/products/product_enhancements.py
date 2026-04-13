"""
Savdoon - Mahsulot Kengaytmalari
Product Enhancements Models
"""
from django.db import models


class ProductVideo(models.Model):
    """Mahsulot videolari"""
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='videos')
    video_file = models.FileField(upload_to='product_videos/', blank=True, null=True)
    video_url = models.URLField(blank=True, help_text="YouTube, Vimeo URL")
    
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    
    # Video properties
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    thumbnail = models.ImageField(upload_to='product_video_thumbnails/', blank=True)
    
    # Display
    order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'product_videos'
        ordering = ['order']
    
    def __str__(self):
        return f"Video: {self.product.name}"


class ProductImage360(models.Model):
    """360° Product View"""
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='images_360')
    image = models.ImageField(upload_to='product_360/')
    angle = models.PositiveIntegerField(help_text="Angle in degrees (0-359)")
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'product_images_360'
        ordering = ['angle']
    
    def __str__(self):
        return f"{self.product.name} - {self.angle}°"


class SizeGuide(models.Model):
    """O'lchov qo'llanmasi"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='size_guides')
    name = models.CharField(max_length=100)
    category = models.ForeignKey('products.Category', on_delete=models.CASCADE, related_name='size_guides')
    
    # Size chart as JSON
    size_chart = models.JSONField(help_text='{"S": {"chest": "36-38", "waist": "30-32"}, ...}')
    
    # Measurement units
    unit = models.CharField(max_length=10, choices=[('cm', 'Centimeters'), ('in', 'Inches')], default='cm')
    
    # How to measure instructions
    measurement_instructions = models.TextField(blank=True)
    measurement_instructions_uz = models.TextField(blank=True)
    measurement_instructions_ru = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'size_guides'
    
    def __str__(self):
        return f"{self.name} - {self.category.name}"


class ProductBundle(models.Model):
    """Mahsulot to'plamlari (Combo deals)"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='product_bundles')
    name = models.CharField(max_length=200)
    name_uz = models.CharField(max_length=200, blank=True)
    name_ru = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    description_uz = models.TextField(blank=True)
    description_ru = models.TextField(blank=True)
    
    # Bundle products
    products = models.ManyToManyField('products.Product', through='BundleItem')
    
    # Pricing
    bundle_price = models.DecimalField(max_digits=12, decimal_places=2)
    original_price = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Discount
    @property
    def discount_percentage(self):
        if self.original_price > 0:
            return ((self.original_price - self.bundle_price) / self.original_price) * 100
        return 0
    
    # Settings
    is_active = models.BooleanField(default=True)
    featured = models.BooleanField(default=False)
    
    image = models.ImageField(upload_to='bundles/', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'product_bundles'
    
    def __str__(self):
        return f"Bundle: {self.name} (Save {self.discount_percentage:.0f}%)"


class BundleItem(models.Model):
    """Bundle itemlari"""
    bundle = models.ForeignKey(ProductBundle, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    
    class Meta:
        db_table = 'bundle_items'
        unique_together = ['bundle', 'product']
    
    def __str__(self):
        return f"{self.product.name} x{self.quantity}"


class ProductSubscription(models.Model):
    """Obuna mahsulotlari"""
    product = models.OneToOneField('products.Product', on_delete=models.CASCADE, related_name='subscription')
    
    # Subscription options
    frequencies = models.JSONField(
        default=list,
        help_text='["weekly", "biweekly", "monthly", "quarterly"]'
    )
    
    # Discounts for subscriptions
    weekly_discount = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    biweekly_discount = models.DecimalField(max_digits=5, decimal_places=2, default=5)
    monthly_discount = models.DecimalField(max_digits=5, decimal_places=2, default=10)
    quarterly_discount = models.DecimalField(max_digits=5, decimal_places=2, default=15)
    
    # Minimum commitment
    minimum_commitment_months = models.PositiveIntegerField(default=0, help_text="0 = no minimum")
    
    # Pause settings
    can_pause = models.BooleanField(default=True)
    max_pause_duration_months = models.PositiveIntegerField(default=3)
    
    # Skip settings
    can_skip = models.BooleanField(default=True)
    max_skips_per_year = models.PositiveIntegerField(default=2)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'product_subscriptions'
    
    def __str__(self):
        return f"Subscription: {self.product.name}"


class CustomerSubscription(models.Model):
    """Mijoz obunalari"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
    
    customer = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='subscriptions')
    subscription = models.ForeignKey(ProductSubscription, on_delete=models.CASCADE)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    frequency = models.CharField(max_length=20)  # weekly, monthly, etc.
    
    # Delivery schedule
    next_delivery_date = models.DateField()
    last_delivery_date = models.DateField(null=True, blank=True)
    
    # Pricing
    current_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount_applied = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Pause/Skip
    paused_until = models.DateField(null=True, blank=True)
    skips_remaining = models.PositiveIntegerField(default=0)
    
    # Tracking
    total_deliveries = models.PositiveIntegerField(default=0)
    start_date = models.DateField(auto_now_add=True)
    end_date = models.DateField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'customer_subscriptions'
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['next_delivery_date']),
        ]
    
    def __str__(self):
        return f"{self.customer.get_full_name()} - {self.subscription.product.name} ({self.frequency})"


class ProductPreOrder(models.Model):
    """Oldindan buyurtma"""
    product = models.OneToOneField('products.Product', on_delete=models.CASCADE, related_name='preorder')
    
    # Pre-order settings
    is_available_for_preorder = models.BooleanField(default=False)
    expected_release_date = models.DateField(null=True, blank=True)
    preorder_start_date = models.DateTimeField()
    preorder_end_date = models.DateTimeField(null=True, blank=True)
    
    # Pricing
    preorder_price = models.DecimalField(max_digits=12, decimal_places=2)
    full_price = models.DecimalField(max_digits=12, decimal_places=2)
    deposit_required = models.BooleanField(default=False)
    deposit_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Limits
    max_quantity_per_customer = models.PositiveIntegerField(default=1)
    total_preorder_limit = models.PositiveIntegerField(default=0, help_text="0 = unlimited")
    preorder_count = models.PositiveIntegerField(default=0)
    
    # Notifications
    notify_on_release = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'product_preorders'
    
    def __str__(self):
        return f"Pre-order: {self.product.name}"


class BackInStockNotification(models.Model):
    """Qayta mavjud bo'lganda bildirishnoma"""
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='back_in_stock_notifications')
    customer = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='stock_notifications')
    
    variant_attributes = models.JSONField(default=dict, blank=True, help_text="Specific variant customer wants")
    
    notified = models.BooleanField(default=False)
    notified_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'back_in_stock_notifications'
        unique_together = ['product', 'customer']
    
    def __str__(self):
        return f"{self.customer.get_full_name()} wants {self.product.name}"
