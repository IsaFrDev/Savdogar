from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from django.http import HttpResponse
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter
from io import BytesIO
import uuid

from .models import Store, Contract
from savdoon.currency_service import currency_service
from .serializers import (
    StoreSerializer, StoreCreateSerializer, ContractSerializer, 
    StoreApprovalSerializer
)
from .permissions import IsStoreOwner, IsSuperAdmin


class StoreViewSet(viewsets.ModelViewSet):
    """ViewSet for Store CRUD operations."""
    
    serializer_class = StoreSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        # Allow unauthorized users for public actions
        public_actions = ['list', 'retrieve', 'by_slug', 'marketplace', 'nearby']
        if getattr(self, 'action', None) in public_actions or \
           (hasattr(self, 'request') and self.request and self.request.method == 'GET'):
            return [AllowAny()]
        if getattr(self, 'action', None) == 'destroy':
            return [IsAuthenticated(), IsSuperAdmin()]
        return [IsAuthenticated()]

    def get_authenticators(self):
        # Allow unauthorized users for public actions (GET requests)
        public_actions = ['list', 'retrieve', 'by_slug', 'marketplace', 'nearby']
        if getattr(self, 'action', None) in public_actions or \
           (hasattr(self, 'request') and self.request and self.request.method == 'GET'):
            return []
        return super().get_authenticators()

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Store.objects.filter(status='approved', maintenance_mode=False)
            
        # Superadmins see everything
        if user.is_superuser or getattr(user, 'role', '') == 'superadmin':
            return Store.objects.all()
            
        # Retrieve action allows seeing the specific store if owned or approved/not in maintenance
        if self.action == 'retrieve':
            pk = self.kwargs.get('pk')
            if Store.objects.filter(pk=pk, owner=user).exists():
                return Store.objects.all()
            return Store.objects.filter(status='approved', maintenance_mode=False)
            
        # Standard list action for owners
        return Store.objects.filter(owner=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return StoreCreateSerializer
        return StoreSerializer
    
    @extend_schema(
        tags=['Stores'],
        summary='List stores',
        description='Get list of stores owned by current user (or all for superadmin)',
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @extend_schema(
        tags=['Stores'],
        summary='Create store',
        description='Create a new store with contract signature',
        request=StoreCreateSerializer,
    )
    def create(self, request, *args, **kwargs):
        # Use .dict() instead of .copy() because .copy() on QueryDict with files 
        # triggers deepcopy which fails with '_io.BufferedRandom' error
        data = request.data.dict() if hasattr(request.data, 'dict') else request.data.copy()
        
        from products.ai_service import ai_service
        
        description = data.get('description', '')
        business_description = data.get('business_description', '')
        default_lang = data.get('default_language', 'uz')
        
        if default_lang == 'uz':
            # Translate to Russian
            if description and not data.get('description_ru'):
                data['description_ru'] = ai_service.translate_text(description, 'ru')
                data['description_uz'] = description
            if business_description and not data.get('business_description_ru'):
                data['business_description_ru'] = ai_service.translate_text(business_description, 'ru')
                data['business_description_uz'] = business_description
        elif default_lang == 'ru':
            # Translate to Uzbek
            if description and not data.get('description_uz'):
                data['description_uz'] = ai_service.translate_text(description, 'uz')
                data['description_ru'] = description
            if business_description and not data.get('business_description_uz'):
                data['business_description_uz'] = ai_service.translate_text(business_description, 'uz')
                data['business_description_ru'] = business_description

        try:
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            store = serializer.save()
            
            try:
                self._generate_contract_pdf(store)
            except Exception as pdf_error:
                import logging
                import traceback
                logger = logging.getLogger('savdoon')
                logger.error(f"PDF Generation error for store {store.slug}: {pdf_error}\n{traceback.format_exc()}")
                # We don't want to fail the whole creation if only PDF fails, 
                # but for now let's know about it.
            
            return Response(StoreSerializer(store).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            import logging
            import traceback
            logger = logging.getLogger('savdoon')
            logger.error(f"Error in StoreViewSet.create: {e}\n{traceback.format_exc()}")
            return Response({
                'error': 'Internal server error during store creation. Please check console logs.',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, *args, **kwargs):
        """Override update to handle JSON parsing for theme_config and color truncation."""
        # Use .dict() instead of .copy() to avoid pickle error with files
        data = request.data.dict() if hasattr(request.data, 'dict') else request.data.copy()
        
        # Parse theme_config if it's a string (happens with FormData)
        if 'theme_config' in data and isinstance(data['theme_config'], str):
            try:
                import json
                data['theme_config'] = json.loads(data['theme_config'])
            except json.JSONDecodeError:
                pass
        
        # Fix for 400 error: Truncate colors to 7 chars (e.g. #RRGGBBAA -> #RRGGBB)
        # The model fields primary_color/secondary_color have max_length=7
        for color_field in ['primary_color', 'secondary_color', 'accent_color']:
            if color_field in data and isinstance(data[color_field], str) and len(data[color_field]) > 7:
                data[color_field] = data[color_field][:7]

        partial = kwargs.get('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=partial)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        self.perform_update(serializer)
        
        # Broadcast the update via WebSocket
        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"store_{instance.id}",
                {
                    "type": "store_event",
                    "message": {
                        "type": "store_updated",
                        "store_id": instance.id,
                        "data": serializer.data
                    }
                }
            )
        except Exception as e:
            print(f"WebSocket broadcast failed: {e}")

        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='generate-api-key')
    def generate_api_key(self, request, pk=None):
        """Generate or rotate API key for the store."""
        store = self.get_object()
        if request.user != store.owner and not request.user.is_superuser:
             return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        store.api_key = f"sk_live_{uuid.uuid4().hex}"
        store.save()
        return Response({'api_key': store.api_key})
    
    def _generate_contract_pdf(self, store):
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        from reportlab.lib.units import inch
        from django.core.files.base import ContentFile
        import base64
        
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        p.setFont("Helvetica-Bold", 20)
        p.drawCentredString(width / 2, height - inch, "SAVDOON STORE AGREEMENT")
        p.setFont("Helvetica", 12)
        y = height - 2 * inch
        lines = [
            f"Store Name: {store.name}",
            f"Owner: {store.owner.get_full_name() or store.owner.username}",
            f"Email: {store.owner.email}",
            f"Business Type: {store.get_business_type_display()}",
            f"Monthly Fee: 150,000 UZS",
            f"Date: {timezone.now().strftime('%Y-%m-%d %H:%M')}",
            "",
            "TERMS AND CONDITIONS:",
            "",
            "1. The store owner agrees to comply with all Savdoon platform rules.",
            "2. The store owner is responsible for the accuracy of product information.",
            "3. Savdoon reserves the right to remove listings that violate policies.",
            "4. Payment processing fees apply as per the current fee schedule.",
            "5. The store owner agrees to handle customer disputes professionally.",
            "",
            "By signing below, you agree to these terms and conditions.",
        ]
        for line in lines:
            p.drawString(inch, y, line)
            y -= 20
        p.drawString(inch, y - 40, "Digital Signature:")
        if store.signature_data and store.signature_data.startswith('data:image'):
            try:
                signature_base64 = store.signature_data.split(',')[1]
                signature_bytes = base64.b64decode(signature_base64)
                from reportlab.lib.utils import ImageReader
                from PIL import Image
                import io
                img = Image.open(io.BytesIO(signature_bytes))
                img_reader = ImageReader(img)
                p.drawImage(img_reader, inch, y - 120, width=200, height=60)
            except Exception:
                p.drawString(inch, y - 60, "[Signature on file]")
        p.showPage()
        p.save()
        buffer.seek(0)
        store.contract_pdf.save(
            f"contract_{store.slug}_{timezone.now().strftime('%Y%m%d')}.pdf",
            ContentFile(buffer.getvalue())
        )
        store.contract_signed_at = timezone.now()
        store.save()
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny], authentication_classes=[])
    def by_slug(self, request):
        try:
            slug = request.query_params.get('slug')
            if not slug:
                return Response({'error': 'Slug is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                store = Store.objects.get(slug=slug)
            except Store.DoesNotExist:
                return Response({
                    'error': f'Store with slug "{slug}" not found',
                    'debug': 'Check if the slug is correct or if the store was deleted'
                }, status=status.HTTP_404_NOT_FOUND)
            # If in maintenance mode, only owner and superadmin can see full data
            if store.maintenance_mode:
                user = request.user
                is_privileged = user.is_authenticated and (user.is_superuser or getattr(user, 'role', '') == 'superadmin' or store.owner == user)
                if not is_privileged:
                    return Response({
                        'id': store.id, 
                        'name': store.name, 
                        'status': store.status, 
                        'maintenance_mode': True,
                        'message': 'This store is currently undergoing maintenance.'
                    })
            
            if store.status != 'approved':
                return Response({'id': store.id, 'name': store.name, 'status': store.status, 'is_pending_or_rejected': True})
            return Response(StoreSerializer(store).data)
        except Store.DoesNotExist:
            return Response({'error': 'Store not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import logging
            logger = logging.getLogger('savdoon')
            logger.error(f"Database error in by_slug: {e}")
            return Response({'error': 'Database initialization in progress. Please refresh in 30 seconds.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny], authentication_classes=[])
    def marketplace(self, request):
        try:
            stores = Store.objects.filter(status='approved', maintenance_mode=False).order_by('-rating', '-created_at')
            return Response(StoreSerializer(stores, many=True).data)
        except Exception as e:
            return Response({'error': 'Database initializing...'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    @action(detail=True, methods=['get'])
    def download_contract(self, request, pk=None):
        store = self.get_object()
        if not store.contract_pdf:
            return Response({'error': 'No contract PDF available'}, status=status.HTTP_404_NOT_FOUND)
        response = HttpResponse(store.contract_pdf.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="contract_{store.slug}.pdf"'
        return response

    @action(detail=True, methods=['post'])
    def test_telegram(self, request, pk=None):
        store = self.get_object()
        bot_token = request.data.get('bot_token') or store.telegram_bot_token
        chat_id = request.data.get('chat_id') or store.telegram_chat_id
        if not bot_token or not chat_id:
            return Response({'error': 'Telegram bot token and chat ID are required'}, status=status.HTTP_400_BAD_REQUEST)
        from savdoon.notification_service import notification_service
        success = notification_service.send_telegram_message(
            bot_token, chat_id, 
            f"✅ <b>Savdoon Test Xabari</b>\n\nSizning do'koningiz ({store.name}) uchun Telegram bildirishnomalari muvaffaqiyatli sozlandi!"
        )
        if success:
            return Response({'message': 'Test message sent successfully'})
        return Response({'error': 'Failed to send test message'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        from orders.models import Order, OrderItem
        from django.db.models import Count, Sum, Avg
        from django.db.models.functions import ExtractHour, ExtractDayOfWeek
        from datetime import timedelta
        store = self.get_object()
        period = request.query_params.get('period', '30d')
        days = {'7d': 7, '30d': 30, '90d': 90}.get(period, 30)
        start_date = timezone.now().date() - timedelta(days=days)
        orders = Order.objects.filter(store=store, created_at__date__gte=start_date).exclude(status='cancelled')
        top_products = OrderItem.objects.filter(order__in=orders).values('product_id', 'product_name').annotate(total_sold=Sum('quantity'), total_revenue=Sum('subtotal')).order_by('-total_sold')[:10]
        hourly_orders = orders.annotate(hour=ExtractHour('created_at')).values('hour').annotate(count=Count('id')).order_by('-count')
        peak_hours = list(hourly_orders[:5])
        daily_orders = orders.annotate(day=ExtractDayOfWeek('created_at')).values('day').annotate(count=Count('id')).order_by('-count')
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        peak_days = [{'day': day_names[item['day'] - 1] if item['day'] else 'Unknown', 'count': item['count']} for item in daily_orders[:3]]
        all_customers = orders.filter(customer__isnull=False).values('customer').distinct().count()
        returning_customers = Order.objects.filter(store=store, customer__isnull=False).values('customer').annotate(order_count=Count('id')).filter(order_count__gt=1).count()
        returning_rate = (returning_customers / all_customers * 100) if all_customers > 0 else 0
        avg_order_value = orders.aggregate(avg=Avg('total'))['avg'] or 0
        return Response({
            'period': period,
            'top_products': list(top_products),
            'peak_hours': peak_hours,
            'peak_days': peak_days,
            'returning_customer_rate': round(returning_rate, 1),
            'total_customers': all_customers,
            'returning_customers': returning_customers,
            'average_order_value': float(avg_order_value),
        })

    @action(detail=True, methods=['post'])
    def send_newsletter(self, request, pk=None):
        store = self.get_object()
        if request.user != store.owner and not (hasattr(request.user, 'role') and request.user.role == 'superadmin'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        title, message = request.data.get('title'), request.data.get('message')
        if not title or not message:
            return Response({'error': 'Title and message are required'}, status=status.HTTP_400_BAD_REQUEST)
        from notifications.models import Notification
        from orders.models import Order
        customer_ids = Order.objects.filter(store=store, customer__isnull=False).values_list('customer_id', flat=True).distinct()
        if not customer_ids:
            return Response({'message': 'No customers found'})
        notifications = [Notification(user_id=cid, store=store, type='promotion', title=title, message=message) for cid in customer_ids]
        Notification.objects.bulk_create(notifications)
        return Response({'message': f'Newsletter sent to {len(notifications)} customers'})

    @action(detail=False, methods=['get'], permission_classes=[AllowAny], authentication_classes=[])
    def nearby(self, request):
        lat, lng = request.query_params.get('lat'), request.query_params.get('lng')
        radius = float(request.query_params.get('radius', 50))
        if not lat or not lng:
            return Response({'error': 'Latitude and longitude are required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            lat, lng = float(lat), float(lng)
        except ValueError:
            return Response({'error': 'Invalid coordinates'}, status=status.HTTP_400_BAD_REQUEST)
        from math import radians, cos, sin, asin, sqrt
        def haversine(lon1, lat1, lon2, lat2):
            lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
            dlon, dlat = lon2 - lon1, lat2 - lat1 
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            return 2 * asin(sqrt(a)) * 6371 
        stores = Store.objects.filter(status='approved', maintenance_mode=False, latitude__isnull=False, longitude__isnull=False)
        nearby_stores = []
        for store in stores:
            distance = haversine(lng, lat, float(store.longitude), float(store.latitude))
            if distance <= radius:
                store_data = StoreSerializer(store).data
                store_data['distance'] = round(distance, 2)
                nearby_stores.append(store_data)
        nearby_stores.sort(key=lambda x: x['distance'])
        return Response(nearby_stores)


class PendingStoresView(generics.ListAPIView):
    """List all pending stores for super admin."""
    serializer_class = StoreSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    def get_queryset(self):
        return Store.objects.filter(status='pending').order_by('-created_at')


class StoreApprovalView(APIView):
    """Approve or reject a store."""
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    serializer_class = StoreApprovalSerializer
    def post(self, request, pk):
        try:
            store = Store.objects.get(pk=pk)
        except Store.DoesNotExist:
            return Response({'error': 'Store not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = StoreApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data['action']
        if action == 'approve':
            store.status = 'approved'
            store.subscription_expiry = timezone.now() + timezone.timedelta(days=30)
            message = 'Store approved'
        else:
            store.status = 'rejected'
            message = 'Store rejected'
            if store.contract_pdf: store.contract_pdf.delete(save=False)
            store.contract_signed = False
            store.signature_data = ""
            store.contracts.all().delete()
            from savdoon.notification_service import notification_service
            notification_service.send_telegram_message(store.telegram_bot_token, store.telegram_chat_id, f"❌ Do'kon rad etildi")
        store.save()
        return Response({'message': message, 'store': StoreSerializer(store).data})


class ContractTemplateView(APIView):
    """Get contract template text."""
    permission_classes = [AllowAny]
    def get(self, request):
        lang = request.query_params.get('lang', 'en')
        templates = {'en': "SAVDOON AGREEMENT...", 'uz': "SAVDOON SHARTNOMASI...", 'ru': "ДОГОВОР SAVDOON..."}
        return Response({'language': lang, 'content': templates.get(lang, templates['en'])})


class ExchangeRatesView(APIView):
    """Get current real-time exchange rates."""
    permission_classes = [AllowAny]
    def get(self, request):
        rates = currency_service.get_rates()
        return Response(rates)


class AcknowledgeRejectionView(APIView):
    """Acknowledge store rejection and revert role to customer."""
    permission_classes = [IsAuthenticated]
    def post(self, request):
        user = request.user
        rejected_store = Store.objects.filter(owner=user, status='rejected').first()
        if not rejected_store:
            return Response({'error': 'No rejected store found'}, status=status.HTTP_404_NOT_FOUND)
        user.role = 'customer'
        user.save()
        return Response({'message': 'Role reverted', 'user': StoreSerializer(rejected_store).data})
