from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourierViewSet, CourierSelfViewSet

router = DefaultRouter()
router.register(r'management', CourierViewSet, basename='courier-management')
router.register(r'self', CourierSelfViewSet, basename='courier-self')

urlpatterns = [
    path('', include(router.urls)),
]
