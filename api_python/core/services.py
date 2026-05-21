import logging
from typing import Any, Dict, Optional
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

class BaseService:
    """Base class for all business logic services."""
    
    def __init__(self, user=None):
        self.user = user

    def handle_error(self, message: str, context: Optional[Dict] = None):
        """Standardized error handling."""
        logger.error(f"{message} | Context: {context}")
        raise ValidationError(message)

class ContentModerationService(BaseService):
    """Shared service for content moderation across apps."""
    
    def moderate(self, text: str) -> bool:
        from products.ai_service import ai_service
        is_valid, reason = ai_service.moderate_content(text)
        if not is_valid:
            self.handle_error(f"Inappropriate content: {reason}", {"text": text})
        return True

class OrderService(BaseService):
    """Service to handle core order logic, moved out of views."""
    
    def process_order(self, order_data: Dict[str, Any]):
        # Placeholder for complex order processing logic
        pass
