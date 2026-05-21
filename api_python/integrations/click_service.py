"""
Click Payment Gateway Integration
Docs: https://my.click.uz/services/api
"""
import requests
import hashlib
import time
from decimal import Decimal
from django.conf import settings
from integrations.models import PaymentGateway, PaymentTransaction


class ClickService:
    """Click payment gateway service"""
    
    def __init__(self, gateway: PaymentGateway):
        self.gateway = gateway
        self.merchant_id = gateway.click_merchant_id
        self.secret_key = gateway.click_secret_key
        self.service_id = gateway.click_service_id
        
        # Click API URLs
        self.base_url = "https://my.click.uz/api"
        # For testing:
        # self.base_url = "https://merchant-clicks.click.uz"
    
    def _generate_sign(self, params: dict) -> str:
        """
        Generate Click signature
        Sign = MD5(merchant_id + secret_key + transaction_id + merchant_user_id + amount + action + sign_time)
        """
        sign_string = (
            str(self.merchant_id) +
            self.secret_key +
            str(params.get('transaction_id', '')) +
            str(params.get('merchant_user_id', '')) +
            str(params.get('amount', '')) +
            str(params.get('action', '')) +
            str(params.get('sign_time', ''))
        )
        return hashlib.md5(sign_string.encode()).hexdigest()
    
    def create_payment_url(self, order_id, amount, description, order_number="",
                          customer_name="", customer_phone="", return_url=""):
        """
        Create Click payment URL
        
        Args:
            order_id: Local order ID
            amount: Amount in UZS
            description: Payment description
            order_number: Order number
            customer_name: Customer name
            customer_phone: Customer phone
            return_url: URL to redirect after payment
        
        Returns:
            dict with payment URL
        """
        # Create transaction record
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
        
        # Generate Click payment URL
        # Click uses GET parameters
        sign_time = int(time.time())
        
        params = {
            'merchant_id': self.merchant_id,
            'service_id': self.service_id,
            'merchant_user_id': transaction.transaction_id,
            'amount': amount,
            'transaction_param': order_id,
            'lang': 'uz',  # or 'ru', 'en'
            'return_url': return_url or f"{settings.FRONTEND_URL}/payment/success",
        }
        
        # Generate sign
        sign_params = {
            'transaction_id': '',  # Empty for new transactions
            'merchant_user_id': params['merchant_user_id'],
            'amount': params['amount'],
            'action': '0',  # 0 for payment creation
            'sign_time': sign_time,
        }
        params['sign'] = self._generate_sign(sign_params)
        params['sign_time'] = sign_time
        
        # Build URL
        from urllib.parse import urlencode
        query_string = urlencode(params)
        payment_url = f"{self.base_url}/?{query_string}"
        
        return {
            'success': True,
            'transaction_id': str(transaction.transaction_id),
            'payment_url': payment_url,
            'amount': amount,
            'merchant_id': self.merchant_id,
            'service_id': self.service_id,
        }
    
    def handle_callback(self, request_data):
        """
        Handle Click callback/notification
        
        Click sends POST request with payment details
        """
        try:
            # Extract parameters
            click_trans_id = request_data.get('click_trans_id')
            service_id = request_data.get('service_id')
            merchant_trans_id = request_data.get('merchant_trans_id')
            amount = request_data.get('amount')
            action = request_data.get('action')
            sign_time = request_data.get('sign_time')
            sign = request_data.get('sign')
            error = request_data.get('error', 0)
            
            # Verify signature
            sign_params = {
                'transaction_id': click_trans_id,
                'merchant_user_id': merchant_trans_id,
                'amount': amount,
                'action': action,
                'sign_time': sign_time,
            }
            expected_sign = self._generate_sign(sign_params)
            
            if sign != expected_sign:
                return {
                    'click_trans_id': click_trans_id,
                    'merchant_trans_id': merchant_trans_id,
                    'merchant_prepare_id': merchant_trans_id,
                    'error': -1,
                    'error_note': 'Sign check failed',
                }
            
            # Find transaction
            try:
                transaction = PaymentTransaction.objects.get(
                    transaction_id=merchant_trans_id
                )
            except PaymentTransaction.DoesNotExist:
                return {
                    'click_trans_id': click_trans_id,
                    'merchant_trans_id': merchant_trans_id,
                    'error': -3,
                    'error_note': 'Transaction not found',
                }
            
            # Handle different actions
            if action == '0':
                # Prepare transaction
                return self._prepare_transaction(transaction, click_trans_id, amount)
            elif action == '1':
                # Complete transaction
                return self._complete_transaction(transaction, click_trans_id, amount)
            else:
                return {
                    'click_trans_id': click_trans_id,
                    'merchant_trans_id': merchant_trans_id,
                    'error': -1,
                    'error_note': 'Invalid action',
                }
                
        except Exception as e:
            return {
                'error': -5,
                'error_note': f'Internal error: {str(e)}',
            }
    
    def _prepare_transaction(self, transaction, click_trans_id, amount):
        """Prepare transaction (first step)"""
        # Verify amount
        if Decimal(amount) != transaction.amount:
            return {
                'click_trans_id': click_trans_id,
                'merchant_trans_id': str(transaction.transaction_id),
                'merchant_prepare_id': str(transaction.transaction_id),
                'error': -2,
                'error_note': 'Amount mismatch',
            }
        
        # Update transaction
        transaction.gateway_transaction_id = click_trans_id
        transaction.status = 'processing'
        transaction.gateway_response = {
            'click_trans_id': click_trans_id,
            'amount': amount,
        }
        transaction.save()
        
        return {
            'click_trans_id': click_trans_id,
            'merchant_trans_id': str(transaction.transaction_id),
            'merchant_prepare_id': str(transaction.transaction_id),
            'error': 0,
            'error_note': 'Success',
        }
    
    def _complete_transaction(self, transaction, click_trans_id, amount):
        """Complete transaction (second step)"""
        # Verify transaction exists
        if transaction.gateway_transaction_id != click_trans_id:
            return {
                'click_trans_id': click_trans_id,
                'merchant_trans_id': str(transaction.transaction_id),
                'error': -3,
                'error_note': 'Transaction not found',
            }
        
        # Mark as completed
        transaction.mark_completed({
            'gateway': 'click',
            'click_trans_id': click_trans_id,
            'amount': amount,
        })
        
        return {
            'click_trans_id': click_trans_id,
            'merchant_trans_id': str(transaction.transaction_id),
            'error': 0,
            'error_note': 'Success',
        }
    
    def verify_payment(self, transaction_id, click_trans_id):
        """Verify payment status with Click"""
        try:
            transaction = PaymentTransaction.objects.get(
                transaction_id=transaction_id,
                gateway_transaction_id=click_trans_id
            )
            
            return {
                'success': True,
                'transaction': transaction,
                'status': transaction.status,
            }
        except PaymentTransaction.DoesNotExist:
            return {
                'success': False,
                'error': 'Transaction not found'
            }
    
    def refund(self, transaction_id, amount=None):
        """
        Refund a transaction
        
        Click requires manual refund through merchant panel
        """
        try:
            transaction = PaymentTransaction.objects.get(transaction_id=transaction_id)
            
            if transaction.status != 'completed':
                return {
                    'success': False,
                    'error': 'Can only refund completed transactions'
                }
            
            # Click doesn't have automatic refund API
            # Refund must be done through merchant panel
            
            transaction.status = 'refunded'
            transaction.save()
            
            return {
                'success': True,
                'transaction': transaction,
                'message': 'Refund marked. Please process refund in Click merchant panel.'
            }
        except PaymentTransaction.DoesNotExist:
            return {
                'success': False,
                'error': 'Transaction not found'
            }
    
    def check_transaction_status(self, click_trans_id):
        """Check transaction status via Click API"""
        # Click doesn't provide status check API
        # You need to check your local database
        
        try:
            transaction = PaymentTransaction.objects.get(
                gateway_transaction_id=click_trans_id
            )
            
            return {
                'success': True,
                'status': transaction.status,
                'amount': str(transaction.amount),
                'transaction_id': str(transaction.transaction_id),
            }
        except PaymentTransaction.DoesNotExist:
            return {
                'success': False,
                'error': 'Transaction not found'
            }
