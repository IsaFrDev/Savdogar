from django.db import models
from django.conf import settings


class Courier(models.Model):
    """Courier model for handling deliveries."""
    
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('busy', 'Busy'),
        ('offline', 'Offline'),
    ]
    
    VEHICLE_CHOICES = [
        ('bike', 'Bicycle'),
        ('scooter', 'Scooter'),
        ('car', 'Car'),
        ('foot', 'Walking'),
    ]
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='courier_profile'
    )
    store = models.ForeignKey(
        'stores.Store', 
        on_delete=models.CASCADE, 
        related_name='couriers',
        null=True,
        blank=True
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='offline')
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_CHOICES, default='bike')
    is_active = models.BooleanField(default=True)
    
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    last_location_update = models.DateTimeField(auto_now=True)
    
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    completed_deliveries = models.PositiveIntegerField(default=0)
    
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'couriers'
        ordering = ['-rating', '-completed_deliveries']
    
    def __str__(self):
        return f"{self.user.username} ({self.status})"
