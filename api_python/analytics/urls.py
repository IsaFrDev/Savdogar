from django.urls import path
from .views import (
    AnalyticsDashboardView,
    RevenueAnalyticsView,
    CustomerAnalyticsView,
    ProductPerformanceView
)

urlpatterns = [
    path('dashboard/<int:store_id>/', AnalyticsDashboardView.as_view(), name='analytics-dashboard'),
    path('revenue/<int:store_id>/', RevenueAnalyticsView.as_view(), name='analytics-revenue'),
    path('customers/<int:store_id>/', CustomerAnalyticsView.as_view(), name='analytics-customers'),
    path('products/<int:store_id>/', ProductPerformanceView.as_view(), name='analytics-products'),
]
