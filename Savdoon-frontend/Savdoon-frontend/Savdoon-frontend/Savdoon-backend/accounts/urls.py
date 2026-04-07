from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView, LoginView, MeView, FaceIDRegisterView, FaceIDLoginView,
    SuperAdminLoginView, ListUsersView, DeleteUserView, UpdateUserView, CreateUserView,
    ActiveSessionsView, EndSessionView, EndAllSessionsView, LoginHistoryView,
    TwoFactorSetupView, TwoFactorEnableView, TwoFactorVerifyView, TwoFactorDisableView,
    VerifyDeviceView, TrustedDevicesListView,
    DeleteTrustedDeviceView, CustomTokenRefreshView,
    ProfileUpdateView, PasswordChangeView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('me/', MeView.as_view(), name='me'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('face-id/register/', FaceIDRegisterView.as_view(), name='face_id_register'),
    path('face-id/login/', FaceIDLoginView.as_view(), name='face_id_login'),
    path('superadmin/login/', SuperAdminLoginView.as_view(), name='superadmin_login'),
    path('users/', ListUsersView.as_view(), name='list_users'),
    path('users/create/', CreateUserView.as_view(), name='create_user'),
    path('users/<int:pk>/delete/', DeleteUserView.as_view(), name='delete_user'),
    path('users/<int:pk>/update/', UpdateUserView.as_view(), name='update_user'),
    
    # Session management
    path('sessions/', ActiveSessionsView.as_view(), name='active_sessions'),
    path('sessions/<int:session_id>/end/', EndSessionView.as_view(), name='end_session'),
    path('sessions/end-all/', EndAllSessionsView.as_view(), name='end_all_sessions'),
    path('login-history/', LoginHistoryView.as_view(), name='login_history'),
    
    # 2FA management
    path('2fa/setup/', TwoFactorSetupView.as_view(), name='2fa_setup'),
    path('2fa/enable/', TwoFactorEnableView.as_view(), name='2fa_enable'),
    path('2fa/verify/', TwoFactorVerifyView.as_view(), name='2fa_verify'),
    path('2fa/disable/', TwoFactorDisableView.as_view(), name='2fa_disable'),
    
    # Device Guard
    path('device/verify/', VerifyDeviceView.as_view(), name='device_verify'),
    path('device/trusted/', TrustedDevicesListView.as_view(), name='trusted_devices_list'),
    path('device/trusted/<int:pk>/', DeleteTrustedDeviceView.as_view(), name='trusted_device_delete'),
    
    # Profile & Security
    path('profile/update/', ProfileUpdateView.as_view(), name='profile_update'),
    path('password/change/', PasswordChangeView.as_view(), name='password_change'),
]
