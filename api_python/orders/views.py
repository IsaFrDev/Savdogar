from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from django.db.models import Sum, Count
from django.http import HttpResponse
from django.utils import timezone

from .models import Order, OrderItem, OrderStatusHistory
from .serializers import (
    OrderSerializer, OrderCreateSerializer, OrderStatusUpdateSerializer,
    CancelOrderSerializer, OrderStatusHistorySerializer, OrderAssignCourierSerializer
)
from delivery.models import Courier
from .invoice import generate_invoice_pdf, save_invoice_to_order
from products.models import Product
from stores.models import Store


class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet for Order CRUD operations."""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Order.objects.all().prefetch_related('items', 'status_history')
        store_id = self.request.query_params.get('store')
        if store_id:
            queryset = queryset.filter(store_id=store_id)
        if not (self.request.user.is_superuser or getattr(self.request.user, 'role', '') == 'superadmin'):
            queryset = queryset.filter(store__owner=self.request.user)
        return queryset
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data['status']
        
        # Create status history
        OrderStatusHistory.objects.create(
            order=order, status=new_status, changed_by=request.user,
            note=serializer.validated_data.get('note', '')
        )
        
        # Update order status
        order.status = new_status
        order.save()
        
        # Send real-time WebSocket notification
        try:
            from .notification_service import OrderNotificationService
            
            status_labels = {
                'pending': 'Kutilmoqda',
                'confirmed': 'Tasdiqlandi',
                'preparing': 'Tayyorlanmoqda',
                'shipped': 'Yo\'lda',
                'delivered': 'Yetkazildi',
                'cancelled': 'Bekor qilindi',
            }
            
            status_messages = {
                'pending': 'Buyurtma qabul qilindi',
                'confirmed': 'Do\'kon buyurtmani tasdiqladi ✅',
                'preparing': 'Buyurtma tayyorlanmoqda 🔄',
                'shipped': 'Buyurtma yo\'lda 🚚',
                'delivered': 'Buyurtma muvaffaqiyatli yetkazildi ✅',
                'cancelled': 'Buyurtma bekor qilindi ❌',
            }
            
            OrderNotificationService.notify_order_status_change(
                order_id=order.id,
                new_status=new_status,
                status_label=status_labels.get(new_status, new_status),
                message=status_messages.get(new_status, f'Status: {new_status}'),
                order=order
            )
        except Exception as e:
            print(f'WebSocket notification error: {e}')
        
        return Response(OrderSerializer(order, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status == 'cancelled':
            return Response({'error': 'Already cancelled'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = CancelOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order.status = 'cancelled'
        order.cancellation_reason = serializer.validated_data['reason']
        order.cancelled_at = timezone.now()
        order.cancelled_by = request.user
        order.save()
        OrderStatusHistory.objects.create(order=order, status='cancelled', changed_by=request.user)
        return Response(OrderSerializer(order, context={'request': request}).data)

    @action(detail=True, methods=['get'])
    def download_invoice(self, request, pk=None):
        order = self.get_object()
        pdf_buffer = generate_invoice_pdf(order)
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_{order.order_number}.pdf"'
        return response

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Dashboard overview statistics."""
        from datetime import timedelta
        from django.db.models.functions import TruncDate

        store_id = request.query_params.get('store')
        period = request.query_params.get('period', '7d')

        days_map = {'7d': 7, '30d': 30, '90d': 90}
        days = days_map.get(period, 7)
        since = timezone.now() - timedelta(days=days)

        qs = Order.objects.all()
        if store_id:
            qs = qs.filter(store_id=store_id)
        if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'superadmin'):
            qs = qs.filter(store__owner=request.user)

        period_qs = qs.filter(created_at__gte=since)

        total_revenue = period_qs.exclude(status='cancelled').aggregate(s=Sum('total'))['s'] or 0
        total_orders = period_qs.count()
        pending = period_qs.filter(status='pending').count()
        completed = period_qs.filter(status='completed').count()

        # Daily history for charts
        daily = (
            period_qs
            .exclude(status='cancelled')
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(revenue=Sum('total'), orders=Count('id'))
            .order_by('date')
        )
        history = [
            {'name': d['date'].strftime('%d/%m'), 'revenue': float(d['revenue'] or 0), 'orders': d['orders']}
            for d in daily
        ]

        return Response({
            'total_revenue': float(total_revenue),
            'total_orders': total_orders,
            'pending': pending,
            'completed': completed,
            'history': history,
        })


class CreateOrderView(APIView):
    """Create order (public endpoint for storefront)."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            store = Store.objects.get(id=data['store_id'], status='approved')
            subtotal = 0
            items_data = []
            for item in data['items']:
                p = Product.objects.get(id=item['product_id'], store=store, active=True)
                variant = None
                price = p.price
                if item.get('variant_id'):
                    from products.models import ProductVariant
                    try:
                        variant = ProductVariant.objects.get(id=item['variant_id'], product=p, active=True)
                        price = variant.price
                    except ProductVariant.DoesNotExist:
                        pass
                
                name = p.name
                if variant:
                    attrs = ", ".join([f"{v}" for v in variant.attributes.values()])
                    name = f"{p.name} ({attrs})"
                
                items_data.append({
                    'p': p, 'v': variant, 'name': name,
                    'q': item['quantity'], 'price': price,
                    's': price * item['quantity']
                })
                subtotal += price * item['quantity']
            
            order = Order.objects.create(
                store=store,
                customer_name=data['customer_name'],
                customer_phone=data['customer_phone'],
                customer_email=data.get('customer_email', ''),
                delivery_type=data['delivery_type'],
                delivery_address=data.get('delivery_address', ''),
                notes=data.get('notes', ''),
                payment_method=data.get('payment_method', 'cash'),
                subtotal=subtotal,
                delivery_fee=data.get('delivery_fee', 0),
                total=subtotal + data.get('delivery_fee', 0),
            )
            for itm in items_data:
                OrderItem.objects.create(
                    order=order, product=itm['p'], variant=itm['v'],
                    product_name=itm['name'], product_price=itm['price'], 
                    quantity=itm['q'], subtotal=itm['s']
                )
            
            # Send real-time WebSocket notification to store
            try:
                from .notification_service import OrderNotificationService
                OrderNotificationService.notify_order_created(order)
            except Exception as e:
                print(f'WebSocket notification error: {e}')
            
            try:
                from savdoon.notification_service import notification_service
                notification_service.notify_new_order(order)
            except: pass
            
            return Response(OrderSerializer(order, context={'request': request}).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=400)
