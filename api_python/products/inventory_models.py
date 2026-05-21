"""
Savdoon - Inventarizatsiya va Ombor Boshqaruvi
Inventory & Warehouse Management Models
"""
from django.db import models
from django.conf import settings


class Warehouse(models.Model):
    """Omborxona"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='warehouses')
    name = models.CharField(max_length=200)
    name_uz = models.CharField(max_length=200, blank=True)
    name_ru = models.CharField(max_length=200, blank=True)
    
    # Location
    address = models.TextField()
    address_uz = models.TextField(blank=True)
    address_ru = models.TextField(blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    
    # Capacity
    total_capacity = models.PositiveIntegerField(help_text="Total storage capacity in units")
    current_utilization = models.PositiveIntegerField(default=0)
    
    # Management
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_warehouses'
    )
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    
    # Settings
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'warehouses'
        indexes = [
            models.Index(fields=['store', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.store.name}"
    
    @property
    def utilization_percentage(self):
        if self.total_capacity > 0:
            return (self.current_utilization / self.total_capacity) * 100
        return 0


class WarehouseZone(models.Model):
    """Ombor zonalar (A, B, C, etc.)"""
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='zones')
    name = models.CharField(max_length=50)  # "Zone A", "Cold Storage"
    zone_type = models.CharField(
        max_length=20,
        choices=[
            ('general', 'General'),
            ('cold_storage', 'Cold Storage'),
            ('hazardous', 'Hazardous Materials'),
            ('high_value', 'High Value Items'),
            ('returns', 'Returns Area'),
        ],
        default='general'
    )
    capacity = models.PositiveIntegerField()
    
    class Meta:
        db_table = 'warehouse_zones'
        unique_together = ['warehouse', 'name']
    
    def __str__(self):
        return f"{self.warehouse.name} - {self.name}"


class StockLocation(models.Model):
    """Aniq joylashuv (shelf, rack, bin)"""
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='stock_locations')
    zone = models.ForeignKey(WarehouseZone, on_delete=models.CASCADE, related_name='locations')
    
    location_code = models.CharField(max_length=50, help_text="A-01-02 (Zone-Rack-Shelf)")
    location_type = models.CharField(
        max_length=20,
        choices=[
            ('shelf', 'Shelf'),
            ('rack', 'Rack'),
            ('bin', 'Bin'),
            ('pallet', 'Pallet'),
            ('floor', 'Floor'),
        ],
        default='shelf'
    )
    
    capacity = models.PositiveIntegerField(default=100)
    is_available = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'stock_locations'
        unique_together = ['warehouse', 'location_code']
    
    def __str__(self):
        return f"{self.warehouse.name} - {self.location_code}"


class WarehouseProduct(models.Model):
    """Ombordagi mahsulotlar"""
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='products')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='warehouse_stocks')
    location = models.ForeignKey(StockLocation, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    
    quantity = models.PositiveIntegerField(default=0)
    reserved_quantity = models.PositiveIntegerField(default=0, help_text="Reserved for pending orders")
    
    # Tracking
    min_stock_level = models.PositiveIntegerField(default=5, help_text="Reorder point")
    max_stock_level = models.PositiveIntegerField(default=1000)
    
    # Batch tracking
    has_batch_tracking = models.BooleanField(default=False)
    has_expiry_tracking = models.BooleanField(default=False)
    
    last_stock_check = models.DateTimeField(null=True, blank=True)
    last_restocked = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'warehouse_products'
        unique_together = ['warehouse', 'product']
        indexes = [
            models.Index(fields=['product', 'quantity']),
        ]
    
    def __str__(self):
        return f"{self.product.name} @ {self.warehouse.name}: {self.quantity}"
    
    @property
    def available_quantity(self):
        return self.quantity - self.reserved_quantity
    
    @property
    def needs_reorder(self):
        return self.available_quantity <= self.min_stock_level
    
    @property
    def is_overstocked(self):
        return self.quantity >= self.max_stock_level


class Batch(models.Model):
    """Batch/Lot tracking"""
    warehouse_product = models.ForeignKey(WarehouseProduct, on_delete=models.CASCADE, related_name='batches')
    batch_number = models.CharField(max_length=100, db_index=True)
    supplier_batch_number = models.CharField(max_length=100, blank=True)
    
    quantity = models.PositiveIntegerField()
    remaining_quantity = models.PositiveIntegerField()
    
    # Dates
    manufacturing_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    received_date = models.DateField(auto_now_add=True)
    
    # Pricing
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('available', 'Available'),
            ('reserved', 'Reserved'),
            ('expired', 'Expired'),
            ('damaged', 'Damaged'),
            ('returned', 'Returned'),
        ],
        default='available'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'batches'
        indexes = [
            models.Index(fields=['batch_number']),
            models.Index(fields=['expiry_date']),
        ]
    
    def __str__(self):
        return f"Batch {self.batch_number} - {self.warehouse_product.product.name}"
    
    @property
    def is_expired(self):
        from django.utils import timezone
        if self.expiry_date:
            return self.expiry_date < timezone.now().date()
        return False
    
    @property
    def days_until_expiry(self):
        from django.utils import timezone
        if self.expiry_date:
            delta = self.expiry_date - timezone.now().date()
            return delta.days
        return None


class StockMovement(models.Model):
    """Ombor harakatlari"""
    MOVEMENT_TYPES = [
        ('in', 'Stock In'),
        ('out', 'Stock Out'),
        ('transfer', 'Transfer'),
        ('adjustment', 'Adjustment'),
        ('return', 'Return'),
        ('damage', 'Damage/Loss'),
        ('audit', 'Audit Correction'),
    ]
    
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='stock_movements')
    warehouse_product = models.ForeignKey(WarehouseProduct, on_delete=models.CASCADE, related_name='movements')
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name='movements')
    
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField(help_text="Positive for IN, negative for OUT")
    
    # Reference
    reference_type = models.CharField(max_length=50, blank=True, help_text="order, purchase_order, return, etc.")
    reference_id = models.PositiveIntegerField(null=True, blank=True)
    
    # Details
    notes = models.TextField(blank=True)
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Stock snapshot
    stock_before = models.PositiveIntegerField()
    stock_after = models.PositiveIntegerField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'stock_movements'
        indexes = [
            models.Index(fields=['warehouse_product', 'created_at']),
            models.Index(fields=['movement_type', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.movement_type}: {self.warehouse_product.product.name} ({self.quantity})"


class StockTransfer(models.Model):
    """Omborlararo transfer"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_transit', 'In Transit'),
        ('received', 'Received'),
        ('cancelled', 'Cancelled'),
    ]
    
    transfer_number = models.CharField(max_length=50, unique=True, db_index=True)
    
    from_warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='outgoing_transfers'
    )
    to_warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='incoming_transfers'
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='requested_transfers')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_transfers')
    
    notes = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'stock_transfers'
        ordering = ['-requested_at']
    
    def __str__(self):
        return f"Transfer {self.transfer_number}: {self.from_warehouse.name} → {self.to_warehouse.name}"


class StockTransferItem(models.Model):
    """Transfer itemlari"""
    transfer = models.ForeignKey(StockTransfer, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    
    quantity_requested = models.PositiveIntegerField()
    quantity_sent = models.PositiveIntegerField(default=0)
    quantity_received = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'stock_transfer_items'
    
    def __str__(self):
        return f"{self.product.name} x {self.quantity_requested}"


class StockAlert(models.Model):
    """Ombor ogohlantirishlari"""
    ALERT_TYPES = [
        ('low_stock', 'Low Stock'),
        ('out_of_stock', 'Out of Stock'),
        ('overstock', 'Overstock'),
        ('expiring_soon', 'Expiring Soon'),
        ('expired', 'Expired'),
        ('negative_stock', 'Negative Stock'),
    ]
    
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='alerts')
    warehouse_product = models.ForeignKey(WarehouseProduct, on_delete=models.CASCADE, related_name='alerts')
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name='alerts')
    
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='medium')
    
    message = models.TextField()
    current_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    threshold_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'stock_alerts'
        indexes = [
            models.Index(fields=['warehouse', 'is_resolved']),
            models.Index(fields=['alert_type', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.alert_type}: {self.warehouse_product.product.name} ({self.severity})"
