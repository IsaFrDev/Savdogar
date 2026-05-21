"""
AI-Powered Smart Pricing Engine
Analyzes market data, demand, and competition to suggest optimal prices
"""
import os
import json
from datetime import datetime, timedelta
from django.db.models import Avg, Count, Sum, Q
from products.ai_service import forecast_ai_service as ai_service, log_ai_error


class AIPricingService:
    """AI-driven dynamic pricing optimization"""
    
    def __init__(self, store_id):
        self.store_id = store_id
        
    def analyze_product_performance(self, product_id):
        """Analyze individual product performance metrics"""
        try:
            from orders.models import OrderItem
            from products.models import Product
            
            product = Product.objects.get(id=product_id)
            
            # Sales metrics
            sales_data = OrderItem.objects.filter(
                product_id=product_id,
                order__store_id=self.store_id,
                order__status__in=['completed', 'delivered'],
                order__created_at__gte=datetime.now() - timedelta(days=60)
            ).aggregate(
                total_sold=Sum('quantity'),
                total_revenue=Sum('price'),
                avg_quantity_per_order=Avg('quantity'),
                order_count=Count('id')
            )
            
            # Recent sales velocity (last 7 days)
            recent_sales = OrderItem.objects.filter(
                product_id=product_id,
                order__store_id=self.store_id,
                order__status__in=['completed', 'delivered'],
                order__created_at__gte=datetime.now() - timedelta(days=7)
            ).aggregate(
                recent_sold=Sum('quantity'),
                recent_orders=Count('id')
            )
            
            # Stock analysis
            stock_status = 'in_stock'
            if product.stock_quantity == 0:
                stock_status = 'out_of_stock'
            elif product.stock_quantity < 10:
                stock_status = 'low_stock'
            elif product.stock_quantity > 100:
                stock_status = 'overstocked'
            
            return {
                'product_id': product_id,
                'product_name': product.name,
                'current_price': float(product.price),
                'cost_price': float(product.cost_price) if product.cost_price else None,
                'stock_quantity': product.stock_quantity,
                'stock_status': stock_status,
                'total_sold': sales_data['total_sold'] or 0,
                'total_revenue': float(sales_data['total_revenue'] or 0),
                'avg_quantity': sales_data['avg_quantity_per_order'] or 0,
                'order_count': sales_data['order_count'] or 0,
                'recent_sold_7d': recent_sales['recent_sold'] or 0,
                'recent_orders_7d': recent_sales['recent_orders'] or 0,
                'sales_velocity': (recent_sales['recent_sold'] or 0) / 7,
                'category': product.category.name if product.category else 'Unknown',
                'created_at': product.created_at.isoformat()
            }
            
        except Exception as e:
            log_ai_error(f"Product performance analysis error: {e}")
            return None
    
    def get_market_context(self, product):
        """Get market context for pricing decisions"""
        try:
            from products.models import Product
            
            # Similar products in the store
            similar_products = Product.objects.filter(
                category=product.category,
                is_active=True,
                store_id=self.store_id
            ).exclude(id=product.id).values(
                'id', 'name', 'price', 'stock_quantity'
            )[:10]
            
            # Price range in category
            category_stats = Product.objects.filter(
                category=product.category,
                is_active=True
            ).aggregate(
                min_price=Avg('price'),
                max_price=Avg('price'),
                avg_price=Avg('price')
            )
            
            return {
                'similar_products': list(similar_products),
                'category_avg_price': float(category_stats['avg_price'] or 0),
                'category_min_price': float(category_stats['min_price'] or 0),
                'category_max_price': float(category_stats['max_price'] or 0)
            }
            
        except Exception as e:
            log_ai_error(f"Market context error: {e}")
            return {
                'similar_products': [],
                'category_avg_price': 0,
                'category_min_price': 0,
                'category_max_price': 0
            }
    
    def generate_pricing_suggestions(self, product_ids=None):
        """Generate AI-powered pricing suggestions for products"""
        try:
            from products.models import Product
            
            if product_ids:
                products = Product.objects.filter(id__in=product_ids, store_id=self.store_id)
            else:
                products = Product.objects.filter(
                    store_id=self.store_id,
                    is_active=True
                )[:20]  # Limit to 20 products per analysis
            
            suggestions = []
            
            for product in products:
                # Get performance data
                performance = self.analyze_product_performance(product.id)
                if not performance:
                    continue
                
                # Get market context
                market = self.get_market_context(product)
                
                # Build AI prompt
                prompt = self._build_pricing_prompt(performance, market)
                
                # Call AI
                try:
                    response_text = ai_service._safe_generate_content(
                        ai_service._get_model_names(),
                        prompt
                    )
                    
                    # Parse JSON
                    start = response_text.find('{')
                    end = response_text.rfind('}')
                    if start != -1 and end != -1:
                        suggestion = json.loads(response_text[start:end+1])
                        suggestion['product_id'] = product.id
                        suggestion['product_name'] = product.name
                        suggestions.append(suggestion)
                        
                except Exception as e:
                    log_ai_error(f"AI pricing suggestion failed for product {product.id}: {e}")
                    # Generate rule-based suggestion
                    suggestion = self._rule_based_pricing(performance, market)
                    suggestion['product_id'] = product.id
                    suggestion['product_name'] = product.name
                    suggestions.append(suggestion)
            
            return {
                'suggestions': suggestions,
                'total_analyzed': len(suggestions),
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            log_ai_error(f"Batch pricing generation error: {e}")
            return {
                'suggestions': [],
                'total_analyzed': 0,
                'error': str(e)
            }
    
    def _build_pricing_prompt(self, performance, market):
        """Build AI prompt for pricing analysis"""
        prompt = f"""As an expert pricing strategist, analyze this product and suggest the optimal price.

PRODUCT PERFORMANCE:
- Product: {performance['product_name']}
- Current Price: {performance['current_price']} UZS
- Cost Price: {performance['cost_price'] or 'Unknown'} UZS
- Stock: {performance['stock_quantity']} units ({performance['stock_status']})
- Total Sold (60 days): {performance['total_sold']} units
- Total Revenue: {performance['total_revenue']} UZS
- Sales Velocity: {performance['sales_velocity']:.2f} units/day (last 7 days)
- Recent Orders (7 days): {performance['recent_orders_7d']}

MARKET CONTEXT:
- Category: {performance['category']}
- Category Average Price: {market['category_avg_price']} UZS
- Similar Products in Store: {len(market['similar_products'])}

PRICING STRATEGY:
1. If stock is high and sales velocity is low → Suggest discount
2. If stock is low and sales velocity is high → Suggest price increase
3. If price is much lower than category average → Suggest increase
4. If price is much higher than category average → Suggest decrease
5. Consider profit margin (if cost price available)

Return ONLY valid JSON:
{{
  "suggested_price": 150000,
  "change_percent": -10,
  "strategy": "discount",
  "reason": "Yuqori stock va past savdo tezligi",
  "expected_impact": "Savdo 20% oshadi",
  "urgency": "low",
  "confidence": 0.85,
  "profit_margin_percent": 25
}}

strategy options: discount, increase, maintain, promotional
urgency options: low, medium, high, critical
reason must be in Uzbek
expected_impact must be in Uzbek
"""
        return prompt
    
    def _rule_based_pricing(self, performance, market):
        """Fallback rule-based pricing if AI fails"""
        current_price = performance['current_price']
        stock_status = performance['stock_status']
        sales_velocity = performance['sales_velocity']
        category_avg = market['category_avg_price']
        
        suggested_price = current_price
        strategy = 'maintain'
        change_percent = 0
        reason = "Hozirgi narx maqbul"
        
        # Rule 1: High stock, low sales → Discount
        if stock_status == 'overstocked' and sales_velocity < 1:
            suggested_price = int(current_price * 0.85)
            strategy = 'discount'
            change_percent = -15
            reason = "Yuqori stock va past savdo - chegirma kerak"
        
        # Rule 2: Low stock, high sales → Increase
        elif stock_status == 'low_stock' and sales_velocity > 3:
            suggested_price = int(current_price * 1.15)
            strategy = 'increase'
            change_percent = 15
            reason = "Yuqori talab va past stock - narxni oshiring"
        
        # Rule 3: Price much lower than category
        elif category_avg > 0 and current_price < category_avg * 0.7:
            suggested_price = int(category_avg * 0.85)
            strategy = 'increase'
            change_percent = int((suggested_price - current_price) / current_price * 100)
            reason = "Kategoriya o'rtacha narxidan ancha past"
        
        # Rule 4: Price much higher than category
        elif category_avg > 0 and current_price > category_avg * 1.3:
            suggested_price = int(category_avg * 1.15)
            strategy = 'discount'
            change_percent = int((suggested_price - current_price) / current_price * 100)
            reason = "Kategoriya o'rtacha narxidan ancha yuqori"
        
        # Calculate margin if cost price available
        profit_margin = 0
        if performance['cost_price'] and performance['cost_price'] > 0:
            profit_margin = ((suggested_price - performance['cost_price']) / suggested_price) * 100
        
        return {
            'suggested_price': suggested_price,
            'change_percent': change_percent,
            'strategy': strategy,
            'reason': reason,
            'expected_impact': "Savdo optimallashadi",
            'urgency': 'medium' if change_percent != 0 else 'low',
            'confidence': 0.6,
            'profit_margin_percent': round(profit_margin, 2),
            'is_fallback': True
        }
    
    def calculate_optimal_discount(self, product_id, target_sales_increase=0.20):
        """Calculate optimal discount to achieve target sales increase"""
        try:
            from products.models import Product
            
            product = Product.objects.get(id=product_id)
            performance = self.analyze_product_performance(product_id)
            
            if not performance:
                return {'discount_percent': 0, 'new_price': product.price}
            
            # Price elasticity estimation (simplified)
            # Generally, 10% discount → 20-30% sales increase
            elasticity = 2.5  # Conservative estimate
            
            required_discount = target_sales_increase / elasticity
            new_price = int(product.price * (1 - required_discount))
            
            # Calculate impact on profit
            current_profit = product.price - (product.cost_price or 0)
            new_profit = new_price - (product.cost_price or 0)
            profit_impact = (new_profit - current_profit) / current_profit if current_profit > 0 else 0
            
            return {
                'discount_percent': round(required_discount * 100, 2),
                'new_price': new_price,
                'original_price': product.price,
                'target_sales_increase': target_sales_increase * 100,
                'estimated_sales_increase': target_sales_increase * 100,
                'profit_margin_impact': round(profit_impact * 100, 2),
                'is_profitable': new_profit > 0
            }
            
        except Exception as e:
            log_ai_error(f"Discount calculation error: {e}")
            return {
                'discount_percent': 10,
                'new_price': 0,
                'error': str(e)
            }
