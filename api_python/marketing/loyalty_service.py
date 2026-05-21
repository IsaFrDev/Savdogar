"""
Loyalty Points System Service
"""
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from .loyalty_models import (
    LoyaltyProgram, CustomerPoints, PointsTransaction, 
    RewardTier, Reward
)


class LoyaltyEngine:
    """Loyalty points management engine"""
    
    @staticmethod
    def calculate_points(order_total, customer_tier=None):
        """Calculate points earned from purchase"""
        if not order_total or order_total <= 0:
            return 0
        
        # Get base points (1 point per dollar by default)
        base_points = int(order_total)
        
        # Apply tier multiplier
        if customer_tier and customer_tier.points_multiplier:
            base_points = int(base_points * customer_tier.points_multiplier)
        
        return base_points
    
    @staticmethod
    @transaction.atomic
    def earn_points(customer_id, store_id, amount, reason='purchase', order=None):
        """Award points to customer"""
        try:
            from accounts.models import User
            from stores.models import Store
            
            customer = User.objects.get(id=customer_id)
            store = Store.objects.get(id=store_id)
            
            # Get or create loyalty account
            program = store.loyalty_program
            customer_points, created = CustomerPoints.objects.get_or_create(
                customer=customer,
                store=store,
                program=program,
                defaults={'points_balance': 0}
            )
            
            # Calculate points
            tier = customer_points.current_tier
            points = LoyaltyEngine.calculate_points(amount, tier)
            
            # Bonus for birthday
            if reason == 'birthday' and program.birthday_multiplier:
                points = int(points * program.birthday_multiplier)
            
            # Update balance
            customer_points.points_balance += points
            customer_points.points_earned_lifetime += points
            customer_points.save()
            
            # Check tier upgrade
            LoyaltyEngine.check_tier_upgrade(customer_points)
            
            # Log transaction
            transaction_record = PointsTransaction.objects.create(
                customer=customer,
                store=store,
                customer_points=customer_points,
                transaction_type='earn',
                reason=reason,
                points=points,
                balance_after=customer_points.points_balance,
                order=order
            )
            
            return {
                'points_earned': points,
                'new_balance': customer_points.points_balance,
                'tier': customer_points.current_tier.display_name if customer_points.current_tier else None
            }
            
        except Exception as e:
            print(f"Loyalty earn points error: {e}")
            return None
    
    @staticmethod
    @transaction.atomic
    def redeem_points(customer_id, points, reward_id):
        """Burn points for reward"""
        try:
            from accounts.models import User
            
            customer = User.objects.get(id=customer_id)
            reward = Reward.objects.get(id=reward_id)
            
            # Validate
            if not reward.is_available:
                return {'success': False, 'error': 'Reward not available'}
            
            if points < reward.points_cost:
                return {'success': False, 'error': 'Insufficient points'}
            
            if customer_points.points_balance < reward.points_cost:
                return {'success': False, 'error': 'Insufficient points'}
            
            # Deduct points
            customer_points.points_balance -= reward.points_cost
            customer_points.points_redeemed_lifetime += reward.points_cost
            customer_points.save()
            
            # Update reward redemption count
            reward.current_redemptions += 1
            reward.save()
            
            # Log transaction
            PointsTransaction.objects.create(
                customer=customer,
                store=reward.program.store,
                customer_points=customer_points,
                transaction_type='redeem',
                reason='redemption',
                points=-reward.points_cost,
                balance_after=customer_points.points_balance,
                reward=reward
            )
            
            return {
                'success': True,
                'points_redeemed': reward.points_cost,
                'new_balance': customer_points.points_balance,
                'reward': reward.name
            }
            
        except Exception as e:
            print(f"Loyalty redeem error: {e}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_tier(customer_id, store_id):
        """Get customer's current tier"""
        try:
            from accounts.models import User
            from stores.models import Store
            
            customer = User.objects.get(id=customer_id)
            store = Store.objects.get(id=store_id)
            
            customer_points = CustomerPoints.objects.get(
                customer=customer,
                store=store
            )
            
            return customer_points.current_tier
            
        except Exception as e:
            return None
    
    @staticmethod
    def check_tier_upgrade(customer_points):
        """Auto-upgrade customer tier if eligible"""
        try:
            program = customer_points.program
            current_points = customer_points.points_balance
            
            # Find highest eligible tier
            eligible_tiers = RewardTier.objects.filter(
                program=program,
                minimum_points__lte=current_points
            ).order_by('-minimum_points')
            
            if eligible_tiers.exists():
                highest_tier = eligible_tiers.first()
                
                if customer_points.current_tier != highest_tier:
                    customer_points.current_tier = highest_tier
                    customer_points.tier_achieved_at = timezone.now()
                    customer_points.save()
                    
                    return highest_tier
            
            return None
            
        except Exception as e:
            print(f"Tier upgrade check error: {e}")
            return None
    
    @staticmethod
    def get_customer_balance(customer_id, store_id):
        """Get customer points balance and info"""
        try:
            from accounts.models import User
            from stores.models import Store
            
            customer = User.objects.get(id=customer_id)
            store = Store.objects.get(id=store_id)
            
            customer_points = CustomerPoints.objects.get(
                customer=customer,
                store=store
            )
            
            return {
                'balance': customer_points.points_balance,
                'lifetime_earned': customer_points.points_earned_lifetime,
                'lifetime_redeemed': customer_points.points_redeemed_lifetime,
                'tier': customer_points.current_tier.display_name if customer_points.current_tier else None,
                'tier_progress': customer_points.tier_progress,
                'points_expiring': customer_points.points_expiring_soon,
                'next_expiry': customer_points.next_expiry_date
            }
            
        except Exception as e:
            return None
