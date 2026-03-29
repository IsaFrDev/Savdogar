from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    StoreViewSet, PendingStoresView, StoreApprovalView, 
    ContractTemplateView, ExchangeRatesView,
    AcknowledgeRejectionView
)

router = DefaultRouter()
router.register(r'', StoreViewSet, basename='store')

urlpatterns = [
    path('acknowledge-rejection/', AcknowledgeRejectionView.as_view(), name='acknowledge-rejection'),
    path('pending/', PendingStoresView.as_view(), name='pending-stores'),
    path('<int:pk>/approve/', StoreApprovalView.as_view(), name='store-approval'),
    path('contract-template/', ContractTemplateView.as_view(), name='contract-template'),
    path('exchange-rates/', ExchangeRatesView.as_view(), name='exchange-rates'),
    path('', include(router.urls)),
]
