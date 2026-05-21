"""
AI Auto-Pricing Engine Models
"""
from django.db import models
from django.utils import timezone


class PricingRule(models.Model):
    """Automated pricing rules based on conditions"""
    RULE_TYPE_CHOICES = [
        ('competitor', 'Competitor Based'),
        ('demand', 'Demand Based'),
        ('time', 'Time Based'),
        ('margin', 'Minimum Margin'),
        ('discount', 'Automatic Discount'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('draft', 'Draft'),
    ]
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='pricing_rules')
    name = models.CharField(max_length=200)
    rule_type = models.CharField(max_length=20, choices=RULE_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Conditions
    apply_to = models.CharField(max_length=20, choices=[
        ('all', 'All Products'),
        ('category', 'Specific Category'),
        ('product', 'Specific Product'),
    ], default='all')
    category = models.ForeignKey('products.Category', on_delete=models.SET_NULL, null=True, blank=True)
    products = models.ManyToManyField('products.Product', blank=True)
    
    # Rule configuration (JSON)
    conditions = models.JSONField(default=dict, help_text='Rule conditions in JSON format')
    action = models.JSONField(default=dict, help_text='Action to take (e.g., set price, percentage change)')
    
    # Priority and scheduling
    priority = models.IntegerField(default=0, help_text='Higher priority rules execute first')
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-priority', '-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.rule_type})"
    
    @property
    def is_active(self):
        if self.status != 'active':
            return False
        now = timezone.now()
        if self.start_date and now < self.start_date:
            return False
        if self.end_date and now > self.end_date:
            return False
        return True


class CompetitorPrice(models.Model):
    """Track competitor prices for products"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='competitor_prices')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='competitor_prices')
    
    competitor_name = models.CharField(max_length=200)
    competitor_url = models.URLField(blank=True, help_text='URL to competitor product page')
    price = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    
    # Tracking
    last_checked = models.DateTimeField(auto_now=True)
    is_available = models.BooleanField(default=True)
    price_difference = models.DecimalField(max_digits=12, decimal_places=2, default=0, 
                                           help_text='Our price - competitor price')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-last_checked']
        unique_together = ['product', 'competitor_name']
    
    def __str__(self):
        return f"{self.competitor_name} - {self.product.name}: ${self.price}"
    
    def save(self, *args, **kwargs):
        # Calculate price difference
        if self.product.price:
            self.price_difference = self.product.price - self.price
        super().save(*args, **kwargs)


class PriceHistory(models.Model):
    """Log all price changes for analytics"""
    CHANGE_REASON_CHOICES = [
        ('manual', 'Manual Change'),
        ('ai_recommendation', 'AI Recommendation'),
        ('pricing_rule', 'Pricing Rule Applied'),
        ('competitor_match', 'Competitor Price Match'),
        ('promotion', 'Promotion'),
        ('seasonal', 'Seasonal Adjustment'),
    ]
    
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='price_history')
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='price_history')
    
    old_price = models.DecimalField(max_digits=12, decimal_places=2)
    new_price = models.DecimalField(max_digits=12, decimal_places=2)
    change_amount = models.DecimalField(max_digits=12, decimal_places=2)
    change_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    
    reason = models.CharField(max_length=30, choices=CHANGE_REASON_CHOICES)
    rule = models.ForeignKey(PricingRule, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    
    changed_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.product.name}: ${self.old_price} → ${self.new_price}"
    
    def save(self, *args, **kwargs):
        self.change_amount = self.new_price - self.old_price
        if self.old_price > 0:
            self.change_percentage = (self.change_amount / self.old_price) * 100
        super().save(*args, **kwargs)


class AIRecommendation(models.Model):
    """AI-suggested prices with confidence scores"""
    RECOMMENDATION_STATUS = [
        ('pending', 'Pending Review'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('applied', 'Applied'),
    ]
    
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='ai_recommendations')
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='ai_recommendations')
    
    current_price = models.DecimalField(max_digits=12, decimal_places=2)
    suggested_price = models.DecimalField(max_digits=12, decimal_places=2)
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2, 
                                           help_text='AI confidence (0-100)')
    
    # Reasoning
    reasoning = models.TextField(help_text='AI explanation for the recommendation')
    factors = models.JSONField(default=dict, help_text='Factors considered by AI')
    
    # Expected impact
    expected_sales_change = models.DecimalField(max_digits=5, decimal_places=2, 
                                                help_text='Expected % change in sales')
    expected_revenue_change = models.DecimalField(max_digits=5, decimal_places=2, 
                                                  help_text='Expected % change in revenue')
    
    status = models.CharField(max_length=20, choices=RECOMMENDATION_STATUS, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)
    applied_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"AI Recommendation for {self.product.name}: ${self.suggested_price}"
    
    @property
    def price_change_percentage(self):
        if self.current_price > 0:
            return ((self.suggested_price - self.current_price) / self.current_price) * 100
        return 0
