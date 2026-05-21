from rest_framework import viewsets, permissions, status, decorators
from rest_framework.response import Response
from .models import Courier
from .serializers import CourierSerializer, CourierLocationUpdateSerializer


class CourierViewSet(viewsets.ModelViewSet):
    """ViewSet for managing couriers (Store Admin Access)."""
    queryset = Courier.objects.all()
    serializer_class = CourierSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or getattr(user, 'role', '') == 'superadmin':
            return Courier.objects.all()
        return Courier.objects.filter(store__owner=user)

    def perform_create(self, serializer):
        user = self.request.user
        store = user.stores.first() if hasattr(user, 'stores') else None
        serializer.save(store=store)


class CourierSelfViewSet(viewsets.ViewSet):
    """Endpoints for couriers to manage their own status and location."""
    permission_classes = [permissions.IsAuthenticated]

    @decorators.action(detail=False, methods=['get'])
    def profile(self, request):
        try:
            courier = request.user.courier_profile
            return Response(CourierSerializer(courier).data)
        except Courier.DoesNotExist:
            return Response({'error': 'Courier not found'}, status=status.HTTP_404_NOT_FOUND)

    @decorators.action(detail=False, methods=['post'])
    def update_status(self, request):
        try:
            courier = request.user.courier_profile
            new_status = request.data.get('status')
            if new_status in [c[0] for c in Courier.STATUS_CHOICES]:
                courier.status = new_status
                courier.save()
                return Response({'status': courier.status})
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        except Courier.DoesNotExist:
            return Response({'error': 'NotFound'}, status=status.HTTP_404_NOT_FOUND)

    @decorators.action(detail=False, methods=['post'])
    def update_location(self, request):
        try:
            courier = request.user.courier_profile
            serializer = CourierLocationUpdateSerializer(courier, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Courier.DoesNotExist:
            return Response({'error': 'NotFound'}, status=status.HTTP_404_NOT_FOUND)
