"""
Payment Providers for Savdoon Platform
Implements Payme, Click, and Uzum payment gateway integrations
with proper webhook signature verification.
"""
import hashlib
import hmac
import json
import base64
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from django.conf import settings

logger = logging.getLogger('savdoon.payments')


class BasePaymentProvider(ABC):
    """
    Abstract base class for payment providers.
    Ensures a consistent interface for the platform.
    """
    def __init__(self, store_config: Dict[str, Any]):
        self.config = store_config

    @abstractmethod
    def initiate_payment(self, transaction: Any) -> Dict[str, Any]:
        """Starts a transaction and returns provider-specific data (e.g. checkout URL)."""
        pass

    @abstractmethod
    def verify_webhook(self, data: Dict[str, Any], headers: Dict[str, Any]) -> bool:
        """Verifies that the webhook request is legitimate. MUST return False on failure."""
        pass

    @abstractmethod
    def handle_webhook(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Processes the webhook and returns status updates."""
        pass


class UzumProvider(BasePaymentProvider):
    """
    Uzum Bank payment integration.
    Docs: https://developer.uzumbank.uz/
    """

    def initiate_payment(self, transaction: Any) -> Dict[str, Any]:
        merchant_id = self.config.get('merchant_id', '')
        amount_tiyin = int(transaction.amount * 100)
        checkout_url = (
            f"https://checkout.uzum.uz/pay/{merchant_id}"
            f"?orderId={transaction.id}&amount={amount_tiyin}"
        )
        return {
            "checkout_url": checkout_url,
            "transaction_id": str(transaction.id),
            "provider": "uzum",
        }

    def verify_webhook(self, data: Dict[str, Any], headers: Dict[str, Any]) -> bool:
        """
        Uzum sends an HMAC-SHA256 signature in the X-Signature header.
        Signature = HMAC-SHA256(secret_key, request_body_as_string)
        """
        secret_key = self.config.get('secret_key', '')
        if not secret_key:
            logger.error("Uzum webhook: secret_key not configured")
            return False

        received_signature = headers.get('X-Signature') or headers.get('HTTP_X_SIGNATURE', '')
        if not received_signature:
            logger.warning("Uzum webhook: missing X-Signature header")
            return False

        body_str = json.dumps(data, separators=(',', ':'), sort_keys=True)
        expected = hmac.new(
            secret_key.encode('utf-8'),
            body_str.encode('utf-8'),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected, received_signature.lower()):
            logger.warning("Uzum webhook: signature mismatch")
            return False
        return True

    def handle_webhook(self, data: Dict[str, Any]) -> Dict[str, Any]:
        status = data.get('status')
        if status == 'SUCCESS':
            return {"status": "success", "amount": data.get('amount')}
        return {"status": "failed", "reason": data.get('error', 'unknown')}


class PaymeProvider(BasePaymentProvider):
    """
    Payme (PayCom) payment integration.
    Docs: https://developer.help.paycom.uz/
    Uses HTTP Basic Auth: login = merchant_id, password = secret_key
    """

    def initiate_payment(self, transaction: Any) -> Dict[str, Any]:
        merchant_id = self.config.get('merchant_id', '')
        amount_tiyin = int(transaction.amount * 100)
        params = f"m={merchant_id};ac.order_id={transaction.order.id};a={amount_tiyin}"
        encoded_params = base64.b64encode(params.encode()).decode()
        checkout_url = f"https://checkout.paycom.uz/{encoded_params}"
        return {
            "checkout_url": checkout_url,
            "provider": "payme",
        }

    def verify_webhook(self, data: Dict[str, Any], headers: Dict[str, Any]) -> bool:
        """
        Payme uses HTTP Basic Auth.
        Authorization: Basic base64(merchant_id:secret_key)
        """
        secret_key = self.config.get('secret_key', '')
        merchant_id = self.config.get('merchant_id', '')
        if not secret_key or not merchant_id:
            logger.error("Payme webhook: merchant_id or secret_key not configured")
            return False

        auth_header = (
            headers.get('HTTP_AUTHORIZATION')
            or headers.get('Authorization')
            or headers.get('authorization', '')
        )
        if not auth_header or not auth_header.startswith('Basic '):
            logger.warning("Payme webhook: missing or invalid Authorization header")
            return False

        try:
            decoded = base64.b64decode(auth_header[6:]).decode('utf-8')
            provided_login, provided_password = decoded.split(':', 1)
        except Exception:
            logger.warning("Payme webhook: failed to decode Authorization header")
            return False

        # Payme sends merchant_id as login and secret_key as password
        login_ok = hmac.compare_digest(provided_login, merchant_id)
        pass_ok = hmac.compare_digest(provided_password, secret_key)
        if not (login_ok and pass_ok):
            logger.warning("Payme webhook: invalid credentials")
            return False
        return True

    def handle_webhook(self, data: Dict[str, Any]) -> Dict[str, Any]:
        method = data.get('method', '')
        params = data.get('params', {})

        if method == 'CheckPerformTransaction':
            return {"result": {"allow": True}}
        elif method == 'CreateTransaction':
            return {
                "result": {
                    "create_time": params.get('time', 0),
                    "transaction": str(params.get('id', '')),
                    "state": 1,
                }
            }
        elif method == 'PerformTransaction':
            import time as _time
            return {
                "result": {
                    "transaction": str(params.get('id', '')),
                    "perform_time": int(_time.time() * 1000),
                    "state": 2,
                }
            }
        elif method == 'CancelTransaction':
            import time as _time
            return {
                "result": {
                    "transaction": str(params.get('id', '')),
                    "cancel_time": int(_time.time() * 1000),
                    "state": -1,
                }
            }
        elif method == 'CheckTransaction':
            return {
                "result": {
                    "create_time": 0,
                    "perform_time": 0,
                    "cancel_time": 0,
                    "transaction": str(params.get('id', '')),
                    "state": 2,
                    "reason": None,
                }
            }
        elif method == 'GetStatement':
            return {"result": {"transactions": []}}

        logger.warning(f"Payme webhook: unknown method '{method}'")
        return {"error": {"code": -32601, "message": "Method not found"}}


class ClickProvider(BasePaymentProvider):
    """
    Click payment integration.
    Docs: https://docs.click.uz/
    Signature = MD5(click_trans_id + service_id + secret_key + merchant_trans_id + amount + action + sign_time)
    """

    def initiate_payment(self, transaction: Any) -> Dict[str, Any]:
        merchant_id = self.config.get('merchant_id', '')
        service_id = self.config.get('service_id', '')
        checkout_url = (
            f"https://my.click.uz/services/pay"
            f"?service_id={service_id}&merchant_id={merchant_id}"
            f"&amount={transaction.amount}&transaction_param={transaction.id}"
        )
        return {
            "checkout_url": checkout_url,
            "provider": "click",
        }

    def verify_webhook(self, data: Dict[str, Any], headers: Dict[str, Any]) -> bool:
        """
        Click sends sign_string in the POST body.
        sign_string = MD5(click_trans_id + service_id + secret_key + merchant_trans_id
                          + amount + action + sign_time)
        """
        secret_key = self.config.get('secret_key', '')
        service_id = self.config.get('service_id', '')
        if not secret_key or not service_id:
            logger.error("Click webhook: service_id or secret_key not configured")
            return False

        received_sign = data.get('sign_string', '')
        if not received_sign:
            logger.warning("Click webhook: missing sign_string")
            return False

        click_trans_id = str(data.get('click_trans_id', ''))
        merchant_trans_id = str(data.get('merchant_trans_id', ''))
        amount = str(data.get('amount', ''))
        action = str(data.get('action', ''))
        sign_time = str(data.get('sign_time', ''))

        raw = (
            click_trans_id
            + str(service_id)
            + secret_key
            + merchant_trans_id
            + amount
            + action
            + sign_time
        )
        expected = hashlib.md5(raw.encode('utf-8')).hexdigest()

        if not hmac.compare_digest(expected, received_sign.lower()):
            logger.warning("Click webhook: signature mismatch")
            return False
        return True

    def handle_webhook(self, data: Dict[str, Any]) -> Dict[str, Any]:
        error = str(data.get('error', '-1'))
        if error == '0':
            return {"error": 0, "error_note": "Success"}
        return {"error": int(error), "error_note": data.get('error_note', 'Failed')}


def get_payment_provider(store: Any, provider_name: str) -> Optional[BasePaymentProvider]:
    """
    Factory to get the provider instance for a store.
    Returns None if the provider is not configured for the store.
    """
    creds = getattr(store, 'payment_credentials', {}) or {}
    if isinstance(creds, str):
        try:
            creds = json.loads(creds)
        except Exception:
            creds = {}

    store_creds = creds.get(provider_name, {})
    if not store_creds:
        logger.warning(f"Payment provider '{provider_name}' not configured for store {store.id}")
        return None

    providers = {
        'uzum': UzumProvider,
        'payme': PaymeProvider,
        'click': ClickProvider,
    }

    provider_class = providers.get(provider_name)
    if provider_class:
        return provider_class(store_creds)

    logger.error(f"Unknown payment provider: '{provider_name}'")
    return None
