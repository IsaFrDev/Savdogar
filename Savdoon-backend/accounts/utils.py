import pyotp
import string
import random
import json
from cryptography.fernet import Fernet
from django.conf import settings
import base64
from django.utils import timezone
import datetime

def generate_totp_secret():
    """Generate a random 32-character base32 secret."""
    return pyotp.random_base32()

def get_totp_uri(user_email, secret):
    """Generate a provisioning URI for Google Authenticator or similar apps."""
    return pyotp.totp.TOTP(secret).provisioning_uri(
        name=user_email,
        issuer_name="Savdoon Enterprise"
    )

def verify_totp_code(secret, code):
    """Verify a TOTP code against a secret."""
    totp = pyotp.TOTP(secret)
    return totp.verify(code)

def generate_backup_codes(count=10, length=8):
    """Generate a list of random backup codes."""
    codes = []
    for _ in range(count):
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
        codes.append(code)
    return codes

def check_and_use_backup_code(user, code):
    """Check if a backup code is valid, and if so, use it (remove it)."""
    if not user.two_factor_backup_codes:
        return False
    
    if code in user.two_factor_backup_codes:
        user.two_factor_backup_codes = [c for c in user.two_factor_backup_codes if c != code]
        user.save()
        return True
    
    return False


def get_fernet():
    key = getattr(settings, 'FIELD_ENCRYPTION_KEY', None)
    if not key:
        return Fernet(Fernet.generate_key())
    try:
        return Fernet(key)
    except Exception:
        return Fernet(Fernet.generate_key())

def encrypt_data(data):
    """Encrypt string data using AES-256."""
    if not data:
        return None
    try:
        f = get_fernet()
        return f.encrypt(data.encode()).decode()
    except Exception:
        return None

def decrypt_data(encrypted_data):
    """Decrypt data using AES-256."""
    if not encrypted_data:
        return None
    try:
        f = get_fernet()
        return f.decrypt(encrypted_data.encode()).decode()
    except Exception:
        return None

def log_audit_event(user, action, description, model_name=None, object_id=None, changes=None, request=None):
    """
    Log an event. AuditLog model was removed, so this is now a stub or 
    could log to a file/external service in the future.
    """
    # For now, just print or ignore as AuditLog is gone for MVP
    pass

def check_impossible_travel(user, new_ip):
    """
    Check if the current login is physically impossible given the previous login location/time.
    """
    from .models import LoginHistory
    
    last_login = LoginHistory.objects.filter(user=user, success=True).order_by('-created_at').first()
    if not last_login:
        return False, None
    
    if last_login.ip_address == new_ip:
        return False, None
    
    time_diff = timezone.now() - last_login.created_at
    if time_diff.total_seconds() < 300: # 5 minutes
        return True, f"Suspicious IP change from {last_login.ip_address} to {new_ip} in {int(time_diff.total_seconds())}s"
    
    return False, None
