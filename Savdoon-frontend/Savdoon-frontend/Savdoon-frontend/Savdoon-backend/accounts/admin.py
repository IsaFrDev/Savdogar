from django.contrib import admin
from .models import User, UserSession, LoginHistory, TrustedDevice

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'username', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active']
    search_fields = ['email', 'username']

@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'device_name', 'ip_address', 'is_current', 'last_activity']
    list_filter = ['is_current', 'device_type']

@admin.register(LoginHistory)
class LoginHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'ip_address', 'success', 'created_at']
    list_filter = ['success']

@admin.register(TrustedDevice)
class TrustedDeviceAdmin(admin.ModelAdmin):
    list_display = ['user', 'device_name', 'is_trusted', 'last_login']
    list_filter = ['is_trusted']
