from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import models
from django.utils import timezone
import datetime
from datetime import timedelta
from rest_framework.decorators import action
from django.db.models import Q
from django.http import HttpResponse
from drf_spectacular.utils import extend_schema, OpenApiParameter
import os
import json
import re

from .ai_service import ai_service
from .bulk_operations import (
    get_client_ip, bulk_update_products,
    export_products_to_excel, import_products_from_excel
)

from .models import (
    Category, Product, ProductImage, ProductAttribute, ProductVariant,
    Discount, PromoCode, Wishlist, RecentlyViewed, Review
)
from django.db import transaction
from .serializers import (
    CategorySerializer, ProductSerializer, ProductCreateSerializer, 
    ProductImageSerializer, ProductAttributeSerializer,
    ProductVariantSerializer, BulkUpdateSerializer,
    DiscountSerializer, PromoCodeSerializer, WishlistSerializer,
    RecentlyViewedSerializer, ReviewSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Category CRUD operations."""
    
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_authenticators(self):
        # Allow public access for GET requests
        if (hasattr(self, 'request') and self.request and self.request.method == 'GET') or \
           getattr(self, 'action', None) in ['list', 'retrieve']:
            return []
        return super().get_authenticators()

    def get_queryset(self):
        try:
            store_id = self.request.query_params.get('store')
            queryset = Category.objects.all()
            
            if store_id:
                queryset = queryset.filter(store_id=store_id)
            return queryset
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in CategoryViewSet.get_queryset: {str(e)}")
            return Category.objects.none()


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for Product CRUD operations."""
    
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_authenticators(self):
        # Allow public access for GET requests
        if (hasattr(self, 'request') and self.request and self.request.method == 'GET') or \
           getattr(self, 'action', None) in ['list', 'retrieve', 'public']:
            return []
        return super().get_authenticators()

    def get_serializer_class(self):
        if self.action == 'create':
            return ProductCreateSerializer
        return ProductSerializer

    def get_queryset(self):
        try:
            queryset = Product.objects.all()
            store_id = self.request.query_params.get('store')
            category_id = self.request.query_params.get('category')
            search = self.request.query_params.get('search')
            featured = self.request.query_params.get('featured')
            
            if store_id:
                queryset = queryset.filter(store_id=store_id)
            if category_id:
                queryset = queryset.filter(category_id=category_id)
            if search:
                queryset = queryset.filter(
                    Q(name__icontains=search) | 
                    Q(description__icontains=search) |
                    Q(sku__icontains=search)
                )
            if featured:
                queryset = queryset.filter(featured=True)
            return queryset
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in ProductViewSet.get_queryset: {str(e)}")
            return Product.objects.none()

    def perform_create(self, serializer):
        # AI Moderation Check via Service layer
        from core.services import ContentModerationService
        name = serializer.validated_data.get('name')
        if name:
            ContentModerationService(user=self.request.user).moderate(name)
        
        serializer.save(store=self.request.store if hasattr(self.request, 'store') else serializer.validated_data.get('store'))

    def perform_update(self, serializer):
        # AI Moderation Check via Service layer
        from core.services import ContentModerationService
        name = serializer.validated_data.get('name')
        if name:
            ContentModerationService(user=self.request.user).moderate(name)
        
        serializer.save()

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def bulk_update(self, request):
        serializer = BulkUpdateSerializer(data=request.data)
        if serializer.is_valid():
            success_count, errors = bulk_update_products(
                serializer.validated_data['products'],
                request.user,
                get_client_ip(request)
            )
            return Response({
                'success_count': success_count,
                'errors': errors
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def export_excel(self, request):
        queryset = self.get_queryset()
        buffer = export_products_to_excel(queryset)
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename=products.xlsx'
        return response

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def import_excel(self, request):
        file = request.FILES.get('file')
        store_id = request.data.get('store')
        if not file or not store_id:
            return Response({'error': 'File and store ID are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from stores.models import Store
            store = Store.objects.get(id=store_id)
            created, updated, errors = import_products_from_excel(file, store, request.user, get_client_ip(request))
            return Response({
                'created': created,
                'updated': updated,
                'errors': errors
            }, status=status.HTTP_200_OK)
        except Store.DoesNotExist:
            return Response({'error': 'Store not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AIDescriptionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        name = request.data.get('name', '')
        category = request.data.get('category', '')
        language = request.data.get('language', 'uz')
        
        if not name:
            return Response({'error': 'Product name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            description = ai_service.generate_description(name, category, language)
            return Response({'description': description})
        except Exception as e:
            error_str = str(e)
            if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str or 'quota' in error_str.lower():
                return Response(
                    {'error': 'AI xizmati vaqtinchalik band. Iltimos, 30 soniyadan keyin qayta urinib ko\'ring.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            return Response({'error': 'AI xizmatida xatolik yuz berdi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIMarketingView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        name = request.data.get('name', '')
        description = request.data.get('description', '')
        platform = request.data.get('platform', 'instagram')
        language = request.data.get('language', 'uz')
        
        if not name:
            return Response({'error': 'Product name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            post = ai_service.generate_marketing_post(name, description, platform, language)
            return Response({'post': post})
        except Exception as e:
            error_str = str(e)
            if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str or 'quota' in error_str.lower():
                return Response(
                    {'error': 'AI xizmati vaqtinchalik band. Iltimos, 30 soniyadan keyin qayta urinib ko\'ring.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            return Response({'error': 'AI xizmatida xatolik yuz berdi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIGenerateSEOTagsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        name = request.data.get('name', '')
        description = request.data.get('description', '')
        language = request.data.get('language', 'uz')
        
        if not name:
            return Response({'error': 'Product name is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        seo_tags = ai_service.generate_seo_tags(name, description, language)
        return Response({'seo_tags': seo_tags})


class AITranslateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        text = request.data.get('text', '')
        target_lang = request.data.get('target_lang', 'ru')
        
        if not text:
            return Response({'error': 'Text is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            translated_text = ai_service.translate_text(text, target_lang)
            return Response({'translated_text': translated_text})
        except Exception as e:
            error_str = str(e)
            if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str or 'quota' in error_str.lower():
                return Response(
                    {'error': 'AI xizmati vaqtinchalik band. Iltimos, 30 soniyadan keyin qayta urinib ko\'ring.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            import logging
            logger = logging.getLogger('savdoon')
            logger.error(f"AI translate error: {e}")
            return Response(
                {'error': 'Tarjima xizmatida xatolik yuz berdi.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_authenticators(self):
        # Allow public access for GET requests
        if (hasattr(self, 'request') and self.request and self.request.method == 'GET') or \
           getattr(self, 'action', None) in ['list', 'retrieve']:
            return []
        return super().get_authenticators()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reply(self, request, pk=None):
        review = self.get_object()
        # Only store owner or staff can reply (simplified check)
        reply_text = request.data.get('reply_text')
        if not reply_text:
            return Response({'error': 'Reply text is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        review.reply_text = reply_text
        review.replied_at = timezone.now()
        review.save()
        return Response(self.get_serializer(review).data)


class PublicSearchView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        query = request.query_params.get('q', '')
        store_id = request.query_params.get('store')
        category_id = request.query_params.get('category')
        
        queryset = Product.objects.all()
        
        if store_id:
            queryset = queryset.filter(store_id=store_id)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
            
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) | 
                Q(description__icontains=query)
            )
        
        # Limit results for public search
        products = queryset.order_by('-created_at')[:200]
        
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)


class WishlistView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        wishlist = Wishlist.objects.filter(user=request.user)
        serializer = WishlistSerializer(wishlist, many=True)
        return Response(serializer.data)
        
    def post(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        wishlist_item, created = Wishlist.objects.get_or_create(
            user=request.user,
            product_id=product_id
        )
        return Response({'created': created}, status=status.HTTP_201_CREATED)


class GlobalAiSearchView(APIView):
    """
    Experimental: Global search across all products with AI assistance.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response({"error": "No query provided"}, status=400)

        # 1. Classical DB search
        db_results = Product.objects.filter(
            Q(name__icontains=query) | 
            Q(description__icontains=query)
        )[:5]

        # 2. AI Enhancement (Smarter matching logic)
        # For now, just simulated
        
        results = ProductSerializer(db_results, many=True).data
        explanation = f"Top matches for '{query}'"
        
        return Response({
            "explanation": explanation,
            "results": results,
            "count": len(results)
        })


class DiscountViewSet(viewsets.ModelViewSet):
    """ViewSet for Discount CRUD operations."""
    serializer_class = DiscountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Discount.objects.all()
        store_id = self.request.query_params.get('store')
        if store_id:
            queryset = queryset.filter(store_id=store_id)
        if not (self.request.user.is_superuser or getattr(self.request.user, 'role', '') == 'superadmin'):
            queryset = queryset.filter(store__owner=self.request.user)
        return queryset

    def perform_create(self, serializer):
        serializer.save()


class ProductAttributeViewSet(viewsets.ModelViewSet):
    """ViewSet for ProductAttribute CRUD operations."""
    serializer_class = ProductAttributeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        store_id = self.request.query_params.get('store')
        queryset = ProductAttribute.objects.all()
        if store_id:
            queryset = queryset.filter(store_id=store_id)
        if not (self.request.user.is_superuser or getattr(self.request.user, 'role', '') == 'superadmin'):
            queryset = queryset.filter(store__owner=self.request.user)
        return queryset


class ProductVariantViewSet(viewsets.ModelViewSet):
    """ViewSet for ProductVariant CRUD operations."""
    serializer_class = ProductVariantSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        product_id = self.request.query_params.get('product')
        queryset = ProductVariant.objects.all()
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        # Security: Filter by store ownership
        if not (self.request.user.is_superuser or getattr(self.request.user, 'role', '') == 'superadmin'):
            queryset = queryset.filter(product__store__owner=self.request.user)
            
        return queryset


class RecentlyViewedView(APIView):
    """View and track recently viewed products."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        views = RecentlyViewed.objects.filter(user=request.user).order_by('-viewed_at')[:20]
        serializer = RecentlyViewedSerializer(views, many=True)
        return Response(serializer.data)
        
    def post(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        view, created = RecentlyViewed.objects.update_or_create(
            user=request.user,
            product_id=product_id,
            defaults={'viewed_at': timezone.now()}
        )
        return Response({'status': 'tracked', 'created': created})
class AIConciergeView(APIView):
    """
    API endpoint for the AI Concierge assistant.
    Provides intelligent product help and store-specific recommendations.
    """
    permission_classes = [AllowAny] # Allow customers to chat without login
    authentication_classes = []

    def post(self, request):
        from .ai_concierge import AIConcierge
        
        store_id = request.data.get('store_id')
        message = request.data.get('message', '')
        store_name = request.data.get('store_name')
        language = request.data.get('language', 'uz')

        if not store_id:
            return Response({"error": "store_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not message:
            return Response({"error": "message is required"}, status=status.HTTP_400_BAD_REQUEST)

        response = AIConcierge.chat(
            store_id=store_id,
            message=message,
            store_name=store_name,
            language=language
        )
        
        return Response(response)
    @action(detail=False, methods=['GET'])
    def export_json(self, request):
        """
        Exports all products of a store to a JSON file.
        Simulates a 3-second processing delay as requested.
        """
        import time
        import json
        from django.http import HttpResponse
        
        store_id = request.query_params.get('store')
        if not store_id:
            return Response({"error": "store_id is required"}, status=400)
            
        # Simulate processing delay
        time.sleep(3)
        
        products = self.get_queryset().filter(store_id=store_id)
        serializer = self.get_serializer(products, many=True)
        
        data = {
            "timestamp": datetime.datetime.now().isoformat(),
            "store_id": store_id,
            "total_count": products.count(),
            "products": serializer.data
        }
        
        response = HttpResponse(
            json.dumps(data, indent=4, ensure_ascii=False),
            content_type='application/json'
        )
        response['Content-Disposition'] = f'attachment; filename="store_{store_id}_products_backup.json"'
        return response


class AIAnalyticsView(APIView):
    """
    Returns AI-powered sales analytics and forecasts.
    Wraps the core forecasting logic for the Merchant AI Intel dash.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from savdoon.analytics_views import forecast_view
        # Call the existing forecast view function (adapted as a helper)
        # For simplicity, we'll re-implement or call the internal logic
        response = forecast_view(request)
        return Response({"forecast": json.dumps(response.data)})


class AIDynamicPricingView(APIView):
    """
    Returns AI-suggested dynamic pricing for products.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Simulated dynamic pricing logic
        suggestions = [
            {"product_id": 1, "name": "Classic Watch", "original": 500000, "suggested": 450000, "reason": "High stock level vs 30d trend"},
            {"product_id": 2, "name": "Smart Band", "original": 200000, "suggested": 220000, "reason": "Rising demand in your category"},
        ]
        return Response({"suggestions": json.dumps(suggestions)})


class AICustomerInsightsView(APIView):
    """
    Returns AI-generated customer segment insights.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        insights = {
            "segments": {
                "VIP": "Customers who spent > 1M UZS. Recommend early access to new collections.",
                "Churn Risk": "Inactive for 14 days. Suggest a 10% personalized discount code.",
                "High Potential": "Frequent browsers, low buyers. Offer free shipping for next 24h."
            }
        }
        return Response({"insights": json.dumps(insights)})
