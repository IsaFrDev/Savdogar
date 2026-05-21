import logging
from typing import Dict, List
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)

class BusinessIntelligenceEngine:
    """
    Engine to aggregate store data and prepare it for AI analysis.
    This provides the foundation for 'Sotuv buyruqchisi' (AI Sales Assistant).
    """
    
    def __init__(self, store_id: int):
        self.store_id = store_id

    def get_sales_summary(self, days: int = 30) -> Dict:
        """Aggregates sales data for the given period."""
        from orders.models import Order
        
        start_date = timezone.now() - timedelta(days=days)
        orders = Order.objects.filter(
            store_id=self.store_id,
            status='completed',
            created_at__gte=start_date
        )
        
        summary = orders.aggregate(
            total_revenue=Sum('total'),
            order_count=Count('id'),
            avg_order_value=Avg('total')
        )
        
        return {
            "period_days": days,
            "total_revenue": float(summary['total_revenue'] or 0),
            "order_count": summary['order_count'],
            "avg_order_value": float(summary['avg_order_value'] or 0),
        }

    def get_ai_insights(self, language: str = 'uz') -> str:
        """
        Stub for generating AI insights based on aggregated data.
        In the future, this will push data to Gemini.
        """
        data = self.get_sales_summary()
        # Logic to format data into a prompt for ai_service goes here
        return f"AI Insights for Store {self.store_id} (Data prepared, awaiting AI activation)"
