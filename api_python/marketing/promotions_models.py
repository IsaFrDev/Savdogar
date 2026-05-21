"""
Advanced Promotions System
Flash sales, bundle deals, tiered discounts, loyalty programs
"""
from django.db import models
from django.utils import timezone


class Promotion(models.Model):
    """Main promotion/campaign model"""
    
    PROMOTION_TYPE = [
        ('percentage', 'Percentage Discount'),
        ('fixed', 'Fixed Amount Discount'),
        ('bogo', 'Buy One Get One'),
        ('bundle', 'Bundle Deal'),
        ('flash_sale', 'Flash Sale'),
        ('free_shipping', 'Free Shipping'),
        ('gift_with_purchase', 'Gift with Purchase'),
        ('tiered', 'Tiered Discount'),
    ]
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='promotions')
    name = models.CharField(max_length=200)
    promotion_type = models.CharField(max_length=20, choices=PROMOTION_TYPE)
    
    # Discount values
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_percent = models.IntegerField(default=0)
    
    # Conditions
    min_purchase_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_items = models.IntegerField(default=0)
    
    # Applicability
    applicable_products = models.ManyToManyField('products.Product', blank=True, related_name='promotions')
    applicable_categories = models.ManyToManyField('products.Category', blank=True, related_name='promotions')
    excluded_products = models.ManyToManyField('products.Product', blank=True, related_name='excluded_promotions')
    
    # Usage limits
    usage_limit = models.IntegerField(default=0, help_text='0 = unlimited')
    usage_limit_per_user = models.IntegerField(default=1)
    usage_count = models.IntegerField(default=0)
    
    # Scheduling
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    
    # Priority
    priority = models.IntegerField(default=0, help_text='Higher priority applied first')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_promotion_type_display()})"
    
    @property
    def is_currently_active(self):
        now = timezone.now()
        return self.is_active and self.starts_at <= now <= self.ends_at
    
    @property
    def remaining_uses(self):
        if self.usage_limit == 0:
            return -1  # Unlimited
        return max(0, self.usage_limit - self.usage_count)


class TieredDiscount(models.Model):
    """Tiered discount (spend more, save more)"""
    
    promotion = models.ForeignKey(Promotion, on_delete=models.CASCADE, related_name='tiers')
    
    min_amount = models.DecimalField(max_digits=10, decimal_places=2)
    max_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discount_percent = models.IntegerField()
    
    class Meta:
        ordering = ['min_amount']
    
    def __str__(self):
        return f"Spend {self.min_amount}-{self.max_amount or '∞'}: {self.discount_percent}% off"


class BundleDeal(models.Model):
    """Product bundle with special pricing"""
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='bundle_deals')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Bundle products
    products = models.ManyToManyField('products.Product', through='BundleProduct')
    
    # Pricing
    original_price = models.DecimalField(max_digits=10, decimal_places=2)
    bundle_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percent = models.IntegerField(default=0)
    
    # Limits
    stock_limit = models.IntegerField(default=0, help_text='0 = unlimited')
    sold_count = models.IntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    @property
    def savings(self):
        return self.original_price - self.bundle_price


class BundleProduct(models.Model):
    """Products in a bundle"""
    
    bundle = models.ForeignKey(BundleDeal, on_delete=models.CASCADE, related_name='bundle_products')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    
    def __str__(self):
        return f"{self.product.name} x{self.quantity}"


class FlashSale(models.Model):
    """Time-limited flash sales"""
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='flash_sales')
    name = models.CharField(max_length=200)
    
    products = models.ManyToManyField('products.Product', through='FlashSaleProduct')
    
    # Timing
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    
    # Display
    is_featured = models.BooleanField(default=False)
    banner_image = models.ImageField(upload_to='flash_sales/', blank=True, null=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.starts_at.strftime('%H:%M')} - {self.ends_at.strftime('%H:%M')})"
    
    @property
    def time_remaining(self):
        if timezone.now() > self.ends_at:
            return None
        return self.ends_at - timezone.now()


class FlashSaleProduct(models.Model):
    """Products in a flash sale"""
    
    flash_sale = models.ForeignKey(FlashSale, on_delete=models.CASCADE, related_name='sale_products')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    
    original_price = models.DecimalField(max_digits=10, decimal_places=2)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percent = models.IntegerField()
    
    stock_allocated = models.IntegerField(default=0)
    stock_sold = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.product.name} - {self.discount_percent}% off"


class LoyaltyProgram(models.Model):
    """Customer loyalty points system"""
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='loyalty_programs')
    name = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    
    # Earning rules
    points_per_amount_spent = models.IntegerField(default=1, help_text='Points per X UZS spent')
    points_per_review = models.IntegerField(default=10)
    points_per_signup = models.IntegerField(default=50)
    points_per_referral = models.IntegerField(default=100)
    points_per_social_share = models.IntegerField(default=5)
    points_per_birthday = models.IntegerField(default=200)
    
    # Redemption
    points_value = models.DecimalField(max_digits=5, decimal_places=2, default=0.01, help_text='1 point = X UZS')
    min_points_to_redeem = models.IntegerField(default=100)
    max_discount_percent = models.IntegerField(default=50, help_text='Max % of order payable with points')
    
    # Tiers
    has_tiers = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class LoyaltyTier(models.Model):
    """Loyalty program tiers (Bronze, Silver, Gold, Platinum)"""
    
    program = models.ForeignKey(LoyaltyProgram, on_delete=models.CASCADE, related_name='tiers')
    name = models.CharField(max_length=100)
    
    min_points = models.IntegerField()
    max_points = models.IntegerField(null=True, blank=True)
    
    # Benefits
    points_multiplier = models.DecimalField(max_digits=3, decimal_places=2, default=1.0)
    exclusive_discount = models.IntegerField(default=0, help_text='Additional % discount')
    free_shipping = models.BooleanField(default=False)
    early_access = models.BooleanField(default=False)
    priority_support = models.BooleanField(default=False)
    
    # Icon/Color
    icon = models.CharField(max_length=100, blank=True)
    color = models.CharField(max_length=7, default='#CD7F32')  # Bronze
    
    class Meta:
        ordering = ['min_points']
    
    def __str__(self):
        return f"{self.program.name} - {self.name}"


class CustomerLoyalty(models.Model):
    """Individual customer loyalty tracking"""
    
    customer = models.OneToOneField('accounts.User', on_delete=models.CASCADE, related_name='loyalty')
    program = models.ForeignKey(LoyaltyProgram, on_delete=models.CASCADE)
    current_tier = models.ForeignKey(LoyaltyTier, on_delete=models.SET_NULL, null=True, blank=True)
    
    total_points = models.IntegerField(default=0)
    available_points = models.IntegerField(default=0)
    redeemed_points = models.IntegerField(default=0)
    expired_points = models.IntegerField(default=0)
    
    lifetime_points_earned = models.IntegerField(default=0)
    lifetime_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    joined_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.customer.username} - {self.available_points} points"


class LoyaltyTransaction(models.Model):
    """Points earned/spent log"""
    
    TRANSACTION_TYPE = [
        ('earned', 'Points Earned'),
        ('redeemed', 'Points Redeemed'),
        ('expired', 'Points Expired'),
        ('adjusted', 'Manual Adjustment'),
        ('refunded', 'Points Refunded'),
    ]
    
    customer_loyalty = models.ForeignKey(CustomerLoyalty, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE)
    
    points = models.IntegerField()
    balance_after = models.IntegerField()
    
    reference_type = models.CharField(max_length=50, blank=True)
    reference_id = models.IntegerField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.customer_loyalty.customer.username} - {self.transaction_type}: {self.points:+d}"
