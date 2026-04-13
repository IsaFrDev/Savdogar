import 'package:flutter/material.dart';

class AppColors {
  // Slate 950 - The core background color from React
  static const Color scaffoldBackground = Color(0xFF020617);
  
  // Brand colors
  static const Color primary = Color(0xFF4F46E5);
  static const Color secondary = Color(0xFF7C3AED);
  static const Color accent = Color(0xFFF43F5E);
  
  // Surface / Glass colors
  static const Color glassSurface = Color(0x0DFFFFFF); // 5% white
  static const Color glassBorder = Color(0x1AFFFFFF); // 10% white
  static const Color cardSurface = Color(0x12FFFFFF); // ~7% white
  
  // Text colors
  static const Color textPrimary = Color(0xFFF8FAFC);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);
  
  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, secondary],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient backgroundMesh = LinearGradient(
    colors: [
      Color(0x1A4F46E5), // 10% primary
      Colors.transparent,
    ],
    begin: Alignment.topLeft,
    end: Alignment.center,
  );
}
