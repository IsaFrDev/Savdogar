from django.contrib import admin
from .models import Reel, GroupBuy, FlashSale
from .loyalty_models import (
    LoyaltyProgram, LoyaltyTier, CustomerLoyalty, LoyaltyTransaction,
    ReferralProgram, Referral, Coupon, CustomerCoupon
)

@admin.register(Reel)
class ReelAdmin(admin.ModelAdmin):
    list_display = ['id', 'store', 'product', 'views_count', 'created_at']

@admin.register(GroupBuy)
class GroupBuyAdmin(admin.ModelAdmin):
    list_display = ['product', 'target_participants', 'current_participants', 'discount_percentage', 'is_active']
    list_filter = ['is_active']

@admin.register(FlashSale)
class FlashSaleAdmin(admin.ModelAdmin):
    list_display = ['product', 'sale_price', 'start_time', 'end_time', 'is_active']
    list_filter = ['is_active']

# Loyalty Program Admin
@admin.register(LoyaltyProgram)
class LoyaltyProgramAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'points_per_currency', 'currency_per_point', 'is_active']
    list_filter = ['is_active']

@admin.register(LoyaltyTier)
class LoyaltyTierAdmin(admin.ModelAdmin):
    list_display = ['name', 'program', 'level', 'min_points', 'discount_percentage', 'points_multiplier']
    list_filter = ['level']

@admin.register(CustomerLoyalty)
class CustomerLoyaltyAdmin(admin.ModelAdmin):
    list_display = ['customer', 'store', 'tier', 'available_points', 'lifetime_points', 'total_orders']
    list_filter = ['tier']
    search_fields = ['customer__username', 'customer__email']

@admin.register(LoyaltyTransaction)
class LoyaltyTransactionAdmin(admin.ModelAdmin):
    list_display = ['customer_loyalty', 'transaction_type', 'points', 'balance_after', 'created_at']
    list_filter = ['transaction_type']

@admin.register(ReferralProgram)
class ReferralProgramAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'referrer_reward', 'referee_reward', 'reward_type', 'is_active']
    list_filter = ['reward_type', 'is_active']

@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ['referral_code', 'referrer', 'referee', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['referral_code']

@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'discount_type', 'discount_value', 'used_count', 'max_uses', 'is_valid']
    list_filter = ['discount_type', 'is_active']
    search_fields = ['code', 'name']

@admin.register(CustomerCoupon)
class CustomerCouponAdmin(admin.ModelAdmin):
    list_display = ['customer', 'coupon', 'is_used', 'assigned_at']
    list_filter = ['is_used']
