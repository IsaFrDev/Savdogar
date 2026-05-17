# 🚀 QUICK START GUIDE - Savdogar Flutter App

## ⚡ ENG TEZ USUL (5 DAQIQADA)

### **1. Flutter o'rnatish (1 daqiqa)**

```bash
# 1. Flutter SDK yuklab oling:
# https://docs.flutter.dev/get-started/install/windows

# 2. Extract qiling: C:\src\flutter

# 3. PATH ga qo'shing:
# - Windows Search: "Environment Variables"
# - Path ga qo'shing: C:\src\flutter\bin

# 4. Tekshirish:
flutter --version
```

---

### **2. Backend ishga tushirish (30 soniya)**

```bash
# Terminal 1 oching:
cd C:\Users\hp\Desktop\Savdogar\Savdogar-backend

# Server run:
python manage.py runserver

# ✅ Backend tayyor: http://127.0.0.1:8000
```

---

### **3. Flutter App Run (1 daqiqa)**

```bash
# Terminal 2 oching (YANGI):
cd C:\Users\hp\Desktop\Savdogar\savdogar_app

# Dependencies install:
flutter pub get

# Web'da run (ENG TEZ):
flutter run -d chrome

# YOKI Windows'da:
flutter run -d windows
```

---

## ✅ BO'LDI! App ishlayapti!

---

## 📱 ANDROID EMULATOR'DA RUN QILISH

### **Android Studio'siz!**

```bash
# 1. Command Line Tools yuklang:
# https://developer.android.com/studio#command-line-tools-only

# 2. Extract: C:\Android\cmdline-tools

# 3. Structure yarating:
C:\Android\cmdline-tools\latest\bin

# 4. Environment Variables:
ANDROID_HOME = C:\Android
PATH += %ANDROID_HOME%\cmdline-tools\latest\bin
PATH += %ANDROID_HOME%\platform-tools

# 5. SDK install:
sdkmanager "platform-tools"
sdkmanager "platforms;android-34"
sdkmanager "system-images;android-34;google_apis;x86_64"

# 6. Licenses:
sdkmanager --licenses

# 7. Emulator yaratish:
avdmanager create avd -n Pixel -k "system-images;android-34;google_apis;x86_64" -d pixel

# 8. Emulator run:
emulator -avd Pixel

# 9. Flutter run:
flutter run
```

---

## 📲 REAL TELEFON'DA RUN

### **1. Telefonni tayyorlash:**

```
Settings → About Phone → Build Number (7 marta bosing)
→ Developer Options → USB Debugging (ON)
```

### **2. USB orqali ulash:**

```bash
# Telefonni USB bilan ulang

# Tekshirish:
adb devices

# Run:
flutter run
```

### **3. Backend URL o'zgartirish:**

`lib/config/constants.dart` faylida:

```dart
// Emulator uchun:
static const String baseUrl = 'http://10.0.2.2:8000';

// Real telefon uchun (kompyuter IP):
static const String baseUrl = 'http://192.168.1.100:8000';
```

IP ni bilish:
```bash
ipconfig
# IPv4 Address ni qidiring
```

---

## 🎯 ASOSIY KOMANDALAR

```bash
# Dependencies install
flutter pub get

# Run (web)
flutter run -d chrome

# Run (Windows)
flutter run -d windows

# Run (Android emulator)
flutter run

# Run (Real phone)
flutter run

# Hot reload (app run bo'lganda)
r

# Hot restart
R

# Quit
q

# Build APK
flutter build apk

# Check issues
flutter doctor
```

---

## 🔥 MUAMMOLAR VA YECHIMLAR

### **"flutter: command not found"**
```bash
# PATH ga Flutter qo'shilmagan
# Qaytadan qo'shing va terminalni qayta oching
```

### **"No devices found"**
```bash
# Web uchun:
flutter config --enable-web
flutter run -d chrome

# Windows uchun:
flutter config --enable-windows-desktop
flutter run -d windows
```

### **"Backend connection refused"**
```bash
# 1. Backend ishlayaptimi tekshiring
# 2. URL to'g'riligini tekshiring (constants.dart)
# 3. Emulator: 10.0.2.2 ishlatish
# 4. Real telefon: Kompyuter IP ishlatish
```

### **"Dependencies error"**
```bash
flutter clean
flutter pub get
```

---

## 📁 PROJECT TUZILISHI

```
savdogar_app/
├── lib/
│   ├── config/
│   │   ├── constants.dart       # API URL'lar
│   │   └── routes.dart          # Sahifalar
│   ├── providers/
│   │   ├── auth_provider.dart   # Login/Register
│   │   └── cart_provider.dart   # Savat
│   ├── screens/
│   │   ├── auth/                # Login, Register
│   │   ├── home/                # Dashboard
│   │   ├── pos/                 # POS Terminal
│   │   └── erp/                 # ERP System
│   ├── theme/
│   │   └── app_theme.dart       # Oq fon, qora elementlar
│   └── main.dart                # Boshlanish
└── pubspec.yaml                 # Dependencies
```

---

## 🎨 UI THEME

- **Fon**: OQ (#FFFFFF)
- **Elementlar**: QORA (#000000)
- **Matn**: QORA (#000000)
- **Chegaralar**: KULRANG (#E0E0E0)
- **Accent**: KO'K (#2196F3)

**Hammasi bir xil - oq fon, qora elementlar!** ✅

---

## 📝 KEYINGI QADAMLAR

1. ✅ Flutter o'rnatish
2. ✅ Backend run qilish
3. ✅ App run qilish
4. 🔄 POS screen to'liq qilish
5. 🔄 ERP screen to'liq qilish
6. 🔄 Mahsulotlar qo'shish
7. 🔄 Buyurtmalar qo'shish

---

## 🆘 YORDAM

```bash
# Flutter yordam
flutter --help

# Doctor check
flutter doctor -v

# Run yordam
flutter run --help
```

---

## ⚡ TL;DR (ENG QISQA)

```bash
# Terminal 1:
cd C:\Users\hp\Desktop\Savdogar\Savdogar-backend
python manage.py runserver

# Terminal 2:
cd C:\Users\hp\Desktop\Savdogar\savdogar_app
flutter pub get
flutter run -d chrome
```

**BO'LDI!** 🎉

App ishlayapti, backend bilan ulangan!

---

## 📚 QO'SHIMCHA

- **Flutter Docs**: https://docs.flutter.dev
- **Dart Docs**: https://dart.dev/guides
- **Material Design**: https://m3.material.io

---

**Savdogar Flutter App - Tayyor!** 🚀

Backend o'zgarmaydi, faqat Flutter frontend qo'shildi!
