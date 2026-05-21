"""
Marketing Automation Serializers
"""
from rest_framework import serializers
from .models import (
    MarketingCampaign, CampaignRecipient, AutomatedWorkflow, 
    WorkflowStep, EmailTemplate, SMSTemplate
)
from .loyalty_models import (
    LoyaltyPointsProgram, CustomerPoints, PointsTransaction,
    RewardTier, Reward
)
from .gamification_models import SpinWheel, SpinReward, SpinAttempt
from .story_models import Story, StoryView, StoryHighlight
from .affiliate_models import (
    AffiliateProgram, Affiliate, ReferralLink, Commission, Payout
)


class MarketingCampaignSerializer(serializers.ModelSerializer):
    open_rate = serializers.ReadOnlyField()
    click_rate = serializers.ReadOnlyField()
    conversion_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = MarketingCampaign
        fields = '__all__'
        read_only_fields = ['sent_count', 'delivered_count', 'opened_count', 
                           'clicked_count', 'converted_count', 'revenue_generated']


class CampaignRecipientSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignRecipient
        fields = '__all__'


class WorkflowStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowStep
        fields = '__all__'


class AutomatedWorkflowSerializer(serializers.ModelSerializer):
    steps = WorkflowStepSerializer(many=True, read_only=True)
    
    class Meta:
        model = AutomatedWorkflow
        fields = '__all__'


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = '__all__'


class SMSTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SMSTemplate
        fields = '__all__'


# Phase A Serializers - Loyalty, Gamification, Stories, Affiliate

# Loyalty Serializers
class RewardTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = RewardTier
        fields = '__all__'

class RewardSerializer(serializers.ModelSerializer):
    is_available = serializers.ReadOnlyField()
    
    class Meta:
        model = Reward
        fields = '__all__'

class CustomerPointsSerializer(serializers.ModelSerializer):
    tier_name = serializers.CharField(source='current_tier.display_name', read_only=True)
    tier_progress = serializers.ReadOnlyField()
    
    class Meta:
        model = CustomerPoints
        fields = '__all__'

class PointsTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointsTransaction
        fields = '__all__'

class LoyaltyPointsProgramSerializer(serializers.ModelSerializer):
    total_members = serializers.ReadOnlyField()
    tiers = RewardTierSerializer(many=True, read_only=True)
    rewards = RewardSerializer(many=True, read_only=True)
    
    class Meta:
        model = LoyaltyPointsProgram
        fields = '__all__'


# Gamification Serializers
class SpinRewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpinReward
        fields = '__all__'

class SpinAttemptSerializer(serializers.ModelSerializer):
    reward_name = serializers.CharField(source='reward.name', read_only=True)
    
    class Meta:
        model = SpinAttempt
        fields = '__all__'

class SpinWheelSerializer(serializers.ModelSerializer):
    rewards = SpinRewardSerializer(many=True, read_only=True)
    
    class Meta:
        model = SpinWheel
        fields = '__all__'


# Story Serializers
class StorySerializer(serializers.ModelSerializer):
    is_expired = serializers.ReadOnlyField()
    time_remaining = serializers.ReadOnlyField()
    
    class Meta:
        model = Story
        fields = '__all__'

class StoryViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoryView
        fields = '__all__'

class StoryHighlightSerializer(serializers.ModelSerializer):
    stories_count = serializers.ReadOnlyField()
    
    class Meta:
        model = StoryHighlight
        fields = '__all__'


# Affiliate Serializers
class AffiliateSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    conversion_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = Affiliate
        fields = '__all__'

class ReferralLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferralLink
        fields = '__all__'

class CommissionSerializer(serializers.ModelSerializer):
    affiliate_name = serializers.CharField(source='affiliate.user.username', read_only=True)
    
    class Meta:
        model = Commission
        fields = '__all__'

class PayoutSerializer(serializers.ModelSerializer):
    affiliate_name = serializers.CharField(source='affiliate.user.username', read_only=True)
    
    class Meta:
        model = Payout
        fields = '__all__'

class AffiliateProgramSerializer(serializers.ModelSerializer):
    total_affiliates = serializers.ReadOnlyField()
    total_commissions_paid = serializers.ReadOnlyField()
    
    class Meta:
        model = AffiliateProgram
        fields = '__all__'
