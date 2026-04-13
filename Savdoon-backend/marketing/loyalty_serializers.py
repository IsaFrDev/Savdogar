"""
Loyalty Program Serializers
"""
from rest_framework import serializers
from .loyalty_models import (
    LoyaltyProgram, LoyaltyTier, CustomerLoyalty, LoyaltyTransaction,
    ReferralProgram, Referral, Coupon, CustomerCoupon
)


class LoyaltyProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyProgram
        fields = '__all__'


class LoyaltyTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyTier
        fields = '__all__'


class CustomerLoyaltySerializer(serializers.ModelSerializer):
    tier_name = serializers.CharField(source='tier.name', read_only=True)
    tier_color = serializers.CharField(source='tier.color', read_only=True)
    
    class Meta:
        model = CustomerLoyalty
        fields = '__all__'
        read_only_fields = ['total_points', 'lifetime_points', 'total_orders', 'total_spent']


class LoyaltyTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyTransaction
        fields = '__all__'


class ReferralProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferralProgram
        fields = '__all__'


class ReferralSerializer(serializers.ModelSerializer):
    class Meta:
        model = Referral
        fields = '__all__'
        read_only_fields = ['referral_code', 'status']


class CouponSerializer(serializers.ModelSerializer):
    is_valid = serializers.ReadOnlyField()
    
    class Meta:
        model = Coupon
        fields = '__all__'


class CustomerCouponSerializer(serializers.ModelSerializer):
    coupon_code = serializers.CharField(source='coupon.code', read_only=True)
    discount_type = serializers.CharField(source='coupon.discount_type', read_only=True)
    discount_value = serializers.CharField(source='coupon.discount_value', read_only=True)
    
    class Meta:
        model = CustomerCoupon
        fields = '__all__'
        read_only_fields = ['is_used', 'used_at']
