"""
Savdoon - Mijozlar Sodiqlik Dasturi
Customer Loyalty Program Models
"""
from django.db import models
from django.conf import settings


class LoyaltyProgram(models.Model):
    """Sodiqlik dasturi"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='loyalty_programs')
    name = models.CharField(max_length=100)
    name_uz = models.CharField(max_length=100, blank=True)
    name_ru = models.CharField(max_length=100, blank=True)
    
    # Points system
    points_per_currency = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=1,
        help_text="Points earned per 1 unit of currency spent"
    )
    currency_per_point = models.DecimalField(
        max_digits=10, decimal_places=2,
        default=1000,
        help_text="Currency value of 1 point"
    )
    
    # Expiration
    points_expiry_months = models.PositiveIntegerField(default=12, help_text="Points expire after X months")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'loyalty_programs'
    
    def __str__(self):
        return f"{self.name} - {self.store.name}"


class LoyaltyTier(models.Model):
    """Sodiqlik darajalari (Bronze, Silver, Gold, etc.)"""
    program = models.ForeignKey(LoyaltyProgram, on_delete=models.CASCADE, related_name='tiers')
    
    name = models.CharField(max_length=50)
    name_uz = models.CharField(max_length=50, blank=True)
    name_ru = models.CharField(max_length=50, blank=True)
    
    # Requirements
    min_points = models.PositiveIntegerField(default=0)
    max_points = models.PositiveIntegerField(null=True, blank=True)
    min_orders = models.PositiveIntegerField(default=0)
    min_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Benefits
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    points_multiplier = models.DecimalField(max_digits=5, decimal_places=2, default=1.0)
    free_shipping = models.BooleanField(default=False)
    priority_support = models.BooleanField(default=False)
    early_access = models.BooleanField(default=False)
    
    # Visual
    badge_icon = models.ImageField(upload_to='loyalty_badges/', blank=True)
    color = models.CharField(max_length=7, default='#CD7F32')  # Bronze by default
    
    # Order
    level = models.PositiveIntegerField(default=1, help_text="1=Bronze, 2=Silver, etc.")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'loyalty_tiers'
        ordering = ['level']
    
    def __str__(self):
        return f"{self.name} - {self.program.name}"


class CustomerLoyalty(models.Model):
    """Mijoz sodiqlik holati"""
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='loyalty_accounts')
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE)
    program = models.ForeignKey(LoyaltyProgram, on_delete=models.SET_NULL, null=True)
    tier = models.ForeignKey(LoyaltyTier, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Points
    total_points = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    available_points = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    lifetime_points = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Statistics
    total_orders = models.PositiveIntegerField(default=0)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    average_order_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Enrollment
    enrolled_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    tier_updated_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'customer_loyalty'
        unique_together = ['customer', 'store']
        indexes = [
            models.Index(fields=['available_points']),
        ]
    
    def __str__(self):
        return f"{self.customer.get_full_name()} - {self.available_points} points"
    
    def earn_points(self, amount_spent):
        """Earn points from purchase"""
        if self.program and self.program.is_active:
            points = amount_spent * self.program.points_per_currency
            
            # Apply tier multiplier
            if self.tier:
                points *= self.tier.points_multiplier
            
            self.total_points += points
            self.available_points += points
            self.lifetime_points += points
            self.save()
            return points
        return 0
    
    def redeem_points(self, points):
        """Redeem points for discount"""
        if points <= self.available_points:
            self.available_points -= points
            self.save()
            return True
        return False


class LoyaltyTransaction(models.Model):
    """Sodiqlik tranzaksiyalari"""
    TRANSACTION_TYPES = [
        ('earn', 'Earned'),
        ('redeem', 'Redeemed'),
        ('expire', 'Expired'),
        ('adjust', 'Adjusted'),
        ('refund', 'Refunded'),
        ('bonus', 'Bonus'),
    ]
    
    customer_loyalty = models.ForeignKey(CustomerLoyalty, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    
    points = models.DecimalField(max_digits=12, decimal_places=2)
    balance_before = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Reference
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True)
    
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'loyalty_transactions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.transaction_type}: {self.points} points"


class ReferralProgram(models.Model):
    """Referal dasturi"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='referral_programs')
    
    name = models.CharField(max_length=100)
    
    # Rewards
    referrer_reward = models.DecimalField(max_digits=12, decimal_places=2, default=10000, help_text="Reward for referrer")
    referee_reward = models.DecimalField(max_digits=12, decimal_places=2, default=10000, help_text="Reward for new customer")
    reward_type = models.CharField(
        max_length=20,
        choices=[
            ('points', 'Loyalty Points'),
            ('discount', 'Discount Coupon'),
            ('cashback', 'Cashback'),
        ],
        default='points'
    )
    
    # Conditions
    min_purchase_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    max_referrals = models.PositiveIntegerField(default=0, help_text="0 = unlimited")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'referral_programs'
    
    def __str__(self):
        return f"{self.name} - {self.store.name}"


class Referral(models.Model):
    """Referal"""
    program = models.ForeignKey(ReferralProgram, on_delete=models.CASCADE, related_name='referrals')
    
    referrer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_referrals')
    referee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_referrals')
    
    referral_code = models.CharField(max_length=20, unique=True, db_index=True)
    referral_link = models.URLField(blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('registered', 'Registered'),
            ('completed', 'Completed'),
            ('cancelled', 'Cancelled'),
        ],
        default='pending'
    )
    
    # Conversion
    registered_at = models.DateTimeField(null=True, blank=True)
    first_order_at = models.DateTimeField(null=True, blank=True)
    reward_given_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'referrals'
        indexes = [
            models.Index(fields=['referral_code']),
        ]
    
    def __str__(self):
        return f"{self.referrer.get_full_name()} → {self.referee.get_full_name() if self.referee else 'Pending'}"


class Coupon(models.Model):
    """Kuponlar va voucherlar"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='coupons')
    
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Discount type
    discount_type = models.CharField(
        max_length=20,
        choices=[
            ('percentage', 'Percentage'),
            ('fixed', 'Fixed Amount'),
            ('free_shipping', 'Free Shipping'),
        ],
        default='percentage'
    )
    discount_value = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Usage limits
    max_uses = models.PositiveIntegerField(default=0, help_text="0 = unlimited")
    used_count = models.PositiveIntegerField(default=0)
    max_uses_per_customer = models.PositiveIntegerField(default=1)
    
    # Conditions
    min_order_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    applicable_products = models.ManyToManyField('products.Product', blank=True)
    applicable_categories = models.ManyToManyField('products.Category', blank=True)
    
    # Validity
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'coupons'
        indexes = [
            models.Index(fields=['code', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.code} - {self.discount_type} {self.discount_value}"
    
    @property
    def is_valid(self):
        from django.utils import timezone
        now = timezone.now()
        return (
            self.is_active and
            self.valid_from <= now <= self.valid_until and
            (self.max_uses == 0 or self.used_count < self.max_uses)
        )


class CustomerCoupon(models.Model):
    """Mijozga berilgan kuponlar"""
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='customer_coupons')
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name='customer_coupons')
    
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True)
    
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'customer_coupons'
        unique_together = ['customer', 'coupon']
    
    def __str__(self):
        return f"{self.customer.get_full_name()} - {self.coupon.code}"
