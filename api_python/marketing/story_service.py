"""
Stories Service
Auto-expiry, analytics, trending algorithm
"""
from django.utils import timezone
from django.db.models import Q
from .story_models import Story, StoryView, StoryHighlight


class StoryService:
    """Story management and analytics"""
    
    @staticmethod
    def get_active_stories(store_id=None):
        """Get all non-expired stories"""
        query = Story.objects.filter(
            status='active',
            expires_at__gt=timezone.now()
        )
        
        if store_id:
            query = query.filter(store_id=store_id)
        
        return query.order_by('-created_at')
    
    @staticmethod
    def record_view(story_id, viewer_id, watch_duration, completed=False):
        """Record story view"""
        try:
            from accounts.models import User
            
            story = Story.objects.get(id=story_id)
            viewer = User.objects.get(id=viewer_id)
            
            # Create or update view record
            view, created = StoryView.objects.get_or_create(
                story=story,
                viewer=viewer,
                defaults={
                    'watch_duration': watch_duration,
                    'completed': completed
                }
            )
            
            if not created:
                view.watch_duration = max(view.watch_duration, watch_duration)
                view.completed = view.completed or completed
                view.save()
            
            # Increment view count
            story.views_count += 1
            story.save()
            
            return view
            
        except Exception as e:
            print(f"Story view record error: {e}")
            return None
    
    @staticmethod
    def get_trending_stories(limit=10):
        """Get trending stories based on engagement"""
        now = timezone.now()
        last_24_hours = now - timezone.timedelta(hours=24)
        
        stories = Story.objects.filter(
            status='active',
            expires_at__gt=now,
            created_at__gte=last_24_hours
        ).annotate(
            engagement_score=(
                Q('views_count') * 1 +
                Q('shares_count') * 3 +
                Q('clicks_count') * 2
            )
        ).order_by('-engagement_score')[:limit]
        
        return stories
    
    @staticmethod
    def expire_old_stories():
        """Mark expired stories"""
        expired_count = Story.objects.filter(
            expires_at__lte=timezone.now(),
            status='active'
        ).update(status='expired')
        
        return expired_count
    
    @staticmethod
    def get_story_analytics(story_id):
        """Get detailed story analytics"""
        try:
            story = Story.objects.get(id=story_id)
            views = StoryView.objects.filter(story=story)
            
            total_views = story.views_count
            completed_views = views.filter(completed=True).count()
            completion_rate = (completed_views / total_views * 100) if total_views > 0 else 0
            
            return {
                'views': total_views,
                'shares': story.shares_count,
                'clicks': story.clicks_count,
                'completion_rate': completion_rate,
                'unique_viewers': views.count(),
            }
            
        except Story.DoesNotExist:
            return None
