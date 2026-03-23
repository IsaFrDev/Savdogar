from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Reel, GroupBuy, FlashSale
from .serializers import ReelSerializer, GroupBuySerializer, FlashSaleSerializer
from products.models import Product
from products.ai_service import ai_service


class ReelViewSet(viewsets.ModelViewSet):
    queryset = Reel.objects.all().order_by('-created_at')
    serializer_class = ReelSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        store_id = self.request.query_params.get('store')
        if store_id:
            return self.queryset.filter(store_id=store_id)
        return self.queryset


class GroupBuyViewSet(viewsets.ModelViewSet):
    queryset = GroupBuy.objects.filter(is_active=True)
    serializer_class = GroupBuySerializer
    permission_classes = [permissions.AllowAny]


class FlashSaleViewSet(viewsets.ModelViewSet):
    queryset = FlashSale.objects.filter(is_active=True)
    serializer_class = FlashSaleSerializer
    permission_classes = [permissions.AllowAny]


class AISMMGeneratorView(APIView):
    """View to generate SMM content using AI."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        platform = request.data.get('platform', 'instagram')
        language = request.data.get('language', 'uz')

        if not product_id:
            return Response({"error": "Product ID required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(id=product_id)
            # Use AIService correctly
            content = ai_service.generate_marketing_post(product.name, product.description, platform, language)
            return Response({"content": content})
        except Product.DoesNotExist:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
