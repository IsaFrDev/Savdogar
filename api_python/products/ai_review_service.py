"""
AI-Powered Review Sentiment Analysis
Analyzes customer reviews for sentiment, extracts key themes, generates summaries
"""
import os
import json
from datetime import datetime, timedelta
from django.db.models import Count, Avg, Q
from products.ai_service import concierge_ai_service as ai_service, log_ai_error


class AIReviewService:
    """AI-driven review analysis and sentiment detection"""
    
    def __init__(self, store_id=None, product_id=None):
        self.store_id = store_id
        self.product_id = product_id
        
    def analyze_sentiment(self, review_text):
        """Analyze sentiment of a single review"""
        try:
            prompt = f"""Analyze the sentiment of this customer review.

Review: "{review_text}"

Return ONLY JSON:
{{
  "sentiment": "positive",
  "confidence": 0.92,
  "score": 0.85,
  "emotions": ["satisfied", "happy"],
  "key_points": ["Tez yetkazib berish", "Yaxshi sifat"],
  "topics": ["delivery", "quality"]
}}

sentiment options: positive, negative, neutral
score: -1.0 (very negative) to 1.0 (very positive)
emotions: list of detected emotions
key_points: main points from review in Uzbek
topics: list of topics mentioned
"""
            
            response_text = ai_service._safe_generate_content(
                ai_service._get_model_names(),
                prompt
            )
            
            # Parse response
            start = response_text.find('{')
            end = response_text.rfind('}')
            if start != -1 and end != -1:
                return json.loads(response_text[start:end+1])
            
            return {
                'sentiment': 'neutral',
                'confidence': 0.5,
                'score': 0.0
            }
            
        except Exception as e:
            log_ai_error(f"Sentiment analysis error: {e}")
            return {
                'sentiment': 'neutral',
                'confidence': 0.5,
                'score': 0.0,
                'error': str(e)
            }
    
    def batch_analyze_reviews(self, reviews):
        """Analyze sentiment for multiple reviews"""
        try:
            results = []
            
            for review in reviews:
                sentiment = self.analyze_sentiment(review.get('text', ''))
                sentiment['review_id'] = review.get('id')
                sentiment['rating'] = review.get('rating')
                results.append(sentiment)
            
            # Calculate aggregate metrics
            total = len(results)
            positive = sum(1 for r in results if r['sentiment'] == 'positive')
            negative = sum(1 for r in results if r['sentiment'] == 'negative')
            neutral = sum(1 for r in results if r['sentiment'] == 'neutral')
            
            avg_score = sum(r.get('score', 0) for r in results) / total if total > 0 else 0
            
            return {
                'reviews': results,
                'summary': {
                    'total_reviews': total,
                    'positive_count': positive,
                    'negative_count': negative,
                    'neutral_count': neutral,
                    'positive_percent': round((positive / total) * 100, 1) if total > 0 else 0,
                    'negative_percent': round((negative / total) * 100, 1) if total > 0 else 0,
                    'neutral_percent': round((neutral / total) * 100, 1) if total > 0 else 0,
                    'average_sentiment_score': round(avg_score, 3)
                }
            }
            
        except Exception as e:
            log_ai_error(f"Batch sentiment analysis error: {e}")
            return {
                'reviews': [],
                'summary': {}
            }
    
    def extract_themes_from_reviews(self, reviews):
        """Extract common themes and topics from reviews"""
        try:
            review_texts = [r.get('text', '') for r in reviews if r.get('text')]
            
            if not review_texts:
                return {'themes': [], 'topics': []}
            
            # Combine reviews for AI analysis
            all_reviews = "\n".join([f"- {text}" for text in review_texts[:50]])  # Limit to 50
            
            prompt = f"""Analyze these customer reviews and extract common themes and topics.

Reviews:
{all_reviews}

Identify:
1. Main themes (what customers talk about most)
2. Positive themes
3. Negative themes
4. Actionable insights

Return ONLY JSON:
{{
  "main_themes": [
    {{
      "theme": "Yetkazib berish",
      "mention_count": 45,
      "sentiment": "positive",
      "percentage": 60
    }}
  ],
  "positive_themes": ["Tez yetkazish", "Yaxshi sifat"],
  "negative_themes": ["Qimmat narx", "Kechikish"],
  "improvement_suggestions": [
    "Narxlarni arzonlashtiring",
    "Yetkazish tezligini oshiring"
  ],
  "top_keywords": ["sifat", "narx", "yetkazish", "xizmat"]
}}

All text must be in Uzbek
mention_count: how many times theme appears
percentage: percentage of reviews mentioning this theme
"""
            
            response_text = ai_service._safe_generate_content(
                ai_service._get_model_names(),
                prompt
            )
            
            # Parse response
            start = response_text.find('{')
            end = response_text.rfind('}')
            if start != -1 and end != -1:
                return json.loads(response_text[start:end+1])
            
            return {'themes': [], 'topics': []}
            
        except Exception as e:
            log_ai_error(f"Theme extraction error: {e}")
            return {'themes': [], 'topics': []}
    
    def generate_review_summary(self, reviews):
        """Generate AI summary of all reviews"""
        try:
            review_texts = [r.get('text', '') for r in reviews if r.get('text') and r.get('rating')]
            
            if not review_texts:
                return {
                    'summary': "Hozircha sharhlar yo'q",
                    'key_strengths': [],
                    'key_weaknesses': []
                }
            
            all_reviews = "\n".join([f"- {text}" for text in review_texts[:30]])
            
            prompt = f"""Summarize these customer reviews for the store owner.

Reviews:
{all_reviews}

Provide a concise summary highlighting key strengths and weaknesses.

Return ONLY JSON:
{{
  "summary": "Mijozlar umumiy mamnun. Yetkazib berish tez va sifat yaxshi.",
  "key_strengths": [
    "Tez yetkazib berish",
    "Yuqori sifat",
    "Yaxshi mijozlar xizmati"
  ],
  "key_weaknesses": [
    "Narxlar biroz qimmat",
    "Ba'zi mahsulotlar yo'q"
  ],
  "overall_sentiment": "positive",
  "recommendation": "Sifatni saqlang va narxlarni raqobatbardosh qiling"
}}

summary must be 2-3 sentences in Uzbek
key_strengths: 3-5 items
key_weaknesses: 2-3 items
overall_sentiment: positive, negative, or neutral
recommendation must be in Uzbek
"""
            
            response_text = ai_service._safe_generate_content(
                ai_service._get_model_names(),
                prompt
            )
            
            # Parse response
            start = response_text.find('{')
            end = response_text.rfind('}')
            if start != -1 and end != -1:
                return json.loads(response_text[start:end+1])
            
            return {
                'summary': "AI tahlili mavjud emas",
                'key_strengths': [],
                'key_weaknesses': []
            }
            
        except Exception as e:
            log_ai_error(f"Review summary generation error: {e}")
            return {
                'summary': "Xatolik yuz berdi",
                'key_strengths': [],
                'key_weaknesses': []
            }
    
    def detect_fake_reviews(self, reviews):
        """Detect potentially fake or suspicious reviews"""
        try:
            suspicious_reviews = []
            
            for review in reviews:
                text = review.get('text', '')
                rating = review.get('rating', 0)
                
                # Heuristic checks
                red_flags = []
                
                # Very short review with 5 stars
                if len(text) < 20 and rating == 5:
                    red_flags.append("Juda qisqa 5 yulduzli sharh")
                
                # Repeated text patterns
                if text.lower().count('yaxshi') > 3 or text.lower().count('zo\'r') > 3:
                    red_flags.append("Takrorlanuvchi so'zlar")
                
                # All caps
                if text.isupper() and len(text) > 10:
                    red_flags.append("Katta harflarda yozilgan")
                
                # AI-generated pattern (simplified)
                if len(text) > 200 and text.count('.') > 10:
                    red_flags.append("Sun'iy intellekt tomonidan yozilgan bo'lishi mumkin")
                
                if red_flags:
                    suspicious_reviews.append({
                        'review_id': review.get('id'),
                        'red_flags': red_flags,
                        'suspicion_score': len(red_flags) * 0.25
                    })
            
            return {
                'total_analyzed': len(reviews),
                'suspicious_count': len(suspicious_reviews),
                'suspicious_reviews': suspicious_reviews
            }
            
        except Exception as e:
            log_ai_error(f"Fake review detection error: {e}")
            return {
                'total_analyzed': 0,
                'suspicious_count': 0,
                'suspicious_reviews': []
            }
    
    def analyze_store_reviews(self):
        """Comprehensive review analysis for a store"""
        try:
            from orders.models import Review
            
            reviews = Review.objects.filter(
                store_id=self.store_id
            ).values(
                'id', 'text', 'rating', 'created_at', 'customer_id'
            ).order_by('-created_at')
            
            review_list = list(reviews)
            
            if not review_list:
                return {
                    'total_reviews': 0,
                    'average_rating': 0,
                    'sentiment_analysis': {},
                    'themes': {},
                    'summary': {}
                }
            
            # Basic stats
            avg_rating = Review.objects.filter(store_id=self.store_id).aggregate(
                avg=Avg('rating')
            )['avg'] or 0
            
            # Sentiment analysis
            sentiment = self.batch_analyze_reviews(review_list)
            
            # Theme extraction
            themes = self.extract_themes_from_reviews(review_list)
            
            # Summary
            summary = self.generate_review_summary(review_list)
            
            # Fake detection
            fake_detection = self.detect_fake_reviews(review_list)
            
            return {
                'total_reviews': len(review_list),
                'average_rating': round(avg_rating, 2),
                'rating_distribution': self._get_rating_distribution(review_list),
                'sentiment_analysis': sentiment['summary'],
                'themes': themes,
                'summary': summary,
                'fake_review_detection': fake_detection,
                'recent_reviews': review_list[:10]
            }
            
        except Exception as e:
            log_ai_error(f"Store review analysis error: {e}")
            return {
                'total_reviews': 0,
                'average_rating': 0,
                'error': str(e)
            }
    
    def _get_rating_distribution(self, reviews):
        """Get distribution of ratings (1-5 stars)"""
        distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        
        for review in reviews:
            rating = review.get('rating', 0)
            if rating in distribution:
                distribution[rating] += 1
        
        return distribution
    
    def analyze_product_reviews(self, product_id):
        """Analyze reviews for a specific product"""
        try:
            from orders.models import Review
            
            reviews = Review.objects.filter(
                product_id=product_id
            ).values(
                'id', 'text', 'rating', 'created_at', 'customer_id'
            ).order_by('-created_at')
            
            review_list = list(reviews)
            
            if not review_list:
                return {
                    'product_id': product_id,
                    'total_reviews': 0,
                    'average_rating': 0
                }
            
            # Basic stats
            avg_rating = Review.objects.filter(product_id=product_id).aggregate(
                avg=Avg('rating')
            )['avg'] or 0
            
            # Sentiment and summary
            sentiment = self.batch_analyze_reviews(review_list)
            summary = self.generate_review_summary(review_list)
            
            return {
                'product_id': product_id,
                'total_reviews': len(review_list),
                'average_rating': round(avg_rating, 2),
                'rating_distribution': self._get_rating_distribution(review_list),
                'sentiment_analysis': sentiment['summary'],
                'summary': summary,
                'recent_reviews': review_list[:5]
            }
            
        except Exception as e:
            log_ai_error(f"Product review analysis error: {e}")
            return {
                'product_id': product_id,
                'total_reviews': 0,
                'error': str(e)
            }
