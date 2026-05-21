from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from .models import (
    PaymentGateway, PaymentTransaction,
    MarketplaceIntegration, MarketplaceProduct, MarketplaceOrder,
    DeliveryIntegration, DeliveryRequest
)
from .serializers import (
    PaymentGatewaySerializer, PaymentTransactionSerializer,
    MarketplaceIntegrationSerializer, MarketplaceProductSerializer,
    MarketplaceOrderSerializer,
    DeliveryIntegrationSerializer, DeliveryRequestSerializer
)
from stores.models import Store


# ==========================================
# PAYMENT GATEWAYS
# ==========================================

class PaymentGatewayViewSet(viewsets.ModelViewSet):
    """Payment gateway configuration"""
    serializer_class = PaymentGatewaySerializer
    permission_classes = [IsAuthenticated]
    queryset = PaymentGateway.objects.none()  # Placeholder, overridden in get_queryset
    
    def get_queryset(self):
        return PaymentGateway.objects.filter(
            store__owner=self.request.user
        )


class PaymentTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """Payment transaction history"""
    serializer_class = PaymentTransactionSerializer
    permission_classes = [IsAuthenticated]
    queryset = PaymentTransaction.objects.none()
    
    def get_queryset(self):
        return PaymentTransaction.objects.filter(
            store__owner=self.request.user
        ).order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """Refund a transaction"""
        transaction = self.get_object()
        
        if transaction.status != 'completed':
            return Response(
                {'error': 'Can only refund completed transactions'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Implement refund logic based on gateway
        if transaction.gateway:
            gateway_type = transaction.gateway.gateway_type
            
            if gateway_type == 'payme':
                from integrations.payme_service import PaymeService
                payme = PaymeService(transaction.gateway)
                result = payme.refund(transaction.transaction_id)
                
                if result['success']:
                    return Response(result)
                else:
                    return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(
            {'error': 'Refund not supported for this gateway'},
            status=status.HTTP_400_BAD_REQUEST
        )


# ==========================================
# MARKETPLACE INTEGRATIONS
# ==========================================

class MarketplaceIntegrationViewSet(viewsets.ModelViewSet):
    """Marketplace integration management"""
    serializer_class = MarketplaceIntegrationSerializer
    permission_classes = [IsAuthenticated]
    queryset = MarketplaceIntegration.objects.none()
    
    def get_queryset(self):
        return MarketplaceIntegration.objects.filter(
            store__owner=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def sync_products(self, request, pk=None):
        """Sync all products to marketplace"""
        integration = self.get_object()
        
        integration.is_syncing = True
        integration.save()
        
        if integration.marketplace_type == 'uzum':
            from integrations.uzum_service import UzumMarketService
            service = UzumMarketService(integration)
            results = service.sync_all_products()
            
        elif integration.marketplace_type == 'wildberries':
            from integrations.wildberries_service import WildberriesService
            service = WildberriesService(integration)
            results = service.sync_all_products()
            
        elif integration.marketplace_type == 'ozon':
            from integrations.ozon_service import OzonService
            service = OzonService(integration)
            results = service.sync_all_products()
            
        else:
            return Response(
                {'error': 'Sync not implemented for this marketplace'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(results)
    
    @action(detail=True, methods=['post'])
    def sync_orders(self, request, pk=None):
        """Fetch orders from marketplace"""
        integration = self.get_object()
        hours_back = request.data.get('hours_back', 24)
        
        if integration.marketplace_type == 'uzum':
            from integrations.uzum_service import UzumMarketService
            service = UzumMarketService(integration)
            results = service.sync_orders_from_uzum(hours_back=hours_back)
            
        elif integration.marketplace_type == 'wildberries':
            from integrations.wildberries_service import WildberriesService
            service = WildberriesService(integration)
            results = service.sync_orders_from_wb(hours_back=hours_back)
            
        elif integration.marketplace_type == 'ozon':
            from integrations.ozon_service import OzonService
            service = OzonService(integration)
            results = service.sync_orders_from_ozon(hours_back=hours_back)
            
        else:
            return Response(
                {'error': 'Order sync not implemented for this marketplace'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(results)
    
    @action(detail=True, methods=['post'])
    def sync_inventory(self, request, pk=None):
        """Sync inventory levels to marketplace"""
        integration = self.get_object()
        product_id = request.data.get('product_id')
        
        if integration.marketplace_type == 'uzum':
            from integrations.uzum_service import UzumMarketService
            service = UzumMarketService(integration)
            results = service.sync_inventory(product_id=product_id)
            
        elif integration.marketplace_type == 'wildberries':
            from integrations.wildberries_service import WildberriesService
            service = WildberriesService(integration)
            results = service.sync_inventory(product_id=product_id)
            
        elif integration.marketplace_type == 'ozon':
            from integrations.ozon_service import OzonService
            service = OzonService(integration)
            results = service.sync_inventory(product_id=product_id)
            
        else:
            return Response(
                {'error': 'Inventory sync not implemented for this marketplace'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(results)
    
    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get marketplace analytics"""
        integration = self.get_object()
        days = request.query_params.get('days', 30)
        
        if integration.marketplace_type == 'uzum':
            from integrations.uzum_service import UzumMarketService
            service = UzumMarketService(integration)
            analytics = service.get_sales_analytics(days=int(days))
            
        elif integration.marketplace_type == 'wildberries':
            from integrations.wildberries_service import WildberriesService
            service = WildberriesService(integration)
            analytics = service.get_sales_analytics(days=int(days))
            
        elif integration.marketplace_type == 'ozon':
            from integrations.ozon_service import OzonService
            service = OzonService(integration)
            analytics = service.get_sales_analytics(days=int(days))
            
        else:
            return Response(
                {'error': 'Analytics not available for this marketplace'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(analytics)


class MarketplaceProductViewSet(viewsets.ReadOnlyModelViewSet):
    """Marketplace product mappings"""
    serializer_class = MarketplaceProductSerializer
    permission_classes = [IsAuthenticated]
    queryset = MarketplaceProduct.objects.none()
    
    def get_queryset(self):
        return MarketplaceProduct.objects.filter(
            integration__store__owner=self.request.user
        )


class MarketplaceOrderViewSet(viewsets.ReadOnlyModelViewSet):
    """Marketplace orders"""
    serializer_class = MarketplaceOrderSerializer
    permission_classes = [IsAuthenticated]
    queryset = MarketplaceOrder.objects.none()
    
    def get_queryset(self):
        return MarketplaceOrder.objects.filter(
            integration__store__owner=self.request.user
        ).order_by('-created_at')


# ==========================================
# DELIVERY INTEGRATIONS
# ==========================================

class DeliveryIntegrationViewSet(viewsets.ModelViewSet):
    """Delivery service integration management"""
    serializer_class = DeliveryIntegrationSerializer
    permission_classes = [IsAuthenticated]
    queryset = DeliveryIntegration.objects.none()
    
    def get_queryset(self):
        return DeliveryIntegration.objects.filter(
            store__owner=self.request.user
        )


class DeliveryRequestViewSet(viewsets.ModelViewSet):
    """Delivery requests"""
    serializer_class = DeliveryRequestSerializer
    permission_classes = [IsAuthenticated]
    queryset = DeliveryRequest.objects.none()
    
    def get_queryset(self):
        return DeliveryRequest.objects.filter(
            store__owner=self.request.user
        ).order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def create_yandex_delivery(self, request, pk=None):
        """Create Yandex Go delivery for an order"""
        from integrations.yandex_go_service import YandexGoService
        from integrations.models import DeliveryIntegration
        
        order = self.get_object()
        
        # Get active Yandex Go integration
        yandex_integration = DeliveryIntegration.objects.filter(
            store=order.store,
            service_type='yandex_go',
            is_active=True
        ).first()
        
        if not yandex_integration:
            return Response(
                {'error': 'Yandex Go delivery not configured for this store'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get delivery details from request
        pickup_address = request.data.get('pickup_address', order.store.address)
        delivery_address = request.data.get('delivery_address')
        pickup_lat = request.data.get('pickup_lat')
        pickup_lon = request.data.get('pickup_lon')
        delivery_lat = request.data.get('delivery_lat')
        delivery_lon = request.data.get('delivery_lon')
        customer_name = request.data.get('customer_name', '')
        customer_phone = request.data.get('customer_phone', '')
        items_description = request.data.get('items_description', '')
        declared_value = request.data.get('declared_value', 0)
        
        if not delivery_address:
            return Response(
                {'error': 'Delivery address is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create delivery request
        yandex = YandexGoService(yandex_integration)
        result = yandex.create_delivery_request(
            order_id=order.id,
            pickup_address=pickup_address,
            delivery_address=delivery_address,
            pickup_coords=(pickup_lat, pickup_lon) if pickup_lat and pickup_lon else None,
            delivery_coords=(delivery_lat, delivery_lon) if delivery_lat and delivery_lon else None,
            customer_name=customer_name,
            customer_phone=customer_phone,
            items_description=items_description,
            declared_value=declared_value,
        )
        
        if result['success']:
            return Response(result, status=status.HTTP_201_CREATED)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def track_delivery(self, request, pk=None):
        """Track delivery status"""
        from integrations.yandex_go_service import YandexGoService
        
        delivery_request = self.get_object()
        
        if not delivery_request.external_request_id:
            return Response(
                {'error': 'No external delivery request ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        yandex = YandexGoService(delivery_request.delivery_integration)
        result = yandex.get_delivery_status(delivery_request.external_request_id)
        
        if result['success']:
            return Response(result)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel_delivery(self, request, pk=None):
        """Cancel delivery request"""
        from integrations.yandex_go_service import YandexGoService
        
        delivery_request = self.get_object()
        reason = request.data.get('reason', 'Cancelled by user')
        
        if not delivery_request.external_request_id:
            return Response(
                {'error': 'No external delivery request ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        yandex = YandexGoService(delivery_request.delivery_integration)
        result = yandex.cancel_delivery(
            delivery_request.external_request_id,
            reason=reason
        )
        
        if result['success']:
            return Response(result)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# PAYME CALLBACK
# ==========================================

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def payme_callback(request):
    """
    Handle Payme payment callbacks
    This endpoint receives POST requests from Payme
    """
    try:
        from integrations.payme_service import PaymeService
        
        # Get request data
        request_data = request.data if isinstance(request.data, dict) else json.loads(request.body)
        
        # Find gateway by merchant ID (from params)
        params = request_data.get('params', {})
        account = params.get('account', {})
        
        # For PerformTransaction, we need to find the gateway
        # This is simplified - in production, you'd use a more robust method
        from integrations.models import PaymentGateway
        gateway = PaymentGateway.objects.filter(
            gateway_type='payme',
            is_active=True
        ).first()
        
        if not gateway:
            return JsonResponse({
                'error': {
                    'code': -32504,
                    'message': 'Payme gateway not configured'
                }
            }, status=400)
        
        # Process callback
        payme = PaymeService(gateway)
        result = payme.handle_callback(request_data)
        
        return JsonResponse(result)
        
    except Exception as e:
        return JsonResponse({
            'error': {
                'code': -32400,
                'message': f'Internal error: {str(e)}'
            }
        }, status=500)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def click_callback(request):
    """
    Handle Click payment callbacks
    This endpoint receives POST requests from Click
    """
    try:
        from integrations.click_service import ClickService
        from integrations.models import PaymentGateway
        
        # Get request data
        request_data = request.data if isinstance(request.data, dict) else json.loads(request.body)
        
        # Find Click gateway
        gateway = PaymentGateway.objects.filter(
            gateway_type='click',
            is_active=True
        ).first()
        
        if not gateway:
            return JsonResponse({
                'error': -5,
                'error_note': 'Click gateway not configured'
            }, status=400)
        
        # Process callback
        click = ClickService(gateway)
        result = click.handle_callback(request_data)
        
        return JsonResponse(result)
        
    except Exception as e:
        return JsonResponse({
            'error': -5,
            'error_note': f'Internal error: {str(e)}'
        }, status=500)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def paynet_callback(request):
    """
    Handle Paynet payment callbacks
    This endpoint receives POST requests from Paynet
    """
    try:
        from integrations.paynet_service import PaynetService
        from integrations.models import PaymentGateway
        
        # Get request data
        request_data = request.data if isinstance(request.data, dict) else json.loads(request.body)
        
        # Find Paynet gateway
        gateway = PaymentGateway.objects.filter(
            gateway_type='paynet',
            is_active=True
        ).first()
        
        if not gateway:
            return JsonResponse({
                'success': False,
                'error': 'Paynet gateway not configured'
            }, status=400)
        
        # Process callback
        paynet = PaynetService(gateway)
        result = paynet.handle_callback(request_data)
        
        return JsonResponse(result)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Internal error: {str(e)}'
        }, status=500)


# ==========================================
# TRAVEL AGENCY / EXTERNAL PARTNER INTEGRATION
# ==========================================

import secrets
from django.utils.text import slugify
from django.conf import settings
from accounts.models import User
from orders.models import Order, OrderItem
from products.models import Product, Category

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def partner_create_store(request):
    """
    Endpoint for external partner (e.g. Travel Agency startup) to register a store.
    Header required: X-Partner-API-Key
    """
    partner_key = request.headers.get('X-Partner-API-Key') or request.META.get('HTTP_X_PARTNER_API_KEY')
    # Use environment setting or fallback to standard key
    expected_key = getattr(settings, 'SAVDOGAR_PARTNER_API_KEY', 'savdogar_travel_agency_partner_token_2026')
    
    if not partner_key or partner_key != expected_key:
        return Response({'error': 'Invalid Partner API Key'}, status=status.HTTP_401_UNAUTHORIZED)
    
    data = request.data
    name = data.get('name')
    slug = data.get('slug')
    owner_email = data.get('owner_email')
    description = data.get('description', '')
    
    if not name or not owner_email:
        return Response({'error': 'name and owner_email are required fields'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not slug:
        slug = slugify(name)
        
    # Ensure uniqueness of slug
    base_slug = slug
    counter = 1
    while Store.objects.filter(slug=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1
        
    # Get or create store_admin user
    try:
        user = User.objects.get(email=owner_email)
    except User.DoesNotExist:
        # Create username based on email
        username = owner_email.split('@')[0]
        base_username = username
        uname_counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{uname_counter}"
            uname_counter += 1
            
        password = secrets.token_urlsafe(10)
        user = User.objects.create_user(
            username=username,
            email=owner_email,
            password=password,
            role='store_admin'
        )
        # Store plain password temporarily for them to use
        user.plain_password = password
        user.save()
        
    # Generate unique store api key
    store_api_key = f"sdk_{secrets.token_hex(16)}"
    
    # Create store
    store = Store.objects.create(
        owner=user,
        name=name,
        slug=slug,
        description=description,
        status='approved',  # automatically approve external partner stores
        business_type='services',
        api_key=store_api_key
    )
    
    # Ensure default category 'Services' exists for this store
    category, _ = Category.objects.get_or_create(
        store=store,
        slug='services',
        defaults={'name': 'Services', 'active': True}
    )
    
    return Response({
        'status': 'success',
        'message': 'Store created and approved successfully.',
        'store_id': store.id,
        'store_slug': store.slug,
        'store_api_key': store.api_key,
        'owner_credentials': {
            'username': user.username,
            'email': user.email,
            'password': getattr(user, 'plain_password', 'Already exists')
        }
    }, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def partner_record_sale(request):
    """
    Endpoint to record a tour package sale/order from Travel Agency.
    Header required: X-Store-API-Key (which is the store's api_key SDK)
    """
    store_api_key = request.headers.get('X-Store-API-Key') or request.META.get('HTTP_X_STORE_API_KEY') or request.headers.get('X-API-Key')
    if not store_api_key:
        return Response({'error': 'X-Store-API-Key header is required'}, status=status.HTTP_401_UNAUTHORIZED)
        
    try:
        store = Store.objects.get(api_key=store_api_key)
    except Store.DoesNotExist:
        return Response({'error': 'Invalid Store API Key'}, status=status.HTTP_401_UNAUTHORIZED)
        
    data = request.data
    buyer_name = data.get('buyer_name')
    buyer_phone = data.get('buyer_phone', '')
    buyer_email = data.get('buyer_email', '')
    package_name = data.get('package_name')
    amount = data.get('amount')
    quantity = int(data.get('quantity', 1))
    
    if not buyer_name or not package_name or not amount:
        return Response({'error': 'buyer_name, package_name, and amount are required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        amount_decimal = float(amount)
    except ValueError:
        return Response({'error': 'amount must be a valid number'}, status=status.HTTP_400_BAD_REQUEST)
        
    # Get or create category
    category, _ = Category.objects.get_or_create(
        store=store,
        slug='services',
        defaults={'name': 'Services', 'active': True}
    )
    
    # Get or create the product representing the tour package
    product_slug = slugify(package_name)
    try:
        product = Product.objects.get(store=store, slug=product_slug)
    except Product.DoesNotExist:
        # Create product representing this package
        product = Product.objects.create(
            store=store,
            category=category,
            name=package_name,
            price=amount_decimal,
            is_service=True,
            track_stock=False,
            active=True
        )
        
    # Create the Order
    total_price = amount_decimal * quantity
    order = Order.objects.create(
        store=store,
        customer_name=buyer_name,
        customer_phone=buyer_phone,
        customer_email=buyer_email,
        delivery_type='pickup',
        subtotal=total_price,
        delivery_fee=0,
        total=total_price,
        status='completed',  # Automatically mark as completed
        payment_method='card',
        payment_status='paid'  # Automatically mark as paid
    )
    
    # Create the OrderItem
    OrderItem.objects.create(
        order=order,
        product=product,
        product_name=package_name,
        product_price=amount_decimal,
        quantity=quantity,
        subtotal=total_price
    )
    
    return Response({
        'status': 'success',
        'message': 'Sale recorded successfully.',
        'order_id': order.id,
        'order_number': order.order_number,
        'total': total_price
    }, status=status.HTTP_201_CREATED)

