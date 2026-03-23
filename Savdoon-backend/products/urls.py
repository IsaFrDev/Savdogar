from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, ProductViewSet, ReviewViewSet,
    AIDescriptionView, AIMarketingView, AIGenerateSEOTagsView,
    PublicSearchView, WishlistView, GlobalAiSearchView,
    DiscountViewSet, ProductAttributeViewSet, ProductVariantViewSet,
    RecentlyViewedView, AIConciergeView, AITranslateView
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'discounts', DiscountViewSet, basename='discount')
router.register(r'attributes', ProductAttributeViewSet, basename='attribute')
router.register(r'variants', ProductVariantViewSet, basename='variant')
router.register(r'', ProductViewSet, basename='product')

urlpatterns = [
    path('ai-description/', AIDescriptionView.as_view(), name='ai-description'),
    path('ai-marketing/', AIMarketingView.as_view(), name='ai-marketing'),
    path('ai-seo/', AIGenerateSEOTagsView.as_view(), name='ai-seo'),
    path('public-search/', PublicSearchView.as_view(), name='public-search'),
    path('wishlist/', WishlistView.as_view(), name='wishlist'),
    path('recently-viewed/', RecentlyViewedView.as_view(), name='recently-viewed'),
    path('track-view/', RecentlyViewedView.as_view(), name='track-view'),
    path('global-ai-search/', GlobalAiSearchView.as_view(), name='global-ai-search'),
    path('ai/concierge/', AIConciergeView.as_view(), name='ai-concierge'),
    path('ai/translate/', AITranslateView.as_view(), name='ai-translate'),
    
    # Public & Search Aliases
    path('public/', ProductViewSet.as_view({'get': 'list'}), name='public-products'),
    path('public-categories/', CategoryViewSet.as_view({'get': 'list'}), name='public-categories'),
    path('search/', PublicSearchView.as_view(), name='product-search-alias'),
    
    path('', include(router.urls)),
]
