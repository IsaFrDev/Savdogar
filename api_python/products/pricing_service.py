"""
AI Auto-Pricing Engine Service
"""
from decimal import Decimal
from django.utils import timezone
from .models import Product
from .pricing_models import PricingRule, CompetitorPrice, PriceHistory, AIRecommendation
from .ai_service import ai_service


class PricingEngine:
    """AI-powered pricing optimization engine"""
    
    @staticmethod
    def calculate_optimal_price(product_id):
        """Calculate optimal price using AI and market data"""
        try:
            product = Product.objects.get(id=product_id)
            
            # Gather data for AI analysis
            competitor_prices = CompetitorPrice.objects.filter(
                product=product,
                is_available=True
            )
            
            price_history = PriceHistory.objects.filter(
                product=product
            ).order_by('-created_at')[:30]
            
            # Prepare data for AI
            product_data = {
                'name': product.name,
                'current_price': str(product.price),
                'category': product.category.name if product.category else 'Uncategorized',
                'stock': product.stock,
            }
            
            competitor_data = [
                {
                    'competitor': cp.competitor_name,
                    'price': str(cp.price),
                    'difference': str(cp.price_difference)
                }
                for cp in competitor_prices
            ]
            
            # Get AI recommendation
            ai_suggestion = ai_service.suggest_price(
                product_data=product_data,
                competitor_prices=competitor_data,
                demand_data={'stock_level': product.stock}
            )
            
            if ai_suggestion:
                # Create AI recommendation record
                recommendation = AIRecommendation.objects.create(
                    product=product,
                    store=product.store,
                    current_price=product.price,
                    suggested_price=Decimal(ai_suggestion.get('price', product.price)),
                    confidence_score=Decimal(ai_suggestion.get('confidence', 75)),
                    reasoning=ai_suggestion.get('reasoning', ''),
                    factors=ai_suggestion.get('factors', {}),
                    expected_sales_change=Decimal(ai_suggestion.get('expected_sales_change', 0)),
                    expected_revenue_change=Decimal(ai_suggestion.get('expected_revenue_change', 0))
                )
                
                return recommendation
            
            return None
            
        except Product.DoesNotExist:
            return None
        except Exception as e:
            print(f"Pricing engine error: {e}")
            return None
    
    @staticmethod
    def track_competitor_price(product_sku, competitor_name, competitor_url, price):
        """Track competitor price for a product"""
        try:
            product = Product.objects.get(sku=product_sku)
            
            competitor_price, created = CompetitorPrice.objects.update_or_create(
                product=product,
                competitor_name=competitor_name,
                defaults={
                    'price': price,
                    'competitor_url': competitor_url,
                    'store': product.store,
                    'is_available': True,
                    'last_checked': timezone.now()
                }
            )
            
            return competitor_price
            
        except Product.DoesNotExist:
            return None
    
    @staticmethod
    def apply_pricing_rules(product_id):
        """Apply active pricing rules to a product"""
        try:
            product = Product.objects.get(id=product_id)
            rules = PricingRule.objects.filter(
                store=product.store,
                status='active'
            ).order_by('-priority')
            
            old_price = product.price
            
            for rule in rules:
                # Check if rule applies to this product
                if not PricingEngine._rule_applies(rule, product):
                    continue
                
                # Apply rule action
                new_price = PricingEngine._apply_rule_action(rule, product)
                
                if new_price and new_price != old_price:
                    # Log price change
                    PriceHistory.objects.create(
                        product=product,
                        store=product.store,
                        old_price=old_price,
                        new_price=new_price,
                        reason='pricing_rule',
                        rule=rule
                    )
                    
                    product.price = new_price
                    product.save()
                    old_price = new_price
            
            return True
            
        except Product.DoesNotExist:
            return False
    
    @staticmethod
    def get_price_history(product_id, days=30):
        """Get price change history"""
        cutoff_date = timezone.now() - timezone.timedelta(days=days)
        
        return PriceHistory.objects.filter(
            product_id=product_id,
            created_at__gte=cutoff_date
        ).order_by('-created_at')
    
    @staticmethod
    def _rule_applies(rule, product):
        """Check if pricing rule applies to product"""
        if rule.apply_to == 'all':
            return True
        elif rule.apply_to == 'category' and rule.category:
            return product.category == rule.category
        elif rule.apply_to == 'product':
            return rule.products.filter(id=product.id).exists()
        return False
    
    @staticmethod
    def _apply_rule_action(rule, product):
        """Apply rule action to calculate new price"""
        action = rule.action
        current_price = product.price
        
        action_type = action.get('type')
        
        if action_type == 'set_price':
            return Decimal(str(action.get('value', current_price)))
        
        elif action_type == 'percentage_change':
            change = Decimal(str(action.get('percentage', 0)))
            return current_price * (1 + change / 100)
        
        elif action_type == 'match_competitor':
            competitor_price = CompetitorPrice.objects.filter(
                product=product,
                is_available=True
            ).order_by('price').first()
            
            if competitor_price:
                return competitor_price.price
        
        elif action_type == 'minimum_margin':
            cost = product.cost_price if hasattr(product, 'cost_price') else current_price * 0.7
            min_margin = Decimal(str(action.get('margin', 20)))
            min_price = cost * (1 + min_margin / 100)
            
            if current_price < min_price:
                return min_price
        
        return current_price
