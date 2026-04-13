"""
Savdoon - B2B, Social, Support, Supply Chain Models
Advanced Features
"""
from django.db import models
from django.conf import settings


# ==================== B2B FEATURES ====================

class CorporateAccount(models.Model):
    """Korporativ hisob"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='corporate_accounts')
    company_name = models.CharField(max_length=200)
    company_name_uz = models.CharField(max_length=200, blank=True)
    company_name_ru = models.CharField(max_length=200, blank=True)
    
    # Company details
    tax_id = models.CharField(max_length=50, blank=True)
    registration_number = models.CharField(max_length=50, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    company_size = models.CharField(
        max_length=20,
        choices=[
            ('small', '1-50 employees'),
            ('medium', '51-200 employees'),
            ('large', '201-1000 employees'),
            ('enterprise', '1000+ employees'),
        ],
        blank=True
    )
    
    # Contact
    contact_person = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='corporate_accounts')
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    address = models.TextField()
    
    # Credit settings
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    current_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_terms_days = models.PositiveIntegerField(default=30)
    
    # Pricing
    wholesale_discount = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    is_active = models.BooleanField(default=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_corporate_accounts')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'corporate_accounts'
    
    def __str__(self):
        return f"{self.company_name}"


class WholesalePrice(models.Model):
    """Ulgurji narxlar"""
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='wholesale_prices')
    
    min_quantity = models.PositiveIntegerField()
    max_quantity = models.PositiveIntegerField(null=True, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'wholesale_prices'
        ordering = ['min_quantity']
    
    def __str__(self):
        return f"{self.product.name} - {self.min_quantity}+ units @ {self.price}"


class BulkOrder(models.Model):
    """Ulgurji buyurtma"""
    STATUS_CHOICES = [
        ('quote_requested', 'Quote Requested'),
        ('quote_sent', 'Quote Sent'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    
    corporate_account = models.ForeignKey(CorporateAccount, on_delete=models.CASCADE, related_name='bulk_orders')
    order_number = models.CharField(max_length=50, unique=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='quote_requested')
    
    # Order details
    items = models.JSONField(help_text="Array of {product_id, quantity, price}")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Delivery
    delivery_address = models.TextField()
    requested_delivery_date = models.DateField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'bulk_orders'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Bulk Order {self.order_number}"


class Supplier(models.Model):
    """Yetkazib beruvchi"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='suppliers')
    name = models.CharField(max_length=200)
    name_uz = models.CharField(max_length=200, blank=True)
    name_ru = models.CharField(max_length=200, blank=True)
    
    # Contact
    contact_person = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    address = models.TextField()
    website = models.URLField(blank=True)
    
    # Business
    tax_id = models.CharField(max_length=50, blank=True)
    product_categories = models.JSONField(default=list, help_text="Categories they supply")
    
    # Performance
    reliability_score = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    average_lead_time_days = models.PositiveIntegerField(default=7)
    total_orders = models.PositiveIntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'suppliers'
    
    def __str__(self):
        return f"{self.name}"


class PurchaseOrder(models.Model):
    """Xarid buyurtmasi"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent to Supplier'),
        ('confirmed', 'Confirmed by Supplier'),
        ('in_transit', 'In Transit'),
        ('received', 'Received'),
        ('cancelled', 'Cancelled'),
    ]
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='purchase_orders')
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='purchase_orders')
    po_number = models.CharField(max_length=50, unique=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    items = models.JSONField(help_text="Array of {product_id, quantity, unit_price}")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Dates
    order_date = models.DateField()
    expected_delivery_date = models.DateField()
    actual_delivery_date = models.DateField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'purchase_orders'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"PO {self.po_number} - {self.supplier.name}"


# ==================== CUSTOMER SUPPORT ====================

class SupportTicket(models.Model):
    """Qo'llab-quvvatlash chiptalari"""
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('waiting_customer', 'Waiting for Customer'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='support_tickets')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_tickets')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    
    # Ticket details
    subject = models.CharField(max_length=300)
    description = models.TextField()
    category = models.CharField(
        max_length=50,
        choices=[
            ('order_issue', 'Order Issue'),
            ('product_question', 'Product Question'),
            ('technical', 'Technical Issue'),
            ('billing', 'Billing'),
            ('feedback', 'Feedback'),
            ('other', 'Other'),
        ]
    )
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    
    # Related objects
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True)
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Resolution
    resolution = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'support_tickets'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'priority']),
        ]
    
    def __str__(self):
        return f"Ticket #{self.id}: {self.subject}"


class TicketMessage(models.Model):
    """Chipta xabarlari"""
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_ticket_messages')
    
    message = models.TextField()
    attachments = models.JSONField(default=list, blank=True)
    
    is_internal = models.BooleanField(default=False, help_text="Internal note")
    is_read = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ticket_messages'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Message in Ticket #{self.ticket.id}"


class FAQ(models.Model):
    """Ko'p so'raladigan savollar"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='faqs')
    category = models.CharField(max_length=100)
    category_uz = models.CharField(max_length=100, blank=True)
    category_ru = models.CharField(max_length=100, blank=True)
    
    question = models.CharField(max_length=500)
    question_uz = models.CharField(max_length=500)
    question_ru = models.CharField(max_length=500, blank=True)
    
    answer = models.TextField()
    answer_uz = models.TextField()
    answer_ru = models.TextField(blank=True)
    
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    view_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'faqs'
        ordering = ['category', 'order']
    
    def __str__(self):
        return f"FAQ: {self.question}"


# ==================== COMPLIANCE & LEGAL ====================

class TaxRate(models.Model):
    """Soliq stavkalari"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='tax_rates')
    name = models.CharField(max_length=100)
    name_uz = models.CharField(max_length=100, blank=True)
    
    rate_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    tax_type = models.CharField(
        max_length=20,
        choices=[
            ('vat', 'VAT'),
            ('sales_tax', 'Sales Tax'),
            ('excise', 'Excise Tax'),
        ],
        default='vat'
    )
    
    is_active = models.BooleanField(default=True)
    effective_from = models.DateField()
    effective_until = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'tax_rates'
    
    def __str__(self):
        return f"{self.name} ({self.rate_percentage}%)"


class AuditLog(models.Model):
    """Audit trail"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100)
    object_id = models.PositiveIntegerField()
    
    changes = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['user', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.action} on {self.model_name}#{self.object_id}"


# ==================== PERFORMANCE & CACHING ====================

class CacheEntry(models.Model):
    """Database cache"""
    key = models.CharField(max_length=255, unique=True, db_index=True)
    value = models.TextField()
    expires_at = models.DateTimeField(db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'cache_entries'
    
    def __str__(self):
        return f"Cache: {self.key}"


class APIKey(models.Model):
    """API kalitlari"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='api_keys')
    name = models.CharField(max_length=100)
    
    key = models.CharField(max_length=100, unique=True, db_index=True)
    secret = models.CharField(max_length=255)
    
    # Permissions
    permissions = models.JSONField(default=list, help_text="['read:products', 'write:orders']")
    rate_limit = models.PositiveIntegerField(default=1000, help_text="Requests per hour")
    
    # Status
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'api_keys'
    
    def __str__(self):
        return f"API Key: {self.name}"


class Webhook(models.Model):
    """Webhook integrations"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='webhooks')
    name = models.CharField(max_length=100)
    url = models.URLField()
    
    events = models.JSONField(help_text="['order.created', 'product.updated']")
    secret = models.CharField(max_length=255, blank=True)
    
    is_active = models.BooleanField(default=True)
    last_triggered_at = models.DateTimeField(null=True, blank=True)
    failure_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'webhooks'
    
    def __str__(self):
        return f"Webhook: {self.name} -> {self.url}"
