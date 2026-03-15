from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core import signing
from accounts.models import TrustedDevice

User = get_user_model()

class DeviceGuardTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='securepassword123',
            role='store_admin' # as per requirement
        )
        self.login_url = reverse('login')
        self.verify_url = reverse('device_verify')

    def test_login_new_device(self):
        """Test that logging in from a new device requires verification."""
        data = {
            'email': 'test@example.com',
            'password': 'securepassword123'
        }
        response = self.client.post(self.login_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(response.data.get('device_verification_required'))
        self.assertIn('temp_token', response.data)
        
    def test_verify_device_and_login(self):
        """Test the full flow: Login -> 401 -> Verify -> Login -> 200."""
        # 1. Login attempt
        data = {'email': 'test@example.com', 'password': 'securepassword123'}
        response = self.client.post(self.login_url, data)
        temp_token = response.data['temp_token']
        
        # Decode token to get code (simulating receiving SMS)
        token_data = signing.loads(temp_token, salt='device-verify')
        code = token_data['code']
        
        # 2. Verify Device
        verify_data = {
            'code': code,
            'temp_token': temp_token,
            'device_name': 'Test Runner Device',
            'remember_device': True
        }
        response = self.client.post(self.verify_url, verify_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('savdoon_device_token', response.cookies)
        
        device_cookie = response.cookies['savdoon_device_token'].value
        
        # 3. Subsequent Login with Cookie
        self.client.cookies['savdoon_device_token'] = device_cookie
        response = self.client.post(self.login_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('device_verification_required', response.data)
