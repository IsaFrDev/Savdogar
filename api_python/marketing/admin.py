from django.contrib import admin
from .models import MarketingCampaign, CampaignRecipient, AutomatedWorkflow, WorkflowStep, EmailTemplate, SMSTemplate
from .social_commerce_models import SocialShare, ReferralProgram, Referral, InfluencerCampaign, SocialProof, UserGeneratedContent
from .promotions_models import Promotion, TieredDiscount, BundleDeal, FlashSale, FlashSaleProduct, LoyaltyProgram, LoyaltyTier, CustomerLoyalty, LoyaltyTransaction
from .gamification_models import Badge, UserBadge, Challenge, UserChallenge, Leaderboard, LeaderboardEntry, UserStreak, Achievement, UserAchievement

# Marketing Automation
@admin.register(MarketingCampaign)
class MarketingCampaignAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'campaign_type', 'status', 'sent_count', 'created_at']
    list_filter = ['campaign_type', 'status']
    search_fields = ['name']

@admin.register(CampaignRecipient)
class CampaignRecipientAdmin(admin.ModelAdmin):
    list_display = ['campaign', 'customer', 'sent_at', 'opened_at']
    list_filter = ['sent_at']

@admin.register(AutomatedWorkflow)
class AutomatedWorkflowAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'trigger_event', 'is_active']
    list_filter = ['is_active']

@admin.register(WorkflowStep)
class WorkflowStepAdmin(admin.ModelAdmin):
    list_display = ['workflow', 'step_type', 'order']
    list_filter = ['step_type']

@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'subject', 'is_active']
    list_filter = ['is_active']

@admin.register(SMSTemplate)
class SMSTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'message', 'is_active']

# Social Commerce
@admin.register(SocialShare)
class SocialShareAdmin(admin.ModelAdmin):
    list_display = ['user', 'platform', 'click_count', 'shared_at']
    list_filter = ['platform']

@admin.register(ReferralProgram)
class ReferralProgramAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'is_active', 'created_at']
    list_filter = ['is_active']

@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ['referral_code', 'referrer', 'referee', 'status', 'created_at']
    list_filter = ['status']

@admin.register(InfluencerCampaign)
class InfluencerCampaignAdmin(admin.ModelAdmin):
    list_display = ['name', 'influencer_name', 'status', 'conversions', 'revenue_generated']
    list_filter = ['status']

@admin.register(SocialProof)
class SocialProofAdmin(admin.ModelAdmin):
    list_display = ['store', 'is_active', 'position']

@admin.register(UserGeneratedContent)
class UserGeneratedContentAdmin(admin.ModelAdmin):
    list_display = ['user', 'content_type', 'status', 'created_at']
    list_filter = ['content_type', 'status']

# Promotions
@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'promotion_type', 'is_active', 'starts_at', 'ends_at']
    list_filter = ['promotion_type', 'is_active']

@admin.register(TieredDiscount)
class TieredDiscountAdmin(admin.ModelAdmin):
    list_display = ['promotion', 'min_amount', 'discount_percent']

@admin.register(BundleDeal)
class BundleDealAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'bundle_price', 'sold_count', 'is_active']
    list_filter = ['is_active']

@admin.register(FlashSale)
class FlashSaleAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'starts_at', 'ends_at', 'is_active']
    list_filter = ['is_active']

@admin.register(LoyaltyProgram)
class LoyaltyProgramAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'is_active', 'points_per_amount_spent']
    list_filter = ['is_active']

@admin.register(LoyaltyTier)
class LoyaltyTierAdmin(admin.ModelAdmin):
    list_display = ['name', 'program', 'min_points', 'points_multiplier']

@admin.register(CustomerLoyalty)
class CustomerLoyaltyAdmin(admin.ModelAdmin):
    list_display = ['customer', 'program', 'available_points', 'total_points']
    search_fields = ['customer__username']

@admin.register(LoyaltyTransaction)
class LoyaltyTransactionAdmin(admin.ModelAdmin):
    list_display = ['customer_loyalty', 'transaction_type', 'points', 'created_at']
    list_filter = ['transaction_type']

# Gamification
@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'badge_type', 'icon', 'is_active']
    list_filter = ['badge_type']

@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ['user', 'badge', 'earned_at']

@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'challenge_type', 'is_active', 'starts_at', 'ends_at']
    list_filter = ['is_active']

@admin.register(UserChallenge)
class UserChallengeAdmin(admin.ModelAdmin):
    list_display = ['user', 'challenge', 'status', 'progress']
    list_filter = ['status']

@admin.register(Leaderboard)
class LeaderboardAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'period', 'metric', 'is_active']
    list_filter = ['period']

@admin.register(LeaderboardEntry)
class LeaderboardEntryAdmin(admin.ModelAdmin):
    list_display = ['leaderboard', 'user', 'rank', 'score']
    list_filter = ['leaderboard']

@admin.register(UserStreak)
class UserStreakAdmin(admin.ModelAdmin):
    list_display = ['user', 'streak_type', 'current_streak', 'longest_streak']
    list_filter = ['streak_type']

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ['name', 'store', 'rarity', 'unlock_count']
    list_filter = ['rarity']

@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ['user', 'achievement', 'unlocked_at']
