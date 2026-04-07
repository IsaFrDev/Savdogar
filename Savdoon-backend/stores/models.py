from django.db import models
from django.conf import settings
from django.utils import timezone


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

    PLAN_CHOICES = [
        ('free_trial', 'Free Trial'),
        ('basic', 'Basic'),
        ('pro', 'Pro'),
        ('enterprise', 'Enterprise'),
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
    base_currency = models.CharField(max_length=3, choices=[('UZS', 'UZS'), ('USD', 'USD'), ('RUB', 'RUB'), ('EUR', 'EUR')], default='UZS')
    use_auto_rates = models.BooleanField(default=True)
    manual_exchange_rates = models.JSONField(default=dict, blank=True)
    
    api_key = models.CharField(max_length=100, blank=True, null=True)
    maintenance_mode = models.BooleanField(default=False)
    twa_enabled = models.BooleanField(default=False)
    
    primary_color = models.CharField(max_length=7, default='#6366F1')
    secondary_color = models.CharField(max_length=7, default='#8B5CF6')
    accent_color = models.CharField(max_length=7, default='#F43F5E')
    theme_config = models.JSONField(default=dict, blank=True)
    ui_schema = models.JSONField(default=list, blank=True)
    store_html = models.TextField(default='', blank=True, help_text='Custom HTML template for storefront rendering')
    store_files = models.JSONField(default=dict, blank=True, help_text='Structured file tree for the storefront (Explorer mode)')
    
    # Social media links
    instagram_url = models.URLField(blank=True)
    telegram_channel = models.CharField(max_length=100, blank=True)
    facebook_url = models.URLField(blank=True)
    website_url = models.URLField(blank=True)
    youtube_url = models.URLField(blank=True)
    tiktok_url = models.URLField(blank=True)
    whatsapp_number = models.CharField(max_length=20, blank=True)
    
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    
    # Working hours as JSON: {"monday": {"enabled": true, "from": "09:00", "to": "18:00"}, ...}
    working_hours = models.JSONField(default=dict, blank=True)
    
    contract_signed = models.BooleanField(default=False)
    contract_signed_at = models.DateTimeField(null=True, blank=True)
    signature_data = models.TextField(blank=True)
    telegram_username = models.CharField(max_length=100, blank=True)
    contract_pdf = models.FileField(upload_to='contracts/', blank=True, null=True)
    
    # Subscription & plan
    subscription_price = models.DecimalField(max_digits=12, decimal_places=2, default=150000.00)
    subscription_expiry = models.DateTimeField(null=True, blank=True)
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='free_trial')
    trial_started_at = models.DateTimeField(null=True, blank=True)
    trial_days = models.IntegerField(default=7)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Payment methods enabled
    payment_methods = models.JSONField(default=dict, blank=True)
    # e.g. {"cash": true, "card": true, "click": false, "payme": false, "uzum": false}
    
    # Delivery settings
    delivery_settings = models.JSONField(default=dict, blank=True)
    # e.g. {"enabled": true, "free_above": 100000, "zones": [...]}
    
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    rating_count = models.PositiveIntegerField(default=0)
    
    # SMS Gateway (Eskiz.uz)
    eskiz_email = models.EmailField(blank=True)
    eskiz_token = models.TextField(blank=True)
    
    # Verification
    is_phone_verified = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'stores'
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Auto-migration for legacy store_html to store_files
        # Only migrate if store_files is truly empty AND we have legacy html
        has_files = isinstance(self.store_files, dict) and len(self.store_files) > 0
        
        if not has_files and self.store_html:
            self.store_files = {"index.html": self.store_html}
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.status})"
    
    @property
    def subdomain(self):
        return f"{self.slug}.savdoon.local"

    @property
    def is_trial_active(self):
        if self.plan != 'free_trial' or not self.trial_started_at:
            return False
        from datetime import timedelta
        return timezone.now() < self.trial_started_at + timedelta(days=self.trial_days)

    @property
    def trial_days_remaining(self):
        if not self.trial_started_at:
            return 0
        from datetime import timedelta
        remaining = (self.trial_started_at + timedelta(days=self.trial_days)) - timezone.now()
        return max(0, remaining.days)


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


class Branch(models.Model):
    """Store branch/filial."""
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    working_hours = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'branches'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.store.name}"


class StoreBanner(models.Model):
    """Store promotional banner."""
    BANNER_TYPE_CHOICES = [
        ('main', 'Asosiy banner'),
        ('category', 'Kategoriyaga biriktirilgan'),
    ]
    LINK_TYPE_CHOICES = [
        ('none', 'Havolasiz'),
        ('category', 'Kategoriyaga'),
        ('product', 'Tovarga'),
        ('url', 'Tashqi havola'),
    ]

    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='banners')
    banner_type = models.CharField(max_length=20, choices=BANNER_TYPE_CHOICES, default='main')
    title = models.CharField(max_length=200, blank=True)
    mobile_image = models.ImageField(upload_to='banners/mobile/', blank=True, null=True)
    desktop_image = models.ImageField(upload_to='banners/desktop/', blank=True, null=True)
    link_type = models.CharField(max_length=20, choices=LINK_TYPE_CHOICES, default='none')
    link_value = models.CharField(max_length=500, blank=True)  # category_id, product_id, or URL
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'store_banners'
        ordering = ['order', '-created_at']

    def __str__(self):
        return f"Banner: {self.title or self.banner_type} - {self.store.name}"


class StaffRole(models.Model):
    """Custom roles for store staff."""
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='staff_roles')
    name = models.CharField(max_length=100)
    permissions = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'staff_roles'
        unique_together = ['store', 'name']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.store.name}"


class StaffMember(models.Model):
    """Store staff member."""
    STAFF_TYPE_CHOICES = [
        ('employee', 'Xodim'),
        ('courier', 'Kuryer'),
    ]
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='staff_members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_positions')
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, blank=True)
    role = models.ForeignKey(StaffRole, on_delete=models.SET_NULL, null=True, blank=True, related_name='members')
    staff_type = models.CharField(max_length=20, choices=STAFF_TYPE_CHOICES, default='employee')
    is_active = models.BooleanField(default=True)
    orders_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'staff_members'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} ({self.staff_type}) - {self.store.name}"


class IKPU(models.Model):
    """IKPU (Identifikatsion Kodlar va Partiya Uslublari) for products."""
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='ikpu_entries')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='ikpu_entries')
    ikpu_code = models.CharField(max_length=100, blank=True)
    packaging_code = models.CharField(max_length=100, blank=True)
    unit_code = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ikpu'
        unique_together = ['store', 'product']

    def __str__(self):
        return f"IKPU: {self.ikpu_code} - {self.product.name}"
