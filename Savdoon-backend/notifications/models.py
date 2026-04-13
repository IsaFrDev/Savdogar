from django.db import models
from django.conf import settings

class Notification(models.Model):
    TYPES = (
        ('order', 'Order'),
        ('system', 'System'),
        ('promo', 'Promotion'),
        ('store_approval', 'Store Approval'),
        ('store_rejected', 'Store Rejected'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPES, default='system')
    
    title = models.CharField(max_length=200)
    title_uz = models.CharField(max_length=200, null=True, blank=True)
    title_ru = models.CharField(max_length=200, null=True, blank=True)
    
    message = models.TextField()
    message_uz = models.TextField(null=True, blank=True)
    message_ru = models.TextField(null=True, blank=True)
    
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True)
    store = models.ForeignKey('stores.Store', on_delete=models.SET_NULL, null=True, blank=True)
    
    # For store rejection
    rejection_reason = models.TextField(blank=True, help_text="Reason for store rejection")
    rejection_reason_uz = models.TextField(blank=True)
    rejection_reason_ru = models.TextField(blank=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type}: {self.title} for {self.user.email}"
