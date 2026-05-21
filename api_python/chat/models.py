from django.db import models


class Conversation(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('closed', 'Closed'), ('pending', 'Pending')]
    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='conversations')
    customer_name = models.CharField(max_length=100)
    customer_email = models.EmailField(blank=True, null=True)
    customer_phone = models.CharField(max_length=20, blank=True, null=True)
    customer_session_id = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Chat: {self.customer_name} - {self.store.name}"


class Message(models.Model):
    SENDER_TYPES = [('customer', 'Customer'), ('store', 'Store'), ('system', 'System')]
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender_type = models.CharField(max_length=20, choices=SENDER_TYPES)
    sender_id = models.IntegerField(null=True, blank=True)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender_type}: {self.content[:50]}"
