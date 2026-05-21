from django.db import models
from django.conf import settings

class PaymentTransaction(models.Model):
    """
    Stores details about payment attempts and results from various providers.
    """
    PROVIDER_CHOICES = [
        ('payme', 'Payme'),
        ('click', 'Click'),
        ('uzum', 'Uzum'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('reversed', 'Reversed'),
        ('partially_refunded', 'Partially Refunded'),
    ]
    
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='UZS')
    
    # Provider-specific tracking
    remote_transaction_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    remote_session_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Detailed logging
    raw_request_log = models.JSONField(default=dict, blank=True)
    raw_response_log = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    
    # Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'payment_transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f"Transaction {self.id} ({self.provider}) - {self.status}"
