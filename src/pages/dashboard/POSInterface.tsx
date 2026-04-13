import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

interface Product {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
  barcode?: string;
  image?: string;
}

interface CartItem extends Product {
  quantity: number;
  discount: number;
}

interface CashRegister {
  id: number;
  name: string;
  register_code: string;
  is_active: boolean;
  total_sales?: number;
}

const POSInterface: React.FC = () => {
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qr' | 'mixed'>('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pos' | 'transactions'>('pos');

  // Load registers
  useEffect(() => {
    loadRegisters();
    loadRecentTransactions();
  }, []);

  // Load products when search changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      loadProducts(searchQuery);
    }
  }, [searchQuery]);

  const loadRegisters = async () => {
    try {
      const response = await api.get('/pos/registers/');
      setRegisters(response.data);
      const active = response.data.find((r: CashRegister) => r.is_active);
      if (active) setActiveRegister(active);
    } catch (error) {
      console.error('Failed to load registers:', error);
    }
  };

  const loadProducts = async (query: string) => {
    try {
      const response = await api.get(`/products/?search=${query}`);
      setProducts(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadRecentTransactions = async () => {
    try {
      const response = await api.get('/pos/transactions/?limit=10');
      setRecentTransactions(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const openRegister = async () => {
    try {
      setLoading(true);
      
      // If no register exists, create one first
      if (!activeRegister) {
        const createResponse = await api.post('/pos/registers/', {
          store: 1, // Get from user context
          name: 'Main Register',
          register_code: `REG-${Date.now()}`
        });
        setActiveRegister(createResponse.data);
      }
      
      // Open the register
      const registerToOpen = activeRegister || (await api.post('/pos/registers/', {
        store: 1,
        name: 'Main Register',
        register_code: `REG-${Date.now()}`
      })).data;
      
      await api.post(`/pos/registers/${registerToOpen.id}/open/`, {
        starting_cash: 100000
      });
      
      alert('✅ Kassa muvaffaqiyatli ochildi!');
      loadRegisters();
    } catch (error: any) {
      console.error('Open register error:', error);
      alert('❌ Xatolik: ' + (error.response?.data?.detail || error.message || 'Noma\'lum xato'));
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1, discount: 0 }]);
    }
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const handleBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    try {
      const response = await api.get(`/pos/barcodes/lookup/?code=${barcodeInput}`);
      if (response.data.product) {
        const product = await api.get(`/products/${response.data.product}/`);
        addToCart(product.data);
        setBarcodeInput('');
      }
    } catch (error) {
      alert('Barcode topilmadi');
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity - item.discount;
      return sum + itemTotal;
    }, 0);
  };

  const processPayment = async () => {
    if (!activeRegister || cart.length === 0) return;

    try {
      setLoading(true);
      
      const transaction = await api.post('/pos/transactions/', {
        store: 1, // Get from user's store
        register: activeRegister.id,
        payment_method: paymentMethod,
        amount_paid: parseFloat(amountPaid) || calculateTotal(),
        customer_name: customerName,
        customer_phone: customerPhone,
        items: cart.map(item => ({
          product: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          discount: item.discount,
          tax_rate: 12
        }))
      });

      // Complete transaction
      await api.post(`/pos/transactions/${transaction.data.id}/complete/`);

      alert(`To'lov muvaffaqiyatli! Chek raqami: ${transaction.data.transaction_number}`);
      
      // Reset
      setCart([]);
      setShowPayment(false);
      setAmountPaid('');
      setCustomerName('');
      setCustomerPhone('');
      loadRecentTransactions();
    } catch (error: any) {
      alert('To\'lov xatosi: ' + (error.response?.data?.error || 'Noma\'lum xato'));
    } finally {
      setLoading(false);
    }
  };

  const changeAmount = () => {
    const paid = parseFloat(amountPaid) || 0;
    return Math.max(0, paid - calculateTotal());
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Header - Fixed */}
      <div className="bg-white dark:bg-gray-800 shadow-sm flex-shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              💳 POS Terminal
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('pos')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'pos' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                Savdo
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'transactions' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                Tranzaksiyalar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Register Status - Fixed */}
      {activeTab === 'pos' && (
        <div className="px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className={`p-3 rounded-lg ${
            activeRegister?.is_active 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{activeRegister?.is_active ? '✅' : '❌'}</span>
                <div>
                  <h3 className="font-semibold text-sm">
                    {activeRegister?.is_active ? 'Kassa ochiq' : 'Kassa yopiq'}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {activeRegister?.name || 'Kassa tanlanmagan'}
                  </p>
                </div>
              </div>
              {!activeRegister?.is_active && (
                <button
                  onClick={openRegister}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition-all"
                >
                  {loading ? 'Ochilmoqda...' : 'Ochish'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Scrollable inside */}
      {activeTab === 'pos' ? (
        <div className="flex-1 overflow-hidden p-4">
          <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Products Section */}
            <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden">
              {/* Search & Barcode - Fixed */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex-shrink-0">
                <input
                  type="text"
                  placeholder="🔍 Mahsulot qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg mb-3 dark:bg-gray-700 dark:border-gray-600 text-sm"
                />
                <form onSubmit={handleBarcode} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="📦 Barcode..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
                  />
                  <button type="submit" className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-all">
                    Qo'shish
                  </button>
                </form>
              </div>

              {/* Products Grid - Scrollable */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex-1 overflow-hidden flex flex-col">
                <h3 className="font-semibold mb-3 text-sm">Mahsulotlar</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto flex-1">
                  {products.map(product => (
                    <motion.div
                      key={product.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => addToCart(product)}
                      className="p-3 border rounded-lg cursor-pointer hover:border-blue-500 hover:shadow-md transition-all dark:border-gray-700"
                    >
                      {product.image && (
                        <img src={product.image} alt={product.name} className="w-full h-20 object-cover rounded mb-2" />
                      )}
                      <h4 className="font-medium text-xs truncate">{product.name}</h4>
                      <p className="text-blue-600 font-bold text-sm mt-1">
                        {product.price.toLocaleString()} so'm
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {product.stock_quantity} ta
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cart Section - Scrollable */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex flex-col overflow-hidden">
              <h3 className="font-semibold text-base mb-4 flex-shrink-0">🛒 Savat</h3>
              
              <div className="space-y-2 flex-1 overflow-y-auto mb-4">
                <AnimatePresence>
                  {cart.map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-3 border rounded dark:border-gray-700"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-xs flex-1 truncate mr-2">{item.name}</h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-sm font-bold"
                          >
                            -
                          </button>
                          <span className="font-semibold w-6 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-bold text-blue-600 text-sm">
                          {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {cart.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-center text-gray-500 text-sm">Savat bo'sh</p>
                </div>
              ) : (
                <div className="flex-shrink-0 border-t pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Oraliq jami:</span>
                    <span className="font-medium">{calculateSubtotal().toLocaleString()} so'm</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Jami:</span>
                    <span className="text-blue-600">
                      {calculateTotal().toLocaleString()} so'm
                    </span>
                  </div>

                  <button
                    onClick={() => setShowPayment(true)}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-base transition-all"
                  >
                    💳 To'lov qilish
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Transactions Tab */
        <div className="max-w-7xl mx-auto px-4 pb-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-4">Oxirgi tranzaksiyalar</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b dark:border-gray-700">
                    <tr>
                      <th className="text-left py-3 px-4">Tranzaksiya #</th>
                      <th className="text-left py-3 px-4">Sana</th>
                      <th className="text-left py-3 px-4">Mijoz</th>
                      <th className="text-left py-3 px-4">To'lov</th>
                      <th className="text-right py-3 px-4">Summa</th>
                      <th className="text-center py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map(tx => (
                      <tr key={tx.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3 px-4 font-mono text-sm">{tx.transaction_number}</td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(tx.created_at).toLocaleString('uz-UZ')}
                        </td>
                        <td className="py-3 px-4 text-sm">{tx.customer_name || '-'}</td>
                        <td className="py-3 px-4 text-sm capitalize">{tx.payment_method}</td>
                        <td className="py-3 px-4 text-right font-bold text-blue-600">
                          {tx.total.toLocaleString()} so'm
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                            tx.status === 'refunded' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold mb-4">💳 To'lov</h3>
            
            <div className="space-y-4">
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium mb-2">To'lov turi</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['cash', 'card', 'qr', 'mixed'] as const).map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3 rounded border ${
                        paymentMethod === method
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {method === 'cash' && '💵 Naqd'}
                      {method === 'card' && '💳 Karta'}
                      {method === 'qr' && '📱 QR'}
                      {method === 'mixed' && '🔀 Aralash'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Paid */}
              <div>
                <label className="block text-sm font-medium mb-2">To'langan summa</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 border rounded-lg text-2xl font-bold dark:bg-gray-700 dark:border-gray-600"
                  autoFocus
                />
              </div>

              {/* Customer Info */}
              <div>
                <label className="block text-sm font-medium mb-2">Mijoz ismi (ixtiyoriy)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mijoz telefoni (ixtiyoriy)</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span>Jami:</span>
                  <span className="font-bold">{calculateTotal().toLocaleString()} so'm</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>To'landi:</span>
                  <span className="font-bold">{(parseFloat(amountPaid) || 0).toLocaleString()} so'm</span>
                </div>
                {changeAmount() > 0 && (
                  <div className="flex justify-between text-green-600 font-bold border-t pt-2 mt-2">
                    <span>Qaytim:</span>
                    <span>{changeAmount().toLocaleString()} so'm</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 py-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Bekor qilish
              </button>
              <button
                onClick={processPayment}
                disabled={loading || !amountPaid || parseFloat(amountPaid) < calculateTotal()}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {loading ? 'Amalda...' : 'To\'lovni tasdiqlash'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default POSInterface;
