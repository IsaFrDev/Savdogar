import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../widgets/glass_container.dart';

class POSScreen extends StatelessWidget {
  const POSScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('POS Terminal'),
      ),
      body: Stack(
        children: [
          // Background Glow
          Positioned(
            bottom: 100,
            left: -50,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.accent.withOpacity(0.05),
              ),
            ),
          ),
          
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  GlassContainer(
                    width: 140,
                    height: 140,
                    borderRadius: 70,
                    child: const Center(
                      child: Icon(
                        Icons.point_of_sale_rounded,
                        size: 60,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                  const Text(
                    'POS Terminal',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Sotuvlar va kassa tizimi',
                    style: TextStyle(
                      fontSize: 16,
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 48),
                  
                  GlassContainer(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        _buildFeatureItem(Icons.qr_code_scanner, 'Skanerlash', 'Shtrix-kod va QR skaner'),
                        const Divider(color: Colors.white10, height: 32),
                        _buildFeatureItem(Icons.inventory_2_outlined, 'Inventarizatsiya', 'Ombor bilan sinxronizatsiya'),
                        const Divider(color: Colors.white10, height: 32),
                        _buildFeatureItem(Icons.receipt_long_rounded, 'Cheklar', 'E-chek va chop etish'),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 48),
                  
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.2),
                          blurRadius: 15,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: ElevatedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.add_shopping_cart_rounded),
                      label: const Text('YANGI SOTUV'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        minimumSize: const Size(double.infinity, 64),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureItem(IconData icon, String title, String desc) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: Colors.white70, size: 24),
        ),
        const SizedBox(width: 20),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              Text(desc, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
            ],
          ),
        ),
      ],
    );
  }
}
