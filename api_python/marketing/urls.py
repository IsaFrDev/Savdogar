from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MarketingCampaignViewSet, AutomatedWorkflowViewSet, WorkflowStepViewSet,
    EmailTemplateViewSet, SMSTemplateViewSet
)

router = DefaultRouter()
router.register(r'campaigns', MarketingCampaignViewSet)
router.register(r'workflows', AutomatedWorkflowViewSet)
router.register(r'workflow-steps', WorkflowStepViewSet)
router.register(r'email-templates', EmailTemplateViewSet)
router.register(r'sms-templates', SMSTemplateViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
