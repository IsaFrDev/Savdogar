import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../providers/cart_provider.dart';
import 'package:provider/provider.dart';

class POSScreen extends StatefulWidget {
  const POSScreen({super.key});

  @override
  State<POSScreen> createState() => _POSScreenState();
}

class _POSScreenState extends State<POSScreen> {
  final ApiService _api = ApiService();
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _barcodeController = TextEditingController();

  List<dynamic> _products = [];
  List<dynamic> _registers = [];
  dynamic _activeRegister;
  bool _isLoading = false;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadRegisters();
  }

  Future<void> _loadRegisters() async {
    try {
      final registers = await _api.getRegisters();
      setState(() {
        _registers = registers;
        _activeRegister = registers.firstWhere(
          (r) => r['is_active'] == true,
          orElse: () => null,
        );
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Xatolik: $e')),
        );
      }
    }
  }

  Future<void> _openRegister() async {
    setState(() => _isLoading = true);
    try {
      if (_activeRegister == null && _registers.isNotEmpty) {
        _activeRegister = _registers.first;
      }

      if (_activeRegister != null) {
        await _api.openRegister(_activeRegister['id']);
        await _loadRegisters();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('✅ Kassa ochildi!')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ Xatolik: $e')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _searchProducts(String query) async {
    if (query.length < 2) {
      setState(() => _products = []);
      return;
    }

    try {
      final products = await _api.getProducts(search: query);
      setState(() => _products = products);
    } catch (e) {
      debugPrint('Search error: $e');
    }
  }

  void _addToCart(Map<String, dynamic> product) {
    final cart = context.read<CartProvider>();
    cart.addItem(
      product['id'],
      product['name'],
      (product['price'] as num).toDouble(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('💳 POS Terminal'),
        backgroundColor: Colors.white,
        elevation: 1,
      ),
      body: Column(
        children: [
          // Register Status
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: (_activeRegister?['is_active'] ?? false)
                  ? Colors.green.shade50
                  : Colors.red.shade50,
              border: Border.all(
                color: (_activeRegister?['is_active'] ?? false)
                    ? Colors.green
                    : Colors.red,
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Text(
                      (_activeRegister?['is_active'] ?? false) ? '✅' : '❌',
                      style: const TextStyle(fontSize: 24),
                    ),
                    const SizedBox(width: 8),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          (_activeRegister?['is_active'] ?? false)
                              ? 'Kassa ochiq'
                              : 'Kassa yopiq',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        Text(
                          _activeRegister?['name'] ?? 'Kassa tanlanmagan',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                if (!(_activeRegister?['is_active'] ?? false))
                  ElevatedButton(
                    onPressed: _isLoading ? null : _openRegister,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation(Colors.white),
                            ),
                          )
                        : const Text('Ochish'),
                  ),
              ],
            ),
          ),

          // Search Bar
          Padding(
            padding: const EdgeInsets.all(8),
            child: TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                labelText: '🔍 Mahsulot qidirish...',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: _searchProducts,
            ),
          ),

          // Products Grid
          Expanded(
            child: _products.isEmpty
                ? Center(
                    child: Text(
                      _searchQuery.isEmpty
                          ? 'Mahsulot qidirishni boshlang'
                          : 'Mahsulot topilmadi',
                      style: TextStyle(color: Colors.grey.shade600),
                    ),
                  )
                : GridView.builder(
                    padding: const EdgeInsets.all(8),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 8,
                      mainAxisSpacing: 8,
                      childAspectRatio: 0.75,
                    ),
                    itemCount: _products.length,
                    itemBuilder: (context, index) {
                      final product = _products[index];
                      return Card(
                        elevation: 1,
                        child: InkWell(
                          onTap: () => _addToCart(product),
                          borderRadius: BorderRadius.circular(8),
                          child: Padding(
                            padding: const EdgeInsets.all(8),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (product['image'] != null)
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(4),
                                    child: Image.network(
                                      product['image'],
                                      height: 80,
                                      width: double.infinity,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => const Icon(
                                        Icons.image,
                                        size: 80,
                                        color: Colors.grey,
                                      ),
                                    ),
                                  ),
                                const SizedBox(height: 4),
                                Text(
                                  product['name'] ?? 'Unknown',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const Spacer(),
                                Text(
                                  '${(product['price'] as num).toStringAsFixed(0)} so\'m',
                                  style: const TextStyle(
                                    color: Colors.blue,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                                Text(
                                  '${product['stock_quantity'] ?? 0} ta',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),

          // Cart Summary
          Consumer<CartProvider>(
            builder: (context, cart, _) {
              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border(
                    top: BorderSide(color: Colors.grey.shade200),
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Jami:',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '${cart.subtotal.toStringAsFixed(0)} so\'m',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: cart.itemCount > 0
                            ? () {
                                // TODO: Show payment dialog
                              }
                            : null,
                        icon: const Icon(Icons.payment),
                        label: Text('To\'lov qilish (${cart.itemCount})'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    _barcodeController.dispose();
    super.dispose();
  }
}
