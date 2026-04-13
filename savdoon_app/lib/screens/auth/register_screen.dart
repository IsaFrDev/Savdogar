import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../widgets/glass_container.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        title: const Text('Ro\'yxatdan o\'tish'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Stack(
        children: [
          // Background Mesh
          Positioned(
            bottom: -150,
            right: -150,
            child: Container(
              width: 500,
              height: 500,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.secondary.withOpacity(0.1),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 20),
                  Text(
                    'Yangi hisob yaratish',
                    style: theme.textTheme.displaySmall,
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Savdoon platformasiga xush kelibsiz!',
                    style:
                        TextStyle(color: AppColors.textSecondary, fontSize: 15),
                  ),
                  const SizedBox(height: 40),

                  GlassContainer(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        // Username
                        TextFormField(
                          controller: _usernameController,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(
                            labelText: 'Login tanlang',
                            prefixIcon: Icon(Icons.person_outline,
                                color: AppColors.textSecondary),
                          ),
                          validator: (value) =>
                              value?.isEmpty ?? true ? 'Login majburiy' : null,
                        ),
                        const SizedBox(height: 20),

                        // Email
                        TextFormField(
                          controller: _emailController,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(
                            labelText: 'Email manzilingiz',
                            prefixIcon: Icon(Icons.email_outlined,
                                color: AppColors.textSecondary),
                          ),
                          keyboardType: TextInputType.emailAddress,
                          validator: (value) {
                            if (value == null || value.isEmpty)
                              return 'Email majburiy';
                            if (!value.contains('@'))
                              return 'Email noto\'g\'ri';
                            return null;
                          },
                        ),
                        const SizedBox(height: 20),

                        // Password
                        TextFormField(
                          controller: _passwordController,
                          obscureText: true,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(
                            labelText: 'Murakkab parol',
                            prefixIcon: Icon(Icons.lock_outline,
                                color: AppColors.textSecondary),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty)
                              return 'Parol majburiy';
                            if (value.length < 6) return 'Kamida 6 ta belgi';
                            return null;
                          },
                        ),
                        const SizedBox(height: 32),

                        // Register Button
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
                            onPressed: () {
                              if (_formKey.currentState!.validate()) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                        'Ro\'yxatdan o\'tish muvaffaqiyatli!'),
                                    backgroundColor: AppColors.primary,
                                  ),
                                );
                                Navigator.pop(context);
                              }
                            },
                            child: const Text('DAVOM ETISH',
                                style: TextStyle(fontWeight: FontWeight.w900)),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Terms
                  const Text(
                    'Ro\'yxatdan o\'tish orqali siz bizning foydalanish shartlarimiz va maxfiylik siyosatimizga rozilik bildirasiz.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
