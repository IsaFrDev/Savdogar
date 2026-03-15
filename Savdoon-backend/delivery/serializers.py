from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Courier

User = get_user_model()

class UserCourierSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'phone']

class CourierSerializer(serializers.ModelSerializer):
    user_details = UserCourierSerializer(source='user', read_only=True)
    
    class Meta:
        model = Courier
        fields = [
            'id', 'user', 'user_details', 'store', 'status', 
            'vehicle_type', 'latitude', 'longitude', 
            'rating', 'completed_deliveries', 'balance',
            'last_location_update'
        ]
        read_only_fields = ['id', 'rating', 'completed_deliveries', 'balance', 'last_location_update']

class CourierLocationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Courier
        fields = ['latitude', 'longitude']
