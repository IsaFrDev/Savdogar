from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, ProductViewSet, ReviewViewSet,
    AIDescriptionView, AIMarketingView, AIGenerateSEOTagsView,
    PublicSearchView, WishlistView, GlobalAiSearchView,
    DiscountViewSet, ProductAttributeViewSet, ProductVariantViewSet,
    RecentlyViewedView, AIConciergeView, AITranslateView,
    AIAnalyticsView, AIDynamicPricingView, AICustomerInsightsView
)
from .ai_api_views import (
    AIForecastView, AIDemandPredictionView,
    AIPricingSuggestionsView, AIOptimalDiscountView,
    AIRecommendationsView, AIPersonalizedRecommendationsView,
    AITrendingProductsView,
    AIInventoryHealthView, AIRestockPredictionView,
    AIDeadStockView, AISafetyStockView,
    AICustomerSegmentationView, AIChurnPredictionView,
    AICustomerLifetimeValueView, AICustomerInsightsView as AICustomerInsightsNewView,
    AIReviewSentimentView, AIReviewSummaryView,
    AIBundleSuggestionsView, AICuratedCollectionView
)
from .pricing_views import (
    PricingRuleViewSet, CompetitorPriceViewSet,
    PriceHistoryViewSet, AIRecommendationViewSet
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'discounts', DiscountViewSet, basename='discount')
router.register(r'attributes', ProductAttributeViewSet, basename='attribute')
router.register(r'variants', ProductVariantViewSet, basename='variant')
router.register(r'pricing-rules', PricingRuleViewSet, basename='pricing-rule')
router.register(r'competitor-prices', CompetitorPriceViewSet, basename='competitor-price')
router.register(r'price-history', PriceHistoryViewSet, basename='price-history')
router.register(r'ai-pricing', AIRecommendationViewSet, basename='ai-pricing')
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
    path('ai/analytics/', AIAnalyticsView.as_view(), name='ai-analytics'),
    path('ai/dynamic-pricing/', AIDynamicPricingView.as_view(), name='ai-dynamic-pricing'),
    path('ai/customer-insights/', AICustomerInsightsView.as_view(), name='ai-customer-insights'),
    
    # NEW AI Features (Phase A2)
    # Forecasting
    path('ai/forecast/<int:store_id>/', AIForecastView.as_view(), name='ai-forecast'),
    path('ai/demand-prediction/<int:product_id>/', AIDemandPredictionView.as_view(), name='ai-demand-prediction'),
    
    # Pricing
    path('ai/pricing-suggestions/<int:store_id>/', AIPricingSuggestionsView.as_view(), name='ai-pricing-suggestions'),
    path('ai/optimal-discount/<int:product_id>/', AIOptimalDiscountView.as_view(), name='ai-optimal-discount'),
    
    # Recommendations
    path('ai/recommendations/<int:product_id>/', AIRecommendationsView.as_view(), name='ai-recommendations'),
    path('ai/personalized/<int:store_id>/', AIPersonalizedRecommendationsView.as_view(), name='ai-personalized'),
    path('ai/trending/<int:store_id>/', AITrendingProductsView.as_view(), name='ai-trending'),
    
    # Inventory
    path('ai/inventory-health/<int:store_id>/', AIInventoryHealthView.as_view(), name='ai-inventory-health'),
    path('ai/restock-prediction/<int:product_id>/', AIRestockPredictionView.as_view(), name='ai-restock-prediction'),
    path('ai/dead-stock/<int:store_id>/', AIDeadStockView.as_view(), name='ai-dead-stock'),
    path('ai/safety-stock/<int:product_id>/', AISafetyStockView.as_view(), name='ai-safety-stock'),
    
    # Customer Analytics
    path('ai/customer-segmentation/<int:store_id>/', AICustomerSegmentationView.as_view(), name='ai-customer-segmentation'),
    path('ai/churn-prediction/<int:customer_id>/', AIChurnPredictionView.as_view(), name='ai-churn-prediction'),
    path('ai/customer-ltv/<int:customer_id>/', AICustomerLifetimeValueView.as_view(), name='ai-customer-ltv'),
    path('ai/customer-insights-v2/<int:store_id>/', AICustomerInsightsNewView.as_view(), name='ai-customer-insights-v2'),
    
    # Reviews
    path('ai/review-sentiment/store/<int:store_id>/', AIReviewSentimentView.as_view(), name='ai-review-sentiment-store'),
    path('ai/review-sentiment/product/<int:product_id>/', AIReviewSentimentView.as_view(), name='ai-review-sentiment-product'),
    path('ai/review-summary/<int:store_id>/', AIReviewSummaryView.as_view(), name='ai-review-summary'),
    
    # Collections & Bundles
    path('ai/bundles/', AIBundleSuggestionsView.as_view(), name='ai-bundles'),
    path('ai/curated-collection/<int:store_id>/', AICuratedCollectionView.as_view(), name='ai-curated-collection'),
    
    # Public & Search Aliases
    path('public/', ProductViewSet.as_view({'get': 'list'}), name='public-products'),
    path('public-categories/', CategoryViewSet.as_view({'get': 'list'}), name='public-categories'),
    path('search/', PublicSearchView.as_view(), name='product-search-alias'),
    
    path('', include(router.urls)),
]
