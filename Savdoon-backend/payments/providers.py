from abc import ABC, abstractmethod
from typing import Dict, Any

class BasePaymentProvider(ABC):
    """
    Abstract base class for payment providers (Uzum, Payme, Click).
    Ensures a consistent interface for the platform.
    """
    
    @abstractmethod
    def initiate_payment(self, order_id: int, amount: float) -> Dict[str, Any]:
        """Starts a transaction and returns provider-specific data (e.g. checkout URL)."""
        pass

    @abstractmethod
    def verify_webhook(self, data: Dict[str, Any], signature: str) -> bool:
        """Verifies that the webhook request is legitimate."""
        pass

    @abstractmethod
    def handle_success(self, data: Dict[str, Any]) -> bool:
        """Processes a successful payment notification."""
        pass

class UzumProvider(BasePaymentProvider):
    def initiate_payment(self, order_id: int, amount: float) -> Dict[str, Any]:
        return {"provider": "uzum", "status": "skeleton_ready", "order_id": order_id}

    def verify_webhook(self, data: Dict[str, Any], signature: str) -> bool:
        return True # Skeleton logic

    def handle_success(self, data: Dict[str, Any]) -> bool:
        return True # Skeleton logic

class PaymeProvider(BasePaymentProvider):
    def initiate_payment(self, order_id: int, amount: float) -> Dict[str, Any]:
        return {"provider": "payme", "status": "skeleton_ready", "order_id": order_id}

    def verify_webhook(self, data: Dict[str, Any], signature: str) -> bool:
        return True

    def handle_success(self, data: Dict[str, Any]) -> bool:
        return True
