"""
AI Auto-Pricing API Views
"""
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Product
from .pricing_models import PricingRule, CompetitorPrice, PriceHistory, AIRecommendation
from .serializers import (
    PricingRuleSerializer, CompetitorPriceSerializer, 
    PriceHistorySerializer, AIRecommendationSerializer
)
from .pricing_service import PricingEngine


class PricingRuleViewSet(viewsets.ModelViewSet):
    """Manage pricing rules"""
    serializer_class = PricingRuleSerializer
    permission_classes = [IsAuthenticated]
    queryset = PricingRule.objects.none()
    
    def get_queryset(self):
        return PricingRule.objects.filter(
            store=self.request.user.store
        ).order_by('-priority', '-created_at')
    
    def perform_create(self, serializer):
        serializer.save(store=self.request.user.store)


class CompetitorPriceViewSet(viewsets.ModelViewSet):
    """Track competitor prices"""
    serializer_class = CompetitorPriceSerializer
    permission_classes = [IsAuthenticated]
    queryset = CompetitorPrice.objects.none()
    
    def get_queryset(self):
        return CompetitorPrice.objects.filter(
            store=self.request.user.store
        ).order_by('-last_checked')
    
    def perform_create(self, serializer):
        serializer.save(store=self.request.user.store)


class PriceHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """View price change history"""
    serializer_class = PriceHistorySerializer
    permission_classes = [IsAuthenticated]
    queryset = PriceHistory.objects.none()
    
    def get_queryset(self):
        return PriceHistory.objects.filter(
            store=self.request.user.store
        ).order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def product_history(self, request):
        """Get price history for specific product"""
        product_id = request.query_params.get('product_id')
        days = int(request.query_params.get('days', 30))
        
        if not product_id:
            return Response({'error': 'product_id required'}, status=400)
        
        history = PricingEngine.get_price_history(product_id, days)
        serializer = self.get_serializer(history, many=True)
        
        return Response(serializer.data)


class AIRecommendationViewSet(viewsets.ModelViewSet):
    """AI price recommendations"""
    serializer_class = AIRecommendationSerializer
    permission_classes = [IsAuthenticated]
    queryset = AIRecommendation.objects.none()
    
    def get_queryset(self):
        return AIRecommendation.objects.filter(
            store=self.request.user.store
        ).order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        """Apply AI recommendation"""
        recommendation = self.get_object()
        
        # Update product price
        product = recommendation.product
        old_price = product.price
        product.price = recommendation.suggested_price
        product.save()
        
        # Update recommendation status
        recommendation.status = 'applied'
        recommendation.applied_at = timezone.now()
        recommendation.save()
        
        # Log price change
        from .pricing_models import PriceHistory
        PriceHistory.objects.create(
            product=product,
            store=product.store,
            old_price=old_price,
            new_price=recommendation.suggested_price,
            reason='ai_recommendation',
            notes=f'AI confidence: {recommendation.confidence_score}%'
        )
        
        return Response({'status': 'Price updated successfully'})
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate AI recommendation for product"""
        product_id = request.data.get('product_id')
        
        if not product_id:
            return Response({'error': 'product_id required'}, status=400)
        
        recommendation = PricingEngine.calculate_optimal_price(product_id)
        
        if recommendation:
            serializer = self.get_serializer(recommendation)
            return Response(serializer.data)
        
        return Response({'error': 'Failed to generate recommendation'}, status=500)
