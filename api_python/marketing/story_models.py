"""
Stories/Reels Models
Short-lived video/image content (24 hours expiry)
"""
from django.db import models
from django.utils import timezone
from datetime import timedelta


class Story(models.Model):
    """Short-lived story content (auto-delete after 24 hours)"""
    STORY_TYPE_CHOICES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('product', 'Product Showcase'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('hidden', 'Hidden'),
    ]
    
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='stories')
    creator = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='created_stories')
    
    # Content
    story_type = models.CharField(max_length=20, choices=STORY_TYPE_CHOICES, default='image')
    media_file = models.ImageField(upload_to='stories/%Y/%m/%d/', null=True, blank=True)
    video_file = models.FileField(upload_to='stories/videos/%Y/%m/%d/', null=True, blank=True)
    
    # Metadata
    caption = models.TextField(blank=True, max_length=500)
    link_url = models.URLField(blank=True, null=True, help_text='Swipe-up link')
    
    # Product tagging
    tagged_products = models.ManyToManyField('products.Product', blank=True, related_name='featured_in_stories')
    
    # Analytics
    views_count = models.IntegerField(default=0)
    shares_count = models.IntegerField(default=0)
    clicks_count = models.IntegerField(default=0)
    
    # Timing
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(help_text='Auto-delete after this time')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['expires_at', 'status']),
        ]
    
    def __str__(self):
        return f"{self.store.name} - Story {self.id}"
    
    def save(self, *args, **kwargs):
        # Auto-set expiry to 24 hours if not set
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)
    
    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at
    
    @property
    def time_remaining(self):
        """Time remaining until expiry"""
        if self.is_expired:
            return timedelta(0)
        return self.expires_at - timezone.now()


class StoryView(models.Model):
    """Track who viewed stories"""
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='views')
    viewer = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='viewed_stories')
    
    viewed_at = models.DateTimeField(auto_now_add=True)
    watch_duration = models.IntegerField(default=0, help_text='Seconds watched')
    completed = models.BooleanField(default=False, help_text='Watched full story')
    
    class Meta:
        unique_together = ['story', 'viewer']
        ordering = ['-viewed_at']
    
    def __str__(self):
        return f"{self.viewer.username} viewed story {self.story.id}"


class StoryHighlight(models.Model):
    """Permanent story collections (like Instagram highlights)"""
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='story_highlights')
    creator = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    
    name = models.CharField(max_length=100)
    cover_image = models.ImageField(upload_to='highlights/covers/%Y/%m/%d/', null=True, blank=True)
    icon = models.CharField(max_length=10, default='⭐', help_text='Emoji icon')
    
    # Stories in highlight
    stories = models.ManyToManyField(Story, related_name='highlights', blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.store.name} - {self.name}"
    
    @property
    def stories_count(self):
        return self.stories.count()
