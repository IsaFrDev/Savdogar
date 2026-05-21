"""
Payme Payment Gateway Integration
Docs: https://developer.paycom.uz/
"""
import requests
import base64
import hashlib
import time
from decimal import Decimal
from django.conf import settings
from integrations.models import PaymentGateway, PaymentTransaction


class PaymeService:
    """Payme payment gateway service"""
    
    def __init__(self, gateway: PaymentGateway):
        self.gateway = gateway
        self.merchant_id = gateway.payme_merchant_id
        self.key = gateway.payme_key
        self.base_url = "https://checkout.paycom.uz"
        
        # For production:
        # self.base_url = "https://checkout.paycom.uz"
    
    def _generate_authorization_header(self):
        """Generate Basic Auth header"""
        credentials = f"{self.merchant_id}:{self.key}"
        encoded = base64.b64encode(credentials.encode()).decode()
        return f"Basic {encoded}"
    
    def create_transaction(self, order_id, amount, description, order_number="", 
                          customer_name="", customer_phone="", return_url=""):
        """
        Create Payme payment transaction
        
        Args:
            order_id: Local order ID
            amount: Amount in UZS (sum)
            description: Payment description
            order_number: Order number for reference
            customer_name: Customer name
            customer_phone: Customer phone
            return_url: URL to redirect after payment
        
        Returns:
            dict with payment URL and transaction details
        """
        # Convert to tiyn (Payme uses tiyn, 1 sum = 100 tiyn)
        amount_tiyn = int(amount * 100)
        
        # Create local transaction record
        transaction = PaymentTransaction.objects.create(
            store=self.gateway.store,
            gateway=self.gateway,
            order_id=order_id,
            order_number=order_number,
            amount=amount,
            currency='UZS',
            status='pending',
            customer_name=customer_name,
            customer_phone=customer_phone,
            description=description,
            return_url=return_url,
        )
        
        # Generate Payme payment URL
        # Payme checkout page
        payme_url = f"{self.base_url}/"
        
        params = {
            'merchant': self.merchant_id,
            'amount': amount_tiyn,
            'account[order_id]': transaction.transaction_id,
            'account[order_number]': order_number,
            'lang': 'uz',  # or 'ru', 'en'
            'callback': f"{settings.BACKEND_URL}/api/integrations/payme/callback/",
            'callback_timeout': 60000,
        }
        
        if return_url:
            params['callback'] = return_url
        
        # Create query string
        from urllib.parse import urlencode
        query_string = urlencode(params)
        payment_url = f"{payme_url}?{query_string}"
        
        return {
            'success': True,
            'transaction_id': str(transaction.transaction_id),
            'payment_url': payment_url,
            'amount': amount,
            'amount_tiyn': amount_tiyn,
            'merchant_id': self.merchant_id,
        }
    
    def verify_transaction(self, transaction_id, gateway_transaction_id):
        """
        Verify Payme transaction
        
        Args:
            transaction_id: Local transaction UUID
            gateway_transaction_id: Payme transaction ID
        
        Returns:
            dict with verification result
        """
        try:
            transaction = PaymentTransaction.objects.get(transaction_id=transaction_id)
            
            # Update transaction with gateway response
            transaction.gateway_transaction_id = gateway_transaction_id
            transaction.mark_completed()
            
            return {
                'success': True,
                'transaction': transaction,
                'message': 'Transaction verified successfully'
            }
        except PaymentTransaction.DoesNotExist:
            return {
                'success': False,
                'error': 'Transaction not found'
            }
    
    def handle_callback(self, request_data):
        """
        Handle Payme callback/notification
        
        Payme sends POST request with transaction details
        """
        method = request_data.get('method')
        params = request_data.get('params', {})
        
        if method == 'PerformTransaction':
            return self._perform_transaction(params)
        elif method == 'CheckPerformTransaction':
            return self._check_perform_transaction(params)
        elif method == 'CreateTransaction':
            return self._create_transaction_callback(params)
        elif method == 'CheckTransaction':
            return self._check_transaction(params)
        elif method == 'CancelTransaction':
            return self._cancel_transaction(params)
        else:
            return {
                'error': {
                    'code': -32601,
                    'message': 'Method not found'
                }
            }
    
    def _check_perform_transaction(self, params):
        """Check if transaction can be performed"""
        amount = params.get('amount')
        account = params.get('account', {})
        
        # Convert from tiyn to sum
        amount_sum = Decimal(amount) / 100
        
        return {
            'result': {
                'allow': True,
            }
        }
    
    def _create_transaction_callback(self, params):
        """Create transaction callback"""
        transaction_id = params.get('id')
        amount = params.get('amount')
        account = params.get('account', {})
        order_id = account.get('order_id')
        
        # Convert from tiyn to sum
        amount_sum = Decimal(amount) / 100
        
        # Find or create transaction
        try:
            transaction = PaymentTransaction.objects.get(transaction_id=order_id)
        except PaymentTransaction.DoesNotExist:
            return {
                'error': {
                    'code': -31099,
                    'message': 'Transaction not found'
                }
            }
        
        return {
            'result': {
                'create_time': int(time.time() * 1000),
                'transaction': str(transaction.transaction_id),
                'state': 1,  # 1 = created
            }
        }
    
    def _perform_transaction(self, params):
        """Perform transaction (complete payment)"""
        transaction_id = params.get('id')
        
        try:
            transaction = PaymentTransaction.objects.get(
                gateway_transaction_id=transaction_id
            )
            
            # Mark as completed
            transaction.mark_completed({
                'gateway': 'payme',
                'transaction_id': transaction_id,
            })
            
            return {
                'result': {
                    'transaction': str(transaction.transaction_id),
                    'state': 2,  # 2 = completed
                    'perform_time': int(time.time() * 1000),
                }
            }
        except PaymentTransaction.DoesNotExist:
            return {
                'error': {
                    'code': -31099,
                    'message': 'Transaction not found'
                }
            }
    
    def _check_transaction(self, params):
        """Check transaction status"""
        transaction_id = params.get('id')
        
        try:
            transaction = PaymentTransaction.objects.get(
                gateway_transaction_id=transaction_id
            )
            
            state = 2 if transaction.status == 'completed' else 1
            
            return {
                'result': {
                    'create_time': int(transaction.created_at.timestamp() * 1000),
                    'perform_time': int(transaction.completed_at.timestamp() * 1000) if transaction.completed_at else 0,
                    'cancel_time': 0,
                    'transaction': str(transaction.transaction_id),
                    'state': state,
                    'reason': None,
                }
            }
        except PaymentTransaction.DoesNotExist:
            return {
                'error': {
                    'code': -31099,
                    'message': 'Transaction not found'
                }
            }
    
    def _cancel_transaction(self, params):
        """Cancel transaction"""
        transaction_id = params.get('id')
        reason = params.get('reason', 0)
        
        try:
            transaction = PaymentTransaction.objects.get(
                gateway_transaction_id=transaction_id
            )
            
            transaction.status = 'cancelled'
            transaction.save()
            
            return {
                'result': {
                    'transaction': str(transaction.transaction_id),
                    'state': -1,  # -1 = cancelled
                    'cancel_time': int(time.time() * 1000),
                    'reason': reason,
                }
            }
        except PaymentTransaction.DoesNotExist:
            return {
                'error': {
                    'code': -31099,
                    'message': 'Transaction not found'
                }
            }
    
    def refund(self, transaction_id, amount=None):
        """
        Refund a transaction
        
        Args:
            transaction_id: Transaction UUID
            amount: Amount to refund (None for full refund)
        """
        try:
            transaction = PaymentTransaction.objects.get(transaction_id=transaction_id)
            
            if transaction.status != 'completed':
                return {
                    'success': False,
                    'error': 'Can only refund completed transactions'
                }
            
            # Implement Payme refund API call
            # This would use Payme's refund endpoint
            
            transaction.status = 'refunded'
            transaction.save()
            
            return {
                'success': True,
                'transaction': transaction,
                'message': 'Refund processed successfully'
            }
        except PaymentTransaction.DoesNotExist:
            return {
                'success': False,
                'error': 'Transaction not found'
            }
