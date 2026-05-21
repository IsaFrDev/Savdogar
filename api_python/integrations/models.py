from django.db import models
from django.conf import settings
from stores.models import Store
import uuid


# ==========================================
# PAYMENT GATEWAYS
# ==========================================

class PaymentGateway(models.Model):
    """Payment gateway configuration (Payme, Click, Paynet)"""
    
    GATEWAY_CHOICES = [
        ('payme', 'Payme'),
        ('click', 'Click'),
        ('paynet', 'Paynet'),
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
    ]
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='payment_gateways')
    gateway_type = models.CharField(max_length=20, choices=GATEWAY_CHOICES)
    is_active = models.BooleanField(default=False)
    
    # Payme credentials
    payme_merchant_id = models.CharField(max_length=100, blank=True)
    payme_key = models.CharField(max_length=255, blank=True)
    
    # Click credentials
    click_merchant_id = models.CharField(max_length=100, blank=True)
    click_secret_key = models.CharField(max_length=255, blank=True)
    click_service_id = models.CharField(max_length=100, blank=True)
    
    # Paynet credentials
    paynet_merchant_id = models.CharField(max_length=100, blank=True)
    paynet_terminal_key = models.CharField(max_length=255, blank=True)
    
    # Stripe credentials
    stripe_publishable_key = models.CharField(max_length=255, blank=True)
    stripe_secret_key = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['store', 'gateway_type']
    
    def __str__(self):
        return f"{self.store.name} - {self.get_gateway_type_display()}"


class PaymentTransaction(models.Model):
    """Payment transaction record"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('cancelled', 'Cancelled'),
    ]
    
    transaction_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='payment_transactions')
    gateway = models.ForeignKey(PaymentGateway, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Order reference
    order_id = models.IntegerField(null=True, blank=True)
    order_number = models.CharField(max_length=50, blank=True)
    
    # Payment details
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='UZS')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Gateway response
    gateway_transaction_id = models.CharField(max_length=100, blank=True)
    gateway_response = models.JSONField(default=dict, blank=True)
    
    # Metadata
    customer_name = models.CharField(max_length=255, blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)
    
    # Callback data
    callback_url = models.URLField(blank=True)
    return_url = models.URLField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.transaction_id} - {self.amount} {self.currency} ({self.status})"
    
    def mark_completed(self, gateway_response=None):
        """Mark transaction as completed"""
        self.status = 'completed'
        self.gateway_response = gateway_response or self.gateway_response
        from django.utils import timezone
        self.completed_at = timezone.now()
        self.save()


# ==========================================
# MARKETPLACE INTEGRATIONS
# ==========================================

class MarketplaceIntegration(models.Model):
    """Marketplace API connection (Uzum, WB, Ozon)"""
    
    MARKETPLACE_CHOICES = [
        ('uzum', 'Uzum Market'),
        ('wildberries', 'Wildberries'),
        ('ozon', 'Ozon'),
        ('amazon', 'Amazon'),
        ('ebay', 'eBay'),
    ]
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='marketplace_integrations')
    marketplace_type = models.CharField(max_length=20, choices=MARKETPLACE_CHOICES)
    is_active = models.BooleanField(default=False)
    is_syncing = models.BooleanField(default=False)
    last_sync_at = models.DateTimeField(null=True, blank=True)
    
    # API credentials
    api_key = models.CharField(max_length=255, blank=True)
    api_secret = models.CharField(max_length=255, blank=True)
    api_token = models.TextField(blank=True, help_text="JSON token data")
    
    # Store mapping
    marketplace_store_id = models.CharField(max_length=100, blank=True, help_text="Store ID on marketplace")
    marketplace_warehouse_id = models.CharField(max_length=100, blank=True, help_text="Warehouse ID on marketplace")
    
    # Sync settings
    sync_products = models.BooleanField(default=True)
    sync_orders = models.BooleanField(default=True)
    sync_inventory = models.BooleanField(default=True)
    sync_prices = models.BooleanField(default=True)
    sync_interval_minutes = models.IntegerField(default=30, help_text="Auto-sync interval")
    
    # Price markup
    price_markup_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Price increase %")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['store', 'marketplace_type']
    
    def __str__(self):
        return f"{self.store.name} - {self.get_marketplace_type_display()}"


class MarketplaceProduct(models.Model):
    """Product mapping between Savdoon and marketplace"""
    
    SYNC_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('synced', 'Synced'),
        ('error', 'Error'),
        ('skipped', 'Skipped'),
    ]
    
    integration = models.ForeignKey(MarketplaceIntegration, on_delete=models.CASCADE, related_name='marketplace_products')
    
    # Local product
    local_product_id = models.IntegerField(help_text="Product ID in Savdoon")
    
    # Marketplace product
    marketplace_product_id = models.CharField(max_length=100, blank=True, help_text="Product ID on marketplace")
    marketplace_sku = models.CharField(max_length=100, blank=True)
    
    # Sync info
    sync_status = models.CharField(max_length=20, choices=SYNC_STATUS_CHOICES, default='pending')
    last_synced_at = models.DateTimeField(null=True, blank=True)
    sync_error = models.TextField(blank=True)
    
    # Marketplace specific data
    marketplace_data = models.JSONField(default=dict, blank=True, help_text="Raw marketplace product data")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['integration', 'local_product_id']
    
    def __str__(self):
        return f"Product {self.local_product_id} -> {self.marketplace_product_id}"


class MarketplaceOrder(models.Model):
    """Order from marketplace"""
    
    STATUS_CHOICES = [
        ('new', 'New'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('returned', 'Returned'),
    ]
    
    integration = models.ForeignKey(MarketplaceIntegration, on_delete=models.CASCADE, related_name='marketplace_orders')
    
    # Marketplace order info
    marketplace_order_id = models.CharField(max_length=100, unique=True, help_text="Order ID from marketplace")
    marketplace_order_number = models.CharField(max_length=100, blank=True)
    
    # Local order reference
    local_order_id = models.IntegerField(null=True, blank=True, help_text="Linked local order ID")
    
    # Order details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='UZS')
    
    # Customer info
    customer_name = models.CharField(max_length=255, blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)
    delivery_address = models.TextField(blank=True)
    
    # Items
    items_data = models.JSONField(default=list, help_text="Order items from marketplace")
    
    # Sync info
    is_synced_to_local = models.BooleanField(default=False, help_text="Created as local order")
    last_synced_at = models.DateTimeField(null=True, blank=True)
    
    # Raw data
    marketplace_data = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.marketplace_order_number} - {self.total_amount} {self.currency}"


class MarketplaceInventoryLog(models.Model):
    """Inventory sync log for marketplace"""
    
    SYNC_TYPE_CHOICES = [
        ('push', 'Push to Marketplace'),
        ('pull', 'Pull from Marketplace'),
        ('conflict', 'Conflict Resolution'),
    ]
    
    integration = models.ForeignKey(MarketplaceIntegration, on_delete=models.CASCADE)
    product_id = models.IntegerField()
    sync_type = models.CharField(max_length=20, choices=SYNC_TYPE_CHOICES)
    
    # Stock levels
    local_stock = models.IntegerField()
    marketplace_stock = models.IntegerField()
    synced_stock = models.IntegerField()
    
    # Result
    success = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Product {self.product_id} - {self.sync_type}"


# ==========================================
# DELIVERY INTEGRATIONS
# ==========================================

class DeliveryIntegration(models.Model):
    """Delivery service integration (Yandex Go, etc.)"""
    
    SERVICE_CHOICES = [
        ('yandex_go', 'Yandex Go'),
        ('uber_delivery', 'Uber Delivery'),
        ('dhl', 'DHL'),
        ('fedex', 'FedEx'),
        ('local_courier', 'Local Courier'),
    ]
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='delivery_integrations')
    service_type = models.CharField(max_length=30, choices=SERVICE_CHOICES)
    is_active = models.BooleanField(default=False)
    
    # API credentials
    api_key = models.CharField(max_length=255, blank=True)
    api_secret = models.CharField(max_length=255, blank=True)
    api_token = models.TextField(blank=True)
    
    # Settings
    default_vehicle_type = models.CharField(max_length=50, default='courier', help_text="courier, car, truck")
    max_delivery_distance_km = models.IntegerField(default=50)
    base_delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=15000)
    per_km_fee = models.DecimalField(max_digits=10, decimal_places=2, default=2000)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['store', 'service_type']
    
    def __str__(self):
        return f"{self.store.name} - {self.get_service_type_display()}"


class DeliveryRequest(models.Model):
    """Delivery request to external service"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('searching', 'Searching for courier'),
        ('assigned', 'Courier assigned'),
        ('picked_up', 'Picked up'),
        ('in_transit', 'In transit'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('failed', 'Failed'),
    ]
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='delivery_requests')
    delivery_integration = models.ForeignKey(DeliveryIntegration, on_delete=models.SET_NULL, null=True, blank=True)
    order_id = models.IntegerField()
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    external_request_id = models.CharField(max_length=100, blank=True, help_text="Request ID from delivery service")
    
    # Pickup info
    pickup_address = models.TextField()
    pickup_lat = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    pickup_lon = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    
    # Delivery info
    delivery_address = models.TextField()
    delivery_lat = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    delivery_lon = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    
    # Courier info
    courier_name = models.CharField(max_length=255, blank=True)
    courier_phone = models.CharField(max_length=20, blank=True)
    courier_vehicle = models.CharField(max_length=100, blank=True)
    
    # Pricing
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Tracking
    tracking_url = models.URLField(blank=True)
    estimated_delivery_time = models.DateTimeField(null=True, blank=True)
    actual_delivery_time = models.DateTimeField(null=True, blank=True)
    
    # Raw data
    request_data = models.JSONField(default=dict, blank=True)
    response_data = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Order {self.order_id} - {self.status}"
