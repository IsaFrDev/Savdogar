"""
ERP (Enterprise Resource Planning) Models
Purchase orders, vendors, supply chain, advanced inventory
"""
from django.db import models
from django.conf import settings
from decimal import Decimal
from datetime import date, timedelta


class Vendor(models.Model):
    """Supplier/Vendor management"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='vendors')
    name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    tax_id = models.CharField(max_length=50, blank=True, help_text="Tax identification number")
    payment_terms = models.CharField(
        max_length=50,
        choices=[
            ('net_15', 'Net 15 days'),
            ('net_30', 'Net 30 days'),
            ('net_60', 'Net 60 days'),
            ('cod', 'Cash on Delivery'),
            ('prepaid', 'Prepaid'),
        ],
        default='net_30'
    )
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.0, help_text="Vendor rating (0-10)")
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'erp_vendors'
        ordering = ['name']

    def __str__(self):
        return self.name


class ERPPurchaseOrder(models.Model):
    """Purchase order from vendor"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent to Vendor'),
        ('confirmed', 'Confirmed'),
        ('partial', 'Partially Received'),
        ('received', 'Fully Received'),
        ('cancelled', 'Cancelled'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='erp_purchase_orders')
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT, related_name='purchase_orders')
    
    po_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    
    order_date = models.DateField(default=date.today)
    expected_delivery = models.DateField(null=True, blank=True)
    actual_delivery = models.DateField(null=True, blank=True)
    
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    payment_status = models.CharField(
        max_length=20,
        choices=[
            ('unpaid', 'Unpaid'),
            ('partial', 'Partially Paid'),
            ('paid', 'Paid'),
        ],
        default='unpaid'
    )
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='approved_pos')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    internal_notes = models.TextField(blank=True, help_text="Internal notes (not sent to vendor)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'erp_purchase_orders'
        ordering = ['-order_date']

    def __str__(self):
        return f"PO {self.po_number} - {self.vendor.name}"

    def save(self, *args, **kwargs):
        if not self.po_number:
            import uuid
            date_str = self.order_date.strftime('%Y%m%d')
            self.po_number = f"PO-{date_str}-{str(uuid.uuid4())[:6].upper()}"
        
        # Calculate total
        self.total = self.subtotal + self.tax_amount + self.shipping_cost - self.discount_amount
        super().save(*args, **kwargs)


class ERPPurchaseOrderItem(models.Model):
    """Individual items in a purchase order"""
    purchase_order = models.ForeignKey(ERPPurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=255)  # Store name in case product is deleted
    sku = models.CharField(max_length=100, blank=True)
    
    quantity_ordered = models.DecimalField(max_digits=10, decimal_places=2)
    quantity_received = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity_pending = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2)
    
    expected_date = models.DateField(null=True, blank=True)
    received_date = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = 'erp_purchase_order_items'
        ordering = ['id']

    def __str__(self):
        return f"{self.product_name} x {self.quantity_ordered}"

    def save(self, *args, **kwargs):
        self.total_cost = self.quantity_ordered * self.unit_cost
        self.quantity_pending = self.quantity_ordered - self.quantity_received
        super().save(*args, **kwargs)


class StockReorderRule(models.Model):
    """Automatic stock reorder rules"""
    TRIGGER_CHOICES = [
        ('min_stock', 'Minimum Stock Level'),
        ('forecast', 'Demand Forecast'),
        ('seasonal', 'Seasonal Pattern'),
    ]

    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='reorder_rules')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='reorder_rules')
    
    trigger_type = models.CharField(max_length=20, choices=TRIGGER_CHOICES, default='min_stock')
    min_stock_level = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    reorder_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    preferred_vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    auto_create_po = models.BooleanField(default=False, help_text="Automatically create PO when triggered")
    last_triggered = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'erp_stock_reorder_rules'
        unique_together = ['store', 'product']
        ordering = ['product__name']

    def __str__(self):
        return f"Reorder rule for {self.product.name}"

    def check_and_trigger(self):
        """Check if reorder is needed"""
        if not self.is_active:
            return False
        
        if self.product.stock_quantity <= self.min_stock_level:
            self.last_triggered = models.DateTimeField(auto_now=True)
            self.save()
            return True
        return False


class Shipment(models.Model):
    """Incoming shipment tracking"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_transit', 'In Transit'),
        ('customs', 'At Customs'),
        ('arrived', 'Arrived'),
        ('received', 'Received'),
        ('delayed', 'Delayed'),
    ]

    CARRIER_CHOICES = [
        ('vendor', 'Vendor Delivery'),
        ('courier', 'Courier Service'),
        ('freight', 'Freight'),
        ('air', 'Air Freight'),
        ('sea', 'Sea Freight'),
        ('rail', 'Rail'),
    ]

    purchase_order = models.ForeignKey(ERPPurchaseOrder, on_delete=models.CASCADE, related_name='shipments')
    tracking_number = models.CharField(max_length=100, blank=True)
    carrier = models.CharField(max_length=20, choices=CARRIER_CHOICES, default='vendor')
    carrier_name = models.CharField(max_length=255, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    shipped_date = models.DateField(null=True, blank=True)
    estimated_arrival = models.DateField(null=True, blank=True)
    actual_arrival = models.DateField(null=True, blank=True)
    
    origin_address = models.TextField(blank=True)
    destination_warehouse = models.ForeignKey('products.Warehouse', on_delete=models.SET_NULL, null=True, blank=True)
    
    package_count = models.PositiveIntegerField(default=1)
    weight_kg = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'erp_shipments'
        ordering = ['-estimated_arrival']

    def __str__(self):
        return f"Shipment {self.tracking_number or self.id}"


class WarehouseTransfer(models.Model):
    """Inter-warehouse stock transfers"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('approved', 'Approved'),
        ('in_transit', 'In Transit'),
        ('received', 'Received'),
        ('cancelled', 'Cancelled'),
    ]

    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='erp_warehouse_transfers')
    transfer_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    source_warehouse = models.ForeignKey('products.Warehouse', on_delete=models.PROTECT, related_name='erp_outgoing_transfers')
    destination_warehouse = models.ForeignKey('products.Warehouse', on_delete=models.PROTECT, related_name='erp_incoming_transfers')
    
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='erp_approved_transfers')
    
    transfer_date = models.DateField(default=date.today)
    completed_date = models.DateField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'erp_warehouse_transfers'
        ordering = ['-transfer_date']

    def __str__(self):
        return f"Transfer {self.transfer_number}"

    def save(self, *args, **kwargs):
        if not self.transfer_number:
            import uuid
            date_str = self.transfer_date.strftime('%Y%m%d')
            self.transfer_number = f"WT-{date_str}-{str(uuid.uuid4())[:6].upper()}"
        super().save(*args, **kwargs)


class WarehouseTransferItem(models.Model):
    """Items in warehouse transfer"""
    transfer = models.ForeignKey(WarehouseTransfer, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    
    quantity_requested = models.DecimalField(max_digits=10, decimal_places=2)
    quantity_sent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity_received = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'erp_warehouse_transfer_items'
        ordering = ['id']


class ExpenseCategory(models.Model):
    """Expense categories for accounting"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='expense_categories')
    name = models.CharField(max_length=100)
    name_uz = models.CharField(max_length=100, blank=True)
    name_ru = models.CharField(max_length=100, blank=True)
    code = models.CharField(max_length=20, unique=True)
    is_active = models.BooleanField(default=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories')

    class Meta:
        db_table = 'erp_expense_categories'
        verbose_name_plural = 'Expense categories'
        ordering = ['code']

    def __str__(self):
        return self.name


class Expense(models.Model):
    """Business expense tracking"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='expenses')
    category = models.ForeignKey(ExpenseCategory, on_delete=models.PROTECT, related_name='expenses')
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True)
    purchase_order = models.ForeignKey(ERPPurchaseOrder, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='UZS')
    expense_date = models.DateField(default=date.today)
    payment_method = models.CharField(
        max_length=20,
        choices=[
            ('cash', 'Cash'),
            ('bank', 'Bank Transfer'),
            ('card', 'Card'),
            ('check', 'Check'),
        ],
        default='cash'
    )
    
    receipt_number = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    receipt_image = models.ImageField(upload_to='expenses/', blank=True, null=True)
    
    approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_expenses')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'erp_expenses'
        ordering = ['-expense_date']

    def __str__(self):
        return f"{self.category.name} - {self.amount}"
