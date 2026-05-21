from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# Payment
router.register(r'payment-gateways', views.PaymentGatewayViewSet)
router.register(r'payment-transactions', views.PaymentTransactionViewSet)

# Marketplaces
router.register(r'marketplace-integrations', views.MarketplaceIntegrationViewSet)
router.register(r'marketplace-products', views.MarketplaceProductViewSet)
router.register(r'marketplace-orders', views.MarketplaceOrderViewSet)

# Delivery
router.register(r'delivery-integrations', views.DeliveryIntegrationViewSet)
router.register(r'delivery-requests', views.DeliveryRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # Payme callback endpoint
    path('payme/callback/', views.payme_callback, name='payme-callback'),
    
    # Click callback endpoint
    path('click/callback/', views.click_callback, name='click-callback'),
    
    # Paynet callback endpoint
    path('paynet/callback/', views.paynet_callback, name='paynet-callback'),

    # External Partner (Travel Agency Startup) endpoints
    path('partner/store/', views.partner_create_store, name='partner-create-store'),
    path('partner/sale/', views.partner_record_sale, name='partner-record-sale'),
]
