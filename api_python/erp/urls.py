"""
ERP URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VendorViewSet, ERPPurchaseOrderViewSet, StockReorderRuleViewSet,
    ShipmentViewSet, WarehouseTransferViewSet,
    ExpenseCategoryViewSet, ExpenseViewSet,
    CustomerDebtViewSet, DebtTransactionViewSet
)

router = DefaultRouter()
router.register(r'vendors', VendorViewSet, basename='erp-vendor')
router.register(r'purchase-orders', ERPPurchaseOrderViewSet, basename='erp-purchase-order')
router.register(r'reorder-rules', StockReorderRuleViewSet, basename='erp-reorder-rule')
router.register(r'shipments', ShipmentViewSet, basename='erp-shipment')
router.register(r'warehouse-transfers', WarehouseTransferViewSet, basename='erp-warehouse-transfer')
router.register(r'expense-categories', ExpenseCategoryViewSet, basename='erp-expense-category')
router.register(r'expenses', ExpenseViewSet, basename='erp-expense')
router.register(r'customer-debts', CustomerDebtViewSet, basename='erp-customer-debt')
router.register(r'debt-transactions', DebtTransactionViewSet, basename='erp-debt-transaction')

urlpatterns = [
    path('', include(router.urls)),
]
