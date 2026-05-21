"""
Affiliate Program Service
Referral tracking, commission calculation, payout processing
"""
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from .affiliate_models import (
    AffiliateProgram, Affiliate, ReferralLink, Commission, Payout
)


class AffiliateEngine:
    """Affiliate program management engine"""
    
    @staticmethod
    def generate_referral_link(affiliate_id, product_id=None):
        """Generate tracked referral link"""
        try:
            affiliate = Affiliate.objects.get(id=affiliate_id)
            
            base_url = f"https://savdoon.uz/?ref={affiliate.referral_code}"
            if product_id:
                base_url = f"https://savdoon.uz/product/{product_id}/?ref={affiliate.referral_code}"
            
            # Create referral link record
            link = ReferralLink.objects.create(
                affiliate=affiliate,
                url=base_url,
                landing_page=f'product/{product_id}' if product_id else 'homepage'
            )
            
            return {
                'url': base_url,
                'link_id': link.id
            }
            
        except Exception as e:
            print(f"Generate referral link error: {e}")
            return None
    
    @staticmethod
    def track_click(link_id, visitor_data=None):
        """Track referral link click"""
        try:
            link = ReferralLink.objects.get(id=link_id)
            
            link.clicks += 1
            link.last_clicked = timezone.now()
            
            # Track unique clicks (simplified - in production use IP/fingerprint)
            if visitor_data and visitor_data.get('is_unique'):
                link.unique_clicks += 1
            
            link.save()
            
            # Update affiliate total
            link.affiliate.total_clicks += 1
            link.affiliate.save()
            
            return True
            
        except Exception as e:
            print(f"Track click error: {e}")
            return False
    
    @staticmethod
    @transaction.atomic
    def record_conversion(order_id, affiliate_referral_code):
        """Attribute sale to affiliate and create commission"""
        try:
            from orders.models import Order
            
            affiliate = Affiliate.objects.get(referral_code=affiliate_referral_code)
            order = Order.objects.get(id=order_id)
            
            # Check cookie expiry
            cookie_duration = affiliate.program.cookie_duration_days
            if affiliate.created_at + timezone.timedelta(days=cookie_duration) < timezone.now():
                return {'success': False, 'error': 'Cookie expired'}
            
            # Calculate commission
            commission_amount = AffiliateEngine.calculate_commission(
                order_total=order.total,
                commission_rate=affiliate.program.commission_rate,
                commission_type=affiliate.program.commission_type
            )
            
            # Create commission record
            commission = Commission.objects.create(
                affiliate=affiliate,
                program=affiliate.program,
                order=order,
                amount=commission_amount,
                commission_rate=affiliate.program.commission_rate,
                order_total=order.total,
                status='pending'
            )
            
            # Update affiliate stats
            affiliate.total_conversions += 1
            affiliate.total_commission_pending += commission_amount
            affiliate.save()
            
            return {
                'success': True,
                'commission_id': commission.id,
                'amount': commission_amount
            }
            
        except Exception as e:
            print(f"Record conversion error: {e}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def calculate_commission(order_total, commission_rate, commission_type='percentage'):
        """Calculate commission amount"""
        if commission_type == 'percentage':
            return order_total * (commission_rate / 100)
        else:
            # Fixed amount
            return commission_rate
    
    @staticmethod
    @transaction.atomic
    def process_payout(affiliate_id, amount, payment_method, payment_details):
        """Process affiliate withdrawal request"""
        try:
            affiliate = Affiliate.objects.get(id=affiliate_id)
            
            # Validate minimum payout
            if amount < affiliate.program.minimum_payout:
                return {'success': False, 'error': f'Minimum payout is {affiliate.program.minimum_payout}'}
            
            # Validate available balance
            if affiliate.total_commission_pending < amount:
                return {'success': False, 'error': 'Insufficient balance'}
            
            # Create payout request
            payout = Payout.objects.create(
                affiliate=affiliate,
                program=affiliate.program,
                amount=amount,
                payment_method=payment_method,
                payment_details=payment_details,
                status='pending'
            )
            
            return {
                'success': True,
                'payout_id': payout.id,
                'amount': amount,
                'status': 'pending'
            }
            
        except Exception as e:
            print(f"Process payout error: {e}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_affiliate_stats(affiliate_id):
        """Get comprehensive affiliate statistics"""
        try:
            affiliate = Affiliate.objects.get(id=affiliate_id)
            
            commissions = Commission.objects.filter(affiliate=affiliate)
            
            return {
                'total_clicks': affiliate.total_clicks,
                'total_conversions': affiliate.total_conversions,
                'conversion_rate': affiliate.conversion_rate,
                'total_earned': affiliate.total_commission_earned,
                'pending_balance': affiliate.total_commission_pending,
                'paid_balance': affiliate.total_commission_paid,
                'total_commissions': commissions.count(),
                'commissions_by_status': {
                    'pending': commissions.filter(status='pending').count(),
                    'approved': commissions.filter(status='approved').count(),
                    'paid': commissions.filter(status='paid').count(),
                }
            }
            
        except Exception as e:
            print(f"Get affiliate stats error: {e}")
            return None
