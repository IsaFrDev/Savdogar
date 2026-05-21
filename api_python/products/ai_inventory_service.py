"""
AI-Powered Inventory Management Service
Predicts when to restock, identifies dead stock, optimizes inventory levels
"""
import os
import json
from datetime import datetime, timedelta
from django.db.models import Sum, Count, Avg, Q
from django.db.models.functions import TruncDay
from products.ai_service import forecast_ai_service as ai_service, log_ai_error


class AIInventoryService:
    """AI-driven inventory optimization and predictions"""
    
    def __init__(self, store_id):
        self.store_id = store_id
        
    def analyze_inventory_health(self):
        """Overall inventory health analysis"""
        try:
            from products.models import Product
            from orders.models import OrderItem
            
            products = Product.objects.filter(store_id=self.store_id, is_active=True)
            
            # Categorize products by stock status
            total_products = products.count()
            out_of_stock = products.filter(stock_quantity=0).count()
            low_stock = products.filter(stock_quantity__gt=0, stock_quantity__lte=10).count()
            overstocked = products.filter(stock_quantity__gt=100).count()
            healthy_stock = total_products - out_of_stock - low_stock - overstocked
            
            # Calculate inventory value
            inventory_value = products.aggregate(
                total_value=Sum(
                    'price' * 'stock_quantity',
                    filter=Q(stock_quantity__gt=0)
                )
            )['total_value'] or 0
            
            # Get sales velocity for all products (last 30 days)
            cutoff_date = datetime.now() - timedelta(days=30)
            
            product_sales = OrderItem.objects.filter(
                order__store_id=self.store_id,
                order__status__in=['completed', 'delivered'],
                order__created_at__gte=cutoff_date
            ).values('product_id').annotate(
                total_sold=Sum('quantity'),
                avg_daily=Sum('quantity') / 30
            )
            
            sales_dict = {item['product_id']: item for item in product_sales}
            
            # Days until stockout for each product
            stockout_predictions = []
            for product in products:
                if product.stock_quantity == 0:
                    continue
                    
                sales_data = sales_dict.get(product.id)
                if sales_data and sales_data['avg_daily'] > 0:
                    days_until_stockout = product.stock_quantity / sales_data['avg_daily']
                    
                    stockout_predictions.append({
                        'product_id': product.id,
                        'product_name': product.name,
                        'current_stock': product.stock_quantity,
                        'avg_daily_sales': round(sales_data['avg_daily'], 2),
                        'days_until_stockout': round(days_until_stockout, 1),
                        'urgency': self._calculate_urgency(days_until_stockout)
                    })
            
            # Sort by urgency
            stockout_predictions.sort(key=lambda x: x['days_until_stockout'])
            
            return {
                'total_products': total_products,
                'out_of_stock': out_of_stock,
                'low_stock': low_stock,
                'overstocked': overstocked,
                'healthy_stock': healthy_stock,
                'inventory_value': inventory_value,
                'stockout_predictions': stockout_predictions[:20],  # Top 20 urgent
                'health_score': self._calculate_health_score(
                    total_products, out_of_stock, low_stock
                )
            }
            
        except Exception as e:
            log_ai_error(f"Inventory health analysis error: {e}")
            return {
                'total_products': 0,
                'out_of_stock': 0,
                'low_stock': 0,
                'overstocked': 0,
                'healthy_stock': 0,
                'inventory_value': 0,
                'stockout_predictions': [],
                'health_score': 0,
                'error': str(e)
            }
    
    def _calculate_urgency(self, days_until_stockout):
        """Calculate urgency level based on days until stockout"""
        if days_until_stockout <= 3:
            return 'critical'
        elif days_until_stockout <= 7:
            return 'high'
        elif days_until_stockout <= 14:
            return 'medium'
        else:
            return 'low'
    
    def _calculate_health_score(self, total, out_of_stock, low_stock):
        """Calculate inventory health score (0-100)"""
        if total == 0:
            return 0
        
        # Penalties
        oos_penalty = (out_of_stock / total) * 50  # Max 50 points penalty
        low_penalty = (low_stock / total) * 25  # Max 25 points penalty
        
        score = max(0, 100 - oos_penalty - low_penalty)
        return round(score, 1)
    
    def predict_restock_needs(self, product_id, lead_time_days=7):
        """Predict when and how much to restock"""
        try:
            from products.models import Product
            from orders.models import OrderItem
            
            product = Product.objects.get(id=product_id)
            
            # Get sales history (90 days)
            cutoff_date = datetime.now() - timedelta(days=90)
            
            daily_sales = OrderItem.objects.filter(
                product_id=product_id,
                order__status__in=['completed', 'delivered'],
                order__created_at__gte=cutoff_date
            ).annotate(
                date=TruncDay('order__created_at')
            ).values('date').annotate(
                quantity=Sum('quantity')
            ).order_by('date')
            
            if not daily_sales:
                return {
                    'product_id': product_id,
                    'recommendation': 'Ma\'lumot yetarli emas',
                    'restock_quantity': 0,
                    'restock_date': None,
                    'urgency': 'low'
                }
            
            # Calculate metrics
            sales_list = [d['quantity'] for d in daily_sales]
            avg_daily = sum(sales_list) / 90
            max_daily = max(sales_list)
            
            # Predict days until stockout
            if avg_daily > 0:
                days_until_stockout = product.stock_quantity / avg_daily
            else:
                days_until_stockout = 999
            
            # AI prediction
            sales_data_json = json.dumps(list(daily_sales), indent=2, default=str)
            
            prompt = f"""Analyze inventory and predict restock needs.

Product: {product.name}
Current Stock: {product.stock_quantity} units
Average Daily Sales: {avg_daily:.2f}
Max Daily Sales: {max_daily}
Supplier Lead Time: {lead_time_days} days

Daily Sales History (90 days):
{sales_data_json}

Calculate:
1. When to reorder (considering lead time)
2. How much to order (optimize for demand + safety stock)
3. Urgency level

Return ONLY JSON:
{{
  "restock_date": "2024-01-20",
  "days_until_reorder": 5,
  "restock_quantity": 100,
  "safety_stock": 20,
  "urgency": "high",
  "reason": "Uzbek explanation",
  "estimated_demand_30d": 150,
  "confidence": 0.85
}}

urgency options: critical, high, medium, low
restock_date format: YYYY-MM-DD
reason must be in Uzbek
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
                prediction['product_id'] = product_id
                prediction['product_name'] = product.name
                prediction['current_stock'] = product.stock_quantity
                return prediction
            
            # Fallback calculation
            reorder_point = (avg_daily * lead_time_days) + (avg_daily * 7)  # Safety stock
            days_until_reorder = (product.stock_quantity - reorder_point) / avg_daily if avg_daily > 0 else 999
            
            return {
                'product_id': product_id,
                'product_name': product.name,
                'current_stock': product.stock_quantity,
                'restock_date': (datetime.now() + timedelta(days=max(0, days_until_reorder))).strftime('%Y-%m-%d'),
                'days_until_reorder': round(days_until_reorder, 1),
                'restock_quantity': int(avg_daily * 30),  # 30 days supply
                'safety_stock': int(avg_daily * 7),
                'urgency': self._calculate_urgency(days_until_reorder) if avg_daily > 0 else 'low',
                'estimated_demand_30d': int(avg_daily * 30),
                'confidence': 0.6,
                'is_fallback': True
            }
            
        except Exception as e:
            log_ai_error(f"Restock prediction error: {e}")
            return {
                'product_id': product_id,
                'restock_quantity': 0,
                'error': str(e)
            }
    
    def identify_dead_stock(self, threshold_days=90):
        """Identify products with no recent sales (dead stock)"""
        try:
            from products.models import Product
            from orders.models import OrderItem
            
            cutoff_date = datetime.now() - timedelta(days=threshold_days)
            
            # Products with stock but no recent sales
            products_with_stock = Product.objects.filter(
                store_id=self.store_id,
                is_active=True,
                stock_quantity__gt=0
            )
            
            # Get products that sold in the period
            sold_products = OrderItem.objects.filter(
                order__store_id=self.store_id,
                order__status__in=['completed', 'delivered'],
                order__created_at__gte=cutoff_date
            ).values_list('product_id', flat=True).distinct()
            
            # Dead stock = has stock but no sales
            dead_stock = products_with_stock.exclude(id__in=sold_products)
            
            dead_stock_list = []
            for product in dead_stock:
                # Find last sale date
                last_sale = OrderItem.objects.filter(
                    product_id=product.id,
                    order__status__in=['completed', 'delivered']
                ).order_by('-order__created_at').first()
                
                days_since_sale = 0
                if last_sale:
                    days_since_sale = (datetime.now() - last_sale.order.created_at).days
                else:
                    days_since_sale = threshold_days + 1
                
                tied_up_capital = product.price * product.stock_quantity
                
                dead_stock_list.append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'current_stock': product.stock_quantity,
                    'price': float(product.price),
                    'tied_up_capital': tied_up_capital,
                    'days_since_last_sale': days_since_sale,
                    'last_sale_date': last_sale.order.created_at.isoformat() if last_sale else None
                })
            
            # Sort by tied capital (highest first)
            dead_stock_list.sort(key=lambda x: x['tied_up_capital'], reverse=True)
            
            total_tied_capital = sum(item['tied_up_capital'] for item in dead_stock_list)
            
            return {
                'dead_stock_products': dead_stock_list,
                'total_dead_stock_count': len(dead_stock_list),
                'total_tied_capital': total_tied_capital,
                'threshold_days': threshold_days,
                'recommendations': self._generate_dead_stock_recommendations(dead_stock_list)
            }
            
        except Exception as e:
            log_ai_error(f"Dead stock identification error: {e}")
            return {
                'dead_stock_products': [],
                'total_dead_stock_count': 0,
                'total_tied_capital': 0,
                'threshold_days': threshold_days
            }
    
    def _generate_dead_stock_recommendations(self, dead_stock):
        """Generate recommendations for dead stock"""
        if not dead_stock:
            return []
        
        recommendations = []
        
        total_capital = sum(item['tied_up_capital'] for item in dead_stock)
        
        if total_capital > 10000000:  # 10M UZS
            recommendations.append({
                'action': 'clearance_sale',
                'priority': 'high',
                'message': f"{len(dead_stock)} ta mahsulot {total_capital:,.0f} UZS kapitalni band qilmoqda. Chegirma aksiyasi uyushtiring."
            })
        
        if len(dead_stock) > 10:
            recommendations.append({
                'action': 'bundle_deals',
                'priority': 'medium',
                'message': "O'lik stocklarni bundle sifatida sotishni ko'rib chiqing."
            })
        
        recommendations.append({
            'action': 'donate_or_return',
            'priority': 'low',
            'message': "Sotilmayotgan mahsulotlarni qaytarish yoki xayriya qilishni o'ylang."
        })
        
        return recommendations
    
    def optimize_safety_stock(self, product_id, service_level=0.95):
        """Calculate optimal safety stock level"""
        try:
            from products.models import Product
            from orders.models import OrderItem
            
            product = Product.objects.get(id=product_id)
            
            # Get daily sales for 60 days
            cutoff_date = datetime.now() - timedelta(days=60)
            
            daily_sales = OrderItem.objects.filter(
                product_id=product_id,
                order__status__in=['completed', 'delivered'],
                order__created_at__gte=cutoff_date
            ).annotate(
                date=TruncDay('order__created_at')
            ).values('date').annotate(
                quantity=Sum('quantity')
            ).order_by('date')
            
            if not daily_sales:
                return {
                    'product_id': product_id,
                    'recommended_safety_stock': 10,
                    'reorder_point': 20,
                    'service_level': service_level
                }
            
            # Calculate standard deviation
            sales_quantities = [d['quantity'] for d in daily_sales]
            avg_sales = sum(sales_quantities) / len(sales_quantities)
            variance = sum((x - avg_sales) ** 2 for x in sales_quantities) / len(sales_quantities)
            std_dev = variance ** 0.5
            
            # Z-score for service level (95% = 1.65)
            z_scores = {0.90: 1.28, 0.95: 1.65, 0.99: 2.33}
            z_score = z_scores.get(service_level, 1.65)
            
            # Safety stock = Z * std_dev * sqrt(lead_time)
            lead_time = 7  # days
            safety_stock = int(z_score * std_dev * (lead_time ** 0.5))
            
            # Reorder point = (avg_daily * lead_time) + safety_stock
            reorder_point = int(avg_sales * lead_time) + safety_stock
            
            return {
                'product_id': product_id,
                'product_name': product.name,
                'current_stock': product.stock_quantity,
                'avg_daily_sales': round(avg_sales, 2),
                'sales_std_dev': round(std_dev, 2),
                'recommended_safety_stock': safety_stock,
                'reorder_point': reorder_point,
                'service_level': service_level,
                'lead_time_days': lead_time
            }
            
        except Exception as e:
            log_ai_error(f"Safety stock optimization error: {e}")
            return {
                'product_id': product_id,
                'recommended_safety_stock': 10,
                'error': str(e)
            }
