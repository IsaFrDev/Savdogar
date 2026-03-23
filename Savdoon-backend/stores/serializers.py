from rest_framework import serializers
from .models import Store, Contract
from accounts.serializers import UserSerializer


class StoreSerializer(serializers.ModelSerializer):
    """Serializer for Store model."""
    
    owner_details = UserSerializer(source='owner', read_only=True)
    subdomain = serializers.ReadOnlyField()
    
    class Meta:
        model = Store
        fields = [
            'id', 'owner', 'owner_details', 'name', 'slug', 'description',
            'description_uz', 'description_ru',
            'business_type', 'business_description', 'business_description_uz', 'business_description_ru', 'logo', 'banner', 'status', 'pickup_address', 'latitude',
            'longitude', 'telegram_bot_token', 'telegram_chat_id', 'telegram_welcome', 'telegram_welcome_uz', 'telegram_welcome_ru', 'catalog_mode',
            'default_language', 'contract_signed', 'contract_signed_at',
            'subdomain', 'created_at', 'updated_at', 'api_key', 'maintenance_mode',
            'base_currency', 'use_auto_rates', 'manual_exchange_rates', 'telegram_username',
            'primary_color', 'secondary_color', 'phone', 'email', 'instagram_url',
            'telegram_channel', 'facebook_url', 'website_url', 'theme_config'
        ]
        read_only_fields = ['id', 'owner', 'status', 'contract_signed', 'contract_signed_at', 'created_at', 'updated_at', 'api_key']


class StoreCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a store with contract."""
    
    signature_data = serializers.CharField(write_only=True, required=True)
    agree_to_terms = serializers.BooleanField(write_only=True, required=True)
    telegram_username = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Store
        fields = [
            'name', 'slug', 'description', 'description_uz', 'description_ru',
            'business_type', 'business_description', 'business_description_uz', 'business_description_ru', 'logo', 'banner',
            'pickup_address', 'latitude', 'longitude', 'telegram_bot_token',
            'telegram_chat_id', 'telegram_welcome', 'telegram_welcome_uz', 'telegram_welcome_ru', 'catalog_mode', 'default_language',
            'signature_data', 'agree_to_terms', 'telegram_username',
            'primary_color', 'secondary_color'
        ]
    
    def validate_agree_to_terms(self, value):
        if not value:
            raise serializers.ValidationError("You must agree to the terms.")
        return value
    
    def validate_signature_data(self, value):
        if not value or len(value) < 100:
            raise serializers.ValidationError("A valid signature is required.")
        return value
    
    def create(self, validated_data):
        signature_data = validated_data.pop('signature_data')
        validated_data.pop('agree_to_terms')
        user = self.context['request'].user
        
        store = Store.objects.create(
            **validated_data,
            owner=user,
            signature_data=signature_data,
            contract_signed=True,
            status='pending',
        )
        
        # Promote customer to store_admin
        if user.role == 'customer':
            user.role = 'store_admin'
            user.save()
            
        return store


class ContractSerializer(serializers.ModelSerializer):
    """Serializer for Contract model."""
    class Meta:
        model = Contract
        fields = ['id', 'store', 'language', 'content', 'signed', 'signed_at', 'signature_data', 'pdf_file', 'created_at']
        read_only_fields = ['id', 'created_at']


class StoreApprovalSerializer(serializers.Serializer):
    """Serializer for approving/rejecting stores."""
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
