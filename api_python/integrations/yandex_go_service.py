"""
Yandex Go Delivery API Integration
Docs: https://yandex.ru/dev/delivery/
"""
import requests
import time
from decimal import Decimal
from django.conf import settings
from integrations.models import DeliveryIntegration, DeliveryRequest


class YandexGoService:
    """Yandex Go delivery service"""
    
    def __init__(self, integration: DeliveryIntegration):
        self.integration = integration
        self.api_key = integration.api_key
        
        # Yandex Delivery API URLs
        self.base_url = "https://delivery-api.yandex.ru"
        # For testing:
        # self.base_url = "https://sandbox.delivery-api.yandex.ru"
    
    def _get_headers(self):
        """Get API request headers"""
        return {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Yandex-Delivery-Api-Version': '1.0',
        }
    
    def _make_request(self, method, endpoint, data=None):
        """Make API request to Yandex"""
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers()
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            
            if response.status_code == 204:
                return {'success': True}
            
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Yandex Delivery API request failed: {str(e)}")
    
    # ==========================================
    # DELIVERY REQUEST
    # ==========================================
    
    def create_delivery_request(self, order_id, pickup_address, delivery_address,
                               pickup_coords=None, delivery_coords=None,
                               customer_name="", customer_phone="",
                               items_description="", declared_value=0):
        """
        Create delivery request
        
        Args:
            order_id: Local order ID
            pickup_address: Pickup location address
            delivery_address: Delivery location address
            pickup_coords: (latitude, longitude) tuple for pickup
            delivery_coords: (latitude, longitude) tuple for delivery
            customer_name: Customer name
            customer_phone: Customer phone
            items_description: Description of items
            declared_value: Declared value of items (for insurance)
        
        Returns:
            dict with delivery request details
        """
        # Build request data
        request_data = {
            'client_request_id': f"order_{order_id}_{int(time.time())}",
            'delivery_type': self.integration.default_vehicle_type,  # 'courier', 'car', 'truck'
            'pickup': {
                'address': {
                    'full_address': pickup_address,
                },
                'contact': {
                    'name': self.integration.store.name,
                    'phone': self.integration.store.phone or '',
                },
            },
            'dropoff': {
                'address': {
                    'full_address': delivery_address,
                },
                'contact': {
                    'name': customer_name,
                    'phone': customer_phone,
                },
            },
            'items': [{
                'name': items_description or f"Order #{order_id}",
                'cost': float(declared_value),
            }],
            'payment': {
                'type': 'cash',  # or 'card'
                'delivery_cost': 'recipient',  # who pays: 'sender' or 'recipient'
            },
        }
        
        # Add coordinates if provided
        if pickup_coords:
            request_data['pickup']['location'] = {
                'lat': pickup_coords[0],
                'lon': pickup_coords[1],
            }
        
        if delivery_coords:
            request_data['dropoff']['location'] = {
                'lat': delivery_coords[0],
                'lon': delivery_coords[1],
            }
        
        try:
            # Send request to Yandex
            response = self._make_request('POST', '/v1/delivery/request', request_data)
            
            # Create local delivery request record
            delivery_request = DeliveryRequest.objects.create(
                store=self.integration.store,
                delivery_integration=self.integration,
                order_id=order_id,
                status='pending',
                external_request_id=response.get('id', ''),
                pickup_address=pickup_address,
                pickup_lat=pickup_coords[0] if pickup_coords else None,
                pickup_lon=pickup_coords[1] if pickup_coords else None,
                delivery_address=delivery_address,
                delivery_lat=delivery_coords[0] if delivery_coords else None,
                delivery_lon=delivery_coords[1] if delivery_coords else None,
                estimated_cost=response.get('estimated_cost', 0),
                request_data=request_data,
                response_data=response,
            )
            
            return {
                'success': True,
                'delivery_request_id': delivery_request.id,
                'yandex_request_id': response.get('id'),
                'estimated_cost': response.get('estimated_cost'),
                'estimated_time': response.get('estimated_delivery_time'),
                'tracking_url': f"https://delivery.yandex.ru/track/{response.get('id')}",
            }
            
        except Exception as e:
            # Create failed delivery request record
            delivery_request = DeliveryRequest.objects.create(
                store=self.integration.store,
                delivery_integration=self.integration,
                order_id=order_id,
                status='failed',
                pickup_address=pickup_address,
                delivery_address=delivery_address,
                request_data=request_data,
                response_data={'error': str(e)},
            )
            
            return {
                'success': False,
                'error': str(e),
                'delivery_request_id': delivery_request.id,
            }
    
    # ==========================================
    # DELIVERY STATUS
    # ==========================================
    
    def get_delivery_status(self, external_request_id):
        """
        Get delivery status from Yandex
        
        Args:
            external_request_id: Yandex delivery request ID
        
        Returns:
            dict with delivery status
        """
        try:
            response = self._make_request(
                'GET',
                f'/v1/delivery/{external_request_id}'
            )
            
            # Map Yandex status to local status
            yandex_status = response.get('status')
            status_mapping = {
                'pending': 'pending',
                'searching': 'searching',
                'assigned': 'assigned',
                'pickup_arrived': 'picked_up',
                'pickup_complete': 'in_transit',
                'dropoff_arrived': 'in_transit',
                'dropoff_complete': 'delivered',
                'cancelled': 'cancelled',
                'failed': 'failed',
            }
            
            local_status = status_mapping.get(yandex_status, 'pending')
            
            # Update local delivery request
            try:
                delivery_request = DeliveryRequest.objects.get(
                    external_request_id=external_request_id
                )
                delivery_request.status = local_status
                delivery_request.response_data = response
                
                # Update courier info if assigned
                if 'courier' in response:
                    courier = response['courier']
                    delivery_request.courier_name = courier.get('name', '')
                    delivery_request.courier_phone = courier.get('phone', '')
                    delivery_request.courier_vehicle = courier.get('vehicle', '')
                
                # Update estimated/actual delivery time
                if response.get('estimated_delivery_time'):
                    from django.utils import timezone
                    delivery_request.estimated_delivery_time = timezone.datetime.fromisoformat(
                        response['estimated_delivery_time']
                    )
                
                if local_status == 'delivered':
                    delivery_request.actual_delivery_time = timezone.now()
                
                delivery_request.save()
                
            except DeliveryRequest.DoesNotExist:
                pass
            
            return {
                'success': True,
                'status': local_status,
                'yandex_status': yandex_status,
                'courier': response.get('courier'),
                'tracking_url': f"https://delivery.yandex.ru/track/{external_request_id}",
                'estimated_time': response.get('estimated_delivery_time'),
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }
    
    def cancel_delivery(self, external_request_id, reason="Customer cancelled"):
        """
        Cancel delivery request
        
        Args:
            external_request_id: Yandex delivery request ID
            reason: Cancellation reason
        
        Returns:
            dict with cancellation result
        """
        try:
            response = self._make_request(
                'POST',
                f'/v1/delivery/{external_request_id}/cancel',
                {'reason': reason}
            )
            
            # Update local delivery request
            try:
                delivery_request = DeliveryRequest.objects.get(
                    external_request_id=external_request_id
                )
                delivery_request.status = 'cancelled'
                delivery_request.response_data = response
                delivery_request.save()
            except DeliveryRequest.DoesNotExist:
                pass
            
            return {
                'success': True,
                'message': 'Delivery cancelled successfully',
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }
    
    # ==========================================
    # DELIVERY COST ESTIMATION
    # ==========================================
    
    def estimate_delivery_cost(self, pickup_coords, delivery_coords, 
                               vehicle_type='courier'):
        """
        Estimate delivery cost
        
        Args:
            pickup_coords: (latitude, longitude) tuple
            delivery_coords: (latitude, longitude) tuple
            vehicle_type: 'courier', 'car', 'truck'
        
        Returns:
            dict with cost estimation
        """
        try:
            request_data = {
                'pickup': {
                    'location': {
                        'lat': pickup_coords[0],
                        'lon': pickup_coords[1],
                    }
                },
                'dropoff': {
                    'location': {
                        'lat': delivery_coords[0],
                        'lon': delivery_coords[1],
                    }
                },
                'delivery_type': vehicle_type,
            }
            
            response = self._make_request(
                'POST',
                '/v1/delivery/estimate',
                request_data
            )
            
            return {
                'success': True,
                'estimated_cost': response.get('cost'),
                'currency': response.get('currency', 'UZS'),
                'estimated_time': response.get('estimated_time'),
                'distance_km': response.get('distance_km'),
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }
    
    # ==========================================
    # AVAILABLE DELIVERY TYPES
    # ==========================================
    
    def get_available_delivery_types(self, pickup_coords):
        """
        Get available delivery types for location
        
        Args:
            pickup_coords: (latitude, longitude) tuple
        
        Returns:
            list of available delivery types
        """
        try:
            response = self._make_request(
                'GET',
                f'/v1/delivery/types?lat={pickup_coords[0]}&lon={pickup_coords[1]}'
            )
            
            return {
                'success': True,
                'delivery_types': response.get('types', []),
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }
    
    # ==========================================
    # COURIER TRACKING
    # ==========================================
    
    def track_courier(self, external_request_id):
        """
        Track courier location in real-time
        
        Args:
            external_request_id: Yandex delivery request ID
        
        Returns:
            dict with courier location
        """
        try:
            response = self._make_request(
                'GET',
                f'/v1/delivery/{external_request_id}/courier'
            )
            
            return {
                'success': True,
                'courier': {
                    'name': response.get('name'),
                    'phone': response.get('phone'),
                    'vehicle': response.get('vehicle'),
                    'location': {
                        'lat': response.get('lat'),
                        'lon': response.get('lon'),
                    },
                    'bearing': response.get('bearing'),  # direction
                },
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }
    
    # ==========================================
    # DELIVERY HISTORY
    # ==========================================
    
    def get_delivery_history(self, external_request_id):
        """
        Get delivery status history
        
        Args:
            external_request_id: Yandex delivery request ID
        
        Returns:
            list of status changes
        """
        try:
            response = self._make_request(
                'GET',
                f'/v1/delivery/{external_request_id}/history'
            )
            
            return {
                'success': True,
                'history': response.get('events', []),
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }
    
    # ==========================================
    # PRICING
    # ==========================================
    
    def calculate_pricing(self, distance_km, vehicle_type='courier'):
        """
        Calculate delivery pricing based on distance
        
        Args:
            distance_km: Distance in kilometers
            vehicle_type: Delivery type
        
        Returns:
            dict with pricing breakdown
        """
        base_fee = self.integration.base_delivery_fee
        per_km_fee = self.integration.per_km_fee
        
        total_cost = base_fee + (distance_km * per_km_fee)
        
        return {
            'base_fee': float(base_fee),
            'per_km_fee': float(per_km_fee),
            'distance_km': distance_km,
            'total_cost': float(total_cost),
            'currency': 'UZS',
            'vehicle_type': vehicle_type,
        }
