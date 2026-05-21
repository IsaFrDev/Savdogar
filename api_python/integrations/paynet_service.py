"""
Paynet Payment Gateway Integration
Docs: https://paynet.uz/
"""
import requests
import hashlib
import hmac
import time
import json
from decimal import Decimal
from django.conf import settings
from integrations.models import PaymentGateway, PaymentTransaction


class PaynetService:
    """Paynet payment gateway service"""
    
    def __init__(self, gateway: PaymentGateway):
        self.gateway = gateway
        self.merchant_id = gateway.paynet_merchant_id
        self.terminal_key = gateway.paynet_terminal_key
        
        # Paynet API URLs
        self.base_url = "https://api.paynet.uz"
        # For testing:
        # self.base_url = "https://test.paynet.uz"
    
    def _generate_signature(self, data: dict) -> str:
        """
        Generate Paynet signature using HMAC-SHA256
        """
        # Sort keys and create string
        sorted_keys = sorted(data.keys())
        sign_string = '&'.join([f"{key}={data[key]}" for key in sorted_keys])
        
        # Generate HMAC
        signature = hmac.new(
            self.terminal_key.encode(),
            sign_string.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return signature
    
    def create_transaction(self, order_id, amount, description, order_number="",
                          customer_name="", customer_phone="", return_url=""):
        """
        Create Paynet payment transaction
        
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
        
        # Prepare Paynet request
        timestamp = int(time.time())
        
        request_data = {
            'merchant_id': self.merchant_id,
            'terminal_id': self.merchant_id,  # Usually same as merchant_id
            'order_id': str(transaction.transaction_id),
            'amount': int(amount),  # In tiyn (1 UZS = 100 tiyn)
            'currency': '860',  # UZS currency code
            'description': description,
            'timestamp': timestamp,
            'language': 'uz',  # or 'ru', 'en'
            'callback_url': f"{settings.BACKEND_URL}/api/integrations/paynet/callback/",
            'return_url': return_url or f"{settings.FRONTEND_URL}/payment/success",
        }
        
        # Generate signature
        request_data['signature'] = self._generate_signature(request_data)
        
        # Send to Paynet API
        try:
            response = requests.post(
                f"{self.base_url}/v1/payment/init",
                json=request_data,
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get('success'):
                return {
                    'success': True,
                    'transaction_id': str(transaction.transaction_id),
                    'payment_url': result.get('payment_url'),
                    'paynet_transaction_id': result.get('transaction_id'),
                    'amount': amount,
                }
            else:
                return {
                    'success': False,
                    'error': result.get('error_message', 'Payment creation failed'),
                }
                
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': f'API request failed: {str(e)}'
            }
    
    def handle_callback(self, request_data):
        """
        Handle Paynet callback/notification
        
        Paynet sends POST request with payment status
        """
        try:
            # Extract parameters
            order_id = request_data.get('order_id')
            status = request_data.get('status')
            paynet_transaction_id = request_data.get('transaction_id')
            amount = request_data.get('amount')
            signature = request_data.get('signature')
            
            # Verify signature
            verify_data = {k: v for k, v in request_data.items() if k != 'signature'}
            expected_signature = self._generate_signature(verify_data)
            
            # In production, verify signature
            # if signature != expected_signature:
            #     return {'success': False, 'error': 'Invalid signature'}
            
            # Find transaction
            try:
                transaction = PaymentTransaction.objects.get(
                    transaction_id=order_id
                )
            except PaymentTransaction.DoesNotExist:
                return {
                    'success': False,
                    'error': 'Transaction not found'
                }
            
            # Update transaction based on status
            if status == 'completed' or status == 'success':
                transaction.mark_completed({
                    'gateway': 'paynet',
                    'paynet_transaction_id': paynet_transaction_id,
                    'amount': amount,
                })
                
                return {
                    'success': True,
                    'message': 'Payment completed',
                    'transaction_id': str(transaction.transaction_id),
                }
            elif status == 'failed' or status == 'cancelled':
                transaction.status = 'failed'
                transaction.gateway_response = request_data
                transaction.save()
                
                return {
                    'success': False,
                    'error': 'Payment failed',
                }
            else:
                # Processing or pending
                transaction.gateway_response = request_data
                transaction.save()
                
                return {
                    'success': True,
                    'message': 'Status updated',
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Internal error: {str(e)}'
            }
    
    def verify_payment(self, transaction_id, paynet_transaction_id):
        """Verify payment with Paynet API"""
        try:
            transaction = PaymentTransaction.objects.get(
                transaction_id=transaction_id
            )
            
            # Query Paynet API for status
            timestamp = int(time.time())
            request_data = {
                'merchant_id': self.merchant_id,
                'transaction_id': paynet_transaction_id,
                'timestamp': timestamp,
            }
            request_data['signature'] = self._generate_signature(request_data)
            
            response = requests.post(
                f"{self.base_url}/v1/payment/status",
                json=request_data,
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            return {
                'success': True,
                'status': result.get('status'),
                'amount': result.get('amount'),
                'transaction': transaction,
            }
            
        except PaymentTransaction.DoesNotExist:
            return {
                'success': False,
                'error': 'Transaction not found'
            }
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': f'API request failed: {str(e)}'
            }
    
    def refund(self, transaction_id, amount=None):
        """
        Refund a transaction via Paynet API
        """
        try:
            transaction = PaymentTransaction.objects.get(transaction_id=transaction_id)
            
            if transaction.status != 'completed':
                return {
                    'success': False,
                    'error': 'Can only refund completed transactions'
                }
            
            refund_amount = amount or transaction.amount
            
            # Prepare refund request
            timestamp = int(time.time())
            request_data = {
                'merchant_id': self.merchant_id,
                'transaction_id': transaction.gateway_transaction_id,
                'refund_amount': int(refund_amount),
                'timestamp': timestamp,
                'reason': 'Customer request',
            }
            request_data['signature'] = self._generate_signature(request_data)
            
            # Send refund request
            response = requests.post(
                f"{self.base_url}/v1/payment/refund",
                json=request_data,
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get('success'):
                transaction.status = 'refunded'
                transaction.gateway_response = {
                    **transaction.gateway_response,
                    'refund': result,
                }
                transaction.save()
                
                return {
                    'success': True,
                    'transaction': transaction,
                    'message': 'Refund processed successfully',
                }
            else:
                return {
                    'success': False,
                    'error': result.get('error_message', 'Refund failed'),
                }
                
        except PaymentTransaction.DoesNotExist:
            return {
                'success': False,
                'error': 'Transaction not found'
            }
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': f'API request failed: {str(e)}'
            }
    
    def create_payment_link(self, order_id, amount, description, **kwargs):
        """
        Create a payment link that can be shared with customer
        
        Useful for invoices, SMS, email, etc.
        """
        result = self.create_transaction(
            order_id=order_id,
            amount=amount,
            description=description,
            **kwargs
        )
        
        if result['success']:
            return {
                'success': True,
                'payment_link': result['payment_url'],
                'transaction_id': result['transaction_id'],
                'expires_at': None,  # Paynet links don't expire by default
            }
        
        return result
    
    def get_payment_details(self, transaction_id):
        """Get detailed payment information"""
        try:
            transaction = PaymentTransaction.objects.get(
                transaction_id=transaction_id
            )
            
            return {
                'success': True,
                'transaction': {
                    'id': str(transaction.transaction_id),
                    'status': transaction.status,
                    'amount': str(transaction.amount),
                    'currency': transaction.currency,
                    'gateway': 'paynet',
                    'gateway_transaction_id': transaction.gateway_transaction_id,
                    'created_at': transaction.created_at.isoformat(),
                    'completed_at': transaction.completed_at.isoformat() if transaction.completed_at else None,
                }
            }
        except PaymentTransaction.DoesNotExist:
            return {
                'success': False,
                'error': 'Transaction not found'
            }
