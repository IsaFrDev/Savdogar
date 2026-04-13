import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/glass_container.dart';
import '../home/home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();

  void _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      final authProvider = context.read<AuthProvider>();
      final success = await authProvider.login(
        _usernameController.text,
        _passwordController.text,
      );

      if (success && mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const HomeScreen()),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      body: Stack(
        children: [
          // Background Mesh Gradient Effect
          Positioned(
            top: -100,
            left: -100,
            child: Container(
              width: 400,
              height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.primary.withOpacity(0.15),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          
          SafeArea(
            child: Consumer<AuthProvider>(
              builder: (context, authProvider, _) {
                return Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(28),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Premium Logo Badge
                          Hero(
                            tag: 'logo',
                            child: Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(24),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.primary.withOpacity(0.3),
                                    blurRadius: 20,
                                    offset: const Offset(0, 10),
                                  ),
                                ],
                              ),
                              child: const Center(
                                child: Text(
                                  'S',
                                  style: TextStyle(
                                    fontSize: 40,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 32),
                          Text(
                            'SAVDOON',
                            style: theme.textTheme.displayMedium,
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Tizimga kirish',
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 48),

                          // Login Form in a Glass Container
                          GlassContainer(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                // Username
                                TextFormField(
                                  controller: _usernameController,
                                  style: const TextStyle(color: Colors.white),
                                  decoration: const InputDecoration(
                                    labelText: 'Loginingiz',
                                    prefixIcon: Icon(Icons.person_outline, color: AppColors.textSecondary),
                                  ),
                                  validator: (value) => (value == null || value.isEmpty) ? 'Loginni kiriting' : null,
                                ),
                                const SizedBox(height: 20),
                                
                                // Password
                                TextFormField(
                                  controller: _passwordController,
                                  obscureText: true,
                                  style: const TextStyle(color: Colors.white),
                                  decoration: const InputDecoration(
                                    labelText: 'Parol',
                                    prefixIcon: Icon(Icons.lock_outline, color: AppColors.textSecondary),
                                  ),
                                  validator: (value) => (value == null || value.isEmpty) ? 'Parolni kiriting' : null,
                                ),
                                const SizedBox(height: 12),
                                
                                // Forgot Password Link
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: TextButton(
                                    onPressed: () {},
                                    child: const Text(
                                      'Parolni unutdingizmi?',
                                      style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 12),

                                // Error Message
                                if (authProvider.error != null)
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 16),
                                    child: Text(
                                      authProvider.error!,
                                      style: const TextStyle(color: AppColors.accent, fontSize: 13),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),

                                // Login Button
                                Container(
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(16),
                                    boxShadow: [
                                      BoxShadow(
                                        color: AppColors.primary.withOpacity(0.3),
                                        blurRadius: 15,
                                        offset: const Offset(0, 5),
                                      ),
                                    ],
                                  ),
                                  child: ElevatedButton(
                                    onPressed: authProvider.isLoading ? null : _handleLogin,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.primary,
                                      minimumSize: const Size(double.infinity, 60),
                                    ),
                                    child: authProvider.isLoading
                                        ? const SizedBox(
                                            height: 24,
                                            width: 24,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 3,
                                              valueColor: AlwaysStoppedAnimation(Colors.white),
                                            ),
                                          )
                                        : const Text('KIRISH', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.2)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          
                          const SizedBox(height: 32),
                          
                          // Register Section
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Text(
                                'Hisobingiz yo\'qmi?',
                                style: TextStyle(color: AppColors.textSecondary),
                              ),
                              TextButton(
                                onPressed: () {
                                  Navigator.pushNamed(context, '/register');
                                },
                                child: const Text(
                                  'Ro\'yxatdan o\'ting',
                                  style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
