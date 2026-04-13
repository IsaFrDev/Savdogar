class AppConstants {
  // API Configuration
  static const String baseUrl = 'http://10.0.2.2:8000'; // Android emulator
  // For physical device, use your computer's IP: static const String baseUrl = 'http://192.168.1.100:8000';
  
  // Auth Endpoints
  static const String loginEndpoint = '/api/auth/login/';
  static const String registerEndpoint = '/api/auth/register/';
  
  // POS Endpoints
  static const String posRegistersEndpoint = '/api/pos/registers/';
  static const String posTransactionsEndpoint = '/api/pos/transactions/';
  static const String posBarcodesEndpoint = '/api/pos/barcodes/lookup/';
  
  // ERP Endpoints
  static const String erpVendorsEndpoint = '/api/erp/vendors/';
  static const String erpPurchaseOrdersEndpoint = '/api/erp/purchase-orders/';
  static const String erpReorderRulesEndpoint = '/api/erp/reorder-rules/alerts/';
  static const String erpExpensesEndpoint = '/api/erp/expenses/';
  
  // Products Endpoints
  static const String productsEndpoint = '/api/products/';
  
  // Orders Endpoints
  static const String ordersEndpoint = '/api/orders/';
  static const String orderStatsEndpoint = '/api/orders/stats/';
  
  // Stores Endpoints
  static const String storesEndpoint = '/api/stores/';
  
  // Headers
  static Map<String, String> getHeaders(String? token) {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }
}
