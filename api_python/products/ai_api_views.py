"""
AI Features API Views
Endpoints for all AI-powered features
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from products.ai_forecast_service import AIForecastService
from products.ai_pricing_service import AIPricingService
from products.ai_recommendation_service import AIRecommendationService
from products.ai_inventory_service import AIInventoryService
from products.ai_customer_service import AICustomerService
from products.ai_review_service import AIReviewService


class AIForecastView(APIView):
    """AI-powered sales forecasting"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, store_id):
        """Get sales forecast for store"""
        days_ahead = request.query_params.get('days', 7)
        
        try:
            forecast_service = AIForecastService(store_id)
            forecast = forecast_service.generate_forecast(days_ahead=int(days_ahead))
            
            return Response({
                'success': True,
                'forecast': forecast
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIDemandPredictionView(APIView):
    """AI-powered demand prediction for specific product"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, product_id):
        """Get demand prediction for product"""
        try:
            from products.models import Product
            product = Product.objects.filter(id=product_id).first()
            if not product:
                return Response({
                    'success': False,
                    'error': 'Product not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            forecast_service = AIForecastService(product.store_id)
            prediction = forecast_service.get_demand_prediction_for_product(product_id)
            
            return Response({
                'success': True,
                'prediction': prediction
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIPricingSuggestionsView(APIView):
    """AI-powered pricing suggestions"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, store_id):
        """Get pricing suggestions for store products"""
        product_ids = request.query_params.get('products', None)
        
        try:
            pricing_service = AIPricingService(store_id)
            
            if product_ids:
                product_ids = [int(pid) for pid in product_ids.split(',')]
            
            suggestions = pricing_service.generate_pricing_suggestions(product_ids)
            
            return Response({
                'success': True,
                'suggestions': suggestions
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIOptimalDiscountView(APIView):
    """Calculate optimal discount for a product"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, product_id):
        """Get optimal discount calculation"""
        target_increase = request.query_params.get('target', 0.20)
        
        try:
            from products.models import Product
            product = Product.objects.filter(id=product_id).first()
            if not product:
                 return Response({'success': False, 'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
            
            pricing_service = AIPricingService(product.store_id)
            discount = pricing_service.calculate_optimal_discount(
                product_id,
                target_sales_increase=float(target_increase)
            )
            
            return Response({
                'success': True,
                'discount': discount
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIRecommendationsView(APIView):
    """AI-powered product recommendations"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, product_id):
        """Get recommendations for a product"""
        rec_type = request.query_params.get('type', 'similar')  # similar, cross_sell, upsell
        
        try:
            # Get store_id from product
            from products.models import Product
            product = Product.objects.filter(id=product_id).first()
            if not product:
                return Response({'success': False, 'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
            
            rec_service = AIRecommendationService(product.store_id)
            
            if rec_type == 'similar':
                result = rec_service.get_similar_products(product_id)
            elif rec_type == 'cross_sell':
                result = rec_service.get_cross_sell_recommendations(product_id)
            elif rec_type == 'upsell':
                result = rec_service.get_upsell_recommendations(product_id)
            else:
                result = rec_service.get_similar_products(product_id)
            
            return Response({
                'success': True,
                'recommendations': result
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIPersonalizedRecommendationsView(APIView):
    """AI-powered personalized recommendations for user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, store_id):
        """Get personalized recommendations for authenticated user"""
        limit = request.query_params.get('limit', 10)
        
        try:
            rec_service = AIRecommendationService(store_id)
            recommendations = rec_service.get_personalized_recommendations(
                request.user.id,
                limit=int(limit)
            )
            
            return Response({
                'success': True,
                'recommendations': recommendations
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AITrendingProductsView(APIView):
    """Get trending products"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, store_id):
        """Get trending products for store"""
        days = request.query_params.get('days', 7)
        limit = request.query_params.get('limit', 10)
        
        try:
            rec_service = AIRecommendationService(store_id)
            trending = rec_service.get_trending_products(
                limit=int(limit),
                days=int(days)
            )
            
            return Response({
                'success': True,
                'trending': trending
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIInventoryHealthView(APIView):
    """AI-powered inventory health analysis"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, store_id):
        """Get inventory health analysis"""
        try:
            inventory_service = AIInventoryService(store_id)
            health = inventory_service.analyze_inventory_health()
            
            return Response({
                'success': True,
                'inventory_health': health
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIRestockPredictionView(APIView):
    """AI-powered restock predictions"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, product_id):
        """Get restock prediction for product"""
        lead_time = request.query_params.get('lead_time', 7)
        
        try:
            # Get store_id from product
            from products.models import Product
            product = Product.objects.get(id=product_id)
            
            inventory_service = AIInventoryService(product.store_id)
            prediction = inventory_service.predict_restock_needs(
                product_id,
                lead_time_days=int(lead_time)
            )
            
            return Response({
                'success': True,
                'prediction': prediction
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIDeadStockView(APIView):
    """Identify dead stock"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, store_id):
        """Get dead stock analysis"""
        threshold = request.query_params.get('threshold', 90)
        
        try:
            inventory_service = AIInventoryService(store_id)
            dead_stock = inventory_service.identify_dead_stock(
                threshold_days=int(threshold)
            )
            
            return Response({
                'success': True,
                'dead_stock': dead_stock
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AISafetyStockView(APIView):
    """Calculate optimal safety stock"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, product_id):
        """Get safety stock optimization"""
        service_level = request.query_params.get('service_level', 0.95)
        
        try:
            from products.models import Product
            product = Product.objects.filter(id=product_id).first()
            if not product:
                return Response({'success': False, 'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
            
            inventory_service = AIInventoryService(product.store_id)
            optimization = inventory_service.optimize_safety_stock(
                product_id,
                service_level=float(service_level)
            )
            
            return Response({
                'success': True,
                'optimization': optimization
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AICustomerSegmentationView(APIView):
    """AI-powered customer segmentation"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, store_id):
        """Get customer segmentation"""
        try:
            customer_service = AICustomerService(store_id)
            segmentation = customer_service.segment_customers()
            
            return Response({
                'success': True,
                'segmentation': segmentation
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIChurnPredictionView(APIView):
    """AI-powered churn prediction"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, customer_id):
        """Get churn prediction for customer"""
        try:
            from orders.models import Order
            first_order = Order.objects.filter(customer_id=customer_id).first()
            if not first_order:
                 return Response({'success': False, 'error': 'No orders found for customer'}, status=status.HTTP_404_NOT_FOUND)
            
            customer_service = AICustomerService(first_order.store_id)
            prediction = customer_service.predict_churn_risk(customer_id)
            
            return Response({
                'success': True,
                'prediction': prediction
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AICustomerLifetimeValueView(APIView):
    """Calculate customer lifetime value"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, customer_id):
        """Get CLV for customer"""
        try:
            from orders.models import Order
            first_order = Order.objects.filter(customer_id=customer_id).first()
            if not first_order:
                return Response({'success': False, 'error': 'No orders found for customer'}, status=status.HTTP_404_NOT_FOUND)
            
            customer_service = AICustomerService(first_order.store_id)
            clv = customer_service.calculate_customer_lifetime_value(customer_id)
            
            return Response({
                'success': True,
                'clv': clv
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AICustomerInsightsView(APIView):
    """Generate comprehensive customer insights"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, store_id):
        """Get customer insights"""
        try:
            customer_service = AICustomerService(store_id)
            insights = customer_service.generate_customer_insights()
            
            return Response({
                'success': True,
                'insights': insights
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIReviewSentimentView(APIView):
    """AI-powered review sentiment analysis"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, store_id=None, product_id=None):
        """Get review sentiment analysis"""
        try:
            review_service = AIReviewService(store_id=store_id, product_id=product_id)
            
            if store_id:
                analysis = review_service.analyze_store_reviews()
            elif product_id:
                analysis = review_service.analyze_product_reviews(product_id)
            else:
                return Response({
                    'success': False,
                    'error': 'store_id or product_id required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                'success': True,
                'analysis': analysis
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIReviewSummaryView(APIView):
    """Generate AI review summary"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, store_id):
        """Get AI-generated review summary"""
        try:
            review_service = AIReviewService(store_id=store_id)
            analysis = review_service.analyze_store_reviews()
            
            return Response({
                'success': True,
                'summary': analysis.get('summary', {}),
                'themes': analysis.get('themes', {}),
                'sentiment': analysis.get('sentiment_analysis', {})
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIBundleSuggestionsView(APIView):
    """AI-powered product bundle suggestions"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Get bundle suggestions for products"""
        product_ids = request.data.get('product_ids', [])
        
        if not product_ids:
            return Response({
                'success': False,
                'error': 'product_ids required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from products.models import Product
            first_product = Product.objects.filter(id__in=product_ids).first()
            if not first_product:
                 return Response({'success': False, 'error': 'Products not found'}, status=status.HTTP_404_NOT_FOUND)
            
            rec_service = AIRecommendationService(first_product.store_id)
            bundles = rec_service.get_bundle_suggestions(product_ids)
            
            return Response({
                'success': True,
                'bundles': bundles
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AICuratedCollectionView(APIView):
    """AI-curated product collections"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, store_id):
        """Get AI-curated collection"""
        theme = request.query_params.get('theme', 'bestsellers')
        limit = request.query_params.get('limit', 8)
        
        try:
            rec_service = AIRecommendationService(store_id)
            collection = rec_service.get_ai_curated_collection(
                theme,
                limit=int(limit)
            )
            
            return Response({
                'success': True,
                'collection': collection
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
