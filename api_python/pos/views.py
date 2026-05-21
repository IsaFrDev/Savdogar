"""
POS Views
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta

from .models import (
    CashRegister, POSSession, POSTransaction,
    POSTransactionItem, POSReceipt, POSRefund, Barcode
)
from .serializers import (
    CashRegisterSerializer, POSSessionSerializer,
    POSTransactionSerializer, POSTransactionCreateSerializer,
    POSReceiptSerializer, POSRefundSerializer, BarcodeSerializer
)
from stores.permissions import IsStoreOwner


class CashRegisterViewSet(viewsets.ModelViewSet):
    """Cash register management"""
    serializer_class = CashRegisterSerializer
    permission_classes = [IsAuthenticated, IsStoreOwner]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'register_code']
    
    def get_queryset(self):
        return CashRegister.objects.filter(
            store_id=self.request.user.stores.first().id if hasattr(self.request.user, 'stores') else None
        )
    
    @action(detail=True, methods=['post'])
    def open(self, request, pk=None):
        """Open cash register"""
        register = self.get_object()
        starting_cash = request.data.get('starting_cash', 0)
        
        register.is_active = True
        register.opened_at = timezone.now()
        register.starting_cash = starting_cash
        register.cashier = request.user
        register.save()
        
        # Create new session
        session = POSSession.objects.create(
            register=register,
            cashier=request.user,
            starting_cash=starting_cash,
            status='open'
        )
        
        return Response({
            'message': 'Register opened',
            'session_id': session.id
        })
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close cash register"""
        register = self.get_object()
        actual_cash = request.data.get('actual_cash', 0)
        
        register.is_active = False
        register.closed_at = timezone.now()
        register.actual_cash = actual_cash
        
        # Calculate expected cash
        transactions = register.transactions.filter(status='completed')
        cash_sales = transactions.filter(payment_method='cash').aggregate(
            total=Sum('total')
        )['total'] or 0
        
        register.expected_cash = register.starting_cash + cash_sales
        register.ending_cash = actual_cash
        register.save()
        
        # Close session
        session = register.sessions.filter(status='open').first()
        if session:
            session.ended_at = timezone.now()
            session.ending_cash = actual_cash
            session.status = 'closed'
            session.save()
        
        return Response({
            'message': 'Register closed',
            'expected': register.expected_cash,
            'actual': actual_cash,
            'difference': register.difference
        })


class POSSessionViewSet(viewsets.ModelViewSet):
    """POS session management"""
    serializer_class = POSSessionSerializer
    permission_classes = [IsAuthenticated, IsStoreOwner]
    
    def get_queryset(self):
        return POSSession.objects.filter(
            register__store_id=self.request.user.stores.first().id if hasattr(self.request.user, 'stores') else None
        )


class POSTransactionViewSet(viewsets.ModelViewSet):
    """POS transactions"""
    permission_classes = [IsAuthenticated, IsStoreOwner]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['transaction_number', 'customer_name', 'customer_phone']
    ordering_fields = ['created_at', 'total']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return POSTransaction.objects.filter(
            store_id=self.request.user.stores.first().id if hasattr(self.request.user, 'stores') else None
        )
    
    def get_serializer_class(self):
        if self.action == 'create':
            return POSTransactionCreateSerializer
        return POSTransactionSerializer
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete transaction"""
        transaction = self.get_object()
        transaction.status = 'completed'
        transaction.completed_at = timezone.now()
        transaction.save()
        
        # Create receipt
        receipt = POSReceipt.objects.create(transaction=transaction)
        
        return Response({
            'message': 'Transaction completed',
            'receipt_number': receipt.receipt_number
        })
    
    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """Process refund"""
        transaction = self.get_object()
        reason = request.data.get('reason', 'other')
        reason_details = request.data.get('reason_details', '')
        
        # Create refund transaction
        refund_transaction = POSTransaction.objects.create(
            store=transaction.store,
            register=transaction.register,
            cashier=request.user,
            status='completed',
            payment_method=transaction.payment_method,
            total=-transaction.total,  # Negative for refund
            amount_paid=-transaction.total,
            notes=f"Refund for {transaction.transaction_number}"
        )
        
        # Create refund record
        refund = POSRefund.objects.create(
            original_transaction=transaction,
            refund_transaction=refund_transaction,
            reason=reason,
            reason_details=reason_details,
            refund_amount=transaction.total,
            refund_method=transaction.payment_method,
            approved_by=request.user
        )
        
        return Response({
            'message': 'Refund processed',
            'refund_id': refund.id
        })
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get transaction analytics"""
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        transactions = self.get_queryset().filter(
            created_at__gte=start_date,
            status='completed'
        )
        
        # Total sales
        total_sales = transactions.aggregate(
            total=Sum('total'),
            count=Count('id'),
            avg_ticket=Sum('total') / Count('id')
        )
        
        # Sales by payment method
        by_payment = transactions.values('payment_method').annotate(
            total=Sum('total'),
            count=Count('id')
        )
        
        # Hourly sales
        hourly = transactions.extra(
            select={'hour': 'EXTRACT(HOUR FROM created_at)'}
        ).values('hour').annotate(
            total=Sum('total'),
            count=Count('id')
        ).order_by('hour')
        
        return Response({
            'total_sales': total_sales['total'] or 0,
            'transaction_count': total_sales['count'] or 0,
            'avg_ticket': total_sales['avg_ticket'] or 0,
            'by_payment_method': list(by_payment),
            'hourly_sales': list(hourly)
        })


class POSReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    """POS receipts (read-only)"""
    serializer_class = POSReceiptSerializer
    permission_classes = [IsAuthenticated, IsStoreOwner]
    
    def get_queryset(self):
        return POSReceipt.objects.filter(
            transaction__store_id=self.request.user.stores.first().id if hasattr(self.request.user, 'stores') else None
        )
    
    @action(detail=True, methods=['post'])
    def mark_printed(self, request, pk=None):
        """Mark receipt as printed"""
        receipt = self.get_object()
        receipt.printed = True
        receipt.printed_at = timezone.now()
        receipt.save()
        return Response({'message': 'Receipt marked as printed'})


class BarcodeViewSet(viewsets.ModelViewSet):
    """Barcode management"""
    serializer_class = BarcodeSerializer
    permission_classes = [IsAuthenticated, IsStoreOwner]
    filter_backends = [filters.SearchFilter]
    search_fields = ['barcode']
    
    def get_queryset(self):
        return Barcode.objects.filter(
            product__store_id=self.request.user.stores.first().id if hasattr(self.request.user, 'stores') else None
        )
    
    @action(detail=False, methods=['get'])
    def lookup(self, request):
        """Lookup product by barcode"""
        barcode = request.query_params.get('code')
        if not barcode:
            return Response({'error': 'Barcode required'}, status=400)
        
        try:
            barcode_obj = Barcode.objects.get(barcode=barcode)
            return Response(BarcodeSerializer(barcode_obj).data)
        except Barcode.DoesNotExist:
            return Response({'error': 'Barcode not found'}, status=404)
