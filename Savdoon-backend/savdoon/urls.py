from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from savdoon.notification_views import NotificationViewSet
from savdoon import analytics_views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('admin/', admin.site.root if hasattr(admin.site, 'root') else admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/stores/', include('stores.urls')),
    path('api/products/', include('products.urls')),
    path('api/catalog/', include('products.urls')), # Alias for frontend compatibility
    path('api/orders/', include('orders.urls')),
    path('api/delivery/', include('delivery.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/marketing/', include('marketing.urls')),
    path('api/analytics/forecast/', analytics_views.forecast_view, name='forecast'),
    path('api/ai/', include('savdoon.ai_urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
