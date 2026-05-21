"""
Marketing Automation Views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import (
    MarketingCampaign, CampaignRecipient, AutomatedWorkflow,
    WorkflowStep, EmailTemplate, SMSTemplate
)
from .serializers import (
    MarketingCampaignSerializer, CampaignRecipientSerializer,
    AutomatedWorkflowSerializer, WorkflowStepSerializer,
    EmailTemplateSerializer, SMSTemplateSerializer
)


class MarketingCampaignViewSet(viewsets.ModelViewSet):
    """Manage marketing campaigns"""
    serializer_class = MarketingCampaignSerializer
    permission_classes = [IsAuthenticated]
    queryset = MarketingCampaign.objects.none()  # Placeholder, overridden in get_queryset
    
    def get_queryset(self):
        store = self.request.user.stores.first()
        if not store:
            return MarketingCampaign.objects.none()
        return MarketingCampaign.objects.filter(
            store=store
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        store = self.request.user.stores.first()
        if store:
            serializer.save(store=store)
    
    @action(detail=True, methods=['post'])
    def launch(self, request, pk=None):
        """Launch a campaign"""
        campaign = self.get_object()
        campaign.status = 'active'
        campaign.started_at = timezone.now()
        campaign.save()
        return Response({'status': 'Campaign launched'})
    
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause a campaign"""
        campaign = self.get_object()
        campaign.status = 'paused'
        campaign.save()
        return Response({'status': 'Campaign paused'})
    
    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Send campaign to targeted users"""
        campaign = self.get_object()
        # TODO: Implement actual sending logic
        campaign.sent_count = 0  # Would be calculated
        campaign.save()
        return Response({'status': f'Campaign sent to {campaign.sent_count} users'})


class AutomatedWorkflowViewSet(viewsets.ModelViewSet):
    """Manage automated workflows"""
    serializer_class = AutomatedWorkflowSerializer
    permission_classes = [IsAuthenticated]
    queryset = AutomatedWorkflow.objects.none()
    
    def get_queryset(self):
        store = self.request.user.stores.first()
        if not store:
            return AutomatedWorkflow.objects.none()
        return AutomatedWorkflow.objects.filter(
            store=store
        )
    
    def perform_create(self, serializer):
        store = self.request.user.stores.first()
        if store:
            serializer.save(store=store)


class WorkflowStepViewSet(viewsets.ModelViewSet):
    """Manage workflow steps"""
    serializer_class = WorkflowStepSerializer
    permission_classes = [IsAuthenticated]
    queryset = WorkflowStep.objects.none()
    
    def get_queryset(self):
        store = self.request.user.stores.first()
        if not store:
            return WorkflowStep.objects.none()
        return WorkflowStep.objects.filter(
            workflow__store=store
        )


class EmailTemplateViewSet(viewsets.ModelViewSet):
    """Manage email templates"""
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsAuthenticated]
    queryset = EmailTemplate.objects.none()
    
    def get_queryset(self):
        store = self.request.user.stores.first()
        if not store:
            return EmailTemplate.objects.none()
        return EmailTemplate.objects.filter(
            store=store,
            is_active=True
        )
    
    def perform_create(self, serializer):
        store = self.request.user.stores.first()
        if store:
            serializer.save(store=store)


class SMSTemplateViewSet(viewsets.ModelViewSet):
    """Manage SMS templates"""
    serializer_class = SMSTemplateSerializer
    permission_classes = [IsAuthenticated]
    queryset = SMSTemplate.objects.none()
    
    def get_queryset(self):
        store = self.request.user.stores.first()
        if not store:
            return SMSTemplate.objects.none()
        return SMSTemplate.objects.filter(
            store=store,
            is_active=True
        )
    
    def perform_create(self, serializer):
        store = self.request.user.stores.first()
        if store:
            serializer.save(store=store)
