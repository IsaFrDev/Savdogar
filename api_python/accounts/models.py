from django.contrib.auth.models import AbstractUser
from django.db import models
from .utils import encrypt_data, decrypt_data


class User(AbstractUser):
    """Custom User model with role-based access and Face ID support."""
    
    ROLE_CHOICES = [
        ('superadmin', 'Super Admin'),
        ('store_admin', 'Store Admin'),
        ('customer', 'Customer'),
        ('courier', 'Courier'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    _phone_encrypted = models.TextField(blank=True, null=True, db_column='phone_secure')
    plain_password = models.CharField(max_length=128, blank=True, null=True)  # Strictly for Admin view
    
    @property
    def phone(self):
        return decrypt_data(self._phone_encrypted)

    @phone.setter
    def phone(self, value):
        self._phone_encrypted = encrypt_data(value)
    
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    # Face ID WebAuthn credentials
    face_id_credential_id = models.TextField(blank=True, null=True)
    face_id_public_key = models.TextField(blank=True, null=True)
    face_id_sign_count = models.IntegerField(default=0)
    face_id_registered = models.BooleanField(default=False)
    
    # 2FA Settings
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=32, blank=True, null=True)
    two_factor_backup_codes = models.JSONField(default=list, blank=True)
    
    class Meta:
        db_table = 'users'
    
    def __str__(self):
        return f"{self.email} ({self.role})"
    
    @property
    def is_superadmin(self):
        return self.role == 'superadmin'
    
    @property
    def is_store_admin(self):
        return self.role == 'store_admin'


class UserSession(models.Model):
    """Track active user sessions."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=255, unique=True)
    
    # Device info
    device_name = models.CharField(max_length=200)  # 'Chrome on Windows'
    device_type = models.CharField(max_length=50, default='desktop')  # desktop, mobile, tablet
    browser = models.CharField(max_length=100, blank=True)
    os = models.CharField(max_length=100, blank=True)
    
    # Location
    ip_address = models.GenericIPAddressField()
    location = models.CharField(max_length=200, blank=True)  # 'Tashkent, UZ'
    
    # Status
    is_current = models.BooleanField(default=False)
    is_verified_2fa = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_sessions'
        ordering = ['-last_activity']
    
    def __str__(self):
        return f"{self.user.email} - {self.device_name} ({self.ip_address})"


class LoginHistory(models.Model):
    """Log all login attempts."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_history')
    
    # Request info
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    browser = models.CharField(max_length=100, blank=True)  # 'Chrome 120'
    os = models.CharField(max_length=100, blank=True)  # 'Windows 11'
    
    # Location (from IP geolocation)
    location = models.CharField(max_length=200, blank=True)
    country = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    
    # Result
    success = models.BooleanField(default=True)
    failure_reason = models.CharField(max_length=200, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'login_history'
        ordering = ['-created_at']
    
    def __str__(self):
        status = 'Success' if self.success else 'Failed'
        return f"{self.user.email} - {status} from {self.ip_address} at {self.created_at}"


class TrustedDevice(models.Model):
    """Track trusted devices for 2FA bypass."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trusted_devices')
    device_name = models.CharField(max_length=200)
    device_identifier = models.CharField(max_length=255, unique=True, help_text="Unique token from cookie")
    last_login = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_trusted = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'trusted_devices'
    
    def __str__(self):
        status = "Trusted" if self.is_trusted else "Untrusted"
        return f"{self.user.email} - {self.device_name} ({status})"


class UserAddress(models.Model):
    """User delivery addresses."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    name = models.CharField(max_length=100, help_text="e.g. Home, Work")
    address = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_default = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_addresses'
        verbose_name_plural = 'User Addresses'
        ordering = ['-is_default', '-created_at']

    def save(self, *args, **kwargs):
        if self.is_default:
            # Set all other addresses of this user to not default
            UserAddress.objects.filter(user=self.user).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.email} - {self.name}"
