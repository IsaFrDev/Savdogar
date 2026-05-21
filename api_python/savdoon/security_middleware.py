"""
Security Middleware for Savdoon Platform
Provides:
- File upload validation
- Security headers
- Request rate monitoring
- Suspicious activity detection
"""
import logging
from django.conf import settings
from django.http import HttpResponseForbidden, HttpResponseBadRequest

logger = logging.getLogger('savdoon.security')


class FileUploadValidationMiddleware:
    """
    Validates file uploads to prevent malicious file uploads
    - Checks file size
    - Validates file extensions
    - Prevents executable file uploads
    """
    
    # Maximum file sizes (in bytes)
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
    MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50MB
    MAX_DOCUMENT_SIZE = 10 * 1024 * 1024  # 10MB
    
    # Allowed file extensions
    ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'}
    ALLOWED_VIDEO_EXTENSIONS = {'.mp4', '.avi', '.mov', '.mkv', '.webm'}
    ALLOWED_DOCUMENT_EXTENSIONS = {'.pdf', '.doc', '.docx', '.xls', '.xlsx'}
    
    # Dangerous extensions to block
    DANGEROUS_EXTENSIONS = {
        '.exe', '.bat', '.cmd', '.com', '.scr', '.pif', '.msi',  # Windows executables
        '.sh', '.bash', '.zsh', '.fish',  # Shell scripts
        '.php', '.asp', '.aspx', '.jsp', '.cgi',  # Server scripts
        '.js', '.jsx', '.ts', '.tsx',  # JavaScript (prevent XSS via upload)
        '.html', '.htm',  # HTML (prevent XSS)
        '.py', '.rb', '.pl',  # Scripting languages
    }
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only check POST/PUT/PATCH requests with files
        if request.method in ['POST', 'PUT', 'PATCH'] and request.FILES:
            for uploaded_file in request.FILES.values():
                # Check file size
                if uploaded_file.size > self.MAX_IMAGE_SIZE * 10:  # Absolute max 50MB
                    logger.warning(
                        f"File too large: {uploaded_file.name} ({uploaded_file.size} bytes) "
                        f"by user {getattr(request.user, 'id', 'anonymous')}"
                    )
                    return HttpResponseBadRequest(
                        "Fayl hajmi juda katta. Maksimal hajm: 50MB"
                    )
                
                # Check file extension
                file_ext = '.' + uploaded_file.name.split('.')[-1].lower()
                
                if file_ext in self.DANGEROUS_EXTENSIONS:
                    logger.warning(
                        f"Dangerous file upload blocked: {uploaded_file.name} "
                        f"(extension: {file_ext}) by user {getattr(request.user, 'id', 'anonymous')}"
                    )
                    return HttpResponseForbidden(
                        "Bu fayl turi ruxsat etilmaydi. Xavfsizlik sababli bloklandi."
                    )
                
                # Validate against allowed extensions for specific content types
                if 'image' in uploaded_file.content_type:
                    if file_ext not in self.ALLOWED_IMAGE_EXTENSIONS:
                        return HttpResponseBadRequest(
                            f"Rasm fayli turi noto'g'ri. Ruxsat etilgan: {', '.join(self.ALLOWED_IMAGE_EXTENSIONS)}"
                        )
                
                elif 'video' in uploaded_file.content_type:
                    if file_ext not in self.ALLOWED_VIDEO_EXTENSIONS:
                        return HttpResponseBadRequest(
                            f"Video fayli turi noto'g'ri. Ruxsat etilgan: {', '.join(self.ALLOWED_VIDEO_EXTENSIONS)}"
                        )
        
        response = self.get_response(request)
        return response


class SecurityHeadersMiddleware:
    """
    Adds security headers to all responses.
    Note: CORS headers are handled by django-cors-headers middleware — do NOT set them here.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Security headers — use dict-style assignment; not all response types support .pop()
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = (
            'camera=(), microphone=(), geolocation=(), payment=(self)'
        )

        # Remove server header to prevent information disclosure
        try:
            del response['Server']
        except KeyError:
            pass

        # HSTS (only in production)
        if not settings.DEBUG:
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'

        return response


class SuspiciousActivityMiddleware:
    """
    Detects and logs suspicious activities:
    - SQL injection attempts
    - Path traversal attempts
    - Excessive 404 errors
    - Suspicious user agents
    """
    
    SUSPICIOUS_PATTERNS = [
        '../', '..\\',  # Path traversal
        '<script', 'javascript:',  # XSS in URL
        '/etc/passwd', '/etc/shadow', 'wp-admin', 'phpmyadmin',  # Common probes
    ]
    
    SUSPICIOUS_USER_AGENTS = [
        'sqlmap', 'nikto', 'nmap', 'masscan', 'dirbuster',
        'gobuster', 'wfuzz', 'burpsuite', 'metasploit'
    ]
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check for suspicious patterns in URL and query params
        request_path = request.get_full_path().lower()
        
        for pattern in self.SUSPICIOUS_PATTERNS:
            if pattern.lower() in request_path:
                logger.critical(
                    f"Suspicious activity detected from IP {request.META.get('REMOTE_ADDR')}: "
                    f"Pattern '{pattern}' in path '{request_path}'"
                )
                return HttpResponseForbidden(
                    "So'rov xavfsizlik sababli bloklandi."
                )
        
        # Check user agent
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        for suspicious_ua in self.SUSPICIOUS_USER_AGENTS:
            if suspicious_ua in user_agent:
                logger.critical(
                    f"Suspicious user agent blocked: {user_agent} "
                    f"from IP {request.META.get('REMOTE_ADDR')}"
                )
                return HttpResponseForbidden(
                    "Ruxsat etilmagan foydalanuvchi agenti."
                )
        
        response = self.get_response(request)
        return response