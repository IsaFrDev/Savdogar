from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReelViewSet, GroupBuyViewSet, FlashSaleViewSet, AISMMGeneratorView

router = DefaultRouter()
router.register(r'reels', ReelViewSet)
router.register(r'group-buy', GroupBuyViewSet)
router.register(r'flash-sale', FlashSaleViewSet)

urlpatterns = [
    path('generate-smm/', AISMMGeneratorView.as_view(), name='ai-smm'),
    path('', include(router.urls)),
]
