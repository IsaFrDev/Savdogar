class ERPScreen extends StatefulWidget {
  const ERPScreen({super.key});

  @override
  State<ERPScreen> createState() => _ERPScreenState();
}

class _ERPScreenState extends State<ERPScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _expenses = [];
  List<dynamic> _vendors = [];
  bool _isLoading = true;
  double _totalExpenses = 0;

  @override
  void initState() {
    super.initState();
    _loadERPData();
  }

  Future<void> _loadERPData() async {
    try {
      final expenses = await _apiService.getExpenses();
      final vendors = await _apiService.getVendors();
      
      double total = 0;
      for (var e in expenses) {
        total += (e['amount'] ?? 0).toDouble();
      }

      if (mounted) {
        setState(() {
          _expenses = expenses;
          _vendors = vendors;
          _totalExpenses = total;
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
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('ERP HUB', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, letterSpacing: 1.2)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              setState(() => _isLoading = true);
              _loadERPData();
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.secondary))
          : RefreshIndicator(
              onRefresh: _loadERPData,
              color: AppColors.secondary,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Finance Summary Card
                    GlassContainer(
                      padding: const EdgeInsets.all(28),
                      gradient: LinearGradient(
                        colors: [
                          AppColors.secondary.withOpacity(0.15),
                          AppColors.secondary.withOpacity(0.05),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'UMUMIY XARAJATLAR',
                            style: TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.5,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            '${_totalExpenses.toInt().toLocaleString()} UZS',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 32,
                              fontWeight: FontWeight.w900,
                              fontFamily: 'Outfit',
                            ),
                          ),
                          const SizedBox(height: 24),
                          Row(
                            children: [
                              _buildMiniStat('Tranzaksiyalar', '${_expenses.length}'),
                              const SizedBox(width: 32),
                              _buildMiniStat('Hamkorlar', '${_vendors.length}'),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 40),

                    // Quick Actions
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'XARAJATLAR',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1.2),
                        ),
                        TextButton(
                          onPressed: () {},
                          child: const Text('Qo\'shish', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _expenses.isEmpty
                      ? _buildEmptyState('Xarajatlar yo\'q')
                      : ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _expenses.length > 5 ? 5 : _expenses.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final e = _expenses[index];
                            return _buildExpenseItem(e);
                          },
                        ),
                    
                    const SizedBox(height: 40),

                    const Text(
                      'YETKAZIB BERUVCHILAR',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1.2),
                    ),
                    const SizedBox(height: 16),
                    _vendors.isEmpty
                      ? _buildEmptyState('Yetkazib beruvchilar yo\'q')
                      : SizedBox(
                          height: 140,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: _vendors.length,
                            separatorBuilder: (_, __) => const SizedBox(width: 16),
                            itemBuilder: (context, index) {
                              final v = _vendors[index];
                              return _buildVendorCard(v);
                            },
                          ),
                        ),
                    
                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildMiniStat(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
        Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
      ],
    );
  }

  Widget _buildEmptyState(String msg) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Text(msg, style: const TextStyle(color: AppColors.textMuted, fontSize: 13, fontStyle: FontStyle.italic)),
      ),
    );
  }

  Widget _buildExpenseItem(dynamic e) {
    return GlassContainer(
      padding: const EdgeInsets.all(16),
      borderRadius: 20,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.receipt_long_rounded, color: AppColors.secondary, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  e['category'] ?? 'Xarajat',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  e['date'] ?? '',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                ),
              ],
            ),
          ),
          Text(
            '-${(e['amount'] ?? 0).toInt().toLocaleString()}',
            style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.w900, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildVendorCard(dynamic v) {
    return GlassContainer(
      width: 160,
      padding: const EdgeInsets.all(20),
      borderRadius: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.business_center_rounded, color: AppColors.textSecondary, size: 24),
          const Spacer(),
          Text(
            v['name'] ?? 'Noma\'lum',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            v['category'] ?? 'Ta\'minotchi',
            style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
          ),
        ],
      ),
    );
  }
}
