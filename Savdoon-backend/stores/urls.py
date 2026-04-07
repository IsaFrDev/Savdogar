from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    StoreViewSet, PendingStoresView, StoreApprovalView, 
    ContractTemplateView, ExchangeRatesView,
    AcknowledgeRejectionView,
    BranchViewSet, StoreBannerViewSet, StaffRoleViewSet,
    StaffMemberViewSet, IKPUViewSet,
)
from .builder_views import StoreBuilderChatView, StoreBuilderSchemaUpdateView, StoreBuilderHtmlUpdateView
from .builder_views import StoreBuilderChatView, StoreBuilderSchemaUpdateView, StoreBuilderHtmlUpdateView, StoreBuilderFilesUpdateView

router = DefaultRouter()
router.register(r'', StoreViewSet, basename='store')

urlpatterns = [
    path('builder/chat/', StoreBuilderChatView.as_view(), name='store-builder-chat'),
    path('builder/schema/', StoreBuilderSchemaUpdateView.as_view(), name='store-builder-schema'),
    path('builder/html/', StoreBuilderHtmlUpdateView.as_view(), name='store-builder-html'),
    path('builder/files/', StoreBuilderFilesUpdateView.as_view(), name='store-builder-files'),
    path('acknowledge-rejection/', AcknowledgeRejectionView.as_view(), name='acknowledge-rejection'),
    path('pending/', PendingStoresView.as_view(), name='pending-stores'),
    path('<int:pk>/approve/', StoreApprovalView.as_view(), name='store-approval'),
    path('contract-template/', ContractTemplateView.as_view(), name='contract-template'),
    path('exchange-rates/', ExchangeRatesView.as_view(), name='exchange-rates'),
    # New feature endpoints
    path('<int:store_id>/branches/', BranchViewSet.as_view({'get': 'list', 'post': 'create'}), name='store-branches'),
    path('<int:store_id>/branches/<int:pk>/', BranchViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='store-branch-detail'),
    path('<int:store_id>/banners/', StoreBannerViewSet.as_view({'get': 'list', 'post': 'create'}), name='store-banners'),
    path('<int:store_id>/banners/<int:pk>/', StoreBannerViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='store-banner-detail'),
    path('<int:store_id>/staff-roles/', StaffRoleViewSet.as_view({'get': 'list', 'post': 'create'}), name='store-staff-roles'),
    path('<int:store_id>/staff-roles/<int:pk>/', StaffRoleViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='store-staff-role-detail'),
    path('<int:store_id>/staff/', StaffMemberViewSet.as_view({'get': 'list', 'post': 'create'}), name='store-staff'),
    path('<int:store_id>/staff/<int:pk>/', StaffMemberViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='store-staff-detail'),
    path('<int:store_id>/ikpu/', IKPUViewSet.as_view({'get': 'list', 'post': 'create'}), name='store-ikpu'),
    path('<int:store_id>/ikpu/<int:pk>/', IKPUViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='store-ikpu-detail'),
    path('', include(router.urls)),
]
