from rest_framework import viewsets, status, views
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import PaymentTransaction
from .serializers import PaymentTransactionSerializer, InitiatePaymentSerializer
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .providers import get_payment_provider
from orders.models import Order

@extend_schema(tags=['Payments'])
class PaymentViewSet(viewsets.GenericViewSet):
    queryset = PaymentTransaction.objects.all()
    serializer_class = PaymentTransactionSerializer

    @action(detail=False, methods=['post'], url_path='initiate')
    def initiate(self, request):
        """
        Starts a payment process for an order.
        """
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        order_id = serializer.validated_data['order_id']
        provider_name = serializer.validated_data['provider']
        
        order = get_object_or_404(Order, id=order_id)
        
        # Check if order belongs to user or if user is owner of store
        # (Simplified for now)
        
        # Create a transaction record
        transaction = PaymentTransaction.objects.create(
            order=order,
            provider=provider_name,
            amount=order.total,
            status='pending'
        )
        
        provider = get_payment_provider(order.store, provider_name)
        if not provider:
            return Response(
                {"error": f"Provider {provider_name} is not configured for this store."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            payment_data = provider.initiate_payment(transaction)
            transaction.raw_request_log = payment_data
            transaction.save()
            return Response(payment_data)
        except Exception as e:
            transaction.status = 'failed'
            transaction.error_message = str(e)
            transaction.save()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(
        summary="Check transaction status",
        description="Returns the current status of a payment transaction and the associated order."
    )
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        transaction = self.get_object()
        return Response({
            "status": transaction.status,
            "order_status": transaction.order.payment_status,
            "completed_at": transaction.completed_at
        })

@extend_schema(
    tags=['Payments'],
    summary="Generic Webhook Handler",
    description="Universal endpoint for payment provider callbacks (Click, Payme, Uzum, etc.)",
    parameters=[
        OpenApiParameter("provider_name", type=str, location=OpenApiParameter.PATH, description="Name of the payment provider")
    ]
)
class GenericWebhookView(views.APIView):
    """
    Handles payment provider webhook callbacks.
    1. Verifies the request signature.
    2. Updates the PaymentTransaction and Order accordingly.
    """
    def post(self, request, provider_name):
        import logging
        logger = logging.getLogger('savdoon.payments')

        # Find the most recent pending transaction for this provider
        # (providers send their own transaction IDs; we match by provider name)
        data = request.data
        headers = request.META

        # Resolve the store from the transaction reference in the payload.
        # Different providers use different field names for the merchant transaction id.
        merchant_trans_id = (
            data.get('merchant_trans_id')          # Click
            or data.get('params', {}).get('account', {}).get('order_id')  # Payme
            or data.get('orderId')                  # Uzum
        )

        transaction = None
        if merchant_trans_id:
            try:
                transaction = PaymentTransaction.objects.select_related('order__store').get(
                    id=merchant_trans_id
                )
            except (PaymentTransaction.DoesNotExist, ValueError):
                pass

        if transaction is None:
            # Try to find by provider + pending status as fallback
            logger.warning(
                f"Webhook [{provider_name}]: could not resolve transaction "
                f"from payload: {data}"
            )
            return Response({"error": "transaction_not_found"}, status=status.HTTP_404_NOT_FOUND)

        store = transaction.order.store
        provider = get_payment_provider(store, provider_name)
        if not provider:
            return Response(
                {"error": f"Provider '{provider_name}' not configured for this store."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Signature verification ────────────────────────────────────────────
        if not provider.verify_webhook(data, headers):
            logger.warning(
                f"Webhook [{provider_name}]: signature verification FAILED "
                f"for transaction {transaction.id}"
            )
            return Response({"error": "invalid_signature"}, status=status.HTTP_403_FORBIDDEN)

        # ── Process the webhook ───────────────────────────────────────────────
        result = provider.handle_webhook(data)
        webhook_status = result.get('status') or (
            'success' if result.get('error') == 0 else 'failed'
        )

        if webhook_status == 'success':
            transaction.status = 'completed'
            transaction.completed_at = timezone.now()
            transaction.order.payment_status = 'paid'
            transaction.order.save(update_fields=['payment_status'])
            logger.info(
                f"Webhook [{provider_name}]: payment SUCCESS for order "
                f"{transaction.order.id}"
            )
        elif webhook_status == 'failed':
            transaction.status = 'failed'
            transaction.error_message = result.get('reason') or result.get('error_note', '')
            logger.warning(
                f"Webhook [{provider_name}]: payment FAILED for order "
                f"{transaction.order.id}: {transaction.error_message}"
            )

        transaction.raw_response_log = result
        transaction.save()

        return Response(result)
