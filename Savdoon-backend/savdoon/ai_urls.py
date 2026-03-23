from django.urls import path
from . import ai_views

urlpatterns = [
    path('translate-product/', ai_views.translate_product_view, name='translate-product'),
    path('enhance-signature/', ai_views.enhance_signature, name='enhance-signature'),
    path('generate-signatures/', ai_views.generate_signatures_view, name='generate-signatures'),
    path('enhance-description/', ai_views.enhance_description, name='enhance-description'),
    path('generate-description/', ai_views.generate_description_view, name='generate-description'),
    path('analyze-logo/', ai_views.analyze_logo_view, name='analyze-logo'),
    path('chatbot/', ai_views.chatbot_view, name='chatbot'),
    path('analyze-business/', ai_views.analyze_business_view, name='analyze-business'),
]
