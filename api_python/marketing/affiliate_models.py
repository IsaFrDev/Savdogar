"""
Affiliate Program Models
Referral tracking, commission management, payout system
"""
from django.db import models
from django.utils import timezone
import uuid


class AffiliateProgram(models.Model):
    """Affiliate program configuration per store"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('inactive', 'Inactive'),
    ]
    
    store = models.OneToOneField('stores.Store', on_delete=models.CASCADE, related_name='affiliate_program')
    name = models.CharField(max_length=200, default='Affiliate Program')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Commission settings
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=10.0,
                                          help_text='Default commission percentage')
    commission_type = models.CharField(max_length=20, choices=[
        ('percentage', 'Percentage of Sale'),
        ('fixed', 'Fixed Amount'),
    ], default='percentage')
    
    # Cookie settings
    cookie_duration_days = models.IntegerField(default=30, 
                                               help_text='Days cookie is valid for attribution')
    
    # Payout settings
    minimum_payout = models.DecimalField(max_digits=12, decimal_places=2, default=50.0,
                                         help_text='Minimum commission to request payout')
    payout_method = models.JSONField(default=dict, help_text='Available payout methods')
    
    # Terms
    terms_and_conditions = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.store.name} - {self.name}"
    
    @property
    def total_affiliates(self):
        return self.affiliates.filter(is_active=True).count()
    
    @property
    def total_commissions_paid(self):
        return self.commissions.filter(status='paid').aggregate(
            total=models.Sum('amount')
        )['total'] or 0


class Affiliate(models.Model):
    """Affiliate user with referral code"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('pending', 'Pending Approval'),
        ('suspended', 'Suspended'),
        ('banned', 'Banned'),
    ]
    
    program = models.ForeignKey(AffiliateProgram, on_delete=models.CASCADE, related_name='affiliates')
    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE, related_name='affiliate_profile')
    
    # Referral code
    referral_code = models.CharField(max_length=50, unique=True, default=uuid.uuid4)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_active = models.BooleanField(default=True)
    
    # Performance tracking
    total_clicks = models.IntegerField(default=0)
    total_conversions = models.IntegerField(default=0)
    total_commission_earned = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_commission_pending = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_commission_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Conversion rate
    @property
    def conversion_rate(self):
        if self.total_clicks > 0:
            return (self.total_conversions / self.total_clicks) * 100
        return 0
    
    # Payment info
    payment_email = models.EmailField(blank=True)
    payment_method = models.CharField(max_length=50, blank=True, choices=[
        ('bank_transfer', 'Bank Transfer'),
        ('paypal', 'PayPal'),
        ('crypto', 'Cryptocurrency'),
        ('wallet', 'Platform Wallet'),
    ])
    
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='approved_affiliates')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-total_commission_earned']
    
    def __str__(self):
        return f"{self.user.username} - {self.referral_code}"
    
    def generate_referral_link(self, product_id=None):
        """Generate tracked referral link"""
        base_url = f"https://savdoon.uz/?ref={self.referral_code}"
        if product_id:
            base_url = f"https://savdoon.uz/product/{product_id}/?ref={self.referral_code}"
        return base_url


class ReferralLink(models.Model):
    """Individual tracked referral links"""
    affiliate = models.ForeignKey(Affiliate, on_delete=models.CASCADE, related_name='referral_links')
    
    # Link details
    url = models.URLField(help_text='Full referral URL')
    landing_page = models.CharField(max_length=200, help_text='Target page path')
    utm_source = models.CharField(max_length=100, default='affiliate')
    utm_medium = models.CharField(max_length=100, default='referral')
    utm_campaign = models.CharField(max_length=200, blank=True)
    
    # Analytics
    clicks = models.IntegerField(default=0)
    unique_clicks = models.IntegerField(default=0)
    conversions = models.IntegerField(default=0)
    conversion_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    last_clicked = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-clicks']
    
    def __str__(self):
        return f"{self.affiliate.user.username} - {self.landing_page}"


class Commission(models.Model):
    """Earned commissions from referrals"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    
    affiliate = models.ForeignKey(Affiliate, on_delete=models.CASCADE, related_name='commissions')
    program = models.ForeignKey(AffiliateProgram, on_delete=models.CASCADE, related_name='commissions')
    
    # Order reference
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, related_name='affiliate_commissions')
    
    # Commission details
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, help_text='Rate applied %')
    order_total = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Timing
    earned_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    # Notes
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-earned_at']
    
    def __str__(self):
        return f"{self.affiliate.user.username} - ${self.amount} ({self.status})"


class Payout(models.Model):
    """Affiliate withdrawal requests and history"""
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
        ('failed', 'Failed'),
    ]
    
    affiliate = models.ForeignKey(Affiliate, on_delete=models.CASCADE, related_name='payouts')
    program = models.ForeignKey(AffiliateProgram, on_delete=models.CASCADE, related_name='payouts')
    
    # Amount
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    
    # Payment details
    payment_method = models.CharField(max_length=50)
    payment_details = models.JSONField(help_text='Payment account details')
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Processing
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='processed_payouts')
    
    # Transaction reference
    transaction_id = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-requested_at']
    
    def __str__(self):
        return f"{self.affiliate.user.username} - ${self.amount} ({self.status})"
