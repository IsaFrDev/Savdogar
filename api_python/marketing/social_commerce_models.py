"""
Social Commerce Integrations
Social sharing, referrals, influencer tracking, social proof
"""
from django.db import models


class SocialShare(models.Model):
    """Track product/store shares on social media"""
    
    PLATFORM_CHOICES = [
        ('telegram', 'Telegram'),
        ('instagram', 'Instagram'),
        ('facebook', 'Facebook'),
        ('twitter', 'Twitter/X'),
        ('whatsapp', 'WhatsApp'),
        ('tiktok', 'TikTok'),
        ('copy_link', 'Copy Link'),
    ]
    
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='social_shares')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, null=True, blank=True, related_name='shares')
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, null=True, blank=True, related_name='shares')
    
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    shared_at = models.DateTimeField(auto_now_add=True)
    
    # Tracking
    click_count = models.IntegerField(default=0)
    conversion_count = models.IntegerField(default=0)
    revenue_generated = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    def __str__(self):
        return f"{self.user.username} shared on {self.platform}"


class ReferralProgram(models.Model):
    """Referral program configuration"""
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='referral_programs')
    name = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    
    # Rewards
    referrer_reward_type = models.CharField(max_length=20, choices=[
        ('discount', 'Discount %'),
        ('fixed', 'Fixed Amount'),
        ('points', 'Loyalty Points'),
        ('free_shipping', 'Free Shipping'),
    ], default='discount')
    
    referrer_reward_value = models.DecimalField(max_digits=10, decimal_places=2, default=10)
    
    referee_reward_type = models.CharField(max_length=20, choices=[
        ('discount', 'Discount %'),
        ('fixed', 'Fixed Amount'),
        ('points', 'Loyalty Points'),
    ], default='discount')
    
    referee_reward_value = models.DecimalField(max_digits=10, decimal_places=2, default=10)
    
    # Conditions
    min_purchase_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_referrals_per_user = models.IntegerField(default=0, help_text='0 = unlimited')
    referral_valid_days = models.IntegerField(default=30, help_text='Days until referral expires')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class Referral(models.Model):
    """Individual referral tracking"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('registered', 'Registered'),
        ('converted', 'Converted (Purchase Made)'),
        ('expired', 'Expired'),
    ]
    
    program = models.ForeignKey(ReferralProgram, on_delete=models.CASCADE, related_name='referrals')
    referrer = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='referrals_made')
    referee = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='referrals_received')
    
    referral_code = models.CharField(max_length=50, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    registered_at = models.DateTimeField(null=True, blank=True)
    converted_at = models.DateTimeField(null=True, blank=True)
    expired_at = models.DateTimeField(null=True, blank=True)
    
    order_generated = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, related_name='referral_order')
    commission_earned = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.referrer.username} → {self.referee.username if self.referee else 'Pending'}"


class InfluencerCampaign(models.Model):
    """Influencer marketing campaigns"""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='influencer_campaigns')
    name = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    influencer_name = models.CharField(max_length=200)
    influencer_social_handle = models.CharField(max_length=200)
    influencer_platform = models.CharField(max_length=50)
    
    # Compensation
    compensation_type = models.CharField(max_length=30, choices=[
        ('fixed', 'Fixed Payment'),
        ('commission', 'Commission Only'),
        ('fixed_plus_commission', 'Fixed + Commission'),
        ('free_products', 'Free Products'),
    ])
    
    fixed_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    commission_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Tracking
    unique_code = models.CharField(max_length=50, unique=True, help_text='Influencer discount code')
    tracking_url = models.URLField(blank=True)
    
    # Performance
    clicks = models.IntegerField(default=0)
    conversions = models.IntegerField(default=0)
    revenue_generated = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.influencer_name}"


class SocialProof(models.Model):
    """Social proof notifications (recent purchases, etc.)"""
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='social_proofs')
    is_active = models.BooleanField(default=True)
    
    # Display settings
    show_recent_purchases = models.BooleanField(default=True)
    show_visitor_count = models.BooleanField(default=True)
    show_stock_low = models.BooleanField(default=True)
    
    # Timing
    display_duration = models.IntegerField(default=5, help_text='Seconds to show notification')
    interval = models.IntegerField(default=15, help_text='Seconds between notifications')
    delay_first = models.IntegerField(default=3, help_text='Delay before first notification')
    
    # Customization
    position = models.CharField(max_length=20, choices=[
        ('bottom-left', 'Bottom Left'),
        ('bottom-right', 'Bottom Right'),
    ], default='bottom-left')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Social Proof for {self.store.name}"


class UserGeneratedContent(models.Model):
    """Customer reviews, photos, videos"""
    
    CONTENT_TYPE = [
        ('review', 'Review'),
        ('photo', 'Photo'),
        ('video', 'Video'),
        ('testimonial', 'Testimonial'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='ugc')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, null=True, blank=True, related_name='ugc')
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='ugc')
    
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    content = models.TextField()
    media_url = models.URLField(blank=True)
    media_file = models.FileField(upload_to='ugc/', blank=True, null=True)
    
    rating = models.IntegerField(null=True, blank=True)
    
    likes_count = models.IntegerField(default=0)
    shares_count = models.IntegerField(default=0)
    
    approved_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='approved_ugc')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_content_type_display()}"
