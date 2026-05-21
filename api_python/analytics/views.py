"""
Advanced Analytics Dashboard Views
Comprehensive business analytics with real-time metrics.

Field name reference (from actual models):
  Order:     total, status in ['completed', 'cancelled', ...]
  OrderItem: product_price, subtotal, quantity, product_name
  Product:   active (not is_active), stock (not stock_quantity), price
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from datetime import datetime, timedelta
from django.db.models import Sum, Count, Avg, Q, F
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth
from django.utils import timezone


class AnalyticsDashboardView(APIView):
    """Main analytics dashboard with all key metrics"""
    permission_classes = [IsAuthenticated]

    def get(self, request, store_id):
        try:
            from orders.models import Order, OrderItem
            from products.models import Product

            days = int(request.query_params.get('days', 30))
            start_date = timezone.now() - timedelta(days=days)

            # ── Base queryset ─────────────────────────────────────────────────
            orders = Order.objects.filter(
                store_id=store_id,
                created_at__gte=start_date,
                status__in=['completed', 'processing', 'out_for_delivery'],
            )

            # ── Key metrics ───────────────────────────────────────────────────
            total_revenue = orders.aggregate(s=Sum('total'))['s'] or 0
            total_orders = orders.count()
            total_customers = orders.exclude(customer__isnull=True).values('customer_id').distinct().count()
            avg_order_value = (total_revenue / total_orders) if total_orders > 0 else 0

            # ── Period-over-period comparison ─────────────────────────────────
            prev_start = start_date - timedelta(days=days)
            prev_orders = Order.objects.filter(
                store_id=store_id,
                created_at__gte=prev_start,
                created_at__lt=start_date,
                status__in=['completed', 'processing', 'out_for_delivery'],
            )
            prev_revenue = prev_orders.aggregate(s=Sum('total'))['s'] or 0
            prev_orders_count = prev_orders.count()

            revenue_growth = (
                ((float(total_revenue) - float(prev_revenue)) / float(prev_revenue) * 100)
                if prev_revenue > 0 else 0
            )
            orders_growth = (
                ((total_orders - prev_orders_count) / prev_orders_count * 100)
                if prev_orders_count > 0 else 0
            )

            # ── Daily revenue chart ───────────────────────────────────────────
            daily_revenue = list(
                orders.annotate(date=TruncDay('created_at'))
                .values('date')
                .annotate(revenue=Sum('total'), orders=Count('id'))
                .order_by('date')
                .values('date', 'revenue', 'orders')
            )
            # Serialize dates
            for row in daily_revenue:
                row['date'] = row['date'].isoformat() if row['date'] else None
                row['revenue'] = float(row['revenue'] or 0)

            # ── Weekly trend ──────────────────────────────────────────────────
            weekly_trend = list(
                orders.annotate(week=TruncWeek('created_at'))
                .values('week')
                .annotate(revenue=Sum('total'), orders=Count('id'))
                .order_by('week')
                .values('week', 'revenue', 'orders')
            )
            for row in weekly_trend:
                row['week'] = row['week'].isoformat() if row['week'] else None
                row['revenue'] = float(row['revenue'] or 0)

            # ── Hourly distribution ───────────────────────────────────────────
            # Use Python-level aggregation to avoid DB-specific EXTRACT syntax
            from collections import defaultdict
            hourly_counts: dict = defaultdict(int)
            for created_at in orders.values_list('created_at', flat=True):
                hourly_counts[created_at.hour] += 1
            hourly_distribution = [
                {'hour': h, 'count': hourly_counts.get(h, 0)} for h in range(24)
            ]

            # ── Top products ──────────────────────────────────────────────────
            top_products = list(
                OrderItem.objects.filter(
                    order__store_id=store_id,
                    order__created_at__gte=start_date,
                    order__status__in=['completed', 'processing', 'out_for_delivery'],
                )
                .values('product_id', 'product_name')
                .annotate(
                    total_sold=Sum('quantity'),
                    total_revenue=Sum('subtotal'),
                    order_count=Count('id'),
                )
                .order_by('-total_revenue')[:10]
            )
            for row in top_products:
                row['total_revenue'] = float(row['total_revenue'] or 0)

            # ── Category performance ──────────────────────────────────────────
            category_performance = list(
                OrderItem.objects.filter(
                    order__store_id=store_id,
                    order__created_at__gte=start_date,
                    order__status__in=['completed', 'processing', 'out_for_delivery'],
                    product__category__isnull=False,
                )
                .values('product__category__name')
                .annotate(
                    total_revenue=Sum('subtotal'),
                    total_sold=Sum('quantity'),
                    product_count=Count('product_id', distinct=True),
                )
                .order_by('-total_revenue')
            )
            for row in category_performance:
                row['total_revenue'] = float(row['total_revenue'] or 0)

            # ── Customer metrics ──────────────────────────────────────────────
            new_customers = (
                orders.filter(customer__date_joined__gte=start_date)
                .exclude(customer__isnull=True)
                .values('customer_id')
                .distinct()
                .count()
            )
            returning_customers = max(0, total_customers - new_customers)

            # ── Order status breakdown ────────────────────────────────────────
            order_status_breakdown = list(
                Order.objects.filter(store_id=store_id, created_at__gte=start_date)
                .values('status')
                .annotate(count=Count('id'))
                .order_by('-count')
            )

            # ── Payment method breakdown ──────────────────────────────────────
            payment_breakdown = list(
                orders.values('payment_method')
                .annotate(count=Count('id'), total=Sum('total'))
                .order_by('-count')
            )
            for row in payment_breakdown:
                row['total'] = float(row['total'] or 0)

            # ── Inventory metrics ─────────────────────────────────────────────
            total_products = Product.objects.filter(store_id=store_id, active=True).count()
            out_of_stock = Product.objects.filter(store_id=store_id, active=True, stock=0).count()
            low_stock = Product.objects.filter(
                store_id=store_id, active=True, stock__gt=0, stock__lte=F('low_stock_threshold')
            ).count()

            return Response({
                'success': True,
                'metrics': {
                    'total_revenue': float(total_revenue),
                    'total_orders': total_orders,
                    'total_customers': total_customers,
                    'avg_order_value': float(avg_order_value),
                    'revenue_growth': round(revenue_growth, 2),
                    'orders_growth': round(orders_growth, 2),
                    'new_customers': new_customers,
                    'returning_customers': returning_customers,
                    'total_products': total_products,
                    'out_of_stock': out_of_stock,
                    'low_stock': low_stock,
                },
                'charts': {
                    'daily_revenue': daily_revenue,
                    'weekly_trend': weekly_trend,
                    'hourly_distribution': hourly_distribution,
                },
                'breakdowns': {
                    'top_products': top_products,
                    'category_performance': category_performance,
                    'order_status': order_status_breakdown,
                    'payment_methods': payment_breakdown,
                },
                'period': {
                    'days': days,
                    'start_date': start_date.isoformat(),
                    'end_date': timezone.now().isoformat(),
                },
            })

        except Exception as e:
            import traceback
            return Response(
                {'success': False, 'error': str(e), 'detail': traceback.format_exc()},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class RevenueAnalyticsView(APIView):
    """Detailed revenue analytics"""
    permission_classes = [IsAuthenticated]

    def get(self, request, store_id):
        try:
            from orders.models import Order

            days = int(request.query_params.get('days', 30))
            start_date = timezone.now() - timedelta(days=days)

            orders = Order.objects.filter(
                store_id=store_id,
                created_at__gte=start_date,
                status__in=['completed', 'processing', 'out_for_delivery'],
            )

            def _serialize(qs, date_field):
                rows = list(qs)
                for row in rows:
                    if row.get(date_field):
                        row[date_field] = row[date_field].isoformat()
                    row['revenue'] = float(row.get('revenue') or 0)
                    if 'avg_order_value' in row:
                        row['avg_order_value'] = float(row['avg_order_value'] or 0)
                return rows

            daily = _serialize(
                orders.annotate(date=TruncDay('created_at'))
                .values('date')
                .annotate(revenue=Sum('total'), order_count=Count('id'), avg_order_value=Avg('total'))
                .order_by('date'),
                'date',
            )
            weekly = _serialize(
                orders.annotate(week=TruncWeek('created_at'))
                .values('week')
                .annotate(revenue=Sum('total'), order_count=Count('id'))
                .order_by('week'),
                'week',
            )
            monthly = _serialize(
                orders.annotate(month=TruncMonth('created_at'))
                .values('month')
                .annotate(revenue=Sum('total'), order_count=Count('id'))
                .order_by('month'),
                'month',
            )

            return Response({'success': True, 'daily': daily, 'weekly': weekly, 'monthly': monthly})

        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CustomerAnalyticsView(APIView):
    """Customer behavior analytics"""
    permission_classes = [IsAuthenticated]

    def get(self, request, store_id):
        try:
            from orders.models import Order

            days = int(request.query_params.get('days', 90))
            start_date = timezone.now() - timedelta(days=days)

            orders = Order.objects.filter(
                store_id=store_id,
                created_at__gte=start_date,
                status__in=['completed', 'processing', 'out_for_delivery'],
            ).exclude(customer__isnull=True)

            customer_ltv = list(
                orders.values('customer_id')
                .annotate(
                    total_spent=Sum('total'),
                    order_count=Count('id'),
                    avg_order_value=Avg('total'),
                )
                .order_by('-total_spent')
            )
            for row in customer_ltv:
                row['total_spent'] = float(row['total_spent'] or 0)
                row['avg_order_value'] = float(row['avg_order_value'] or 0)

            frequency_distribution = list(
                orders.values('customer_id')
                .annotate(order_count=Count('id'))
                .values('order_count')
                .annotate(customer_count=Count('customer_id'))
                .order_by('order_count')
            )

            return Response({
                'success': True,
                'ltv_distribution': customer_ltv,
                'frequency': frequency_distribution,
            })

        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProductPerformanceView(APIView):
    """Product performance analytics"""
    permission_classes = [IsAuthenticated]

    def get(self, request, store_id):
        try:
            from orders.models import OrderItem
            from products.models import Product

            days = int(request.query_params.get('days', 30))
            start_date = timezone.now() - timedelta(days=days)

            product_sales = (
                OrderItem.objects.filter(
                    order__store_id=store_id,
                    order__created_at__gte=start_date,
                    order__status__in=['completed', 'processing', 'out_for_delivery'],
                )
                .values('product_id', 'product_name')
                .annotate(
                    total_sold=Sum('quantity'),
                    total_revenue=Sum('subtotal'),
                    order_count=Count('id'),
                    avg_price=Avg('product_price'),
                )
                .order_by('-total_revenue')
            )

            best_sellers = list(product_sales[:20])
            for row in best_sellers:
                row['total_revenue'] = float(row['total_revenue'] or 0)
                row['avg_price'] = float(row['avg_price'] or 0)

            sold_product_ids = product_sales.values_list('product_id', flat=True)
            worst_sellers = list(
                Product.objects.filter(store_id=store_id, active=True)
                .exclude(id__in=sold_product_ids)
                .values('id', 'name', 'price', 'stock')[:20]
            )
            for row in worst_sellers:
                row['price'] = float(row['price'] or 0)

            all_sales = list(product_sales)
            for row in all_sales:
                row['total_revenue'] = float(row['total_revenue'] or 0)
                row['avg_price'] = float(row['avg_price'] or 0)

            return Response({
                'success': True,
                'best_sellers': best_sellers,
                'worst_sellers': worst_sellers,
                'all_product_sales': all_sales,
            })

        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
