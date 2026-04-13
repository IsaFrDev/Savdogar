"""
Savdoon - Kengaytirilgan Yetkazib Berish Tizimi
Delivery Expansion Models
"""
from django.db import models
from django.conf import settings


class DeliveryZone(models.Model):
    """Yetkazib berish zonalari"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='delivery_zones')
    name = models.CharField(max_length=100)  # Masalan: "Toshkent shahar", "Toshkent viloyat"
    name_uz = models.CharField(max_length=100, blank=True)
    name_ru = models.CharField(max_length=100, blank=True)
    
    # Zone geometry (polygon coordinates)
    zone_coordinates = models.JSONField(help_text="Array of [lat, lng] coordinates defining the zone")
    
    # Delivery settings
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_per_km = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_order_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    estimated_time_minutes = models.PositiveIntegerField(default=60)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'delivery_zones'
        indexes = [
            models.Index(fields=['store', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.store.name}"


class DeliveryProvider(models.Model):
    """Yetkazib beruvchi xizmatlar"""
    PROVIDER_TYPES = [
        ('in_house', 'O\'z kuryerlarimiz'),
        ('yandex', 'Yandex Delivery'),
        ('partner', 'Hamkor xizmat'),
        ('pickup', 'Olib ketish'),
    ]
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='delivery_providers')
    name = models.CharField(max_length=100)
    provider_type = models.CharField(max_length=20, choices=PROVIDER_TYPES, default='in_house')
    
    # API Integration
    api_key = models.CharField(max_length=200, blank=True)
    api_endpoint = models.URLField(blank=True)
    webhook_url = models.URLField(blank=True)
    
    # Pricing
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    min_delivery_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'delivery_providers'
    
    def __str__(self):
        return f"{self.name} ({self.provider_type})"


class DeliveryTimeSlot(models.Model):
    """Yetkazib berish vaqtini tanlash"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='delivery_time_slots')
    day_of_week = models.PositiveIntegerField(
        choices=[
            (0, 'Dushanba'),
            (1, 'Seshanba'),
            (2, 'Chorshanba'),
            (3, 'Payshanba'),
            (4, 'Juma'),
            (5, 'Shanba'),
            (6, 'Yakshanba'),
        ]
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    max_orders = models.PositiveIntegerField(default=50, help_text="Maximum orders in this slot")
    current_orders = models.PositiveIntegerField(default=0)
    
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'delivery_time_slots'
        unique_together = ['store', 'day_of_week', 'start_time', 'end_time']
    
    def __str__(self):
        return f"{self.get_day_of_week_display()}: {self.start_time}-{self.end_time}"


class PickupPoint(models.Model):
    """Olib ketish nuqtalari"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='pickup_points')
    name = models.CharField(max_length=200)
    name_uz = models.CharField(max_length=200, blank=True)
    name_ru = models.CharField(max_length=200, blank=True)
    
    address = models.TextField()
    address_uz = models.TextField(blank=True)
    address_ru = models.TextField(blank=True)
    
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    
    # Working hours
    opening_time = models.TimeField(default='09:00')
    closing_time = models.TimeField(default='18:00')
    working_hours_note = models.CharField(max_length=200, blank=True)
    
    # Contact
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    
    # Features
    is_active = models.BooleanField(default=True)
    has_parking = models.BooleanField(default=False)
    is_24_7 = models.BooleanField(default=False)
    
    photo = models.ImageField(upload_to='pickup_points/', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'pickup_points'
        indexes = [
            models.Index(fields=['latitude', 'longitude']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.address}"
    
    @property
    def is_open_now(self):
        from django.utils import timezone
        now = timezone.now().time()
        return self.opening_time <= now <= self.closing_time


class DeliveryRoute(models.Model):
    """Kuryer marshruti"""
    courier = models.ForeignKey('delivery.Courier', on_delete=models.CASCADE, related_name='routes')
    date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=[
            ('planned', 'Rejalashtirilgan'),
            ('in_progress', 'Jarayonda'),
            ('completed', 'Tugallandi'),
            ('cancelled', 'Bekor qilindi'),
        ],
        default='planned'
    )
    
    total_orders = models.PositiveIntegerField(default=0)
    completed_orders = models.PositiveIntegerField(default=0)
    total_distance_km = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    estimated_duration_minutes = models.PositiveIntegerField(default=0)
    
    # Route optimization
    optimized_route = models.JSONField(default=list, help_text="Ordered list of delivery coordinates")
    
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'delivery_routes'
        indexes = [
            models.Index(fields=['courier', 'date']),
        ]
    
    def __str__(self):
        return f"Route {self.id} - {self.courier.user.get_full_name()} - {self.date}"


class DeliveryPricing(models.Model):
    """Yetkazib berish narxlari (avtomatik hisoblash)"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='delivery_pricing_rules')
    
    # Pricing method
    pricing_method = models.CharField(
        max_length=20,
        choices=[
            ('fixed', 'Fixed price'),
            ('distance', 'Distance-based'),
            ('weight', 'Weight-based'),
            ('order_value', 'Order value-based'),
            ('zone', 'Zone-based'),
        ],
        default='fixed'
    )
    
    # Rules
    min_distance_km = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    max_distance_km = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    price_per_km = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_per_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Free delivery conditions
    free_delivery_min_order = models.DecimalField(
        max_digits=12, decimal_places=2,
        default=0,
        help_text="Free delivery for orders above this amount"
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'delivery_pricing'
    
    def __str__(self):
        return f"{self.store.name} - {self.pricing_method} - {self.base_price}"
    
    def calculate_price(self, distance_km=None, weight_kg=None, order_value=None):
        """Yetkazib berish narxini avtomatik hisoblash"""
        if order_value and order_value >= self.free_delivery_min_order:
            return 0
        
        if self.pricing_method == 'fixed':
            return self.base_price
        elif self.pricing_method == 'distance' and distance_km:
            return self.base_price + (distance_km * self.price_per_km)
        elif self.pricing_method == 'weight' and weight_kg:
            return self.base_price + (weight_kg * self.price_per_kg)
        elif self.pricing_method == 'order_value' and order_value:
            percentage = (self.price_per_km / 100)  # Using price_per_km as percentage
            return order_value * percentage
        
        return self.base_price
