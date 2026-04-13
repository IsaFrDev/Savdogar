import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import api from '../../services/api';

interface Vendor {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  rating: number;
  is_active: boolean;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  vendor_name: string;
  status: string;
  priority: string;
  total: number;
  order_date: string;
  expected_delivery: string;
}

interface ReorderAlert {
  rule_id: number;
  product: string;
  current_stock: number;
  min_level: number;
  reorder_quantity: number;
  vendor: string;
}

interface Expense {
  id: number;
  category_name: string;
  amount: number;
  expense_date: string;
  description: string;
}

const ERPDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'purchase-orders' | 'alerts' | 'shipments' | 'expenses'>('overview');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [showCreateVendor, setShowCreateVendor] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    totalExpenses: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load stats
      const [poAnalytics, expenseAnalytics, reorderAlerts] = await Promise.all([
        api.get('/erp/purchase-orders/analytics/?days=30'),
        api.get('/erp/expenses/analytics/?days=30'),
        api.get('/erp/reorder-rules/alerts/')
      ]);

      setStats({
        totalSpent: poAnalytics.data.total_spent || 0,
        totalOrders: poAnalytics.data.total_orders || 0,
        avgOrderValue: poAnalytics.data.avg_order_value || 0,
        pendingOrders: poAnalytics.data.by_status?.find((s: any) => s.status === 'sent')?.count || 0,
        lowStockItems: reorderAlerts.data.count || 0,
        totalExpenses: expenseAnalytics.data.total_expenses || 0
      });

      setAlerts(reorderAlerts.data.alerts || []);

      // Load recent data
      const [vendorsRes, ordersRes, expensesRes] = await Promise.all([
        api.get('/erp/vendors/?limit=10'),
        api.get('/erp/purchase-orders/?limit=10'),
        api.get('/erp/expenses/?limit=10')
      ]);

      setVendors(vendorsRes.data.results || vendorsRes.data);
      setPurchaseOrders(ordersRes.data.results || ordersRes.data);
      setExpenses(expensesRes.data.results || expensesRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + ' so\'m';
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'draft': 'bg-gray-100 text-gray-800',
      'sent': 'bg-blue-100 text-blue-800',
      'confirmed': 'bg-purple-100 text-purple-800',
      'partial': 'bg-yellow-100 text-yellow-800',
      'received': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: any = {
      'low': 'text-gray-600',
      'medium': 'text-blue-600',
      'high': 'text-orange-600',
      'urgent': 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              🏢 ERP Boshqaruv
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateVendor(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Vendor qo'shish
              </button>
              <button
                onClick={() => setShowCreatePO(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Buyurtma yaratish
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: '📊 Umumiy', },
            { id: 'vendors', label: '👥 Vendorlar' },
            { id: 'purchase-orders', label: '📦 Buyurtmalar' },
            { id: 'alerts', label: '⚠️ Ogohlantirishlar' },
            { id: 'shipments', label: '🚚 Yetkazish' },
            { id: 'expenses', label: '💰 Xarajatlar' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Jami xarajatlar</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {formatCurrency(stats.totalSpent)}
                        </p>
                      </div>
                      <DollarSign className="w-12 h-12 text-green-500" />
                    </div>
                    <div className="flex items-center mt-4 text-sm">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-green-600">{stats.totalOrders} buyurtma</span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">O'rtacha buyurtma</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {formatCurrency(stats.avgOrderValue)}
                        </p>
                      </div>
                      <Package className="w-12 h-12 text-blue-500" />
                    </div>
                    <div className="flex items-center mt-4 text-sm">
                      <Clock className="w-4 h-4 text-blue-500 mr-1" />
                      <span className="text-blue-600">{stats.pendingOrders} kutilmoqda</span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Kam ombor</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                          {stats.lowStockItems} ta
                        </p>
                      </div>
                      <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>
                    <div className="flex items-center mt-4 text-sm">
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                      <span className="text-red-600">Qo'shish kerak</span>
                    </div>
                  </motion.div>
                </div>

                {/* Recent Purchase Orders */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="p-6 border-b dark:border-gray-700">
                    <h3 className="font-semibold text-lg">Oxirgi buyurtmalar</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-semibold">PO #</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold">Vendor</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold">Sana</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold">Summa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseOrders.slice(0, 5).map(po => (
                          <tr key={po.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="py-3 px-4 font-mono text-sm">{po.po_number}</td>
                            <td className="py-3 px-4 text-sm">{po.vendor_name}</td>
                            <td className="py-3 px-4 text-sm">{new Date(po.order_date).toLocaleDateString('uz-UZ')}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(po.status)}`}>
                                {po.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-blue-600">
                              {formatCurrency(po.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Stock Alerts */}
                {alerts.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                      Ombor ogohlantirishlari
                    </h3>
                    <div className="space-y-3">
                      {alerts.slice(0, 5).map((alert, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{alert.product}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Hozir: {alert.current_stock} | Min: {alert.min_level}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">Qo'shish: {alert.reorder_quantity}</p>
                              {alert.vendor && (
                                <p className="text-xs text-gray-500">Vendor: {alert.vendor}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Vendors Tab */}
            {activeTab === 'vendors' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b dark:border-gray-700">
                  <h3 className="font-semibold text-lg">Vendorlar ro'yxati</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Nom</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Kontakt</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Telefon</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Reyting</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendors.map(vendor => (
                        <tr key={vendor.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-semibold">{vendor.name}</p>
                              <p className="text-sm text-gray-500">{vendor.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">{vendor.contact_person}</td>
                          <td className="py-3 px-4 text-sm">{vendor.phone}</td>
                          <td className="py-3 px-4">
                            <span className="text-yellow-600 font-semibold">⭐ {vendor.rating}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              vendor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {vendor.is_active ? 'Faol' : 'Nofaol'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Purchase Orders Tab */}
            {activeTab === 'purchase-orders' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b dark:border-gray-700">
                  <h3 className="font-semibold text-lg">Xarid buyurtmalari</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold">PO #</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Vendor</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Buyurtma sanasi</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Kutilayotgan</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Prioritet</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold">Summa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrders.map(po => (
                        <tr key={po.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="py-3 px-4 font-mono text-sm">{po.po_number}</td>
                          <td className="py-3 px-4 text-sm">{po.vendor_name}</td>
                          <td className="py-3 px-4 text-sm">{new Date(po.order_date).toLocaleDateString('uz-UZ')}</td>
                          <td className="py-3 px-4 text-sm">{new Date(po.expected_delivery).toLocaleDateString('uz-UZ')}</td>
                          <td className="py-3 px-4">
                            <span className={`font-semibold ${getPriorityColor(po.priority)}`}>
                              {po.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(po.status)}`}>
                              {po.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-blue-600">
                            {formatCurrency(po.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-12 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-green-800 dark:text-green-400">
                      Hammasi yaxshi! ✅
                    </h3>
                    <p className="text-green-600 dark:text-green-500 mt-2">
                      Omborda yetarli mahsulot bor
                    </p>
                  </div>
                ) : (
                  alerts.map((alert, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4">
                          <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-lg">{alert.product}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Hozirgi ombor: <span className="font-bold text-red-600">{alert.current_stock}</span>
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Minimal daraja: {alert.min_level}
                            </p>
                            {alert.vendor && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                Tavsiya etilgan vendor: <span className="font-semibold">{alert.vendor}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Qo'shish kerak:</p>
                          <p className="text-2xl font-bold text-blue-600">{alert.reorder_quantity}</p>
                          <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                            Buyurtma yaratish
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* Shipments Tab */}
            {activeTab === 'shipments' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <Truck className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Yetkazib berish tracking</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Tez orada qo'shiladi...
                </p>
              </div>
            )}

            {/* Expenses Tab */}
            {activeTab === 'expenses' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b dark:border-gray-700">
                  <h3 className="font-semibold text-lg">Xarajatlar</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Kategoriya</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Tavsif</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Sana</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold">Summa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(expense => (
                        <tr key={expense.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                              {expense.category_name}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">{expense.description}</td>
                          <td className="py-3 px-4 text-sm">{new Date(expense.expense_date).toLocaleDateString('uz-UZ')}</td>
                          <td className="py-3 px-4 text-right font-bold text-red-600">
                            {formatCurrency(expense.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ERPDashboard;
