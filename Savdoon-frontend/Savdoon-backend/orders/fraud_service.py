import re
import json
from savdoon.ai_views import ai_service

class FraudService:
    @staticmethod
    def analyze_order(order_data):
        """Analyzes order data for potential fraud."""
        prompt = f"Analyze this order for potential fraud: {json.dumps(order_data)}"
        try:
            res = ai_service._get_model('text').generate_content(prompt)
            clean_res = re.sub(r'```json\s*|\s*```', '', res.text.strip())
            return json.loads(clean_res)
        except Exception:
            return {"risk_score": 0, "recommendation": "accept"}

fraud_service = FraudService()
