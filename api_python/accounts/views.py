from rest_framework import status, generics, serializers
from rest_framework.views import APIView
import base64
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from drf_spectacular.utils import extend_schema, OpenApiExample, inline_serializer
from django.core import signing
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
import uuid
import threading
import random
import logging

from rest_framework_simplejwt.views import TokenRefreshView
from .webauthn_utils import decode_credential_id_bytes, find_user_by_credential_id, store_credential_id
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    FaceIDRegisterSerializer, FaceIDLoginSerializer,
    SuperAdminLoginSerializer, UserSessionSerializer,
    LoginHistorySerializer, TwoFactorVerifySerializer,
    TwoFactorStatusSerializer, DeviceVerificationSerializer,
    TrustedDeviceSerializer, CustomTokenRefreshSerializer
)
from .models import UserSession, LoginHistory, TrustedDevice
from .session_utils import (
    get_client_ip, parse_user_agent_info, create_user_session, log_login_attempt
)
from .utils import (
    generate_totp_secret, get_totp_uri, verify_totp_code,
    generate_backup_codes, check_and_use_backup_code,
    log_audit_event, check_impossible_travel
)

User = get_user_model()


class CustomTokenRefreshView(TokenRefreshView):
    """Custom TokenRefreshView using CustomTokenRefreshSerializer."""
    serializer_class = CustomTokenRefreshSerializer
    
    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except Exception as e:
            import logging
            import traceback
            logger = logging.getLogger('savdoon')
            
            error_str = str(e)
            
            # Special case for users that no longer exist in the DB (e.g. after re-deploy/DB wipe)
            if "User matching query does not exist" in error_str:
                logger.warning(f"Token refresh failed: User does not exist (stale token). IP: {request.META.get('REMOTE_ADDR')}")
                return Response({'error': 'User session is invalid or stale'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Token expired or invalid
            if "Token is invalid" in error_str or "Token expired" in error_str or "token" in error_str.lower():
                logger.warning(f"Token refresh failed: Invalid/expired token. IP: {request.META.get('REMOTE_ADDR')}")
                return Response({'error': 'Token is invalid or expired'}, status=status.HTTP_401_UNAUTHORIZED)
                
            # Any other error - return 401 instead of 500
            logger.error(f"Error in CustomTokenRefreshView: {e}\n{traceback.format_exc()}")
            return Response({'error': 'Token refresh failed. Please login again.'}, status=status.HTTP_401_UNAUTHORIZED)


class RegisterView(generics.CreateAPIView):
    """Register a new user."""
    
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    
    @extend_schema(
        tags=['Auth'],
        summary='Register new user',
        description='Create a new store admin account',
        examples=[
            OpenApiExample(
                'Example',
                value={
                    'email': 'user@example.com',
                    'username': 'newuser',
                    'password': 'securepass123',
                    'password2': 'securepass123',
                    'first_name': 'John',
                    'last_name': 'Doe',
                    'phone': '+998901234567'
                }
            )
        ]
    )
    def post(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            
            refresh = RefreshToken.for_user(user)
            
            # Create session
            try:
                create_user_session(user, request)
            except Exception:
                pass  # Non-critical
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            import logging
            from rest_framework.exceptions import ValidationError as DRFValidationError
            logger = logging.getLogger('savdoon')
            # Re-raise DRF validation errors so they return 400 with field details
            if isinstance(e, DRFValidationError):
                raise
            logger.error(f"Unexpected error in RegisterView: {e}")
            return Response({
                'error': 'Registration failed. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# Helper Functions for Device Guard
def generate_device_verification_code(user=None):
    """Generate a 6-digit verification code. Always 123456 in DEBUG mode or for Superadmin."""
    if settings.DEBUG or (user and (user.is_superuser or getattr(user, 'role', '') == 'superadmin')):
        return '123456'
    import random
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def _send_mail_task(subject, message, from_email, recipient_list):
    try:
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)
        print(f"SECURITY: Verification email sent to {recipient_list}")
    except Exception as e:
        print(f"ERROR: Failed to send email to {recipient_list}: {e}")

def send_device_code_notification(user, code):
    """
    Send verification code to user via email (Background).
    """
    subject = f'Savdoon - Device Verification Code'
    message = f'Your verification code for a new device login is: {code}\n\nThis code will expire in 5 minutes.'
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user.email]
    
    # Send in background to avoid worker timeout
    thread = threading.Thread(target=_send_mail_task, args=(subject, message, from_email, recipient_list))
    thread.daemon = True
    thread.start()


class LoginView(APIView):
    """Login with email and password, protected by Device Guard."""
    
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = LoginSerializer
    
    @extend_schema(
        tags=['Auth'],
        summary='Login',
        description='Login with email and password, protected by Device Guard',
        request=LoginSerializer,
        responses={
            200: UserSerializer,
            401: OpenApiExample('Device Verification Required', value={'device_verification_required': True, 'temp_token': '...'})
        }
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        print(f"DEBUG: Login Attempt for email='{email}', password='{password}'")
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            import logging
            logger = logging.getLogger('savdoon')
            logger.error(f"Database error in LoginView: {e}")
            return Response({'error': 'Database is being initialized. Please refresh in 30 seconds.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        if not user.check_password(password):
            try:
                log_login_attempt(user, request, success=False, failure_reason='Invalid password')
            except: pass
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            
        # Ensure superadmin role and email if it's the designated superadmin email
        if user.email == 'mansurovislombek130@gmail.com' or user.username == 'admin':
            user.role = 'superadmin'
            user.is_staff = True
            user.is_superuser = True
            if user.email != 'mansurovislombek130@gmail.com':
                user.email = 'mansurovislombek130@gmail.com'
            user.save()
            
        # IMPOSSIBLE TRAVEL CHECK
        ip = get_client_ip(request)
        is_suspicious, msg = check_impossible_travel(user, ip)
        if is_suspicious:
             log_audit_event(user, 'security_alert', msg, request=request)
            
        # DEVICE GUARD CHECK — skip for superadmin users
        is_superadmin = user.is_superuser or getattr(user, 'role', '') == 'superadmin'
        device_token = request.COOKIES.get('savdoon_device_token')
        is_device_trusted = is_superadmin  # superadmins always bypass device guard
        
        if not is_device_trusted and device_token:
            try:
                td = TrustedDevice.objects.get(user=user, device_identifier=device_token, is_trusted=True)
                td.last_login = timezone.now()
                td.save()
                is_device_trusted = True
            except TrustedDevice.DoesNotExist:
                pass
        
        if not is_device_trusted:
            code = generate_device_verification_code(user=user)
            temp_token_data = {
                'user_id': user.id,
                'code': code,
                'device_attempt': True,
                'exp': timezone.now().timestamp() + 300
            }
            temp_token = signing.dumps(temp_token_data, salt='device-verify')
            send_device_code_notification(user, code)
            
            return Response({
                'device_verification_required': True,
                'temp_token': temp_token,
                'message': 'New device detected. Verification code has been sent.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if user.two_factor_enabled:
            return Response({
                'two_factor_required': True,
                'email': user.email,
                'message': 'Two-factor authentication code required'
            })

        refresh = RefreshToken.for_user(user)
        try:
            log_login_attempt(user, request, success=True)
            create_user_session(user, request, is_verified_2fa=False)
        except Exception as e:
            print(f"Non-critical login log/session error: {e}")
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })


class SuperAdminLoginView(APIView):
    """Super Admin login with hardcoded credentials."""
    
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = SuperAdminLoginSerializer
    
    @extend_schema(
        tags=['Super Admin'],
        summary='Super Admin Login',
        description='Login as super admin (username: admin, password: admin123)',
        request=SuperAdminLoginSerializer,
    )
    def post(self, request):
        print("\n[DEBUG] --- SuperAdminLogin Start ---")
        serializer = SuperAdminLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        username_input = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        print(f"[DEBUG] Attempt: username='{username_input}'")
        
        # 1. Check for hardcoded fallback (accepts both legacy and current password)
        HARDCODED_PASSWORDS = {'admin123', 'Admin1234!'}
        if username_input == 'admin' and password in HARDCODED_PASSWORDS:
            print("[DEBUG] Using hardcoded fallback branch")
            try:
                print("[DEBUG] Calling get_or_create for admin...")
                user, created = User.objects.get_or_create(
                    username='admin',
                    defaults={
                        'email': 'admin@savdoon.com',
                        'role': 'superadmin',
                        'is_staff': True,
                        'is_superuser': True,
                    }
                )
                print(f"[DEBUG] User {'created' if created else 'found'}. Ready to set permissions.")
                user.role = 'superadmin'
                user.is_staff = True
                user.is_superuser = True
                if created:
                    print("[DEBUG] Setting password for new admin...")
                    user.set_password('admin123')
                print("[DEBUG] Saving user...")
                user.save()
                print("[DEBUG] User save complete.")
            except Exception as e:
                import traceback
                print(f"[DEBUG] ERROR in get_or_create: {e}")
                print(traceback.format_exc())
                return Response({'error': str(e)}, status=500)
        else:
            print("[DEBUG] Using DB lookup branch")
            from django.db.models import Q
            user = User.objects.filter(
                Q(username=username_input) | Q(email=username_input),
                role='superadmin'
            ).first()
            
            if not user:
                print(f"[DEBUG] No superadmin found for '{username_input}'")
                return Response({'error': 'Invalid admin credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            
            print("[DEBUG] Checking password...")
            if not user.check_password(password):
                print(f"[DEBUG] Password mismatch for user '{user.username}'")
                return Response({'error': 'Invalid admin credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            
            print(f"[DEBUG] Password valid for '{user.username}'")
        
        # Ensure superadmin permissions are set
        print("[DEBUG] Final Permission Check...")
        if not user.is_staff or not user.is_superuser:
            user.is_staff = True
            user.is_superuser = True
            user.save()
            print("[DEBUG] Permissions updated.")

        try:
            print("[DEBUG] GENERATING JWT TOKEN (RefreshToken.for_user)...")
            refresh = RefreshToken.for_user(user)
            print("[DEBUG] JWT TOKEN GENERATED.")
            
            try:
                print("[DEBUG] Logging login attempt...")
                log_login_attempt(user, request, success=True)
                
                print("[DEBUG] Creating user session...")
                create_user_session(user, request)
                print("[DEBUG] SESSION CREATED.")
            except Exception as e:
                print(f"[DEBUG] Session creation failed (ignoring for login): {e}")
            
            print("[DEBUG] --- SuperAdminLogin Success! ---")
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            })
        except Exception as e:
            import traceback
            print(f"[DEBUG] CRITICAL ERROR during token/session: {e}")
            print(traceback.format_exc())
            return Response({'error': 'Critical initialization error'}, status=500)


class MeView(APIView):
    """Get current user info."""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Auth'],
        summary='Get current user',
        description='Get authenticated user information',
        responses={200: UserSerializer}
    )
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class FaceIDRegisterView(APIView):
    """Register Face ID credentials using WebAuthn."""
    permission_classes = [IsAuthenticated]
    serializer_class = FaceIDRegisterSerializer

    @extend_schema(
        tags=['Face ID'],
        summary='Get Face ID registration options',
        description='Get WebAuthn registration challenge',
    )
    def get(self, request):
        from webauthn import generate_registration_options
        from webauthn.helpers.structs import (
            UserVerificationRequirement,
            AuthenticatorSelectionCriteria,
        )

        options = generate_registration_options(
            rp_id=settings.WEBAUTHN_RP_ID,
            rp_name=settings.WEBAUTHN_RP_NAME,
            user_id=str(request.user.id).encode('utf-8'),
            user_name=request.user.email or request.user.username,
            user_display_name=request.user.get_full_name() or request.user.username,
            attestation="none",
            authenticator_selection=AuthenticatorSelectionCriteria(
                user_verification=UserVerificationRequirement.REQUIRED,
            ),
        )

        request.session['face_id_registration_challenge'] = options.challenge.hex()
        request.session.modified = True

        from webauthn.helpers import options_to_json_dict

        return Response(options_to_json_dict(options))

    @extend_schema(
        tags=['Face ID'],
        summary='Register Face ID',
        description='Register WebAuthn credentials for Face ID login',
        request=FaceIDRegisterSerializer,
    )
    def post(self, request):
        from webauthn import verify_registration_response

        serializer = FaceIDRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        registration = serializer.validated_data['registration_response']

        challenge_hex = request.session.get('face_id_registration_challenge')
        if not challenge_hex:
            return Response({'error': 'Registration challenge not found'}, status=status.HTTP_400_BAD_REQUEST)

        challenge = bytes.fromhex(challenge_hex)
        try:
            verification = verify_registration_response(
                credential=registration,
                expected_challenge=challenge,
                expected_origin=settings.WEBAUTHN_ORIGIN,
                expected_rp_id=settings.WEBAUTHN_RP_ID,
            )

            user = request.user
            user.face_id_credential_id = store_credential_id(verification.credential_id)
            user.face_id_public_key = base64.b64encode(verification.public_key).decode('utf-8')
            user.face_id_sign_count = verification.sign_count
            user.face_id_registered = True
            user.save()

            request.session.pop('face_id_registration_challenge', None)
            request.session.modified = True

            return Response({'message': 'Face ID registered successfully'})
        except Exception as e:
            return Response({'error': f'Registration failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


class FaceIDLoginView(APIView):
    """Login with Face ID using WebAuthn."""
    permission_classes = [AllowAny]
    serializer_class = FaceIDLoginSerializer

    @extend_schema(
        tags=['Face ID'],
        summary='Get Face ID login options',
        description='Get WebAuthn authentication challenge',
    )
    def get(self, request):
        from webauthn import generate_authentication_options
        from webauthn.helpers.structs import (
            UserVerificationRequirement,
            PublicKeyCredentialDescriptor,
            PublicKeyCredentialType,
        )

        email = (request.query_params.get('email') or '').strip()
        allow_credentials = None

        if email:
            try:
                u = User.objects.get(email=email, face_id_registered=True)
                cred_bytes = decode_credential_id_bytes(u.face_id_credential_id)
                allow_credentials = [
                    PublicKeyCredentialDescriptor(
                        id=cred_bytes,
                        type=PublicKeyCredentialType.PUBLIC_KEY,
                    )
                ]
            except (User.DoesNotExist, ValueError):
                allow_credentials = None

        options = generate_authentication_options(
            rp_id=settings.WEBAUTHN_RP_ID,
            allow_credentials=allow_credentials,
            user_verification=UserVerificationRequirement.REQUIRED,
        )

        request.session['face_id_authentication_challenge'] = options.challenge.hex()
        request.session.modified = True

        from webauthn.helpers import options_to_json_dict

        return Response(options_to_json_dict(options))

    @extend_schema(
        tags=['Face ID'],
        summary='Login with Face ID',
        description='Authenticate using WebAuthn Face ID',
        request=FaceIDLoginSerializer,
    )
    def post(self, request):
        from webauthn import verify_authentication_response

        logger = logging.getLogger(__name__)
        serializer = FaceIDLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        credential = serializer.validated_data['authentication_response']

        challenge_hex = request.session.get('face_id_authentication_challenge')
        if not challenge_hex:
            return Response(
                {'error': 'Authentication challenge expired. Request new login options and try again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cred_id = credential.get('id') or credential.get('rawId')
        if not cred_id:
            return Response({'error': 'Invalid credential payload'}, status=status.HTTP_400_BAD_REQUEST)

        user = find_user_by_credential_id(cred_id)
        if not user or not user.face_id_registered:
            return Response({'error': 'Face ID not recognized'}, status=status.HTTP_401_UNAUTHORIZED)

        challenge = bytes.fromhex(challenge_hex)
        try:
            verification = verify_authentication_response(
                credential=credential,
                expected_challenge=challenge,
                expected_origin=settings.WEBAUTHN_ORIGIN,
                expected_rp_id=settings.WEBAUTHN_RP_ID,
                credential_public_key=base64.b64decode(user.face_id_public_key),
                credential_current_sign_count=user.face_id_sign_count,
                require_user_verification=True,
            )
        except Exception as e:
            logger.warning('Face ID verification failed for %s: %s', user.email, e)
            return Response({'error': 'Face ID verification failed'}, status=status.HTTP_401_UNAUTHORIZED)

        user.face_id_sign_count = verification.new_sign_count
        user.save()

        request.session.pop('face_id_authentication_challenge', None)
        request.session.modified = True

        refresh = RefreshToken.for_user(user)
        log_login_attempt(user, request, success=True)
        create_user_session(user, request, is_verified_2fa=True)

        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
        })


class ListUsersView(APIView):
    """List all users for SuperAdmin."""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Super Admin'],
        summary='List all users',
        description='Get all users in the system (SuperAdmin only)',
        responses={200: UserSerializer(many=True)}
    )
    def get(self, request):
        if not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        users = User.objects.all().order_by('-date_joined')
        return Response(UserSerializer(users, many=True).data)


class CreateUserView(APIView):
    """Create a new user (SuperAdmin only)."""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Super Admin'],
        summary='Create user',
        description='Create a new user directly (SuperAdmin only)',
        request=UserSerializer,
        responses={201: UserSerializer}
    )
    def post(self, request):
        if not (request.user.is_superuser or getattr(request.user, 'is_superadmin', False)):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        data = request.data
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data:
                return Response({'error': f'{field} is required'}, status=status.HTTP_400_BAD_REQUEST)
                
        try:
            if User.objects.filter(username=data['username']).exists():
                return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
                
            if User.objects.filter(email=data['email']).exists():
                return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
            
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                role=data.get('role', 'customer'),
                phone=data.get('phone', ''),
            )
            
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DeleteUserView(APIView):
    """Delete a user (SuperAdmin only)."""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Super Admin'],
        summary='Delete user',
        description='Delete a user from the system (SuperAdmin only)',
        responses={200: inline_serializer("MessageResponse", fields={"message": serializers.CharField()})}
    )
    def delete(self, request, pk):
        if not (request.user.is_superuser or getattr(request.user, 'is_superadmin', False)):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user_to_delete = User.objects.get(pk=pk)
            if user_to_delete == request.user:
                return Response({'error': 'Cannot delete your own account'}, status=status.HTTP_400_BAD_REQUEST)
                
            user_to_delete.delete()
            return Response({'message': f'User {pk} deleted successfully'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': f'User with ID {pk} not found in database'}, status=status.HTTP_404_NOT_FOUND)


class UpdateUserView(APIView):
    """Update user details or password (SuperAdmin only)."""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Super Admin'],
        summary='Update user',
        description='Update user details or reset password (SuperAdmin only)',
        request=UserSerializer,
    )
    def patch(self, request, pk):
        if not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user_to_update = User.objects.get(pk=pk)
            data = request.data
            fields = ['first_name', 'last_name', 'email', 'role', 'phone', 'username']
            for field in fields:
                if field in data:
                    setattr(user_to_update, field, data[field])
            
            if 'password' in data and data['password']:
                user_to_update.set_password(data['password'])
            
            user_to_update.save()
            return Response(UserSerializer(user_to_update).data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class ActiveSessionsView(APIView):
    """View and manage active sessions."""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Security'],
        summary='Get active sessions',
        description='Get all active sessions for the current user',
        responses={200: UserSessionSerializer(many=True)}
    )
    def get(self, request):
        sessions = UserSession.objects.filter(user=request.user)
        return Response(UserSessionSerializer(sessions, many=True).data)


class EndSessionView(APIView):
    """End a specific session."""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Security'],
        summary='End session',
        description='End a specific session by ID',
        responses={200: inline_serializer("EndSessionResponse", fields={"message": serializers.CharField()})}
    )
    def delete(self, request, session_id):
        try:
            session = UserSession.objects.get(id=session_id, user=request.user)
            session.delete()
            return Response({'message': 'Session ended successfully'})
        except UserSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)


class EndAllSessionsView(APIView):
    """End all other sessions."""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Security'],
        summary='End all other sessions',
        description='End all sessions except the current one',
        request=None,
        responses={200: inline_serializer("EndAllSessionsResponse", fields={"message": serializers.CharField()})}
    )
    def post(self, request):
        UserSession.objects.filter(user=request.user, is_current=False).delete()
        return Response({'message': 'All other sessions ended successfully'})


class LoginHistoryView(APIView):
    """View login history."""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Security'],
        summary='Get login history',
        description='Get login history for the current user',
        responses={200: LoginHistorySerializer(many=True)}
    )
    def get(self, request):
        limit = int(request.query_params.get('limit', 50))
        history = LoginHistory.objects.filter(user=request.user)[:limit]
        return Response(LoginHistorySerializer(history, many=True).data)


class TwoFactorSetupView(APIView):
    """Generate 2FA setup details (secret and QR URI)."""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Security'],
        summary='Setup 2FA',
        description='Generate TOTP secret and QR code URI for the current user',
        responses={200: inline_serializer("TwoFactorSetupResponse", fields={
            "secret": serializers.CharField(),
            "otpauth_url": serializers.CharField()
        })}
    )
    def post(self, request):
        user = request.user
        if not user.two_factor_secret:
            user.two_factor_secret = generate_totp_secret()
            user.save()
            
        otp_uri = get_totp_uri(user.email, user.two_factor_secret)
        return Response({
            'secret': user.two_factor_secret,
            'otpauth_url': otp_uri
        })


class TwoFactorEnableView(APIView):
    """Verify and enable 2FA for the user."""
    permission_classes = [IsAuthenticated]
    serializer_class = TwoFactorVerifySerializer
    
    @extend_schema(
        tags=['Security'],
        summary='Enable 2FA',
        description='Verify the first TOTP code and enable 2FA for the user',
        request=TwoFactorVerifySerializer,
        responses={200: inline_serializer("TwoFactorEnableResponse", fields={
            "message": serializers.CharField(),
            "backup_codes": serializers.ListField(child=serializers.CharField())
        })}
    )
    def post(self, request):
        serializer = TwoFactorVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        code = serializer.validated_data['code']
        
        if verify_totp_code(user.two_factor_secret, code):
            user.two_factor_enabled = True
            backup_codes = generate_backup_codes()
            user.two_factor_backup_codes = backup_codes
            user.save()
            
            return Response({
                'message': 'Two-factor authentication enabled successfully',
                'backup_codes': backup_codes
            })
            
        return Response({'error': 'Invalid verification code'}, status=status.HTTP_400_BAD_REQUEST)


class TwoFactorVerifyView(APIView):
    """Verify 2FA code during login process."""
    permission_classes = [AllowAny]
    serializer_class = TwoFactorVerifySerializer
    
    @extend_schema(
        tags=['Auth'],
        summary='Verify 2FA Login',
        description='Verify TOTP or backup code to complete login process',
        request=TwoFactorVerifySerializer
    )
    def post(self, request):
        serializer = TwoFactorVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = request.data.get('email')
        code = serializer.validated_data['code']
        use_backup = serializer.validated_data.get('use_backup_code', False)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if not user.two_factor_enabled:
            return Response({'error': '2FA is not enabled for this user'}, status=status.HTTP_400_BAD_REQUEST)
            
        is_verified = False
        if use_backup:
            if check_and_use_backup_code(user, code):
                is_verified = True
        else:
            if verify_totp_code(user.two_factor_secret, code):
                is_verified = True
                
        if is_verified:
            refresh = RefreshToken.for_user(user)
            log_login_attempt(user, request, success=True)
            create_user_session(user, request, is_verified_2fa=True)
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            })
            
        return Response({'error': 'Invalid 2FA code'}, status=status.HTTP_401_UNAUTHORIZED)


class TwoFactorDisableView(APIView):
    """Disable 2FA for the user."""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Security'],
        summary='Disable 2FA',
        description='Disable Two-Factor Authentication for the current user',
        request=None,
        responses={200: inline_serializer("TwoFactorDisableResponse", fields={"message": serializers.CharField()})}
    )
    def post(self, request):
        user = request.user
        user.two_factor_enabled = False
        user.two_factor_secret = None
        user.two_factor_backup_codes = []
        user.save()
        return Response({'message': 'Two-factor authentication disabled successfully'})


class VerifyDeviceView(APIView):
    """Verify new device with code."""
    permission_classes = [AllowAny]
    serializer_class = DeviceVerificationSerializer

    @extend_schema(
        tags=['Auth'],
        summary='Verify Device',
        description='Verify new device using code and temp token.',
        request=DeviceVerificationSerializer,
        responses={200: UserSerializer}
    )
    def post(self, request):
        serializer = DeviceVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        code = serializer.validated_data['code']
        temp_token = serializer.validated_data['temp_token']
        device_name = serializer.validated_data.get('device_name', 'Unknown Device')
        remember = serializer.validated_data.get('remember_device', True)
        
        try:
            data = signing.loads(temp_token, salt='device-verify', max_age=300)
        except signing.BadSignature:
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
            
        if str(data.get('code')) != str(code):
             return Response({'error': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)
             
        user_id = data.get('user_id')
        user = User.objects.get(id=user_id)
        
        response_data = {}
        if remember:
            device_identifier = str(uuid.uuid4())
            if not device_name or device_name == 'Unknown Device':
                ua_info = parse_user_agent_info(request.META.get('HTTP_USER_AGENT', ''))
                device_name = ua_info['device_name']
            
            TrustedDevice.objects.create(
                user=user,
                device_identifier=device_identifier,
                device_name=device_name,
                is_trusted=True
            )
            response_data['set_cookie'] = device_identifier
            
        refresh = RefreshToken.for_user(user)
        log_login_attempt(user, request, success=True)
        create_user_session(user, request, is_verified_2fa=True)
        
        resp = Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })
        
        if remember and 'set_cookie' in response_data:
            resp.set_cookie(
                'savdoon_device_token',
                response_data['set_cookie'],
                max_age=365*24*60*60,
                httponly=True,
                samesite='Lax',
                secure=False
            )
        return resp


class TrustedDevicesListView(generics.ListAPIView):
    """List trusted devices."""
    serializer_class = TrustedDeviceSerializer
    permission_classes = [IsAuthenticated]
    
    @extend_schema(tags=['Security'], summary='List trusted devices')
    def get_queryset(self):
        return TrustedDevice.objects.filter(user=self.request.user)


class DeleteTrustedDeviceView(generics.DestroyAPIView):
    """Remove a trusted device."""
    queryset = TrustedDevice.objects.all()
    serializer_class = TrustedDeviceSerializer
    permission_classes = [IsAuthenticated]
    
    @extend_schema(tags=['Security'], summary='Remove trusted device')
    def get_queryset(self):
        return TrustedDevice.objects.filter(user=self.request.user)


class ProfileUpdateView(APIView):
    """Update current user profile info."""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Auth'],
        summary='Update profile',
        description='Update current authenticated user information',
        request=UserSerializer,
        responses={200: UserSerializer}
    )
    def patch(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Security: Prevent role escalation or plain_password manipulation
        if 'role' in request.data and not user.is_superuser:
            serializer.validated_data.pop('role', None)
        if 'plain_password' in request.data:
            serializer.validated_data.pop('plain_password', None)
            
        serializer.save()
        return Response(serializer.data)


class PasswordChangeView(APIView):
    """Securely change current user password."""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        tags=['Auth'],
        summary='Change password',
        description='Change password for the current authenticated user',
        request=inline_serializer("PasswordChangeRequest", fields={
            "old_password": serializers.CharField(),
            "new_password": serializers.CharField()
        }),
        responses={200: inline_serializer("MessageResponse", fields={"message": serializers.CharField()})}
    )
    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not old_password or not new_password:
            return Response({'error': 'Both old and new passwords are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not user.check_password(old_password):
            return Response({'error': 'Incorrect old password'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            from django.contrib.auth.password_validation import validate_password
            validate_password(new_password, user)
        except Exception as e:
            return Response({'error': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(new_password)
        user.save()
        
        # Log the security event
        log_audit_event(user, 'security_event', 'Password changed successfully', request=request)
        
        return Response({'message': 'Password updated successfully'})
