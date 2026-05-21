"""
AI-Powered Demand Forecasting Service
Analyzes historical sales data to predict future demand using Gemini AI
"""
import os
import json
from datetime import datetime, timedelta
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncDay, TruncWeek
from products.ai_service import forecast_ai_service as ai_service, log_ai_error


class AIForecastService:
    """Predicts future sales and demand patterns"""
    
    def __init__(self, store_id):
        self.store_id = store_id
        
    def analyze_sales_history(self, days_back=90):
        """Analyze historical sales data"""
        from orders.models import OrderItem
        from orders.models import Order
        
        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        # Get completed orders
        orders = Order.objects.filter(
            store_id=self.store_id,
            created_at__gte=cutoff_date,
            status__in=['completed', 'delivered']
        )
        
        # Daily sales aggregation
        daily_sales = orders.annotate(
            date=TruncDay('created_at')
        ).values('date').annotate(
            total_revenue=Sum('total_price'),
            order_count=Count('id'),
            items_sold=Count('items')
        ).order_by('date')
        
        # Top selling products
        top_products = OrderItem.objects.filter(
            order__store_id=self.store_id,
            order__created_at__gte=cutoff_date,
            order__status__in=['completed', 'delivered']
        ).values(
            'product_id',
            'product_name'
        ).annotate(
            total_sold=Sum('quantity'),
            total_revenue=Sum('price')
        ).order_by('-total_sold')[:20]
        
        # Category trends
        category_trends = OrderItem.objects.filter(
            order__store_id=self.store_id,
            order__created_at__gte=cutoff_date,
            order__status__in=['completed', 'delivered']
        ).values(
            'product__category__name'
        ).annotate(
            total_sold=Sum('quantity'),
            trend_growth=self._calculate_growth('product__category__name')
        ).order_by('-total_sold')[:10]
        
        return {
            'daily_sales': list(daily_sales),
            'top_products': list(top_products),
            'category_trends': list(category_trends),
            'total_orders': orders.count(),
            'total_revenue': orders.aggregate(Sum('total_price'))['total_price__sum'] or 0,
            'avg_order_value': orders.aggregate(Avg='total_price')['Avg'] or 0
        }
    
    def _calculate_growth(self, field):
        """Calculate growth rate (simplified)"""
        from django.db.models import Case, When, FloatField
        # This is a placeholder - in production, use proper time-series analysis
        return Case(
            When(created_at__gte=datetime.now() - timedelta(days=30), then=1.0),
            default=0.8,
            output_field=FloatField()
        )
    
    def generate_forecast(self, days_ahead=7):
        """Generate AI-powered sales forecast"""
        try:
            # Get historical data
            history = self.analyze_sales_history(days_back=90)
            
            if not history['daily_sales']:
                return self._get_fallback_forecast()
            
            # Prepare context for AI
            sales_summary = f"""
Store ID: {self.store_id}
Historical Data: {len(history['daily_sales'])} days
Total Orders: {history['total_orders']}
Total Revenue: {history['total_revenue']}
Average Order Value: {history['avg_order_value']}

Top 5 Products:
{json.dumps(history['top_products'][:5], indent=2, default=str)}

Daily Sales (last 14 days):
{json.dumps(history['daily_sales'][-14:], indent=2, default=str)}

Category Trends:
{json.dumps(history['category_trends'][:5], indent=2, default=str)}
"""
            
            # AI prompt for forecasting
            prompt = f"""As a data scientist and business analyst, analyze this sales data and provide a 7-day forecast.

{sales_summary}

Return ONLY valid JSON in this exact format:
{{
  "forecast_data": [
    {{"day": "Day 1", "date": "2024-01-15", "predicted_revenue": 1500000, "predicted_orders": 12, "confidence": 0.85}},
    ...
  ],
  "confidence_score": 0.85,
  "forecast_summary": "Brief analysis in Uzbek language",
  "trending_products": ["Product Name 1", "Product Name 2"],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "risk_factors": ["Risk 1", "Risk 2"]
}}

CRITICAL RULES:
1. Return ONLY valid JSON, no markdown, no triple backticks
2. Predictions should be realistic based on the historical data
3. Confidence score between 0.5 and 0.95
4. forecast_summary must be in Uzbek
5. trending_products should be 3-5 product names
6. recommendations should be 2-3 actionable business insights
7. risk_factors should be 1-2 potential risks
"""
            
            # Call Gemini AI
            response_text = ai_service._safe_generate_content(
                ai_service._get_model_names(),
                prompt
            )
            
            # Parse JSON response
            start = response_text.find('{')
            end = response_text.rfind('}')
            if start != -1 and end != -1:
                json_str = response_text[start:end+1]
                forecast = json.loads(json_str)
                return forecast
            else:
                log_ai_error(f"Forecast: Invalid JSON format from AI")
                return self._get_fallback_forecast()
                
        except Exception as e:
            log_ai_error(f"Forecast generation error: {e}")
            return self._get_fallback_forecast()
    
    def _get_fallback_forecast(self):
        """Fallback forecast if AI fails"""
        from orders.models import Order
        from django.db.models import Avg
        
        # Get recent average
        recent_avg = Order.objects.filter(
            store_id=self.store_id,
            status__in=['completed', 'delivered'],
            created_at__gte=datetime.now() - timedelta(days=7)
        ).aggregate(
            avg_revenue=Avg('total_price'),
            count=Count('id')
        )
        
        avg_revenue = recent_avg.get('avg_revenue') or 1000000
        avg_orders = recent_avg.get('count') or 5
        
        forecast_data = []
        for i in range(7):
            date = datetime.now() + timedelta(days=i+1)
            # Add some variance
            variance = 0.9 + (i * 0.02)  # Slight upward trend
            forecast_data.append({
                'day': f"Kun {i+1}",
                'date': date.strftime('%Y-%m-%d'),
                'predicted_revenue': int(avg_revenue * variance),
                'predicted_orders': max(1, int(avg_orders * variance)),
                'confidence': 0.7
            })
        
        return {
            'forecast_data': forecast_data,
            'confidence_score': 0.7,
            'forecast_summary': "AI xizmati band. O'rtacha ko'rsatkichlar asosida bashorat qilindi.",
            'trending_products': ["Mahsulot 1", "Mahsulot 2"],
            'recommendations': ["Omborni to'ldiring", "Narxlarni optimallashtiring"],
            'risk_factors': ["Talab o'zgarishi mumkin"],
            'is_fallback': True
        }
    
    def get_demand_prediction_for_product(self, product_id):
        """Predict demand for a specific product"""
        try:
            from orders.models import OrderItem
            from products.models import Product
            
            product = Product.objects.get(id=product_id)
            
            # Get sales history for this product
            sales_history = OrderItem.objects.filter(
                product_id=product_id,
                order__status__in=['completed', 'delivered'],
                order__created_at__gte=datetime.now() - timedelta(days=60)
            ).annotate(
                date=TruncDay('order__created_at')
            ).values('date').annotate(
            ).values('date').annotate(
                total_sold=Sum('quantity'),
                revenue=Sum('price')
            ).order_by('date')
            
            if not sales_history:
                return {
                    'predicted_demand_7d': 0,
                    'predicted_demand_30d': 0,
                    'confidence': 0.5,
                    'trend': 'stable',
                    'recommendation': 'Ma\'lumot yo\'q'
                }
            
            # Calculate metrics
            total_sold = sum(item['total_sold'] for item in sales_history)
            days_with_sales = len(sales_history)
            avg_daily = total_sold / 60  # Over 60 days
            
            # AI analysis
            prompt = f"""Product: {product.name}
Category: {product.category}
Current Stock: {product.stock_quantity}
Price: {product.price}

Sales History (60 days):
{json.dumps(list(sales_history), indent=2, default=str)}

Total Sold: {total_sold}
Average Daily Sales: {avg_daily:.2f}
Days with Sales: {days_with_sales}

Predict demand for next 7 and 30 days. Return ONLY JSON:
{{
  "predicted_demand_7d": 15,
  "predicted_demand_30d": 65,
  "confidence": 0.82,
  "trend": "increasing",
  "seasonality": "none",
  "recommendation": "Omborga qo'shish kerak"
}}

Trend options: increasing, decreasing, stable, seasonal
"""
            
            response_text = ai_service._safe_generate_content(
                ai_service._get_model_names(),
                prompt
            )
            
            start = response_text.find('{')
            end = response_text.rfind('}')
            if start != -1 and end != -1:
                prediction = json.loads(response_text[start:end+1])
                return prediction
            
            # Fallback
            return {
                'predicted_demand_7d': int(avg_daily * 7),
                'predicted_demand_30d': int(avg_daily * 30),
                'confidence': 0.6,
                'trend': 'stable',
                'recommendation': 'O\'rtacha talab'
            }
            
        except Exception as e:
            log_ai_error(f"Product demand prediction error: {e}")
            return {
                'predicted_demand_7d': 0,
                'predicted_demand_30d': 0,
                'confidence': 0.5,
                'trend': 'unknown',
                'recommendation': 'Xatolik yuz berdi'
            }
