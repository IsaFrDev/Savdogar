"""
Ozon Marketplace API Integration
Docs: https://docs.ozon.ru/api/seller/
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


class OzonService:
    """Ozon marketplace API integration"""
    
    def __init__(self, integration: MarketplaceIntegration):
        self.integration = integration
        self.api_key = integration.api_key
        self.client_id = integration.api_secret  # Ozon uses Client-ID + API-Key
        
        # Ozon API URLs
        self.base_url = "https://api-seller.ozon.ru"
        
        # Sandbox for testing:
        # self.base_url = "https://api-seller.ozon.ru"  # Use test credentials
    
    def _get_headers(self):
        """Get API request headers"""
        return {
            'Client-Id': self.client_id,
            'Api-Key': self.api_key,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    
    def _make_request(self, method, endpoint, data=None):
        """Make API request to Ozon"""
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers()
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=data, timeout=30)
            elif method == 'POST':
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, json=data, timeout=30)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            
            if response.status_code == 204:
                return {'success': True}
            
            return response.json()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Ozon API request failed: {str(e)}")
    
    # ==========================================
    # PRODUCT SYNC
    # ==========================================
    
    def sync_product_to_ozon(self, product: Product):
        """
        Sync local product to Ozon
        
        Args:
            product: Local Product instance
        
        Returns:
            dict with sync result
        """
        # Ozon requires product import via API
        product_data = {
            'items': [{
                'name': product.name,
                'description_category_id': self._map_category(product.category),
                'type_id': self._get_type_id(product.category),
                'currency_code': 'RUB',
                'old_price': str(product.price * 1.2),  # 20% markup as "old price"
                'price': str(product.price),
                'vat': '0.1',  # 10% VAT
                'images': self._get_product_images(product),
                'images360': [],
                'attributes': [
                    {
                        'complex_id': 0,
                        'id': self._get_brand_attribute_id(),
                        'values': [{
                            'dictionary_value_id': 0,
                            'value': product.brand or 'No Brand',
                        }]
                    }
                ],
                'complex_attributes': [],
                'color_image': '',
                'primary_image': self._get_primary_image(product),
                'sku': product.sku or f"OZON{product.id}",
                'barcodes': [product.barcode] if product.barcode else [],
                'weight': float(product.weight or 0),
                'weight_unit': 'g',
                'depth': float(product.length or 0),
                'width': float(product.width or 0),
                'height': float(product.height or 0),
                'dimension_unit': 'mm',
            }]
        }
        
        # Apply price markup
        if self.integration.price_markup_percentage > 0:
            markup = product.price * (self.integration.price_markup_percentage / 100)
            new_price = product.price + markup
            product_data['items'][0]['price'] = str(new_price)
            product_data['items'][0]['old_price'] = str(new_price * 1.2)
        
        try:
            marketplace_product = MarketplaceProduct.objects.filter(
                integration=self.integration,
                local_product_id=product.id
            ).first()
            
            if marketplace_product and marketplace_product.marketplace_product_id:
                # Update existing product
                response = self._make_request(
                    'POST',
                    '/v2/product/import',
                    product_data
                )
            else:
                # Create new product
                response = self._make_request(
                    'POST',
                    '/v2/product/import',
                    product_data
                )
                
                # Create mapping
                if not marketplace_product:
                    marketplace_product = MarketplaceProduct.objects.create(
                        integration=self.integration,
                        local_product_id=product.id,
                    )
                
                marketplace_product.marketplace_sku = product_data['items'][0]['sku']
                marketplace_product.sync_status = 'synced'
                from django.utils import timezone
                marketplace_product.last_synced_at = timezone.now()
                marketplace_product.marketplace_data = response
                marketplace_product.save()
            
            return {
                'success': True,
                'product_id': marketplace_product.marketplace_product_id,
                'message': 'Product imported successfully',
                'task_id': response.get('task_id'),
            }
            
        except Exception as e:
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
        """Sync all active products to Ozon"""
        products = Product.objects.filter(active=True, store=self.integration.store)
        
        results = {
            'total': products.count(),
            'success': 0,
            'failed': 0,
            'errors': []
        }
        
        for product in products:
            result = self.sync_product_to_ozon(product)
            if result['success']:
                results['success'] += 1
            else:
                results['failed'] += 1
                results['errors'].append({
                    'product_id': product.id,
                    'error': result['error']
                })
        
        from django.utils import timezone
        self.integration.last_sync_at = timezone.now()
        self.integration.is_syncing = False
        self.integration.save()
        
        return results
    
    # ==========================================
    # ORDER SYNC
    # ==========================================
    
    def sync_orders_from_ozon(self, hours_back=24):
        """
        Fetch new orders from Ozon
        
        Args:
            hours_back: How many hours back to fetch orders
        
        Returns:
            dict with sync results
        """
        from datetime import datetime, timedelta
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(hours=hours_back)
        
        try:
            # Fetch orders
            response = self._make_request(
                'POST',
                '/v3/order/list',
                {
                    'dir': 'ASC',
                    'filter': {
                        'since': start_date.strftime('%Y-%m-%dT00:00:00Z'),
                        'to': end_date.strftime('%Y-%m-%dT23:59:59Z'),
                        'status': 'awaiting_packaging',  # New orders
                        'warehouse_id': self.integration.marketplace_warehouse_id if self.integration.marketplace_warehouse_id else None,
                    },
                    'limit': 1000,
                    'offset': 0,
                    'with': {
                        'analytics_data': True,
                        'financial_data': True,
                    }
                }
            )
            
            orders_data = response.get('postings', [])
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
                        'order_id': order_data.get('order_number'),
                        'error': str(e)
                    })
            
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
        """Create marketplace order from Ozon data"""
        marketplace_order, created = MarketplaceOrder.objects.get_or_create(
            integration=self.integration,
            marketplace_order_id=str(order_data.get('posting_number', '')),
            defaults={
                'marketplace_order_number': order_data.get('order_number', ''),
                'status': order_data.get('status', 'new'),
                'total_amount': float(order_data.get('in_process_at', 0)),
                'currency': 'RUB',
                'customer_name': order_data.get('customer', {}).get('name', ''),
                'delivery_address': json.dumps(order_data.get('address', {})),
                'items_data': order_data.get('products', []),
                'marketplace_data': order_data,
            }
        )
        
        return marketplace_order
    
    # ==========================================
    # INVENTORY SYNC
    # ==========================================
    
    def sync_inventory(self, product_id=None):
        """
        Sync inventory levels to Ozon
        """
        if product_id:
            products = Product.objects.filter(id=product_id, store=self.integration.store)
        else:
            products = Product.objects.filter(active=True, store=self.integration.store)
        
        results = {'success': 0, 'failed': 0}
        
        for product in products:
            try:
                marketplace_product = MarketplaceProduct.objects.filter(
                    integration=self.integration,
                    local_product_id=product.id
                ).first()
                
                if not marketplace_product or not marketplace_product.marketplace_sku:
                    continue
                
                # Update stock on Ozon
                stock_data = {
                    'stocks': [{
                        'offer_id': marketplace_product.marketplace_sku,
                        'stock': product.stock_quantity,
                        'warehouse_id': int(self.integration.marketplace_warehouse_id) if self.integration.marketplace_warehouse_id else 1,
                    }]
                }
                
                response = self._make_request(
                    'POST',
                    '/v2/product/import/stocks',
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
        """Get sales analytics from Ozon"""
        from datetime import datetime, timedelta
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        response = self._make_request(
            'POST',
            '/v1/analytics/data',
            {
                'date_from': start_date.strftime('%Y-%m-%d'),
                'date_to': end_date.strftime('%Y-%m-%d'),
                'metrics': [
                    'hits_view_search',
                    'hits_view_pdp',
                    'hits_tocart',
                    'orders',
                    'revenue',
                    'returns',
                    'cancellations',
                    'delivered_units',
                ],
                'dimension': ['sku'],
            }
        )
        
        return response
    
    def get_product_performance(self):
        """Get product performance metrics"""
        response = self._make_request(
            'POST',
            '/v1/product/list',
            {
                'filter': {
                    'visibility': 'ALL',
                },
                'last_id': '',
                'limit': 1000,
            }
        )
        
        return response
    
    def get_financial_report(self, month=None):
        """Get financial report for a period"""
        if month is None:
            month = datetime.now().strftime('%Y-%m')
        
        response = self._make_request(
            'POST',
            '/v1/finance/realization',
            {
                'month': month,
            }
        )
        
        return response
    
    # ==========================================
    # PRICING
    # ==========================================
    
    def update_price(self, product_id, new_price):
        """Update product price on Ozon"""
        try:
            marketplace_product = MarketplaceProduct.objects.get(
                integration=self.integration,
                local_product_id=product_id
            )
            
            response = self._make_request(
                'POST',
                '/v1/product/import/prices',
                {
                    'prices': [{
                        'offer_id': marketplace_product.marketplace_sku,
                        'price': str(new_price),
                        'old_price': str(new_price * 1.2),
                        'premium_price': str(new_price * 0.9),
                        'vat': '0.1',
                        'min_price': str(new_price * 0.8),
                    }]
                }
            )
            
            return {
                'success': True,
                'message': 'Price updated successfully',
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    # ==========================================
    # HELPERS
    # ==========================================
    
    def _map_category(self, local_category):
        """Map local category to Ozon category ID"""
        # Ozon uses numeric category IDs
        # You need to fetch categories from Ozon API and map them
        category_mapping = {
            'electronics': 12345,  # Example ID
            'clothing': 12346,
            'shoes': 12347,
            'home': 12348,
        }
        return category_mapping.get(str(local_category).lower(), 0)
    
    def _get_type_id(self, category):
        """Get product type ID for category"""
        # Ozon requires product type ID
        type_mapping = {
            'electronics': 1,
            'clothing': 2,
            'shoes': 3,
            'home': 4,
        }
        return type_mapping.get(str(category).lower(), 0)
    
    def _get_brand_attribute_id(self):
        """Get brand attribute ID"""
        return 5076  # Standard Ozon brand attribute ID
    
    def _get_product_images(self, product):
        """Get product images URLs"""
        if hasattr(product, 'images') and product.images:
            return [product.images.url] if hasattr(product.images, 'url') else []
        return []
    
    def _get_primary_image(self, product):
        """Get primary image URL"""
        if hasattr(product, 'images') and product.images:
            return product.images.url if hasattr(product.images, 'url') else ''
        return ''
    
    def get_product_info(self, product_id):
        """Get detailed product information from Ozon"""
        try:
            marketplace_product = MarketplaceProduct.objects.get(
                integration=self.integration,
                local_product_id=product_id
            )
            
            response = self._make_request(
                'POST',
                '/v2/product/list',
                {
                    'filter': {
                        'offer_id': [marketplace_product.marketplace_sku],
                    },
                    'last_id': '',
                    'limit': 1,
                }
            )
            
            return {
                'success': True,
                'product': response.get('items', [{}])[0],
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
