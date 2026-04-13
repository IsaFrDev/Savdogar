from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourierViewSet, CourierSelfViewSet
from .expanded_views import (
    DeliveryZoneViewSet, DeliveryProviderViewSet, DeliveryTimeSlotViewSet,
    PickupPointViewSet, DeliveryRouteViewSet, DeliveryPricingViewSet
)

router = DefaultRouter()
router.register(r'management', CourierViewSet, basename='courier-management')
router.register(r'self', CourierSelfViewSet, basename='courier-self')

# Expanded delivery features
router.register(r'zones', DeliveryZoneViewSet, basename='delivery-zones')
router.register(r'providers', DeliveryProviderViewSet, basename='delivery-providers')
router.register(r'time-slots', DeliveryTimeSlotViewSet, basename='delivery-timeslots')
router.register(r'pickup-points', PickupPointViewSet, basename='pickup-points')
router.register(r'routes', DeliveryRouteViewSet, basename='delivery-routes')
router.register(r'pricing', DeliveryPricingViewSet, basename='delivery-pricing')

urlpatterns = [
    path('', include(router.urls)),
]
