"""
Delivery Expansion API Views
"""
from django.utils import timezone
from django.db import models
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .expanded_models import (
    DeliveryZone, DeliveryProvider, DeliveryTimeSlot,
    PickupPoint, DeliveryRoute, DeliveryPricing
)
from .expanded_serializers import (
    DeliveryZoneSerializer, DeliveryProviderSerializer, DeliveryTimeSlotSerializer,
    PickupPointSerializer, DeliveryRouteSerializer, DeliveryPricingSerializer
)


class StoreSubResourceMixin:
    """Mixin to filter by store"""
    def get_queryset(self):
        queryset = super().get_queryset()
        store_id = self.kwargs.get('store_id')
        if store_id:
            return queryset.filter(store_id=store_id)
        return queryset
    
    def perform_create(self, serializer):
        store_id = self.kwargs.get('store_id')
        serializer.save(store_id=store_id)


class DeliveryZoneViewSet(StoreSubResourceMixin, viewsets.ModelViewSet):
    serializer_class = DeliveryZoneSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return DeliveryZone.objects.filter(is_active=True)
    
    @action(detail=True, methods=['get'])
    def calculate_price(self, request, pk=None):
        """Calculate delivery price for a zone"""
        zone = self.get_object()
        distance = request.query_params.get('distance_km', 0)
        
        price = zone.base_price + (float(distance) * float(zone.price_per_km))
        return Response({
            'zone': zone.name,
            'base_price': zone.base_price,
            'distance_km': distance,
            'price_per_km': zone.price_per_km,
            'total_price': price
        })


class DeliveryProviderViewSet(StoreSubResourceMixin, viewsets.ModelViewSet):
    serializer_class = DeliveryProviderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return DeliveryProvider.objects.filter(is_active=True)


class DeliveryTimeSlotViewSet(StoreSubResourceMixin, viewsets.ModelViewSet):
    serializer_class = DeliveryTimeSlotSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return DeliveryTimeSlot.objects.filter(is_available=True)
    
    @action(detail=False, methods=['get'])
    def available_slots(self, request):
        """Get available time slots for a specific day"""
        store_id = request.query_params.get('store_id')
        day = request.query_params.get('day', 0)
        
        slots = DeliveryTimeSlot.objects.filter(
            store_id=store_id,
            day_of_week=day,
            is_available=True,
            current_orders__lt=models.F('max_orders')
        )
        
        return Response(DeliveryTimeSlotSerializer(slots, many=True).data)


class PickupPointViewSet(StoreSubResourceMixin, viewsets.ModelViewSet):
    serializer_class = PickupPointSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        return PickupPoint.objects.filter(is_active=True)
    
    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """Find nearby pickup points"""
        lat = request.query_params.get('latitude')
        lng = request.query_params.get('longitude')
        radius_km = request.query_params.get('radius', 10)
        
        if not lat or not lng:
            return Response({'error': 'Latitude and longitude required'}, status=400)
        
        # Simple distance calculation (for production, use PostGIS)
        from django.db.models import Q
        from decimal import Decimal
        
        lat_decimal = Decimal(lat)
        lng_decimal = Decimal(lng)
        radius_decimal = Decimal(str(radius_km)) / 111  # Approximate conversion
        
        nearby_points = PickupPoint.objects.filter(
            is_active=True,
            latitude__gte=lat_decimal - radius_decimal,
            latitude__lte=lat_decimal + radius_decimal,
            longitude__gte=lng_decimal - radius_decimal,
            longitude__lte=lng_decimal + radius_decimal
        )
        
        return Response(PickupPointSerializer(nearby_points, many=True).data)


class DeliveryRouteViewSet(viewsets.ModelViewSet):
    serializer_class = DeliveryRouteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'courier_profile'):
            return DeliveryRoute.objects.filter(courier=user.courier_profile)
        return DeliveryRoute.objects.none()
    
    @action(detail=True, methods=['post'])
    def start_route(self, request, pk=None):
        """Start a delivery route"""
        route = self.get_object()
        route.status = 'in_progress'
        route.started_at = timezone.now()
        route.save()
        return Response({'status': 'route started'})
    
    @action(detail=True, methods=['post'])
    def complete_delivery(self, request, pk=None):
        """Mark a delivery as complete"""
        route = self.get_object()
        route.completed_orders += 1
        
        if route.completed_orders >= route.total_orders:
            route.status = 'completed'
            route.completed_at = timezone.now()
        
        route.save()
        return Response({
            'completed_orders': route.completed_orders,
            'total_orders': route.total_orders,
            'route_status': route.status
        })


class DeliveryPricingViewSet(StoreSubResourceMixin, viewsets.ModelViewSet):
    serializer_class = DeliveryPricingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return DeliveryPricing.objects.filter(is_active=True)
    
    @action(detail=True, methods=['post'])
    def calculate(self, request, pk=None):
        """Calculate delivery price"""
        pricing = self.get_object()
        
        distance_km = request.data.get('distance_km')
        weight_kg = request.data.get('weight_kg')
        order_value = request.data.get('order_value')
        
        price = pricing.calculate_price(distance_km, weight_kg, order_value)
        
        return Response({
            'pricing_method': pricing.pricing_method,
            'base_price': pricing.base_price,
            'calculated_price': price,
            'free_delivery_threshold': pricing.free_delivery_min_order
        })
