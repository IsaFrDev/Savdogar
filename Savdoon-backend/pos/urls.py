"""
POS URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CashRegisterViewSet, POSSessionViewSet, POSTransactionViewSet,
    POSReceiptViewSet, BarcodeViewSet
)

router = DefaultRouter()
router.register(r'registers', CashRegisterViewSet, basename='pos-register')
router.register(r'sessions', POSSessionViewSet, basename='pos-session')
router.register(r'transactions', POSTransactionViewSet, basename='pos-transaction')
router.register(r'receipts', POSReceiptViewSet, basename='pos-receipt')
router.register(r'barcodes', BarcodeViewSet, basename='pos-barcode')

urlpatterns = [
    path('', include(router.urls)),
]
