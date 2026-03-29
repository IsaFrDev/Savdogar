"""
Session and login tracking utilities.
"""
import uuid
from django.utils import timezone
try:
    from user_agents import parse as parse_user_agent
except ImportError:
    parse_user_agent = None


def get_client_ip(request):
    """Get client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
    return ip


def parse_user_agent_info(user_agent_string):
    """Parse user agent string and extract device info."""
    if parse_user_agent is None:
        return {
            'browser': 'Unknown',
            'os': 'Unknown',
            'device_type': 'unknown',
            'device_name': 'Unknown Device',
        }
    
    try:
        ua = parse_user_agent(user_agent_string)
        
        # Get browser info
        browser = f"{ua.browser.family}"
        if ua.browser.version_string:
            browser += f" {ua.browser.version_string.split('.')[0]}"
        
        # Get OS info
        os_info = f"{ua.os.family}"
        if ua.os.version_string:
            os_info += f" {ua.os.version_string}"
        
        # Determine device type
        if ua.is_mobile:
            device_type = 'mobile'
        elif ua.is_tablet:
            device_type = 'tablet'
        else:
            device_type = 'desktop'
        
        # Create device name
        device_name = f"{browser} on {os_info}"
        
        return {
            'browser': browser,
            'os': os_info,
            'device_type': device_type,
            'device_name': device_name,
        }
    except Exception:
        return {
            'browser': 'Unknown',
            'os': 'Unknown',
            'device_type': 'unknown',
            'device_name': 'Unknown Device',
        }


def create_user_session(user, request, token_key=None, is_verified_2fa=False):
    """Create a new user session."""
    from .models import UserSession
    
    ip_address = get_client_ip(request)
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    ua_info = parse_user_agent_info(user_agent)
    
    # Generate unique session key if not provided
    session_key = token_key or str(uuid.uuid4())
    
    # Mark all other sessions as not current
    UserSession.objects.filter(user=user).update(is_current=False)
    
    # Create new session
    session = UserSession.objects.create(
        user=user,
        session_key=session_key,
        device_name=ua_info['device_name'],
        device_type=ua_info['device_type'],
        browser=ua_info['browser'],
        os=ua_info['os'],
        ip_address=ip_address,
        is_current=True,
        is_verified_2fa=is_verified_2fa,
    )
    
    return session


def log_login_attempt(user, request, success=True, failure_reason=''):
    """Log a login attempt."""
    from .models import LoginHistory
    
    ip_address = get_client_ip(request)
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    ua_info = parse_user_agent_info(user_agent)
    
    LoginHistory.objects.create(
        user=user,
        ip_address=ip_address,
        user_agent=user_agent,
        browser=ua_info['browser'],
        os=ua_info['os'],
        success=success,
        failure_reason=failure_reason,
    )


def end_user_session(session_key):
    """End a user session by session key."""
    from .models import UserSession
    
    try:
        session = UserSession.objects.get(session_key=session_key)
        session.delete()
        return True
    except UserSession.DoesNotExist:
        return False
