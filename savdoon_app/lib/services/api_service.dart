import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/constants.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _token;

  void setToken(String token) {
    _token = token;
  }

  void clearToken() {
    _token = null;
  }

  // GET request
  Future<dynamic> get(String endpoint) async {
    final response = await http.get(
      Uri.parse('${AppConstants.baseUrl}$endpoint'),
      headers: AppConstants.getHeaders(_token),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load data: ${response.statusCode}');
    }
  }

  // POST request
  Future<dynamic> post(String endpoint, Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('${AppConstants.baseUrl}$endpoint'),
      headers: AppConstants.getHeaders(_token),
      body: jsonEncode(data),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to post data: ${response.statusCode}');
    }
  }

  // PUT request
  Future<dynamic> put(String endpoint, Map<String, dynamic> data) async {
    final response = await http.put(
      Uri.parse('${AppConstants.baseUrl}$endpoint'),
      headers: AppConstants.getHeaders(_token),
      body: jsonEncode(data),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to update data: ${response.statusCode}');
    }
  }

  // DELETE request
  Future<dynamic> delete(String endpoint) async {
    final response = await http.delete(
      Uri.parse('${AppConstants.baseUrl}$endpoint'),
      headers: AppConstants.getHeaders(_token),
    );

    if (response.statusCode == 200 || response.statusCode == 204) {
      return true;
    } else {
      throw Exception('Failed to delete data: ${response.statusCode}');
    }
  }

  // POS APIs
  Future<List<dynamic>> getRegisters() async {
    final data = await get(AppConstants.posRegistersEndpoint);
    return data is List ? data : data['results'] ?? [];
  }

  Future<dynamic> openRegister(int registerId, {double startingCash = 100000}) async {
    return await post(
      '${AppConstants.posRegistersEndpoint}$registerId/open/',
      {'starting_cash': startingCash},
    );
  }

  Future<dynamic> createTransaction(Map<String, dynamic> transactionData) async {
    return await post(AppConstants.posTransactionsEndpoint, transactionData);
  }

  Future<dynamic> lookupBarcode(String barcode) async {
    return await get('${AppConstants.posBarcodesEndpoint}?code=$barcode');
  }

  Future<List<dynamic>> getProducts({String? search}) async {
    final endpoint = search != null
        ? '${AppConstants.productsEndpoint}?search=$search'
        : AppConstants.productsEndpoint;
    final data = await get(endpoint);
    return data is List ? data : data['results'] ?? [];
  }

  // ERP APIs
  Future<List<dynamic>> getVendors() async {
    final data = await get(AppConstants.erpVendorsEndpoint);
    return data is List ? data : data['results'] ?? [];
  }

  Future<List<dynamic>> getPurchaseOrders() async {
    final data = await get(AppConstants.erpPurchaseOrdersEndpoint);
    return data is List ? data : data['results'] ?? [];
  }

  Future<dynamic> getReorderAlerts() async {
    return await get(AppConstants.erpReorderRulesEndpoint);
  }

  Future<List<dynamic>> getExpenses() async {
    final data = await get(AppConstants.erpExpensesEndpoint);
    return data is List ? data : data['results'] ?? [];
  }

  // Orders APIs
  Future<List<dynamic>> getOrders() async {
    final data = await get(AppConstants.ordersEndpoint);
    return data is List ? data : data['results'] ?? [];
  }

  Future<dynamic> getOrderStats({int? storeId, String period = '7d'}) async {
    final query = storeId != null ? '?store=$storeId&period=$period' : '?period=$period';
    return await get('${AppConstants.orderStatsEndpoint}$query');
  }

  // Stores APIs
  Future<List<dynamic>> getStores() async {
    final data = await get(AppConstants.storesEndpoint);
    return data is List ? data : data['results'] ?? [];
  }
}
