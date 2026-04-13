import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/glass_container.dart';
import '../../providers/auth_provider.dart';
import '../auth/login_screen.dart';
import '../pos/pos_screen.dart';
import '../erp/erp_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const DashboardScreen(),
    const MarketplaceScreen(), // New Marketplace focus
    const POSScreen(),
    const ERPScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      extendBody: true, // Allows content to be behind the bottom bar
      body: Stack(
        children: [
          // Global Background Glow
          Positioned(
            top: -150,
            right: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary.withOpacity(0.05),
              ),
            ),
          ),

          IndexedStack(
            index: _selectedIndex,
            children: _screens,
          ),
        ],
      ),
      bottomNavigationBar: _buildModernNav(),
    );
  }

  Widget _buildModernNav() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      child: GlassContainer(
        borderRadius: 30,
        blur: 20,
        opacity: 0.1,
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildNavItem(0, Icons.grid_view_rounded, 'Boshqaruv'),
            _buildNavItem(1, Icons.shopping_bag_outlined, 'Bozor'),
            _buildNavItem(2, Icons.point_of_sale_rounded, 'POS'),
            _buildNavItem(3, Icons.analytics_outlined, 'Statistika'),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final isSelected = _selectedIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedIndex = index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.white : AppColors.textMuted,
              size: 24,
            ),
            if (isSelected) ...[
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _products = [];
  List<dynamic> _stores = [];
  bool _isLoading = true;
  String? _selectedCategory;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    try {
      final products = await _apiService.getProducts();
      final stores = await _apiService.getStores();
      if (mounted) {
        setState(() {
          _products = products;
          _stores = stores;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('SAVDOON MARKET', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, letterSpacing: 1.5)),
        actions: [
          IconButton(icon: const Icon(Icons.search_rounded), onPressed: () {}),
          IconButton(
            icon: const Icon(Icons.shopping_bag_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              onRefresh: _fetchData,
              color: AppColors.primary,
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 12),
                    // AI Featured Banner
                    _buildAIHeroBanner(),
                    const SizedBox(height: 40),

                    const SectionHeader(title: 'Top Do\'konlar'),
                    const SizedBox(height: 16),
                    SizedBox(
                      height: 130,
                      child: _stores.isEmpty
                          ? _buildEmptyState('Do\'konlar yo\'q')
                          : ListView.separated(
                              scrollDirection: Axis.horizontal,
                              itemCount: _stores.length,
                              separatorBuilder: (_, __) => const SizedBox(width: 20),
                              itemBuilder: (context, index) => _buildStoreCard(_stores[index]),
                            ),
                    ),

                    const SizedBox(height: 40),
                    const SectionHeader(title: 'Filtrlar'),
                    const SizedBox(height: 16),
                    _buildCategoryFilters(),

                    const SizedBox(height: 32),
                    const SectionHeader(title: 'Siz uchun tanlangan'),
                    const SizedBox(height: 16),
                    _products.isEmpty
                        ? _buildEmptyState('Mahsulotlar topilmadi')
                        : GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              childAspectRatio: 0.72,
                              crossAxisSpacing: 16,
                              mainAxisSpacing: 16,
                            ),
                            itemCount: _products.length,
                            itemBuilder: (context, index) => ProductCard(product: _products[index]),
                          ),
                    const SizedBox(height: 120),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildAIHeroBanner() {
    return GlassContainer(
      height: 180,
      width: double.infinity,
      borderRadius: 32,
      gradient: LinearGradient(
        colors: [
          AppColors.primary,
          AppColors.secondary.withOpacity(0.8),
        ],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      child: Stack(
        children: [
          Positioned(
            right: -20,
            bottom: -20,
            child: Icon(Icons.auto_awesome, color: Colors.white.withOpacity(0.1), size: 140),
          ),
          Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text('AI TAVSIYA', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.black, letterSpacing: 1.2)),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Sizga yoqadigan\nyangi to\'plamlar',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    height: 1.1,
                    fontFamily: 'Outfit',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryFilters() {
    final categories = ['Hammasi', 'Kiyim', 'Elektronika', 'Oziq-ovqat', 'Xizmatlar'];
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final isSelected = (_selectedCategory ?? 'Hammasi') == categories[index];
          return GestureDetector(
            onTap: () => setState(() => _selectedCategory = categories[index]),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              decoration: BoxDecoration(
                color: isSelected ? Colors.white : Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: isSelected ? Colors.white : Colors.white10),
              ),
              child: Text(
                categories[index],
                style: TextStyle(
                  color: isSelected ? Colors.black : Colors.white70,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState(String msg) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Text(msg, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
      ),
    );
  }

  Widget _buildStoreCard(dynamic store) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(colors: [AppColors.primary, AppColors.secondary]),
          ),
          child: GlassContainer(
            width: 80,
            height: 80,
            borderRadius: 40,
            child: Center(
              child: store['logo'] != null
                  ? ClipOval(child: Image.network(store['logo'], fit: BoxFit.cover, width: 74, height: 74))
                  : Icon(Icons.storefront_rounded, color: Colors.white.withOpacity(0.8), size: 30),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          store['name'] ?? 'Noma\'lum',
          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _stats;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    try {
      final stats = await _apiService.getOrderStats();
      if (mounted) {
        setState(() {
          _stats = stats;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.read<AuthProvider>();
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: Text('SAVDOON', style: theme.appBarTheme.titleTextStyle),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              setState(() => _isLoading = true);
              _fetchStats();
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            onPressed: () {
              authProvider.logout();
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              onRefresh: _fetchStats,
              color: AppColors.primary,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Welcome & Date
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Xayrli kun,',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1.1,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Admin 👋',
                          style: theme.textTheme.displaySmall?.copyWith(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),

                    // Stats Grid
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            'Umumiy Savdo',
                            '${(_stats?['total_revenue'] ?? 0).toInt().toLocaleString()} UZS',
                            Icons.account_balance_wallet_rounded,
                            AppColors.primary,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildStatCard(
                            'Buyurtmalar',
                            '${_stats?['total_orders'] ?? 0}',
                            Icons.shopping_cart_rounded,
                            AppColors.secondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            'Kutilmoqda',
                            '${_stats?['pending'] ?? 0}',
                            Icons.timer_rounded,
                            Colors.amber,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildStatCard(
                            'Yakunlangan',
                            '${_stats?['completed'] ?? 0}',
                            Icons.check_circle_rounded,
                            Colors.emerald,
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 40),

                    const SectionHeader(title: 'Tezkor Amallar'),
                    const SizedBox(height: 16),
                    _buildActionItem('Yangi Mahsulot', Icons.add_circle_outline_rounded, AppColors.primary),
                    _buildActionItem('Hisobotlar', Icons.bar_chart_rounded, AppColors.secondary),
                    _buildActionItem('Kuryerlar', Icons.delivery_dining_rounded, Colors.orange),
                    _buildActionItem('Sozlamalar', Icons.settings_rounded, AppColors.textMuted),
                    
                    const SizedBox(height: 100), // Bottom nav space
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return GlassContainer(
      padding: const EdgeInsets.all(20),
      borderRadius: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 20),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w900,
              fontFamily: 'Outfit',
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title.toUpperCase(),
            style: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.2,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionItem(String title, IconData icon, Color iconColor) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: GlassContainer(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        borderRadius: 20,
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor, size: 22),
            ),
            const SizedBox(width: 16),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 15,
              ),
            ),
            const Spacer(),
            Icon(Icons.chevron_right_rounded, color: AppColors.textMuted.withOpacity(0.5), size: 20),
          ],
        ),
      ),
    );
  }
}

// Extension to format numbers
extension NumberFormatting on int {
  String toLocaleString() {
    return toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]} ',
    );
  }
}

class SectionHeader extends StatelessWidget {
  final String title;
  const SectionHeader({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold)),
        TextButton(onPressed: () {}, child: const Text('Hammasi')),
      ],
    );
  }
}

class ProductCard extends StatelessWidget {
  final dynamic product;
  const ProductCard({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    return GlassContainer(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(16),
              ),
              child: product['image'] != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.network(product['image'], fit: BoxFit.cover),
                    )
                  : const Center(
                      child:
                          Icon(Icons.image, color: Colors.white12, size: 40)),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            product['name'] ?? 'Noma\'lum mahsulot',
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            product['category_name'] ?? 'Kategoriya',
            style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
          ),
          const SizedBox(height: 8),
          Text(
            '${product['price'] ?? 0} UZS',
            style: const TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w900,
                fontSize: 13),
          ),
        ],
      ),
    );
  }
}
