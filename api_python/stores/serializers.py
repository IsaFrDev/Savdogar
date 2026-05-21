from rest_framework import serializers
from .models import Store, Contract, Branch, StoreBanner, StaffRole, StaffMember, IKPU
from accounts.serializers import UserSerializer


class StoreSerializer(serializers.ModelSerializer):
    """Serializer for Store model."""
    
    owner_details = UserSerializer(source='owner', read_only=True)
    subdomain = serializers.ReadOnlyField()
    trial_days_remaining = serializers.ReadOnlyField()
    is_trial_active = serializers.ReadOnlyField()
    branches_count = serializers.SerializerMethodField()
    staff_count = serializers.SerializerMethodField()
    # Accept full GPS precision
    latitude = serializers.DecimalField(max_digits=30, decimal_places=20, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=30, decimal_places=20, required=False, allow_null=True)
    
    # SECURITY: Mask sensitive fields
    telegram_bot_token = serializers.SerializerMethodField()
    api_key = serializers.SerializerMethodField()
    eskiz_token = serializers.SerializerMethodField()
    
    class Meta:
        model = Store
        fields = [
            'id', 'owner', 'owner_details', 'name', 'slug', 'description',
            'description_uz', 'description_ru',
            'business_type', 'business_description', 'business_description_uz', 'business_description_ru', 'logo', 'banner', 'status', 'pickup_address', 'latitude',
            'longitude', 'telegram_bot_token', 'telegram_chat_id', 'telegram_welcome', 'telegram_welcome_uz', 'telegram_welcome_ru', 'catalog_mode',
            'default_language', 'contract_signed', 'contract_signed_at',
            'subdomain', 'created_at', 'updated_at', 'api_key', 'maintenance_mode', 'twa_enabled',
            'base_currency', 'use_auto_rates', 'manual_exchange_rates', 'telegram_username',
            'primary_color', 'secondary_color', 'phone', 'email', 'instagram_url',
            'telegram_channel', 'facebook_url', 'website_url', 'youtube_url', 'tiktok_url',
            'whatsapp_number', 'theme_config', 'ui_schema', 'store_html', 'store_files', 'working_hours',
            'plan', 'trial_started_at', 'trial_days', 'balance',
            'payment_methods', 'delivery_settings',
            'rating', 'rating_count',
            'eskiz_email', 'eskiz_token', 'is_phone_verified',
            'trial_days_remaining', 'is_trial_active', 'branches_count', 'staff_count',
        ]
        read_only_fields = ['id', 'owner', 'status', 'contract_signed', 'contract_signed_at', 'created_at', 'updated_at', 'api_key']
    
    def get_telegram_bot_token(self, obj):
        """Mask Telegram bot token for security"""
        request = self.context.get('request')
        # Only show to store owner
        if request and request.user == obj.owner:
            return obj.telegram_bot_token
        # Mask for others: show only last 5 chars
        if obj.telegram_bot_token:
            return f"{'*' * 20}{obj.telegram_bot_token[-5:]}"
        return ''
    
    def get_api_key(self, obj):
        """Mask API key for security"""
        request = self.context.get('request')
        # Only show to store owner
        if request and request.user == obj.owner:
            return obj.api_key
        # Mask for others
        if obj.api_key:
            return f"{'*' * 20}{obj.api_key[-5:]}"
        return ''
    
    def get_eskiz_token(self, obj):
        """Mask Eskiz token for security"""
        request = self.context.get('request')
        # Only show to store owner
        if request and request.user == obj.owner:
            return obj.eskiz_token
        return ''

    def get_branches_count(self, obj):
        return obj.branches.count() if hasattr(obj, 'branches') else 0

    def get_staff_count(self, obj):
        return obj.staff_members.filter(is_active=True).count() if hasattr(obj, 'staff_members') else 0


class StoreCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a store with contract."""
    
    signature_data = serializers.CharField(write_only=True, required=True)
    agree_to_terms = serializers.BooleanField(write_only=True, required=True)
    telegram_username = serializers.CharField(write_only=True, required=True)
    branch_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    branch_phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    # Explicit field definitions to accept full GPS precision (up to 12 total digits, 7 decimal places)
    latitude = serializers.DecimalField(max_digits=30, decimal_places=20, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=30, decimal_places=20, required=False, allow_null=True)
    
    class Meta:
        model = Store
        fields = [
            'name', 'slug', 'description', 'description_uz', 'description_ru',
            'business_type', 'business_description', 'business_description_uz', 'business_description_ru', 'logo', 'banner',
            'pickup_address', 'latitude', 'longitude', 'telegram_bot_token',
            'telegram_chat_id', 'telegram_welcome', 'telegram_welcome_uz', 'telegram_welcome_ru', 'catalog_mode', 'default_language',
            'signature_data', 'agree_to_terms', 'telegram_username',
            'primary_color', 'secondary_color', 'phone', 'email', 'twa_enabled',
            'branch_name', 'branch_phone', 'delivery_settings'
        ]
    
    def validate_agree_to_terms(self, value):
        if not value:
            raise serializers.ValidationError("You must agree to the terms.")
        return value
    
    def validate_signature_data(self, value):
        if not value or len(value) < 100:
            raise serializers.ValidationError("A valid signature is required.")
        return value
    
    def validate_slug(self, value):
        if Store.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Bu do'kon manzili (slug) band. Iltimos, boshqasini tanlang.")
        return value
    
    def create(self, validated_data):
        signature_data = validated_data.pop('signature_data')
        validated_data.pop('agree_to_terms')
        branch_name = validated_data.pop('branch_name', '')
        branch_phone = validated_data.pop('branch_phone', '')
        user = self.context['request'].user
        
        store = Store.objects.create(
            **validated_data,
            owner=user,
            signature_data=signature_data,
            contract_signed=True,
            plan='free_trial',
            trial_started_at=__import__('django.utils', fromlist=['timezone']).timezone.now(),
        )
        
        # Create first branch if details provided
        if branch_name or validated_data.get('pickup_address'):
            Branch.objects.create(
                store=store,
                name=branch_name or "Asosiy Filial",
                address=validated_data.get('pickup_address', ''),
                latitude=validated_data.get('latitude'),
                longitude=validated_data.get('longitude'),
                phone=branch_phone
            )
        
        # Promote customer to store_admin
        if user.role == 'customer':
            user.role = 'store_admin'
            user.save()

        # Create default admin role
        StaffRole.objects.create(store=store, name='Admin', permissions={"all": True})
            
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


class BranchSerializer(serializers.ModelSerializer):
    """Serializer for Branch model."""
    class Meta:
        model = Branch
        fields = ['id', 'store', 'name', 'address', 'latitude', 'longitude', 'phone', 'is_active', 'working_hours', 'created_at', 'updated_at']
        read_only_fields = ['id', 'store', 'created_at', 'updated_at']


class StoreBannerSerializer(serializers.ModelSerializer):
    """Serializer for StoreBanner model."""
    class Meta:
        model = StoreBanner
        fields = ['id', 'store', 'banner_type', 'title', 'mobile_image', 'desktop_image', 'link_type', 'link_value', 'order', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'store', 'created_at', 'updated_at']


class StaffRoleSerializer(serializers.ModelSerializer):
    """Serializer for StaffRole model."""
    members_count = serializers.SerializerMethodField()

    class Meta:
        model = StaffRole
        fields = ['id', 'store', 'name', 'permissions', 'is_active', 'created_at', 'updated_at', 'members_count']
        read_only_fields = ['id', 'store', 'created_at', 'updated_at']

    def get_members_count(self, obj):
        return obj.members.filter(is_active=True).count()


class StaffMemberSerializer(serializers.ModelSerializer):
    """Serializer for StaffMember model."""
    role_name = serializers.CharField(source='role.name', read_only=True, default='')

    class Meta:
        model = StaffMember
        fields = ['id', 'store', 'user', 'full_name', 'phone', 'role', 'role_name', 'staff_type', 'is_active', 'orders_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'store', 'created_at', 'updated_at', 'orders_count']


class IKPUSerializer(serializers.ModelSerializer):
    """Serializer for IKPU model."""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)

    class Meta:
        model = IKPU
        fields = ['id', 'store', 'product', 'product_name', 'product_image', 'ikpu_code', 'packaging_code', 'unit_code', 'created_at', 'updated_at']
        read_only_fields = ['id', 'store', 'created_at', 'updated_at']
