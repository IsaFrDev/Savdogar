from django.db import models
from django.utils import timezone


class Reel(models.Model):
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='reels')
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True, blank=True, related_name='reels')
    video = models.FileField(upload_to='reels/')
    caption = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    views_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Reel {self.id} ({self.store.name})"


class GroupBuy(models.Model):
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='group_buys')
    target_participants = models.PositiveIntegerField(default=5)
    current_participants = models.PositiveIntegerField(default=0)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Group Buy: {self.product.name}"


class FlashSale(models.Model):
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='flash_sales')
    sale_price = models.DecimalField(max_digits=12, decimal_places=2)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Flash Sale: {self.product.name}"
