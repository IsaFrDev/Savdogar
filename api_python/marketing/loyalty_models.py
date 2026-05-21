"""
Loyalty Points System Models
"""
from django.db import models
from django.utils import timezone


class LoyaltyPointsProgram(models.Model):
    """Store-specific loyalty program configuration"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('inactive', 'Inactive'),
    ]
    
    store = models.OneToOneField('stores.Store', on_delete=models.CASCADE, related_name='loyalty_points_program')
    name = models.CharField(max_length=200, default='Loyalty Rewards')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Points configuration
    points_per_dollar = models.DecimalField(max_digits=5, decimal_places=2, default=1.0,
                                            help_text='Points earned per dollar spent')
    points_expiry_days = models.IntegerField(default=365, help_text='Days until points expire')
    minimum_redemption = models.IntegerField(default=100, help_text='Minimum points to redeem')
    
    # Bonus multipliers
    birthday_multiplier = models.DecimalField(max_digits=3, decimal_places=2, default=2.0,
                                              help_text='Points multiplier on birthday')
    referral_bonus = models.IntegerField(default=500, help_text='Bonus points for referral')
    review_bonus = models.IntegerField(default=50, help_text='Bonus points for writing review')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.store.name} - {self.name}"
    
    @property
    def total_members(self):
        return self.customer_points.filter(points_balance__gt=0).count()


class RewardTier(models.Model):
    """Loyalty tier levels (Bronze, Silver, Gold, Platinum)"""
    TIER_NAME_CHOICES = [
        ('bronze', 'Bronze'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
        ('platinum', 'Platinum'),
        ('diamond', 'Diamond'),
    ]
    
    program = models.ForeignKey(LoyaltyPointsProgram, on_delete=models.CASCADE, related_name='tiers')
    name = models.CharField(max_length=20, choices=TIER_NAME_CHOICES)
    display_name = models.CharField(max_length=50)
    
    # Thresholds
    minimum_points = models.IntegerField(help_text='Points required to reach this tier')
    maximum_points = models.IntegerField(null=True, blank=True, help_text='Points before next tier')
    
    # Benefits
    points_multiplier = models.DecimalField(max_digits=3, decimal_places=2, default=1.0,
                                            help_text='Earn points faster at higher tiers')
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0,
                                              help_text='Automatic discount for this tier')
    free_shipping = models.BooleanField(default=False)
    early_access = models.BooleanField(default=False, help_text='Early access to sales')
    exclusive_deals = models.BooleanField(default=False)
    priority_support = models.BooleanField(default=False)
    
    # Visual
    badge_color = models.CharField(max_length=7, default='#CD7F32', help_text='Hex color for badge')
    icon = models.CharField(max_length=10, default='🥉')
    
    class Meta:
        ordering = ['minimum_points']
    
    def __str__(self):
        return f"{self.display_name} ({self.program.store.name})"


class CustomerPoints(models.Model):
    """Customer points balance per store"""
    customer = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='loyalty_accounts')
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='customer_points')
    program = models.ForeignKey(LoyaltyPointsProgram, on_delete=models.CASCADE, related_name='customer_points')
    
    points_balance = models.IntegerField(default=0)
    points_earned_lifetime = models.IntegerField(default=0)
    points_redeemed_lifetime = models.IntegerField(default=0)
    
    # Tier tracking
    current_tier = models.ForeignKey(RewardTier, on_delete=models.SET_NULL, null=True, blank=True)
    tier_achieved_at = models.DateTimeField(null=True, blank=True)
    
    # Expiry tracking
    points_expiring_soon = models.IntegerField(default=0, help_text='Points expiring in next 30 days')
    next_expiry_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['customer', 'store']
        ordering = ['-points_balance']
    
    def __str__(self):
        return f"{self.customer.username} - {self.store.name}: {self.points_balance} pts"
    
    @property
    def tier_progress(self):
        """Calculate progress to next tier"""
        if not self.current_tier:
            return 0
        next_tier = RewardTier.objects.filter(
            program=self.program,
            minimum_points__gt=self.current_tier.minimum_points
        ).order_by('minimum_points').first()
        
        if not next_tier:
            return 100  # Already at highest tier
        
        progress = (self.points_balance - self.current_tier.minimum_points) / (next_tier.minimum_points - self.current_tier.minimum_points) * 100
        return min(100, max(0, progress))


class PointsTransaction(models.Model):
    """Earn and burn history"""
    TRANSACTION_TYPE_CHOICES = [
        ('earn', 'Earned'),
        ('redeem', 'Redeemed'),
        ('expire', 'Expired'),
        ('adjust', 'Adjusted'),
        ('bonus', 'Bonus'),
        ('refund', 'Refund'),
    ]
    
    REASON_CHOICES = [
        ('purchase', 'Purchase'),
        ('redemption', 'Reward Redemption'),
        ('referral', 'Referral Bonus'),
        ('review', 'Review Bonus'),
        ('birthday', 'Birthday Bonus'),
        ('signup', 'Signup Bonus'),
        ('admin_adjustment', 'Admin Adjustment'),
        ('expiry', 'Points Expiry'),
        ('other', 'Other'),
    ]
    
    customer = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='points_transactions')
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='points_transactions')
    customer_points = models.ForeignKey(CustomerPoints, on_delete=models.CASCADE, related_name='transactions')
    
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    reason = models.CharField(max_length=30, choices=REASON_CHOICES)
    
    points = models.IntegerField(help_text='Points (positive for earn, negative for burn)')
    balance_after = models.IntegerField(help_text='Balance after transaction')
    
    # Reference
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True)
    reward = models.ForeignKey('marketing.Reward', on_delete=models.SET_NULL, null=True, blank=True)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.customer.username} - {self.transaction_type}: {self.points} pts"


class Reward(models.Model):
    """Redeemable rewards"""
    REWARD_TYPE_CHOICES = [
        ('discount', 'Discount'),
        ('free_shipping', 'Free Shipping'),
        ('free_product', 'Free Product'),
        ('cashback', 'Cashback'),
        ('exclusive_access', 'Exclusive Access'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('limited', 'Limited Stock'),
    ]
    
    program = models.ForeignKey(LoyaltyPointsProgram, on_delete=models.CASCADE, related_name='rewards')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    reward_type = models.CharField(max_length=20, choices=REWARD_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Cost
    points_cost = models.IntegerField(help_text='Points required to redeem')
    
    # Value (for discounts, cashback)
    value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True,
                                help_text='Discount amount or cashback value')
    value_type = models.CharField(max_length=20, choices=[
        ('fixed', 'Fixed Amount'),
        ('percentage', 'Percentage'),
    ], default='fixed')
    
    # Limits
    max_redemptions = models.IntegerField(null=True, blank=True, help_text='Max total redemptions')
    max_per_customer = models.IntegerField(default=1, help_text='Max redemptions per customer')
    current_redemptions = models.IntegerField(default=0)
    
    # Validity
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    
    # Associated product (for free product rewards)
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True, blank=True,
                                related_name='loyalty_rewards')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['points_cost']
    
    def __str__(self):
        return f"{self.name} - {self.points_cost} pts"
    
    @property
    def is_available(self):
        if self.status != 'active':
            return False
        if self.max_redemptions and self.current_redemptions >= self.max_redemptions:
            return False
        now = timezone.now()
        if self.valid_from and now < self.valid_from:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        return True
