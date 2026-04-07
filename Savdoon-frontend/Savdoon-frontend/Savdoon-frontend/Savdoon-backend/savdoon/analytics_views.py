from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum
from django.db.models.functions import TruncDate
from datetime import timedelta
from decimal import Decimal


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def forecast_view(request):
    """
    Real sales forecast endpoint.
    Uses actual order data to compute historical sales,
    trend analysis, and a simple linear projection for 7 days.
    """
    from orders.models import Order

    store_id = request.query_params.get('store_id')
    today = timezone.now().date()
    period_start = today - timedelta(days=30)

    # ── 1. Fetch real daily sales (last 30 days) ──
    qs = Order.objects.filter(
        created_at__date__gte=period_start,
        created_at__date__lte=today,
        status__in=['confirmed', 'processing', 'completed', 'out_for_delivery'],
    )
    if store_id:
        qs = qs.filter(store_id=store_id)

    daily_sales = (
        qs.annotate(day=TruncDate('created_at'))
          .values('day')
          .annotate(sales=Sum('total'))
          .order_by('day')
    )

    # Build a dict for quick lookup, fill missing days with 0
    sales_map = {row['day']: float(row['sales'] or 0) for row in daily_sales}
    historical = []
    for i in range(30, 0, -1):
        d = today - timedelta(days=i)
        historical.append({
            'date': d.strftime('%Y-%m-%d'),
            'sales': sales_map.get(d, 0),
        })

    # ── 2. Compute aggregates ──
    total_period = sum(h['sales'] for h in historical)
    days_with_sales = len([h for h in historical if h['sales'] > 0]) or 1
    avg_daily = total_period / days_with_sales if days_with_sales else 0

    # ── 3. Trend analysis (compare last 7 days vs previous 7 days) ──
    recent_7 = sum(h['sales'] for h in historical[-7:])
    prev_7 = sum(h['sales'] for h in historical[-14:-7])

    if prev_7 > 0:
        change_pct = round(((recent_7 - prev_7) / prev_7) * 100, 1)
    elif recent_7 > 0:
        change_pct = 100.0
    else:
        change_pct = 0.0

    if change_pct > 5:
        trend = 'up'
    elif change_pct < -5:
        trend = 'down'
    else:
        trend = 'stable'

    # ── 4. Simple linear regression forecast (7 days) ──
    # Use last 14 days to project next 7
    recent_data = [h['sales'] for h in historical[-14:]]
    n = len(recent_data)

    if n >= 2 and sum(recent_data) > 0:
        # Simple least-squares linear regression
        x_mean = (n - 1) / 2.0
        y_mean = sum(recent_data) / n
        numerator = sum((i - x_mean) * (y - y_mean) for i, y in enumerate(recent_data))
        denominator = sum((i - x_mean) ** 2 for i in range(n))
        slope = numerator / denominator if denominator != 0 else 0
        intercept = y_mean - slope * x_mean

        forecast = []
        for i in range(1, 8):
            projected = max(0, intercept + slope * (n - 1 + i))
            forecast.append({
                'date': (today + timedelta(days=i)).strftime('%Y-%m-%d'),
                'projected_sales': round(projected, 2),
            })
    else:
        # No data — flat forecast based on average
        forecast = []
        for i in range(1, 8):
            forecast.append({
                'date': (today + timedelta(days=i)).strftime('%Y-%m-%d'),
                'projected_sales': round(avg_daily, 2),
            })

    # ── 5. Generate AI insight text ──
    forecast_total = sum(f['projected_sales'] for f in forecast)

    if trend == 'up':
        insight = (
            f"So'nggi 7 kunlik savdo {change_pct}% ga o'sdi. "
            f"Keyingi hafta uchun bashorat: ~{int(forecast_total):,} UZS. "
            "O'sish davom etishi kutilmoqda — mahsulot zaxirasini nazorat qiling."
        )
    elif trend == 'down':
        insight = (
            f"So'nggi 7 kunda savdo {abs(change_pct)}% ga tushdi. "
            f"Keyingi hafta uchun bashorat: ~{int(forecast_total):,} UZS. "
            "Chegirma aksiyalari yoki reklama o'tkazishni ko'rib chiqing."
        )
    else:
        insight = (
            f"Savdolar barqaror holatda ({change_pct:+}%). "
            f"Keyingi hafta uchun bashorat: ~{int(forecast_total):,} UZS. "
            "Mijozlarni jalb qilish uchun yangi mahsulotlar qo'shing."
        )

    data = {
        'trend': trend,
        'change_pct': change_pct,
        'avg_daily': round(avg_daily, 2),
        'total_period': round(total_period, 2),
        'historical': historical[-14:],   # Show last 14 days on chart
        'forecast': forecast,
        'insight': insight,
    }

    return Response(data)
