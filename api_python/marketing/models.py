"""
Marketing Automation System
Automated campaigns, email/SMS marketing, customer segmentation
"""
from django.db import models
from django.utils import timezone


class MarketingCampaign(models.Model):
    """Automated marketing campaigns"""
    
    CAMPAIGN_TYPE = [
        ('email', 'Email Campaign'),
        ('sms', 'SMS Campaign'),
        ('push', 'Push Notification'),
        ('telegram', 'Telegram Message'),
        ('discount', 'Discount Campaign'),
    ]
    
    TRIGGER_TYPE = [
        ('manual', 'Manual'),
        ('signup', 'New User Signup'),
        ('purchase', 'After Purchase'),
        ('abandoned_cart', 'Abandoned Cart'),
        ('inactive', 'Inactive Customer'),
        ('birthday', 'Customer Birthday'),
        ('anniversary', 'Store Anniversary'),
    ]
    
    STATUS = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
    ]
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='marketing_campaigns')
    name = models.CharField(max_length=200)
    campaign_type = models.CharField(max_length=20, choices=CAMPAIGN_TYPE)
    trigger_type = models.CharField(max_length=20, choices=TRIGGER_TYPE, default='manual')
    status = models.CharField(max_length=20, choices=STATUS, default='draft')
    
    # Content
    subject = models.CharField(max_length=300, blank=True)
    message = models.TextField()
    template_html = models.TextField(blank=True, help_text='HTML template for email')
    
    # Targeting
    target_segment = models.CharField(max_length=50, blank=True, help_text='VIP, Loyal, At-Risk, etc.')
    min_purchase_count = models.IntegerField(default=0, help_text='Minimum purchases to qualify')
    min_total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    days_since_last_purchase = models.IntegerField(default=0, help_text='0 = any')
    
    # Scheduling
    scheduled_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Performance
    sent_count = models.IntegerField(default=0)
    delivered_count = models.IntegerField(default=0)
    opened_count = models.IntegerField(default=0)
    clicked_count = models.IntegerField(default=0)
    converted_count = models.IntegerField(default=0)
    revenue_generated = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Discount (if applicable)
    discount_code = models.CharField(max_length=50, blank=True)
    discount_percent = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.get_campaign_type_display()})"
    
    @property
    def open_rate(self):
        return (self.opened_count / self.sent_count * 100) if self.sent_count > 0 else 0
    
    @property
    def click_rate(self):
        return (self.clicked_count / self.sent_count * 100) if self.sent_count > 0 else 0
    
    @property
    def conversion_rate(self):
        return (self.converted_count / self.sent_count * 100) if self.sent_count > 0 else 0


class CampaignRecipient(models.Model):
    """Track individual campaign recipients"""
    
    campaign = models.ForeignKey(MarketingCampaign, on_delete=models.CASCADE, related_name='recipients')
    customer = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='campaign_receipts')
    
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    clicked_at = models.DateTimeField(null=True, blank=True)
    converted_at = models.DateTimeField(null=True, blank=True)
    
    order_generated = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True)
    revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    class Meta:
        unique_together = ['campaign', 'customer']


class AutomatedWorkflow(models.Model):
    """Multi-step marketing automation workflows"""
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='workflows')
    name = models.CharField(max_length=200)
    is_active = models.BooleanField(default=False)
    
    # Trigger
    trigger_event = models.CharField(max_length=50, help_text='signup, purchase, abandoned_cart, etc.')
    trigger_delay_hours = models.IntegerField(default=0, help_text='Wait X hours before starting')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class WorkflowStep(models.Model):
    """Individual steps in a workflow"""
    
    STEP_TYPE = [
        ('send_email', 'Send Email'),
        ('send_sms', 'Send SMS'),
        ('send_push', 'Send Push'),
        ('add_tag', 'Add Customer Tag'),
        ('remove_tag', 'Remove Customer Tag'),
        ('apply_discount', 'Apply Discount'),
        ('wait', 'Wait/Delay'),
        ('condition', 'If/Else Condition'),
    ]
    
    workflow = models.ForeignKey(AutomatedWorkflow, on_delete=models.CASCADE, related_name='steps')
    step_type = models.CharField(max_length=30, choices=STEP_TYPE)
    order = models.IntegerField(help_text='Step order (1, 2, 3...)')
    
    # Configuration
    config = models.JSONField(default=dict, help_text='Step-specific configuration')
    delay_hours = models.IntegerField(default=0, help_text='Wait before this step')
    
    # Conditions
    condition_field = models.CharField(max_length=50, blank=True, help_text='Field to check')
    condition_operator = models.CharField(max_length=10, blank=True, help_text='equals, greater_than, etc.')
    condition_value = models.CharField(max_length=200, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['workflow', 'order']
    
    def __str__(self):
        return f"{self.workflow.name} - Step {self.order}"


class EmailTemplate(models.Model):
    """Reusable email templates"""
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='email_templates')
    name = models.CharField(max_length=200)
    subject = models.CharField(max_length=300)
    html_content = models.TextField()
    text_content = models.TextField(blank=True)
    
    # Variables available: {{customer_name}}, {{store_name}}, {{discount_code}}, etc.
    variables = models.JSONField(default=list, blank=True, help_text='List of available variables')
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name


class SMSTemplate(models.Model):
    """Reusable SMS templates"""
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='sms_templates')
    name = models.CharField(max_length=200)
    message = models.CharField(max_length=160, help_text='Max 160 characters')
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
