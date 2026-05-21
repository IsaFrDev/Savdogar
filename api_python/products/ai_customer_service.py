"""
AI-Powered Customer Behavior Analysis
Customer segmentation, churn prediction, lifetime value, purchase patterns
"""
import os
import json
from datetime import datetime, timedelta
from django.db.models import Count, Sum, Avg, Q, Max, Min
from django.db.models.functions import TruncDay
from products.ai_service import concierge_ai_service as ai_service, log_ai_error


class AICustomerService:
    """AI-driven customer behavior analysis and insights"""
    
    def __init__(self, store_id):
        self.store_id = store_id
        
    def segment_customers(self):
        """Segment customers using RFM (Recency, Frequency, Monetary) analysis"""
        try:
            from accounts.models import User
            from orders.models import Order
            
            # Get all customers who ordered from this store
            customers = Order.objects.filter(
                store_id=self.store_id,
                status__in=['completed', 'delivered']
            ).values('customer_id').annotate(
                total_orders=Count('id'),
                total_spent=Sum('total_price'),
                last_order_date=Max('created_at'),
                first_order_date=Min('created_at'),
                avg_order_value=Avg('total_price')
            )
            
            segments = {
                'vip': [],
                'loyal': [],
                'potential': [],
                'at_risk': [],
                'churned': [],
                'new': []
            }
            
            now = datetime.now()
            
            for customer in customers:
                customer_id = customer['customer_id']
                
                # Get user details
                user = User.objects.filter(id=customer_id).first()
                if not user:
                    continue
                
                # Calculate recency (days since last order)
                days_since_last = (now - customer['last_order_date']).days
                
                # Segment logic
                segment_data = {
                    'customer_id': customer_id,
                    'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                    'email': user.email,
                    'phone': user.phone,
                    'total_orders': customer['total_orders'],
                    'total_spent': float(customer['total_spent'] or 0),
                    'avg_order_value': float(customer['avg_order_value'] or 0),
                    'last_order_date': customer['last_order_date'].isoformat(),
                    'days_since_last': days_since_last,
                    'customer_since': customer['first_order_date'].isoformat()
                }
                
                # VIP: High spenders (top 10%)
                if customer['total_spent'] and customer['total_spent'] > 1000000:
                    segments['vip'].append(segment_data)
                
                # Loyal: Frequent buyers
                elif customer['total_orders'] >= 5 and days_since_last <= 30:
                    segments['loyal'].append(segment_data)
                
                # New: First-time buyers (last 14 days)
                elif customer['total_orders'] == 1 and days_since_last <= 14:
                    segments['new'].append(segment_data)
                
                # At Risk: Previously active, now inactive (14-60 days)
                elif days_since_last > 14 and days_since_last <= 60:
                    segments['at_risk'].append(segment_data)
                
                # Churned: Inactive for 60+ days
                elif days_since_last > 60:
                    segments['churned'].append(segment_data)
                
                # Potential: Frequent browsers, low buyers (simplified)
                else:
                    segments['potential'].append(segment_data)
            
            # Calculate segment statistics
            stats = {}
            for segment_name, segment_data in segments.items():
                stats[segment_name] = {
                    'count': len(segment_data),
                    'total_revenue': sum(c['total_spent'] for c in segment_data),
                    'avg_revenue': sum(c['total_spent'] for c in segment_data) / len(segment_data) if segment_data else 0
                }
            
            return {
                'segments': segments,
                'statistics': stats,
                'total_customers': sum(len(v) for v in segments.values())
            }
            
        except Exception as e:
            log_ai_error(f"Customer segmentation error: {e}")
            return {
                'segments': {},
                'statistics': {},
                'total_customers': 0,
                'error': str(e)
            }
    
    def predict_churn_risk(self, customer_id):
        """Predict if a customer is at risk of churning"""
        try:
            from accounts.models import User
            from orders.models import Order
            
            user = User.objects.get(id=customer_id)
            
            # Get customer order history
            orders = Order.objects.filter(
                customer_id=customer_id,
                store_id=self.store_id
            ).order_by('-created_at')
            
            if not orders:
                return {
                    'customer_id': customer_id,
                    'churn_risk': 'unknown',
                    'probability': 0.5,
                    'reason': 'Buyurtmalar topilmadi'
                }
            
            total_orders = orders.count()
            total_spent = orders.aggregate(Sum('total_price'))['total_price__sum'] or 0
            
            # Calculate metrics
            days_since_last = (datetime.now() - orders.first().created_at).days
            
            # Order frequency
            if total_orders > 1:
                order_dates = [o.created_at for o in orders]
                avg_days_between = (max(order_dates) - min(order_dates)).days / (total_orders - 1)
            else:
                avg_days_between = 30
            
            # Get customer's typical behavior
            avg_order_value = total_spent / total_orders if total_orders > 0 else 0
            
            # AI analysis
            prompt = f"""Analyze customer behavior and predict churn risk.

Customer Profile:
- Total Orders: {total_orders}
- Total Spent: {total_spent} UZS
- Average Order Value: {avg_order_value:.0f} UZS
- Days Since Last Order: {days_since_last}
- Average Days Between Orders: {avg_days_between:.1f}

Churn Risk Factors:
1. Long time since last order (>30 days)
2. Decreasing order frequency
3. Decreasing order value
4. Only 1-2 orders total

Return ONLY JSON:
{{
  "churn_risk": "high",
  "probability": 0.75,
  "days_until_likely_churn": 15,
  "risk_factors": ["35 kun dan beri buyurtma yo'q"],
  "retention_strategy": "15% chegirma taklif qiling",
  "recommended_action": "SMS yoki email yuboring",
  "customer_value": "high"
}}

churn_risk options: critical, high, medium, low
customer_value options: high, medium, low
risk_factors must be array of Uzbek strings
retention_strategy must be in Uzbek
"""
            
            response_text = ai_service._safe_generate_content(
                ai_service._get_model_names(),
                prompt
            )
            
            # Parse response
            start = response_text.find('{')
            end = response_text.rfind('}')
            if start != -1 and end != -1:
                prediction = json.loads(response_text[start:end+1])
                prediction['customer_id'] = customer_id
                prediction['customer_name'] = f"{user.first_name} {user.last_name}".strip() or user.username
                return prediction
            
            # Fallback rule-based prediction
            if days_since_last > 60:
                risk = 'critical'
                probability = 0.9
            elif days_since_last > 30:
                risk = 'high'
                probability = 0.7
            elif days_since_last > 14:
                risk = 'medium'
                probability = 0.5
            else:
                risk = 'low'
                probability = 0.2
            
            return {
                'customer_id': customer_id,
                'customer_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'churn_risk': risk,
                'probability': probability,
                'days_since_last_order': days_since_last,
                'is_fallback': True
            }
            
        except Exception as e:
            log_ai_error(f"Churn prediction error: {e}")
            return {
                'customer_id': customer_id,
                'churn_risk': 'unknown',
                'error': str(e)
            }
    
    def calculate_customer_lifetime_value(self, customer_id):
        """Calculate predicted customer lifetime value (CLV)"""
        try:
            from accounts.models import User
            from orders.models import Order
            
            user = User.objects.get(id=customer_id)
            
            orders = Order.objects.filter(
                customer_id=customer_id,
                store_id=self.store_id,
                status__in=['completed', 'delivered']
            )
            
            if not orders:
                return {
                    'customer_id': customer_id,
                    'historical_value': 0,
                    'predicted_clv': 0
                }
            
            # Historical metrics
            total_spent = orders.aggregate(Sum('total_price'))['total_price__sum'] or 0
            total_orders = orders.count()
            first_order = orders.order_by('created_at').first()
            last_order = orders.order_by('-created_at').first()
            
            customer_lifespan_days = (last_order.created_at - first_order.created_at).days
            customer_lifespan_months = max(1, customer_lifespan_days / 30)
            
            avg_order_value = total_spent / total_orders
            purchase_frequency = total_orders / customer_lifespan_months
            
            # Simple CLV prediction: avg_order_value * purchase_frequency * 12 months
            predicted_clv = avg_order_value * purchase_frequency * 12
            
            return {
                'customer_id': customer_id,
                'customer_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'historical_value': float(total_spent),
                'total_orders': total_orders,
                'avg_order_value': float(avg_order_value),
                'purchase_frequency_monthly': round(purchase_frequency, 2),
                'customer_lifespan_months': round(customer_lifespan_months, 1),
                'predicted_annual_clv': float(predicted_clv),
                'clv_category': self._categorize_clv(predicted_clv)
            }
            
        except Exception as e:
            log_ai_error(f"CLV calculation error: {e}")
            return {
                'customer_id': customer_id,
                'historical_value': 0,
                'predicted_clv': 0
            }
    
    def _categorize_clv(self, clv):
        """Categorize customer by lifetime value"""
        if clv > 5000000:
            return 'platinum'
        elif clv > 2000000:
            return 'gold'
        elif clv > 500000:
            return 'silver'
        else:
            return 'bronze'
    
    def analyze_purchase_patterns(self, customer_id=None):
        """Analyze purchase patterns and preferences"""
        try:
            from orders.models import Order, OrderItem
            
            orders = Order.objects.filter(
                store_id=self.store_id,
                status__in=['completed', 'delivered']
            )
            
            if customer_id:
                orders = orders.filter(customer_id=customer_id)
            
            # Time-based patterns
            hourly_dist = orders.annotate(
                hour=TruncDay('created_at')
            ).values('created_at__hour').annotate(
                count=Count('id')
            ).order_by('created_at__hour')
            
            # Day of week patterns
            daily_dist = orders.extra(
                select={'dow': 'EXTRACT(DOW FROM created_at)'}
            ).values('dow').annotate(
                count=Count('id')
            ).order_by('dow')
            
            # Category preferences
            category_pref = OrderItem.objects.filter(
                order__store_id=self.store_id,
                order__status__in=['completed', 'delivered']
            ).values(
                'product__category__name'
            ).annotate(
                total_purchased=Sum('quantity'),
                total_spent=Sum('price')
            ).order_by('-total_spent')[:10]
            
            # Price range preferences
            price_ranges = OrderItem.objects.filter(
                order__store_id=self.store_id,
                order__status__in=['completed', 'delivered']
            ).aggregate(
                min_price=Min('price'),
                max_price=Max('price'),
                avg_price=Avg('price')
            )
            
            return {
                'hourly_distribution': list(hourly_dist),
                'daily_distribution': list(daily_dist),
                'category_preferences': list(category_pref),
                'price_range': {
                    'min': float(price_ranges['min_price'] or 0),
                    'max': float(price_ranges['max_price'] or 0),
                    'avg': float(price_ranges['avg_price'] or 0)
                }
            }
            
        except Exception as e:
            log_ai_error(f"Purchase pattern analysis error: {e}")
            return {
                'hourly_distribution': [],
                'daily_distribution': [],
                'category_preferences': [],
                'price_range': {}
            }
    
    def generate_customer_insights(self):
        """Generate comprehensive customer insights using AI"""
        try:
            # Get segmentation data
            segmentation = self.segment_customers()
            
            if not segmentation['segments']:
                return {
                    'insights': "Mijozlar ma'lumotlari yetarli emas",
                    'recommendations': []
                }
            
            # Prepare summary for AI
            stats_summary = json.dumps(segmentation['statistics'], indent=2, default=str)
            
            prompt = f"""Analyze customer segmentation data and provide business insights.

Customer Segmentation Statistics:
{stats_summary}

Total Customers: {segmentation['total_customers']}

Provide actionable insights and recommendations.

Return ONLY JSON:
{{
  "overall_health": "good",
  "insights": "Mijozlar bazasi o'smoqda. VIP mijozlar ulushi 20%.",
  "key_findings": [
    "Topilmish 1",
    "Topilmish 2"
  ],
  "recommendations": [
    "Tavsiya 1",
    "Tavsiya 2"
  ],
  "action_items": [
    "Harakat 1",
    "Harakat 2"
  ]
}}

overall_health options: excellent, good, fair, poor
All text fields must be in Uzbek
"""
            
            response_text = ai_service._safe_generate_content(
                ai_service._model_names,
                prompt
            )
            
            # Parse response
            start = response_text.find('{')
            end = response_text.rfind('}')
            if start != -1 and end != -1:
                insights = json.loads(response_text[start:end+1])
                insights['segmentation'] = segmentation
                return insights
            
            return {
                'insights': 'AI tahlili mavjud emas',
                'segmentation': segmentation,
                'is_fallback': True
            }
            
        except Exception as e:
            log_ai_error(f"Customer insights generation error: {e}")
            return {
                'insights': "Xatolik yuz berdi",
                'recommendations': []
            }
