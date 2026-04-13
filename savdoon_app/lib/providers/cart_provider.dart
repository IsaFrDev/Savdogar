import 'package:flutter/material.dart';

class CartItem {
  final int id;
  final String name;
  final double price;
  int quantity;

  CartItem({
    required this.id,
    required this.name,
    required this.price,
    this.quantity = 1,
  });

  double get total => price * quantity;
}

class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);
  int get itemCount => _items.length;
  
  double get subtotal {
    return _items.fold(0, (sum, item) => sum + item.total);
  }

  void addItem(int id, String name, double price) {
    final existingItem = _items.firstWhere(
      (item) => item.id == id,
      orElse: () => CartItem(id: 0, name: '', price: 0),
    );

    if (existingItem.id != 0) {
      existingItem.quantity++;
    } else {
      _items.add(CartItem(id: id, name: name, price: price));
    }
    notifyListeners();
  }

  void removeItem(int id) {
    _items.removeWhere((item) => item.id == id);
    notifyListeners();
  }

  void updateQuantity(int id, int quantity) {
    final item = _items.firstWhere(
      (item) => item.id == id,
      orElse: () => CartItem(id: 0, name: '', price: 0),
    );

    if (item.id != 0) {
      if (quantity <= 0) {
        _items.remove(item);
      } else {
        item.quantity = quantity;
      }
      notifyListeners();
    }
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }
}
