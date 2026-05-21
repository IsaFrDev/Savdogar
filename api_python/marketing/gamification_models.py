"""
Gamification System
Badges, achievements, challenges, leaderboards, streaks
"""
from django.db import models


class Badge(models.Model):
    """Achievement badges"""
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='badges')
    name = models.CharField(max_length=100)
    description = models.TextField()
    
    icon = models.CharField(max_length=100, help_text='Emoji or icon name')
    color = models.CharField(max_length=7, default='#FFD700')
    
    # Requirements
    badge_type = models.CharField(max_length=50, choices=[
        ('purchase_count', 'Purchase Count'),
        ('total_spent', 'Total Spent'),
        ('review_count', 'Review Count'),
        ('referral_count', 'Referral Count'),
        ('streak_days', 'Login Streak'),
        ('first_purchase', 'First Purchase'),
        ('social_share', 'Social Shares'),
        ('early_adopter', 'Early Adopter'),
    ])
    
    requirement_value = models.IntegerField(help_text='Required count/amount')
    
    # Rewards
    reward_points = models.IntegerField(default=0)
    reward_discount = models.IntegerField(default=0, help_text='Discount %')
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.icon} {self.name}"


class UserBadge(models.Model):
    """Badges earned by users"""
    
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='earned_badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name='earned_by')
    
    earned_at = models.DateTimeField(auto_now_add=True)
    progress = models.IntegerField(default=0, help_text='Current progress towards badge')
    
    def __str__(self):
        return f"{self.user.username} - {self.badge.name}"


class Challenge(models.Model):
    """Time-limited challenges"""
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='challenges')
    name = models.CharField(max_length=200)
    description = models.TextField()
    
    challenge_type = models.CharField(max_length=50, choices=[
        ('purchase_n_items', 'Purchase N Items'),
        ('spend_amount', 'Spend X Amount'),
        ('write_reviews', 'Write N Reviews'),
        ('refer_friends', 'Refer N Friends'),
        ('daily_login', 'Daily Login Streak'),
        ('share_products', 'Share N Products'),
    ])
    
    target_value = models.IntegerField()
    
    # Rewards
    reward_points = models.IntegerField(default=0)
    reward_badge = models.ForeignKey(Badge, on_delete=models.SET_NULL, null=True, blank=True)
    reward_discount_code = models.CharField(max_length=50, blank=True)
    
    # Timing
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    
    # Participation
    participant_count = models.IntegerField(default=0)
    completion_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class UserChallenge(models.Model):
    """User's progress on challenges"""
    
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('failed', 'Failed/Expired'),
    ]
    
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='user_challenges')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='challenges')
    
    progress = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.challenge.name} ({self.progress}/{self.challenge.target_value})"


class Leaderboard(models.Model):
    """Leaderboard tracking"""
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='leaderboards')
    name = models.CharField(max_length=200)
    
    period = models.CharField(max_length=20, choices=[
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('all_time', 'All Time'),
    ])
    
    metric = models.CharField(max_length=50, choices=[
        ('total_spent', 'Total Spent'),
        ('purchase_count', 'Purchase Count'),
        ('points_earned', 'Points Earned'),
        ('reviews_written', 'Reviews Written'),
        ('referrals_made', 'Referrals Made'),
    ])
    
    is_active = models.BooleanField(default=True)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.period})"


class LeaderboardEntry(models.Model):
    """Individual leaderboard entries"""
    
    leaderboard = models.ForeignKey(Leaderboard, on_delete=models.CASCADE, related_name='entries')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='leaderboard_entries')
    
    rank = models.IntegerField()
    score = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Rewards
    reward_distributed = models.BooleanField(default=False)
    reward_details = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['leaderboard', 'user']
        ordering = ['rank']
    
    def __str__(self):
        return f"#{self.rank} {self.user.username} - {self.score}"


class UserStreak(models.Model):
    """User activity streaks"""
    
    STREAK_TYPE = [
        ('login', 'Login Streak'),
        ('purchase', 'Purchase Streak'),
        ('review', 'Review Streak'),
    ]
    
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='streaks')
    streak_type = models.CharField(max_length=20, choices=STREAK_TYPE)
    
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    
    last_activity_date = models.DateField()
    
    # Milestones
    milestone_rewards = models.JSONField(default=dict, help_text='{7: 50, 30: 200, 100: 1000} points')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'streak_type']
    
    def __str__(self):
        return f"{self.user.username} - {self.streak_type}: {self.current_streak} days"
    
    def increment(self):
        from django.utils import timezone
        today = timezone.now().date()
        yesterday = today - timezone.timedelta(days=1)
        
        if self.last_activity_date == yesterday:
            self.current_streak += 1
        elif self.last_activity_date != today:
            self.current_streak = 1
        
        self.last_activity_date = today
        self.longest_streak = max(self.longest_streak, self.current_streak)
        self.save()
    
    def reset(self):
        self.current_streak = 0
        self.save()


class Achievement(models.Model):
    """Special one-time achievements"""
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='achievements')
    name = models.CharField(max_length=200)
    description = models.TextField()
    
    icon = models.CharField(max_length=100)
    rarity = models.CharField(max_length=20, choices=[
        ('common', 'Common'),
        ('uncommon', 'Uncommon'),
        ('rare', 'Rare'),
        ('epic', 'Epic'),
        ('legendary', 'Legendary'),
    ])
    
    # Achievement conditions
    condition_type = models.CharField(max_length=50)
    condition_value = models.IntegerField()
    
    reward_points = models.IntegerField(default=0)
    
    unlock_count = models.IntegerField(default=0, help_text='How many users unlocked this')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"🏆 {self.name} ({self.rarity})"


class UserAchievement(models.Model):
    """Achievements unlocked by users"""
    
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name='unlocked_by')
    
    unlocked_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'achievement']
    
    def __str__(self):
        return f"{self.user.username} - {self.achievement.name}"


class SpinWheel(models.Model):
    """Daily spin wheel configuration per store"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='spin_wheels')
    name = models.CharField(max_length=200, default='Daily Spin & Win')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Configuration
    spins_per_day = models.IntegerField(default=1, help_text='How many spins per day')
    reset_time = models.TimeField(default='00:00:00', help_text='When daily limit resets')
    
    # Visual customization
    primary_color = models.CharField(max_length=7, default='#6366F1')
    secondary_color = models.CharField(max_length=7, default='#8B5CF6')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.store.name} - {self.name}"


class SpinReward(models.Model):
    """Possible rewards on spin wheel"""
    REWARD_TYPE_CHOICES = [
        ('discount', 'Discount %'),
        ('points', 'Loyalty Points'),
        ('free_shipping', 'Free Shipping'),
        ('free_product', 'Free Product'),
        ('cashback', 'Cashback'),
        ('no_win', 'Try Again'),
    ]
    
    wheel = models.ForeignKey(SpinWheel, on_delete=models.CASCADE, related_name='rewards')
    name = models.CharField(max_length=200)
    reward_type = models.CharField(max_length=20, choices=REWARD_TYPE_CHOICES)
    
    # Value
    value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True,
                                help_text='Discount %, points amount, cashback value')
    
    # Probability
    probability = models.DecimalField(max_digits=5, decimal_places=2, help_text='Win probability (0-100)')
    
    # Visual
    color = models.CharField(max_length=7, default='#FFD700')
    icon = models.CharField(max_length=10, default='🎁')
    
    # Limits
    max_redemptions_per_day = models.IntegerField(null=True, blank=True, help_text='Max times this can be won per day')
    current_daily_wins = models.IntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-probability']
    
    def __str__(self):
        return f"{self.icon} {self.name} ({self.probability}%)"
    
    def reset_daily_wins(self):
        """Reset daily win counter"""
        self.current_daily_wins = 0
        self.save()


class SpinAttempt(models.Model):
    """Track daily spins per customer"""
    wheel = models.ForeignKey(SpinWheel, on_delete=models.CASCADE, related_name='attempts')
    customer = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='spin_attempts')
    
    # Result
    reward = models.ForeignKey(SpinReward, on_delete=models.SET_NULL, null=True, blank=True)
    reward_claimed = models.BooleanField(default=False)
    
    spun_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-spun_at']
    
    def __str__(self):
        return f"{self.customer.username} - {self.spun_at.strftime('%Y-%m-%d')}"
