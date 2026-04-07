from rest_framework import serializers
from .models import Reel, GroupBuy, FlashSale


class ReelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reel
        fields = ['id', 'store', 'product', 'video', 'caption', 'created_at', 'views_count']


class GroupBuySerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupBuy
        fields = '__all__'


class FlashSaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlashSale
        fields = '__all__'
