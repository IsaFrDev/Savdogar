from django.db import models
from django.conf import settings


class Store(models.Model):
    """Store model for multi-store e-commerce."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    BUSINESS_TYPE_CHOICES = [
        ('grocery', 'Grocery'),
        ('clothing', 'Clothing'),
        ('electronics', 'Electronics'),
        ('services', 'Services'),
        ('restaurant', 'Restaurant'),
        ('beauty', 'Beauty & Health'),
        ('home', 'Home & Garden'),
        ('other', 'Other'),
    ]
    BUSINESS_MODEL_CHOICES = [
        ('product', 'Product-based'),
        ('service', 'Service-based'),
        ('hybrid', 'Hybrid'),
    ]
    
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='stores'
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    description_uz = models.TextField(blank=True)
    description_ru = models.TextField(blank=True)
    business_type = models.CharField(max_length=50, choices=BUSINESS_TYPE_CHOICES, default='other')
    business_description = models.TextField(blank=True)
    business_description_uz = models.TextField(blank=True)
    business_description_ru = models.TextField(blank=True)
    business_model = models.CharField(max_length=20, choices=BUSINESS_MODEL_CHOICES, default='product')
    logo = models.ImageField(upload_to='store_logos/', blank=True, null=True)
    banner = models.ImageField(upload_to='store_banners/', blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    pickup_address = models.TextField(blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    
    telegram_bot_token = models.CharField(max_length=200, blank=True)
    telegram_chat_id = models.CharField(max_length=100, blank=True)
    telegram_welcome = models.TextField(blank=True, default="Welcome to our store!")
    telegram_welcome_uz = models.TextField(blank=True)
    telegram_welcome_ru = models.TextField(blank=True)
    
    catalog_mode = models.BooleanField(default=False)
    default_language = models.CharField(max_length=5, default='en')
    base_currency = models.CharField(max_length=3, choices=[('UZS', 'UZS'), ('USD', 'USD'), ('RUB', 'RUB')], default='UZS')
    use_auto_rates = models.BooleanField(default=True)
    manual_exchange_rates = models.JSONField(default=dict, blank=True)
    
    api_key = models.CharField(max_length=100, blank=True, null=True)
    maintenance_mode = models.BooleanField(default=False)
    twa_enabled = models.BooleanField(default=False)
    
    primary_color = models.CharField(max_length=7, default='#6366F1')
    secondary_color = models.CharField(max_length=7, default='#8B5CF6')
    accent_color = models.CharField(max_length=7, default='#F43F5E')
    theme_config = models.JSONField(default=dict, blank=True)
    
    instagram_url = models.URLField(blank=True)
    telegram_channel = models.CharField(max_length=100, blank=True)
    facebook_url = models.URLField(blank=True)
    website_url = models.URLField(blank=True)
    
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    working_hours = models.CharField(max_length=100, blank=True)
    
    contract_signed = models.BooleanField(default=False)
    contract_signed_at = models.DateTimeField(null=True, blank=True)
    signature_data = models.TextField(blank=True)
    telegram_username = models.CharField(max_length=100, blank=True)
    contract_pdf = models.FileField(upload_to='contracts/', blank=True, null=True)
    
    subscription_price = models.DecimalField(max_digits=12, decimal_places=2, default=150000.00)
    subscription_expiry = models.DateTimeField(null=True, blank=True)
    
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    rating_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'stores'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.status})"
    
    @property
    def subdomain(self):
        return f"{self.slug}.savdoon.local"


class Contract(models.Model):
    LANGUAGE_CHOICES = [('en', 'English'), ('uz', "O'zbekcha"), ('ru', 'Русский')]
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='contracts')
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='en')
    content = models.TextField()
    signed = models.BooleanField(default=False)
    signed_at = models.DateTimeField(null=True, blank=True)
    signature_data = models.TextField(blank=True)
    pdf_file = models.FileField(upload_to='contracts/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'contracts'
    
    def __str__(self):
        return f"Contract for {self.store.name}"
