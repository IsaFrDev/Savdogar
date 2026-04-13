"""
ERP Views
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q, Avg
from django.utils import timezone
from datetime import datetime, timedelta, date

from .models import (
    Vendor, ERPPurchaseOrder, ERPPurchaseOrderItem,
    StockReorderRule, Shipment, WarehouseTransfer,
    WarehouseTransferItem, ExpenseCategory, Expense
)
from .serializers import (
    VendorSerializer, ERPPurchaseOrderSerializer, ERPPurchaseOrderCreateSerializer,
    StockReorderRuleSerializer, ShipmentSerializer,
    WarehouseTransferSerializer, ExpenseCategorySerializer, ExpenseSerializer
)
from stores.permissions import IsStoreOwner


class VendorViewSet(viewsets.ModelViewSet):
    """Vendor/Supplier management"""
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated, IsStoreOwner]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'contact_person', 'email', 'phone']
    ordering_fields = ['name', 'rating', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        return Vendor.objects.filter(
            store_id=self.request.user.stores.first().id if hasattr(self.request.user, 'stores') else None
        )
    
    @action(detail=True, methods=['get'])
    def purchase_history(self, request, pk=None):
        """Get vendor's purchase order history"""
        vendor = self.get_object()
        days = int(request.query_params.get('days', 90))
        start_date = date.today() - timedelta(days=days)
        
        orders = vendor.purchase_orders.filter(order_date__gte=start_date)
        
        total_spent = orders.filter(status='received').aggregate(
            total=Sum('total')
        )['total'] or 0
        
        return Response({
            'vendor_id': vendor.id,
            'total_orders': orders.count(),
            'total_spent': total_spent,
            'avg_order_value': total_spent / orders.count() if orders.count() > 0 else 0,
            'on_time_delivery_rate': 85.5  # Calculate this based on actual data
        })


class ERPPurchaseOrderViewSet(viewsets.ModelViewSet):
    """Purchase order management"""
    permission_classes = [IsAuthenticated, IsStoreOwner]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['po_number', 'vendor__name']
    ordering_fields = ['order_date', 'total', 'status']
    ordering = ['-order_date']
    
    def get_queryset(self):
        return ERPPurchaseOrder.objects.filter(
            store_id=self.request.user.stores.first().id if hasattr(self.request.user, 'stores') else None
        )
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ERPPurchaseOrderCreateSerializer
        return ERPPurchaseOrderSerializer
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve purchase order"""
        po = self.get_object()
        po.approved_by = request.user
        po.approved_at = timezone.now()
        if po.status == 'draft':
            po.status = 'sent'
        po.save()
        
        return Response({'message': 'Purchase order approved'})
    
    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        """Mark PO as received"""
        po = self.get_object()
        po.status = 'received'
        po.actual_delivery = date.today()
        po.save()
        
        # Update product stock
        for item in po.items.all():
            if item.product:
                item.product.stock_quantity += item.quantity_received
                item.product.save()
        
        return Response({'message': 'Purchase order marked as received'})
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get PO analytics"""
        days = int(request.query_params.get('days', 30))
        start_date = date.today() - timedelta(days=days)
        
        orders = self.get_queryset().filter(order_date__gte=start_date)
        
        total_spent = orders.filter(status='received').aggregate(
            total=Sum('total'),
            count=Count('id'),
            avg_order=Avg('total')
        )
        
        by_status = orders.values('status').annotate(count=Count('id'), total=Sum('total'))
        by_vendor = orders.values('vendor__name').annotate(
            count=Count('id'),
            total=Sum('total')
        ).order_by('-total')[:10]
        
        return Response({
            'total_spent': total_spent['total'] or 0,
            'total_orders': total_spent['count'] or 0,
            'avg_order_value': total_spent['avg_order'] or 0,
            'by_status': list(by_status),
            'top_vendors': list(by_vendor)
        })


class StockReorderRuleViewSet(viewsets.ModelViewSet):
    """Stock reorder rule management"""
    serializer_class = StockReorderRuleSerializer
    permission_classes = [IsAuthenticated, IsStoreOwner]
    
    def get_queryset(self):
        return StockReorderRule.objects.filter(
            store_id=self.request.user.stores.first().id if hasattr(self.request.user, 'stores') else None
        )
    
    @action(detail=False, methods=['get'])
    def alerts(self, request):
        """Get products that need reordering"""
        rules = self.get_queryset().filter(is_active=True)
        alerts = []
        
        for rule in rules:
            if rule.check_and_trigger():
                alerts.append({
                    'rule_id': rule.id,
                    'product': rule.product.name,
                    'current_stock': rule.product.stock_quantity,
                    'min_level': rule.min_stock_level,
                    'reorder_quantity': rule.reorder_quantity,
                    'vendor': rule.preferred_vendor.name if rule.preferred_vendor else None
                })
        
        return Response({'alerts': alerts, 'count': len(alerts)})


class ShipmentViewSet(viewsets.ModelViewSet):
    """Shipment tracking"""
    serializer_class = ShipmentSerializer
    permission_classes = [IsAuthenticated, IsStoreOwner]
    filter_backends = [filters.SearchFilter]
    search_fields = ['tracking_number', 'carrier_name']
    
    def get_queryset(self):
        return Shipment.objects.filter(
            purchase_order__store_id=self.request.user.stores.first().id if hasattr(self.request.user, 'stores') else None
        )
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update shipment status"""
        shipment = self.get_object()
        new_status = request.data.get('status')
        
        if new_status:
            shipment.status = new_status
            
            if new_status == 'received':
                shipment.actual_arrival = date.today()
            elif new_status == 'in_transit':
                shipment.shipped_date = date.today()
            
            shipment.save()
        
        return Response({'message': 'Status updated', 'status': shipment.status})


class WarehouseTransferViewSet(viewsets.ModelViewSet):
    """Warehouse transfer management"""
    serializer_class = WarehouseTransferSerializer
    permission_classes = [IsAuthenticated, IsStoreOwner]
    
    def get_queryset(self):
        return WarehouseTransfer.objects.filter(
            store_id=self.request.user.stores.first().id if hasattr(self.request.user, 'stores') else None
        )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve transfer"""
        transfer = self.get_object()
        transfer.approved_by = request.user
        transfer.status = 'approved'
        transfer.save()
        
        return Response({'message': 'Transfer approved'})
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete transfer"""
        transfer = self.get_object()
        transfer.status = 'received'
        transfer.completed_date = date.today()
        transfer.save()
        
        # Update stock in both warehouses
        for item in transfer.items.all():
            # Deduct from source
            source_stock = item.product.warehouse_stocks.filter(
                warehouse=transfer.source_warehouse
            ).first()
            if source_stock:
                source_stock.quantity -= item.quantity_sent
                source_stock.save()
            
            # Add to destination
            dest_stock = item.product.warehouse_stocks.filter(
                warehouse=transfer.destination_warehouse
            ).first()
            if dest_stock:
                dest_stock.quantity += item.quantity_received
                dest_stock.save()
        
        return Response({'message': 'Transfer completed'})


class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    """Expense category management"""
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAuthenticated, IsStoreOwner]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'code']
    
    def get_queryset(self):
        return ExpenseCategory.objects.filter(
            store_id=self.request.user.stores.first().id if hasattr(self.request.user, 'stores') else None,
            parent__isnull=True  # Only top-level categories
        )


class ExpenseViewSet(viewsets.ModelViewSet):
    """Expense tracking"""
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, IsStoreOwner]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'receipt_number']
    ordering_fields = ['expense_date', 'amount']
    ordering = ['-expense_date']
    
    def get_queryset(self):
        return Expense.objects.filter(
            store_id=self.request.user.stores.first().id if hasattr(self.request.user, 'stores') else None
        )
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get expense analytics"""
        days = int(request.query_params.get('days', 30))
        start_date = date.today() - timedelta(days=days)
        
        expenses = self.get_queryset().filter(expense_date__gte=start_date)
        
        total = expenses.aggregate(
            total=Sum('amount'),
            count=Count('id'),
            avg=Avg('amount')
        )
        
        by_category = expenses.values('category__name').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        by_payment = expenses.values('payment_method').annotate(
            total=Sum('amount'),
            count=Count('id')
        )
        
        return Response({
            'total_expenses': total['total'] or 0,
            'expense_count': total['count'] or 0,
            'avg_expense': total['avg'] or 0,
            'by_category': list(by_category),
            'by_payment_method': list(by_payment)
        })
