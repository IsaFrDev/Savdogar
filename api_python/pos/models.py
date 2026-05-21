"""
POS (Point of Sale) Models
Cash register, transactions, receipts for in-store sales
"""
from django.db import models
from django.conf import settings
from decimal import Decimal


class CashRegister(models.Model):
    """Cash register/terminal for POS"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='cash_registers')
    name = models.CharField(max_length=100, default="Main Register")
    register_code = models.CharField(max_length=50, unique=True)
    is_active = models.BooleanField(default=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    starting_cash = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    ending_cash = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    expected_cash = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    actual_cash = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cashier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pos_cash_registers'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.store.name} - {self.name}"

    @property
    def difference(self):
        """Cash difference (actual - expected)"""
        return self.actual_cash - self.expected_cash

    @property
    def total_sales(self):
        """Total sales for this register session"""
        transactions = self.transactions.filter(status='completed')
        return transactions.aggregate(total=models.Sum('total'))['total'] or Decimal('0')


class POSSession(models.Model):
    """POS session (shift)"""
    register = models.ForeignKey(CashRegister, on_delete=models.CASCADE, related_name='sessions')
    cashier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    starting_cash = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    ending_cash = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(
        max_length=20,
        choices=[
            ('open', 'Open'),
            ('closed', 'Closed'),
            ('suspended', 'Suspended'),
        ],
        default='open'
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'pos_sessions'
        ordering = ['-started_at']

    def __str__(self):
        return f"Session {self.id} - {self.register.name}"


class POSTransaction(models.Model):
    """Individual POS transaction"""
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('qr', 'QR Code'),
        ('mixed', 'Mixed'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('refunded', 'Refunded'),
        ('voided', 'Voided'),
    ]

    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='pos_transactions')
    register = models.ForeignKey(CashRegister, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    session = models.ForeignKey(POSSession, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    cashier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    
    transaction_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='cash')
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    change_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    customer_name = models.CharField(max_length=200, blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'pos_transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f"Transaction {self.transaction_number} - {self.total}"

    def save(self, *args, **kwargs):
        if not self.transaction_number:
            # Generate unique transaction number
            import uuid
            from datetime import datetime
            date_str = datetime.now().strftime('%Y%m%d')
            self.transaction_number = f"POS-{date_str}-{str(uuid.uuid4())[:8].upper()}"
        
        # Calculate change
        if self.amount_paid > 0:
            self.change_amount = self.amount_paid - self.total
        
        super().save(*args, **kwargs)


class POSTransactionItem(models.Model):
    """Individual items in a POS transaction"""
    transaction = models.ForeignKey(POSTransaction, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=255)  # Store name in case product is deleted
    barcode = models.CharField(max_length=100, blank=True)
    
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'pos_transaction_items'
        ordering = ['id']

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"

    def save(self, *args, **kwargs):
        # Calculate totals
        self.subtotal = self.quantity * self.unit_price
        self.total = self.subtotal - self.discount + (self.subtotal * self.tax_rate / 100)
        super().save(*args, **kwargs)


class POSReceipt(models.Model):
    """Receipt for POS transaction"""
    transaction = models.OneToOneField(POSTransaction, on_delete=models.CASCADE, related_name='receipt')
    receipt_number = models.CharField(max_length=50, unique=True)
    fiscal_number = models.CharField(max_length=100, blank=True, help_text="Fiscal receipt number")
    qr_code = models.CharField(max_length=500, blank=True, help_text="QR code data for verification")
    
    printed = models.BooleanField(default=False)
    printed_at = models.DateTimeField(null=True, blank=True)
    emailed = models.BooleanField(default=False)
    emailed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pos_receipts'
        ordering = ['-created_at']

    def __str__(self):
        return f"Receipt {self.receipt_number}"

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            import uuid
            self.receipt_number = f"RCP-{str(uuid.uuid4())[:10].upper()}"
        super().save(*args, **kwargs)


class POSRefund(models.Model):
    """Refund for POS transaction"""
    REASON_CHOICES = [
        ('defective', 'Defective Product'),
        ('wrong_item', 'Wrong Item'),
        ('customer_request', 'Customer Request'),
        ('other', 'Other'),
    ]

    original_transaction = models.ForeignKey(POSTransaction, on_delete=models.CASCADE, related_name='refunds')
    refund_transaction = models.OneToOneField(POSTransaction, on_delete=models.CASCADE, related_name='refund_record')
    
    reason = models.CharField(max_length=30, choices=REASON_CHOICES)
    reason_details = models.TextField(blank=True)
    
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2)
    refund_method = models.CharField(max_length=20, choices=POSTransaction.PAYMENT_METHODS, default='cash')
    
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='approved_refunds')
    processed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pos_refunds'
        ordering = ['-processed_at']

    def __str__(self):
        return f"Refund for {self.original_transaction.transaction_number}"


class Barcode(models.Model):
    """Product barcode mapping"""
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='barcodes')
    barcode = models.CharField(max_length=100, unique=True, db_index=True)
    barcode_type = models.CharField(
        max_length=20,
        choices=[
            ('ean13', 'EAN-13'),
            ('ean8', 'EAN-8'),
            ('upc', 'UPC'),
            ('code128', 'Code 128'),
            ('qr', 'QR Code'),
            ('custom', 'Custom'),
        ],
        default='ean13'
    )
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pos_barcodes'
        ordering = ['-is_primary', '-created_at']

    def __str__(self):
        return f"{self.barcode} - {self.product.name}"
