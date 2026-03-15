from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

# Import at module level to avoid scoping issues
from .models import UserSession, LoginHistory, TrustedDevice


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    phone = serializers.CharField(required=False, allow_blank=True)
    store_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'role', 'phone', 'avatar', 'face_id_registered', 'plain_password', 'store_status']
        read_only_fields = ['id', 'face_id_registered']

    def get_store_status(self, obj):
        from stores.models import Store
        store = Store.objects.filter(owner=obj).first()
        return store.status if store else None


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password2', 'first_name', 'last_name', 'phone', 'role']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        role = validated_data.pop('role', 'customer')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            role=role,
            plain_password=validated_data['password']  # Save plain password for Admin
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for login."""
    
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class FaceIDRegisterSerializer(serializers.Serializer):
    """Serializer for Face ID registration."""
    
    credential_id = serializers.CharField(required=True)
    public_key = serializers.CharField(required=True)
    

class FaceIDLoginSerializer(serializers.Serializer):
    """Serializer for Face ID login."""
    
    credential_id = serializers.CharField(required=True)
    authenticator_data = serializers.CharField(required=True)
    client_data_json = serializers.CharField(required=True)
    signature = serializers.CharField(required=True)


class SuperAdminLoginSerializer(serializers.Serializer):
    """Serializer for super admin login."""
    
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class UserSessionSerializer(serializers.ModelSerializer):
    """Serializer for active user sessions."""
    
    class Meta:
        model = UserSession
        fields = [
            'id', 'session_key', 'device_name', 'device_type', 
            'browser', 'os', 'ip_address', 'location', 
            'is_current', 'is_verified_2fa', 'created_at', 'last_activity'
        ]
        read_only_fields = ['id', 'session_key', 'created_at', 'last_activity']


class LoginHistorySerializer(serializers.ModelSerializer):
    """Serializer for login history."""
    
    class Meta:
        model = LoginHistory
        fields = [
            'id', 'ip_address', 'user_agent', 'browser', 'os',
            'location', 'country', 'city', 'success', 
            'failure_reason', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class TwoFactorVerifySerializer(serializers.Serializer):
    """Serializer for 2FA verification."""
    
    code = serializers.CharField(required=True, min_length=6, max_length=12)
    use_backup_code = serializers.BooleanField(default=False)


class TwoFactorStatusSerializer(serializers.ModelSerializer):
    """Serializer for 2FA status and info."""
    
    class Meta:
        model = User
        fields = ['two_factor_enabled']


class TrustedDeviceSerializer(serializers.ModelSerializer):
    """Serializer for Trusted Devices."""
    class Meta:
        model = TrustedDevice
        fields = ['id', 'device_name', 'device_identifier', 'last_login', 'created_at', 'is_trusted']
        read_only_fields = ['id', 'created_at']


class DeviceVerificationSerializer(serializers.Serializer):
    """Serializer for device verification."""
    code = serializers.CharField(required=True, min_length=6, max_length=6)
    temp_token = serializers.CharField(required=True)


from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings

class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    """Custom refresh serializer to handle deleted users gracefully."""
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Verify user exists
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken(attrs['refresh'])
        user_id = refresh[api_settings.USER_ID_CLAIM]
        
        try:
            User.objects.get(**{api_settings.USER_ID_FIELD: user_id})
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {"detail": "User associated with this token no longer exists."},
                code="user_not_found"
            )
            
        return data
