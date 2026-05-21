from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Store
from products.ai_service import builder_ai_service as ai_service
from .store_templates import get_template_for_business_type
import logging
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger('savdoon')

# Simple in-memory rate limiting
rate_limit_store = {}

def check_rate_limit(user_id, max_requests=20, window_seconds=60):
    """Check if user has exceeded rate limit"""
    now = timezone.now()
    window_start = now - timedelta(seconds=window_seconds)
    
    # Clean old entries
    if user_id in rate_limit_store:
        rate_limit_store[user_id] = [
            timestamp for timestamp in rate_limit_store[user_id]
            if timestamp > window_start
        ]
    
    # Check current count
    current_count = len(rate_limit_store.get(user_id, []))
    
    if current_count >= max_requests:
        return False  # Rate limit exceeded
    
    # Add current request
    if user_id not in rate_limit_store:
        rate_limit_store[user_id] = []
    rate_limit_store[user_id].append(now)
    
    return True  # OK

import bleach

# HTML Sanitization Configuration
ALLOWED_TAGS = [
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'img', 'ul', 'ol', 'li', 'section', 'article', 'header', 'footer',
    'nav', 'main', 'aside', 'input', 'button', 'textarea', 'select',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'label', 'style', 'link', 'br', 'hr'
]
ALLOWED_ATTRS = [
    'class', 'id', 'style', 'href', 'src', 'alt', 'title', 'target',
    'rel', 'type', 'name', 'value', 'placeholder', 'disabled', 'checked',
    'data-*', 'aria-*', 'role'
]

def sanitize_html_content(html_content: str) -> str:
    """Sanitize HTML content to prevent XSS attacks"""
    if not html_content:
        return html_content
    
    # Remove script, iframe, object, embed tags completely
    dangerous_tags = ['script', 'iframe', 'object', 'embed', 'form', 'meta']
    for tag in dangerous_tags:
        html_content = bleach.clean(
            html_content,
            tags=[],
            attributes={},
            strip=True,
            strip_comments=True
        )
    
    # Clean with allowed tags/attributes
    return bleach.clean(
        html_content,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        strip=True,
        strip_comments=True
    )

class StoreBuilderChatView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Check rate limit
        if not check_rate_limit(request.user.id, max_requests=20, window_seconds=60):
            logger.warning(f"Rate limit exceeded for user {request.user.id}")
            return Response({
                "error": "Juda ko'p so'rov yubordingiz. Iltimos, 1 daqiqadan keyin qayta urinib ko'ring.",
                "message": "Rate limit exceeded. Please try again in 1 minute."
            }, status=429)
        
        store_id = request.data.get('store_id')
        user_prompt = request.data.get('message')
        generate_template = request.data.get('generate_template', False)
        
        if not store_id or not user_prompt:
            return Response({"error": "store_id and message are required"}, status=400)
            
        try:
            store = Store.objects.get(id=store_id, owner=request.user)
            
            # If first time or template generation requested, use professional template
            if generate_template or (not store.store_files and not store.store_html):
                template = get_template_for_business_type(store.business_type)
                
                # Replace placeholders
                store_html = template['html'].replace('{{STORE_NAME}}', store.name)
                store_css = template['css'].replace('{{PRIMARY_COLOR}}', template['primary_color'])
                store_css = store_css.replace('{{SECONDARY_COLOR}}', template['secondary_color'])
                store_css = store_css.replace('{{ACCENT_COLOR}}', template['accent_color'])
                
                store.primary_color = template['primary_color']
                store.secondary_color = template['secondary_color']
                store.accent_color = template['accent_color']
                store.store_files = {
                    'index.html': store_html,
                    'css/style.css': store_css,
                    'js/main.js': template['js']
                }
                store.save()
                
                return Response({
                    "message": "Professional template generated!",
                    "theme_config": store.theme_config,
                    "ui_schema": store.ui_schema,
                    "store_html": store.store_html,
                    "store_files": store.store_files,
                    "ai_reply": f"🎨 {store.name} uchun professional {template['name']} dizayni yaratildi! Bu zamonaviy, responsive va chiroyli storefront."
                })
            
            # Otherwise use AI for modifications
            ai_data = ai_service.generate_ui_config(
                user_prompt=user_prompt,
                business_type=store.get_business_type_display(),
                current_config=store.theme_config,
                current_schema=store.ui_schema,
                current_html=store.store_html,
                current_files=store.store_files
            )
            
            # Update store colors if AI suggested them
            if 'primary_color' in ai_data:
                store.primary_color = ai_data['primary_color']
            if 'secondary_color' in ai_data:
                store.secondary_color = ai_data['secondary_color']
            if 'accent_color' in ai_data:
                store.accent_color = ai_data['accent_color']
                
            store.theme_config = ai_data.get('theme_config', store.theme_config)
            store.ui_schema = ai_data.get('ui_schema', store.ui_schema)
            store.store_html = ai_data.get('store_html', store.store_html)
            store.store_files = ai_data.get('store_files', store.store_files)
            store.save()
            
            return Response({
                "message": "Store design updated successfully!",
                "theme_config": store.theme_config,
                "ui_schema": store.ui_schema,
                "store_html": store.store_html,
                "store_files": store.store_files,
                "ai_reply": ai_data.get('ai_logic_summary', "Loyiha muvaffaqiyatli yangilandi.")
            })
            
        except Store.DoesNotExist:
            return Response({"error": "Store not found or access denied"}, status=404)
        except Exception as e:
            logger.error(f"Error in builder view: {e}")
            return Response({
                "error": "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
                "details": str(e)
            }, status=500)

class StoreBuilderSchemaUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        store_id = request.data.get('store_id')
        ui_schema = request.data.get('ui_schema')
        
        if not store_id or ui_schema is None:
            return Response({"error": "store_id and ui_schema are required"}, status=400)
            
        try:
            store = Store.objects.get(id=store_id, owner=request.user)
            store.ui_schema = ui_schema
            store.save()
            return Response({
                "message": "Schema updated successfully",
                "ui_schema": store.ui_schema
            })
        except Store.DoesNotExist:
            return Response({"error": "Store not found or access denied"}, status=404)
        except Exception as e:
            logger.error(f"Error in builder view: {e}")
            return Response({
                "error": "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring."
            }, status=500)

class StoreBuilderHtmlUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        store_id = request.data.get('store_id')
        store_html = request.data.get('store_html')
        
        if not store_id or store_html is None:
            return Response({"error": "store_id and store_html are required"}, status=400)
        
        # Validate HTML size (max 1MB)
        if len(store_html) > 1_000_000:
            return Response({
                "error": "HTML hajmi juda katta. Maksimal hajm: 1MB"
            }, status=400)
            
        try:
            store = Store.objects.get(id=store_id, owner=request.user)
            
            # Sanitize HTML to prevent XSS
            sanitized_html = sanitize_html_content(store_html)
            
            # Log if HTML was modified (security event)
            if sanitized_html != store_html:
                logger.warning(f"Malicious HTML detected and sanitized for store {store_id} by user {request.user.id}")
            
            store.store_html = sanitized_html
            store.save()
            return Response({
                "message": "HTML updated successfully",
                "store_html": store.store_html
            })
        except Store.DoesNotExist:
            return Response({"error": "Store not found or access denied"}, status=404)
        except Exception as e:
            logger.error(f"Error in builder view: {e}")
            return Response({
                "error": "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring."
            }, status=500)
class StoreBuilderFilesUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        store_id = request.data.get('store_id')
        store_files = request.data.get('store_files')
        
        if not store_id or store_files is None:
            return Response({"error": "store_id and store_files are required"}, status=400)
            
        try:
            store = Store.objects.get(id=store_id, owner=request.user)
            store.store_files = store_files
            store.save()
            return Response({
                "message": "Files updated successfully",
                "store_files": store.store_files
            })
        except Store.DoesNotExist:
            return Response({"error": "Store not found or access denied"}, status=404)
        except Exception as e:
            logger.error(f"Error in builder view: {e}")
            return Response({
                "error": "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring."
            }, status=500)
