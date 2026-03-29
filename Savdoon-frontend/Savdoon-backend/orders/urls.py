from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, CreateOrderView

router = DefaultRouter()
router.register(r'', OrderViewSet, basename='order')

urlpatterns = [
    path('create/', CreateOrderView.as_view(), name='create-order'),
    path('', include(router.urls)),
]
