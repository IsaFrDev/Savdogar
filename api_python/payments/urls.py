from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, GenericWebhookView

router = DefaultRouter()
router.register(r'', PaymentViewSet, basename='payment')

urlpatterns = [
    path('webhook/<str:provider_name>/', GenericWebhookView.as_view(), name='payment-webhook'),
    path('', include(router.urls)),
]
