"""
Uzum Market API Integration
Docs: https://marketplace-api.uzum.uz/
"""
import requests
import json
from datetime import datetime, timedelta
from django.conf import settings
from integrations.models import (
    MarketplaceIntegration, 
    MarketplaceProduct,
    MarketplaceOrder,
    MarketplaceInventoryLog
)
from products.models import Product


class UzumMarketService:
    """Uzum Market API integration service"""
    
    def __init__(self, integration: MarketplaceIntegration):
        self.integration = integration
        self.api_key = integration.api_key
        self.base_url = "https://marketplace-api.uzum.uz"
        
        # Sandbox for testing:
        # self.base_url = "https://marketplace-api.sandbox.uzum.uz"
    
    def _get_headers(self):
        """Get API request headers"""
        return {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    
    def _make_request(self, method, endpoint, data=None):
        """Make API request to Uzum"""
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
            raise Exception(f"Uzum API request failed: {str(e)}")
    
    # ==========================================
    # PRODUCT SYNC
    # ==========================================
    
    def sync_product_to_uzum(self, product: Product):
        """
        Sync local product to Uzum Market
        
        Args:
            product: Local Product instance
        
        Returns:
            dict with sync result
        """
        product_data = {
            'name': product.name,
            'description': product.description or '',
            'price': int(product.price),  # Uzum uses integer (tiyn)
            'currency': 'UZS',
            'sku': product.sku or str(product.id),
            'barcode': product.barcode or '',
            'category_id': self._map_category(product.category),
            'images': self._get_product_images(product),
            'attributes': {
                'brand': product.brand or '',
                'weight': str(product.weight or 0),
                'dimensions': {
                    'length': product.length or 0,
                    'width': product.width or 0,
                    'height': product.height or 0,
                } if hasattr(product, 'length') else {},
            },
            'stock': {
                'quantity': product.stock_quantity,
                'warehouse_id': self.integration.marketplace_warehouse_id,
            },
        }
        
        # Apply price markup
        if self.integration.price_markup_percentage > 0:
            markup = product_data['price'] * (self.integration.price_markup_percentage / 100)
            product_data['price'] = int(product_data['price'] + markup)
        
        try:
            # Check if product already exists on Uzum
            marketplace_product = MarketplaceProduct.objects.filter(
                integration=self.integration,
                local_product_id=product.id
            ).first()
            
            if marketplace_product and marketplace_product.marketplace_product_id:
                # Update existing product
                response = self._make_request(
                    'PUT',
                    f'/api/v1/products/{marketplace_product.marketplace_product_id}',
                    product_data
                )
            else:
                # Create new product
                response = self._make_request('POST', '/api/v1/products', product_data)
                
                # Create mapping
                if not marketplace_product:
                    marketplace_product = MarketplaceProduct.objects.create(
                        integration=self.integration,
                        local_product_id=product.id,
                    )
                
                marketplace_product.marketplace_product_id = response.get('id')
                marketplace_product.marketplace_sku = product_data['sku']
                marketplace_product.sync_status = 'synced'
                from django.utils import timezone
                marketplace_product.last_synced_at = timezone.now()
                marketplace_product.marketplace_data = response
                marketplace_product.save()
            
            return {
                'success': True,
                'product_id': marketplace_product.marketplace_product_id,
                'message': 'Product synced successfully'
            }
            
        except Exception as e:
            # Update sync status to error
            marketplace_product, _ = MarketplaceProduct.objects.get_or_create(
                integration=self.integration,
                local_product_id=product.id
            )
            marketplace_product.sync_status = 'error'
            marketplace_product.sync_error = str(e)
            marketplace_product.save()
            
            return {
                'success': False,
                'error': str(e)
            }
    
    def sync_all_products(self):
        """Sync all active products to Uzum"""
        products = Product.objects.filter(active=True, store=self.integration.store)
        
        results = {
            'total': products.count(),
            'success': 0,
            'failed': 0,
            'errors': []
        }
        
        for product in products:
            result = self.sync_product_to_uzum(product)
            if result['success']:
                results['success'] += 1
            else:
                results['failed'] += 1
                results['errors'].append({
                    'product_id': product.id,
                    'error': result['error']
                })
        
        # Update last sync time
        from django.utils import timezone
        self.integration.last_sync_at = timezone.now()
        self.integration.is_syncing = False
        self.integration.save()
        
        return results
    
    # ==========================================
    # ORDER SYNC
    # ==========================================
    
    def sync_orders_from_uzum(self, hours_back=24):
        """
        Fetch new orders from Uzum Market
        
        Args:
            hours_back: How many hours back to fetch orders
        
        Returns:
            dict with sync results
        """
        # Calculate time range
        from_time = datetime.now() - timedelta(hours=hours_back)
        from_iso = from_time.isoformat()
        
        try:
            # Fetch orders
            response = self._make_request(
                'GET',
                f'/api/v1/orders?from={from_iso}&status=new'
            )
            
            orders_data = response.get('orders', [])
            results = {
                'total': len(orders_data),
                'synced': 0,
                'errors': []
            }
            
            for order_data in orders_data:
                try:
                    self._create_marketplace_order(order_data)
                    results['synced'] += 1
                except Exception as e:
                    results['errors'].append({
                        'order_id': order_data.get('id'),
                        'error': str(e)
                    })
            
            # Update last sync time
            from django.utils import timezone
            self.integration.last_sync_at = timezone.now()
            self.integration.save()
            
            return results
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _create_marketplace_order(self, order_data):
        """Create marketplace order from Uzum data"""
        marketplace_order, created = MarketplaceOrder.objects.get_or_create(
            integration=self.integration,
            marketplace_order_id=str(order_data['id']),
            defaults={
                'marketplace_order_number': order_data.get('orderNumber', ''),
                'status': order_data.get('status', 'new'),
                'total_amount': order_data.get('totalPrice', 0),
                'currency': 'UZS',
                'customer_name': order_data.get('customer', {}).get('name', ''),
                'customer_phone': order_data.get('customer', {}).get('phone', ''),
                'delivery_address': json.dumps(order_data.get('deliveryAddress', {})),
                'items_data': order_data.get('items', []),
                'marketplace_data': order_data,
            }
        )
        
        return marketplace_order
    
    # ==========================================
    # INVENTORY SYNC
    # ==========================================
    
    def sync_inventory(self, product_id=None):
        """
        Sync inventory levels to Uzum
        
        Args:
            product_id: Specific product ID (None for all)
        """
        if product_id:
            products = Product.objects.filter(id=product_id, store=self.integration.store)
        else:
            products = Product.objects.filter(active=True, store=self.integration.store)
        
        results = {'success': 0, 'failed': 0}
        
        for product in products:
            try:
                # Get marketplace product mapping
                marketplace_product = MarketplaceProduct.objects.filter(
                    integration=self.integration,
                    local_product_id=product.id
                ).first()
                
                if not marketplace_product or not marketplace_product.marketplace_product_id:
                    continue
                
                # Update stock on Uzum
                stock_data = {
                    'quantity': product.stock_quantity,
                    'warehouse_id': self.integration.marketplace_warehouse_id,
                }
                
                self._make_request(
                    'PUT',
                    f"/api/v1/products/{marketplace_product.marketplace_product_id}/stock",
                    stock_data
                )
                
                # Log sync
                MarketplaceInventoryLog.objects.create(
                    integration=self.integration,
                    product_id=product.id,
                    sync_type='push',
                    local_stock=product.stock_quantity,
                    marketplace_stock=product.stock_quantity,
                    synced_stock=product.stock_quantity,
                    success=True,
                )
                
                results['success'] += 1
                
            except Exception as e:
                # Log error
                MarketplaceInventoryLog.objects.create(
                    integration=self.integration,
                    product_id=product.id,
                    sync_type='push',
                    local_stock=product.stock_quantity,
                    marketplace_stock=0,
                    synced_stock=0,
                    success=False,
                    error_message=str(e),
                )
                
                results['failed'] += 1
        
        return results
    
    # ==========================================
    # ANALYTICS
    # ==========================================
    
    def get_sales_analytics(self, days=30):
        """Get sales analytics from Uzum"""
        from_date = datetime.now() - timedelta(days=days)
        
        response = self._make_request(
            'GET',
            f'/api/v1/analytics/sales?from={from_date.isoformat()}'
        )
        
        return response
    
    def get_product_performance(self):
        """Get product performance metrics"""
        response = self._make_request('GET', '/api/v1/analytics/products')
        return response
    
    # ==========================================
    # HELPERS
    # ==========================================
    
    def _map_category(self, local_category):
        """Map local category to Uzum category"""
        # This should be implemented based on your category structure
        # For now, return a default category
        return 'default'
    
    def _get_product_images(self, product):
        """Get product images URLs"""
        if hasattr(product, 'images') and product.images:
            return [product.images.url] if hasattr(product.images, 'url') else []
        return []
