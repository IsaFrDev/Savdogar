"""
Wildberries Marketplace API Integration
Docs: https://seller.wildberries.ru/api
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


class WildberriesService:
    """Wildberries marketplace API integration"""
    
    def __init__(self, integration: MarketplaceIntegration):
        self.integration = integration
        self.api_key = integration.api_key
        
        # Wildberries API URLs
        self.base_url = "https://seller-analytics-api.wildberries.ru"
        self.content_url = "https://content-api.wildberries.ru"
        self.prices_url = "https://marketplace-api.wildberries.ru"
        
        # Sandbox for testing:
        # self.base_url = "https://seller-analytics-api-sandbox.wildberries.ru"
    
    def _get_headers(self, api_type='analytics'):
        """Get API request headers"""
        if api_type == 'content':
            return {
                'Authorization': self.api_key,
                'Content-Type': 'application/json',
            }
        elif api_type == 'prices':
            return {
                'Authorization': self.api_key,
                'Content-Type': 'application/json',
            }
        else:  # analytics
            return {
                'Authorization': self.api_key,
                'Accept': 'application/json',
            }
    
    def _make_request(self, method, endpoint, data=None, api_type='analytics'):
        """Make API request to Wildberries"""
        base_urls = {
            'analytics': self.base_url,
            'content': self.content_url,
            'prices': self.prices_url,
        }
        
        url = f"{base_urls.get(api_type, self.base_url)}{endpoint}"
        headers = self._get_headers(api_type)
        
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
            raise Exception(f"Wildberries API request failed: {str(e)}")
    
    # ==========================================
    # PRODUCT SYNC
    # ==========================================
    
    def sync_product_to_wb(self, product: Product):
        """
        Sync local product to Wildberries
        
        Args:
            product: Local Product instance
        
        Returns:
            dict with sync result
        """
        # WB requires specific product structure
        product_data = {
            'subject': self._map_category(product.category),
            'brand': product.brand or 'No Brand',
            'vendorCode': product.sku or str(product.id),
            'characteristics': [
                {
                    'name': 'Состав',
                    'value': product.description or 'Not specified',
                }
            ],
            'barcode': product.barcode or f"WB{product.id}",
            'price': int(product.price),  # In rubles * 100
            'discount': 0,
            'sizes': [{
                'techSize': 'ONE_SIZE',
                'price': int(product.price),
                'discount': 0,
            }],
        }
        
        # Apply price markup
        if self.integration.price_markup_percentage > 0:
            markup = product_data['price'] * (self.integration.price_markup_percentage / 100)
            product_data['price'] = int(product_data['price'] + markup)
            product_data['sizes'][0]['price'] = product_data['price']
        
        try:
            # Check if product already exists
            marketplace_product = MarketplaceProduct.objects.filter(
                integration=self.integration,
                local_product_id=product.id
            ).first()
            
            if marketplace_product and marketplace_product.marketplace_product_id:
                # Update existing product (content API)
                response = self._make_request(
                    'POST',
                    '/api/v3/cards/cursor/list',
                    {'vendorCodes': [product_data['vendorCode']]},
                    api_type='content'
                )
                
                # Update price
                self._make_request(
                    'POST',
                    '/api/v2/upload/task',
                    {
                        'data': [{
                            'nmID': int(marketplace_product.marketplace_product_id),
                            'prices': [{
                                'price': product_data['price'],
                            }]
                        }]
                    },
                    api_type='prices'
                )
            else:
                # Create new product card
                # Note: WB requires manual card creation or content API
                # This is a simplified version
                response = {
                    'nmID': None,  # Would be created manually or via content API
                    'vendorCode': product_data['vendorCode'],
                }
                
                # Create mapping
                if not marketplace_product:
                    marketplace_product = MarketplaceProduct.objects.create(
                        integration=self.integration,
                        local_product_id=product.id,
                    )
                
                marketplace_product.marketplace_sku = product_data['vendorCode']
                marketplace_product.sync_status = 'synced'
                marketplace_product.marketplace_data = response
                from django.utils import timezone
                marketplace_product.last_synced_at = timezone.now()
                marketplace_product.save()
            
            return {
                'success': True,
                'product_id': marketplace_product.marketplace_product_id,
                'message': 'Product synced successfully'
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
        """Sync all active products to Wildberries"""
        products = Product.objects.filter(active=True, store=self.integration.store)
        
        results = {
            'total': products.count(),
            'success': 0,
            'failed': 0,
            'errors': []
        }
        
        for product in products:
            result = self.sync_product_to_wb(product)
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
    
    def sync_orders_from_wb(self, hours_back=24):
        """
        Fetch new orders from Wildberries
        
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
            # Fetch orders (sales report)
            response = self._make_request(
                'GET',
                '/api/v1/supplier/reportDetailByPeriod',
                {
                    'dateFrom': start_date.strftime('%Y-%m-%dT00:00:00'),
                    'dateTo': end_date.strftime('%Y-%m-%dT23:59:59'),
                }
            )
            
            orders_data = response.get('data', [])
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
                        'order_id': order_data.get('rdId'),
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
        """Create marketplace order from WB data"""
        # WB order structure is different - uses sales reports
        marketplace_order, created = MarketplaceOrder.objects.get_or_create(
            integration=self.integration,
            marketplace_order_id=str(order_data.get('rdId', '')),
            defaults={
                'marketplace_order_number': order_data.get('srid', ''),
                'status': 'new',
                'total_amount': order_data.get('totalPrice', 0),
                'currency': 'RUB',
                'customer_name': '',
                'delivery_address': '',
                'items_data': [order_data],
                'marketplace_data': order_data,
            }
        )
        
        return marketplace_order
    
    # ==========================================
    # INVENTORY SYNC
    # ==========================================
    
    def sync_inventory(self, product_id=None):
        """
        Sync inventory levels to Wildberries
        Note: WB manages inventory at their warehouses
        """
        # WB doesn't allow direct stock updates
        # You can only view stock at WB warehouses
        
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
                
                if not marketplace_product:
                    continue
                
                # Get stock info from WB
                stock_info = self.get_product_stock(product.id)
                
                # Log sync
                MarketplaceInventoryLog.objects.create(
                    integration=self.integration,
                    product_id=product.id,
                    sync_type='pull',
                    local_stock=product.stock_quantity,
                    marketplace_stock=stock_info.get('stock', 0),
                    synced_stock=product.stock_quantity,
                    success=True,
                )
                
                results['success'] += 1
                
            except Exception as e:
                MarketplaceInventoryLog.objects.create(
                    integration=self.integration,
                    product_id=product.id,
                    sync_type='pull',
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
        """Get sales analytics from Wildberries"""
        from datetime import datetime, timedelta
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        response = self._make_request(
            'GET',
            '/api/v1/supplier/reportDetailByPeriod',
            {
                'dateFrom': start_date.strftime('%Y-%m-%dT00:00:00'),
                'dateTo': end_date.strftime('%Y-%m-%dT23:59:59'),
            }
        )
        
        return response
    
    def get_product_stock(self, product_id):
        """Get product stock at WB warehouses"""
        try:
            marketplace_product = MarketplaceProduct.objects.get(
                integration=self.integration,
                local_product_id=product_id
            )
            
            if not marketplace_product.marketplace_product_id:
                return {'stock': 0}
            
            # Get stock from WB
            response = self._make_request(
                'POST',
                '/api/v3/stocks',
                {
                    'skus': [marketplace_product.marketplace_sku],
                },
                api_type='content'
            )
            
            return {
                'stock': response.get('stocks', [{}])[0].get('amount', 0),
                'warehouses': response.get('stocks', []),
            }
            
        except Exception as e:
            return {'stock': 0, 'error': str(e)}
    
    def get_financial_report(self, month=None):
        """Get financial report for a month"""
        if month is None:
            month = datetime.now().strftime('%Y-%m')
        
        response = self._make_request(
            'GET',
            f'/api/v1/finance/realization?month={month}'
        )
        
        return response
    
    # ==========================================
    # HELPERS
    # ==========================================
    
    def _map_category(self, local_category):
        """Map local category to WB subject"""
        # WB uses 'subjects' - predefined categories
        # This should be implemented based on your category structure
        category_mapping = {
            'electronics': 'Электроника',
            'clothing': 'Одежда',
            'shoes': 'Обувь',
            'home': 'Товары для дома',
        }
        return category_mapping.get(str(local_category).lower(), 'Другое')
    
    def update_price(self, product_id, new_price):
        """Update product price on WB"""
        try:
            marketplace_product = MarketplaceProduct.objects.get(
                integration=self.integration,
                local_product_id=product_id
            )
            
            response = self._make_request(
                'POST',
                '/api/v2/upload/task',
                {
                    'data': [{
                        'nmID': int(marketplace_product.marketplace_product_id),
                        'prices': [{
                            'price': int(new_price),
                        }]
                    }]
                },
                api_type='prices'
            )
            
            return {
                'success': True,
                'message': 'Price update task created',
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
