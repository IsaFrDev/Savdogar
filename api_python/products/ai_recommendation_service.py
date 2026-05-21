"""
AI-Powered Product Recommendations Engine
Provides personalized product suggestions: similar products, cross-sell, upsell, trending
"""
import os
import json
from datetime import datetime, timedelta
from django.db.models import Count, Sum, Q, Avg
from collections import Counter
from products.ai_service import forecast_ai_service as ai_service, log_ai_error


class AIRecommendationService:
    """AI-driven product recommendation system"""
    
    def __init__(self, store_id):
        self.store_id = store_id
        
    def get_similar_products(self, product_id, limit=6):
        """Find similar products based on category, tags, and price range"""
        try:
            from products.models import Product
            from orders.models import OrderItem
            
            product = Product.objects.get(id=product_id)
            
            # Get products from same category
            similar = Product.objects.filter(
                category=product.category,
                is_active=True,
                store_id=self.store_id
            ).exclude(id=product_id)
            
            # Boost products with similar price range (±30%)
            price_min = product.price * 0.7
            price_max = product.price * 1.3
            
            similar = similar.filter(
                price__gte=price_min,
                price__lte=price_max
            )
            
            # Order by popularity (sales count)
            similar = similar.annotate(
                sales_count=Count(
                    'orderitem',
                    filter=Q(
                        orderitem__order__status__in=['completed', 'delivered'],
                        orderitem__order__created_at__gte=datetime.now() - timedelta(days=90)
                    )
                )
            ).order_by('-sales_count', '-rating')[:limit]
            
            return {
                'product_id': product_id,
                'recommendations': list(similar.values(
                    'id', 'name', 'price', 'image', 'rating', 'stock_quantity'
                )),
                'type': 'similar_products',
                'count': similar.count()
            }
            
        except Exception as e:
            log_ai_error(f"Similar products error: {e}")
            return {'product_id': product_id, 'recommendations': [], 'type': 'similar_products'}
    
    def get_cross_sell_recommendations(self, product_id, limit=4):
        """Products frequently bought together"""
        try:
            from products.models import Product
            from orders.models import OrderItem
            
            # Find orders containing this product
            orders_with_product = OrderItem.objects.filter(
                product_id=product_id,
                order__status__in=['completed', 'delivered']
            ).values_list('order_id', flat=True)
            
            # Find other products in those orders
            co_purchased = OrderItem.objects.filter(
                order_id__in=orders_with_product
            ).exclude(product_id=product_id).values(
                'product_id',
                'product_name'
            ).annotate(
                frequency=Count('id'),
                total_revenue=Sum('price')
            ).order_by('-frequency')[:limit * 2]
            
            # Get full product details
            product_ids = [item['product_id'] for item in co_purchased]
            products = Product.objects.filter(
                id__in=product_ids,
                is_active=True,
                stock_quantity__gt=0
            ).values('id', 'name', 'price', 'image', 'rating', 'stock_quantity')[:limit]
            
            return {
                'product_id': product_id,
                'recommendations': list(products),
                'type': 'cross_sell',
                'message': "Birga sotib olingan"
            }
            
        except Exception as e:
            log_ai_error(f"Cross-sell error: {e}")
            return {'product_id': product_id, 'recommendations': [], 'type': 'cross_sell'}
    
    def get_upsell_recommendations(self, product_id, limit=3):
        """Premium alternatives (higher price, better value)"""
        try:
            from products.models import Product
            
            product = Product.objects.get(id=product_id)
            
            # Find products in same category with higher price and better rating
            upsells = Product.objects.filter(
                category=product.category,
                is_active=True,
                store_id=self.store_id,
                price__gte=product.price * 1.2,  # 20% more expensive
                stock_quantity__gt=0
            ).order_by('-rating', '-price')[:limit]
            
            return {
                'product_id': product_id,
                'recommendations': list(upsells.values(
                    'id', 'name', 'price', 'image', 'rating', 'stock_quantity'
                )),
                'type': 'upsell',
                'message': "Premium variantlar"
            }
            
        except Exception as e:
            log_ai_error(f"Upsell error: {e}")
            return {'product_id': product_id, 'recommendations': [], 'type': 'upsell'}
    
    def get_personalized_recommendations(self, user_id, limit=10):
        """AI-powered personalized recommendations based on user behavior"""
        try:
            from products.models import Product
            from orders.models import Order, OrderItem
            
            # Get user's purchase history
            user_orders = Order.objects.filter(
                customer_id=user_id,
                status__in=['completed', 'delivered']
            ).values_list('id', flat=True)
            
            purchased_products = OrderItem.objects.filter(
                order_id__in=user_orders
            ).values_list('product_id', flat=True)
            
            # Get categories user prefers
            preferred_categories = OrderItem.objects.filter(
                order_id__in=user_orders,
                product__category__isnull=False
            ).values(
                'product__category__name'
            ).annotate(
                count=Count('id')
            ).order_by('-count')[:5]
            
            category_names = [cat['product__category__name'] for cat in preferred_categories]
            
            # Recommend from preferred categories (exclude already purchased)
            recommendations = Product.objects.filter(
                category__name__in=category_names,
                is_active=True,
                store_id=self.store_id,
                stock_quantity__gt=0
            ).exclude(
                id__in=purchased_products
            ).annotate(
                sales_count=Count(
                    'orderitem',
                    filter=Q(
                        orderitem__order__status__in=['completed', 'delivered']
                    )
                )
            ).order_by('-sales_count', '-rating')[:limit]
            
            return {
                'user_id': user_id,
                'recommendations': list(recommendations.values(
                    'id', 'name', 'price', 'image', 'rating', 'stock_quantity', 'category__name'
                )),
                'type': 'personalized',
                'based_on_categories': category_names
            }
            
        except Exception as e:
            log_ai_error(f"Personalized recommendations error: {e}")
            return {'user_id': user_id, 'recommendations': [], 'type': 'personalized'}
    
    def get_trending_products(self, limit=10, days=7):
        """Get trending products based on recent sales velocity"""
        try:
            from products.models import Product
            from orders.models import OrderItem
            
            cutoff_date = datetime.now() - timedelta(days=days)
            
            trending = OrderItem.objects.filter(
                order__store_id=self.store_id,
                order__status__in=['completed', 'delivered'],
                order__created_at__gte=cutoff_date
            ).values(
                'product_id',
                'product_name'
            ).annotate(
                total_sold=Sum('quantity'),
                revenue=Sum('price'),
                order_count=Count('id')
            ).order_by('-total_sold')[:limit]
            
            # Get full product details
            product_ids = [item['product_id'] for item in trending]
            products = Product.objects.filter(
                id__in=product_ids,
                is_active=True
            ).values('id', 'name', 'price', 'image', 'rating', 'stock_quantity')
            
            # Merge data
            trending_list = []
            for item in trending:
                product_data = next((p for p in products if p['id'] == item['product_id']), {})
                trending_list.append({
                    **item,
                    **product_data,
                    'sales_velocity': item['total_sold'] / days
                })
            
            return {
                'trending_products': trending_list,
                'period_days': days,
                'type': 'trending'
            }
            
        except Exception as e:
            log_ai_error(f"Trending products error: {e}")
            return {'trending_products': [], 'period_days': days, 'type': 'trending'}
    
    def get_ai_curated_collection(self, theme, limit=8):
        """AI-generated product collections based on themes"""
        try:
            from products.models import Product
            
            # Get active products
            products = Product.objects.filter(
                store_id=self.store_id,
                is_active=True,
                stock_quantity__gt=0
            ).values('id', 'name', 'description', 'price', 'category__name')[:50]
            
            if not products:
                return {'collection': [], 'theme': theme}
            
            # AI prompt to select products
            product_list = json.dumps(list(products), indent=2, default=str)
            
            prompt = f"""You are a professional e-commerce merchandiser. Select {limit} products that best fit the theme: "{theme}"

Available Products:
{product_list}

Return ONLY a JSON array of product IDs that fit the theme best:
{{
  "product_ids": [1, 5, 12, 8, 23, 15, 9, 3],
  "collection_name": "Theme Collection Name",
  "description": "Brief description in Uzbek"
}}

CRITICAL:
1. Return ONLY valid JSON
2. Select exactly {limit} products
3. collection_name must be catchy
4. description must be in Uzbek
"""
            
            response_text = ai_service._safe_generate_content(
                ai_service._get_model_names(),
                prompt
            )
            
            # Parse response
            start = response_text.find('{')
            end = response_text.rfind('}')
            if start != -1 and end != -1:
                collection_data = json.loads(response_text[start:end+1])
                
                # Get full product details
                full_products = Product.objects.filter(
                    id__in=collection_data['product_ids'],
                    is_active=True
                ).values('id', 'name', 'price', 'image', 'rating', 'stock_quantity')
                
                return {
                    'collection': list(full_products),
                    'collection_name': collection_data.get('collection_name', theme),
                    'description': collection_data.get('description', ''),
                    'theme': theme,
                    'type': 'ai_curated'
                }
            
            return {'collection': [], 'theme': theme}
            
        except Exception as e:
            log_ai_error(f"AI curated collection error: {e}")
            return {'collection': [], 'theme': theme, 'type': 'ai_curated'}
    
    def get_bundle_suggestions(self, product_ids, limit=3):
        """AI-suggested product bundles/packages"""
        try:
            from products.models import Product
            
            products = Product.objects.filter(id__in=product_ids)
            
            if not products:
                return {'bundles': []}
            
            # Build bundle prompt
            product_info = []
            for p in products:
                product_info.append({
                    'id': p.id,
                    'name': p.name,
                    'price': float(p.price),
                    'category': p.category.name if p.category else 'Unknown'
                })
            
            prompt = f"""Create {limit} product bundle suggestions from these products.

Products:
{json.dumps(product_info, indent=2)}

Rules:
1. Each bundle should have 2-4 products
2. Calculate bundle price with 10-20% discount
3. Bundles should make logical sense together

Return ONLY JSON:
[
  {{
    "bundle_name": "Complete Set",
    "product_ids": [1, 2, 3],
    "original_price": 500000,
    "bundle_price": 425000,
    "discount_percent": 15,
    "description": "Uzbek description"
  }}
]

description must be in Uzbek
"""
            
            response_text = ai_service._safe_generate_content(
                ai_service._get_model_names(),
                prompt
            )
            
            # Parse JSON array
            start = response_text.find('[')
            end = response_text.rfind(']')
            if start != -1 and end != -1:
                bundles = json.loads(response_text[start:end+1])
                return {'bundles': bundles, 'type': 'ai_bundles'}
            
            return {'bundles': [], 'type': 'ai_bundles'}
            
        except Exception as e:
            log_ai_error(f"Bundle suggestions error: {e}")
            return {'bundles': [], 'type': 'ai_bundles'}
