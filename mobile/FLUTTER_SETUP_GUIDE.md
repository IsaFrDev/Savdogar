# 🚀 FLUTTER O'RNATISH VA RUN QILISH - TO'LIQ QO'LLANMA

## ⚠️ MUHIM: Flutter hali o'rnatilmagan!

Sizda Flutter SDK yo'q. Keling, o'rnatamiz!

---

## 📥 1. FLUTTER SDK O'RNATISH (5 DAQIQA)

### **Qadam 1: Flutter Yuklab Oling**

```powershell
# PowerShell'da run qiling (Administrator sifatida):

# Flutter SDK yuklab olish:
Invoke-WebRequest -Uri "https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.24.0-stable.zip" -OutFile "$env:USERPROFILE\Downloads\flutter.zip"

# Extract qilish:
Expand-Archive -Path "$env:USERPROFILE\Downloads\flutter.zip" -DestinationPath "C:\src"

# Rename:
Rename-Item -Path "C:\src\flutter_windows_3.24.0-stable" -NewName "flutter"
```

**YOKI** manual:
1. Brauzer'da oching: https://docs.flutter.dev/get-started/install/windows
2. "Flutter SDK" ni yuklab oling
3. Extract: `C:\src\flutter`

---

### **Qadam 2: PATH ga Qo'shing**

```powershell
# System Environment Variables:
# 1. Windows Search: "Environment Variables"
# 2. "Edit the system environment variables"
# 3. "Environment Variables" button
# 4. "Path" ni tanlang → "Edit"
# 5. "New" → qo'shing: C:\src\flutter\bin
# 6. OK → OK → OK

# YOKI PowerShell'da (faqat current user):
[Environment]::SetEnvironmentVariable(
    "Path",
    [Environment]::GetEnvironmentVariable("Path", "User") + ";C:\src\flutter\bin",
    "User"
)
```

---

### **Qadam 3: Tekshirish**

**YANGI terminal oching** va run qiling:

```powershell
flutter --version
```

Natija:
```
Flutter 3.24.0 • channel stable
Tools • Dart 3.5.0
```

---

## 🏃 2. FLUTTER APP RUN QILISH

### **Qadam 1: Backend Run**

```powershell
# Terminal 1:
cd C:\Users\hp\Desktop\Savdogar\Savdogar-backend
python manage.py runserver
```

✅ Backend: http://127.0.0.1:8000

---

### **Qadam 2: Flutter Dependencies**

```powershell
# Terminal 2 (YANGI):
cd C:\Users\hp\Desktop\Savdogar\savdogar_app

# Dependencies install:
flutter pub get
```

Natija:
```
Running "flutter pub get" in savdogar_app...
Got dependencies!
```

---

### **Qadam 3: Run on Web (ENG TEZ)**

```powershell
# Web'da run (Chrome):
flutter run -d chrome
```

✅ **App Chrome'da ochiladi!**

---

### **Qadam 4: Run on Windows Desktop**

```powershell
# Windows desktop app sifatida:
flutter run -d windows
```

---

## 📱 3. ANDROID EMULATOR (OPTIONAL)

Agar telefonda test qilmoqchi bo'lsangiz:

### **Android Command Line Tools O'rnating**

```powershell
# 1. Yuklab oling:
# https://developer.android.com/studio#command-line-tools-only
# "Command line tools only" ni tanlang

# 2. Extract: C:\Android\cmdline-tools

# 3. Structure yarating:
# C:\Android\cmdline-tools\latest\bin

# 4. Environment Variables:
ANDROID_HOME = C:\Android
PATH += %ANDROID_HOME%\cmdline-tools\latest\bin
PATH += %ANDROID_HOME%\platform-tools

# 5. SDK components:
sdkmanager "platform-tools"
sdkmanager "platforms;android-34"
sdkmanager "system-images;android-34;google_apis;x86_64"

# 6. Licenses:
sdkmanager --licenses

# 7. Emulator yaratish:
avdmanager create avd -n Pixel_6 -k "system-images;android-34;google_apis;x86_64" -d pixel_6

# 8. Emulator run:
emulator -avd Pixel_6

# 9. Flutter run:
flutter run
```

---

## 🔧 4. MUAMMOLAR VA YECHIMLAR

### **"flutter: command not found"**

```powershell
# PATH to'g'ri emas!
# Qaytadan qo'shing va TERMINAL QAYTA OCHING

# Tekshirish:
where.exe flutter
```

---

### **"No devices found"**

```powershell
# Web enable qiling:
flutter config --enable-web
flutter run -d chrome

# YOKI Windows:
flutter config --enable-windows-desktop
flutter run -d windows
```

---

### **"Failed to load resources" (API xatosi)**

```dart
// lib/config/constants.dart da URL to'g'riligini tekshiring:

// Emulator uchun:
static const String baseUrl = 'http://10.0.2.2:8000';

// Web/Windows uchun:
static const String baseUrl = 'http://127.0.0.1:8000';

// Real telefon uchun:
static const String baseUrl = 'http://192.168.1.XXX:8000';
```

---

### **"Dependencies error"**

```powershell
flutter clean
flutter pub get
```

---

## 📂 5. FLUTTER PROJECT TUZILISHI

```
savdogar_app/
├── lib/
│   ├── config/
│   │   ├── constants.dart          # API URLs
│   │   └── routes.dart             # Navigation
│   ├── providers/
│   │   ├── auth_provider.dart      # Login/Register
│   │   └── cart_provider.dart      # Shopping cart
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── login_screen.dart   ✅
│   │   │   └── register_screen.dart ✅
│   │   ├── home/
│   │   │   └── home_screen.dart    ✅
│   │   ├── pos/
│   │   │   ├── pos_screen.dart     ✅ (old)
│   │   │   └── pos_screen_full.dart ✅ (NEW!)
│   │   └── erp/
│   │       └── erp_screen.dart     ⏳ (placeholder)
│   ├── services/
│   │   └── api_service.dart        ✅ (NEW!)
│   ├── theme/
│   │   └── app_theme.dart          ✅ (Oq fon, qora elementlar)
│   └── main.dart                   ✅
└── pubspec.yaml                    ✅
```

---

## 🎯 6. TEZ START (TL;DR)

```powershell
# 1. Flutter o'rnating (5 daqiqa)
# 2. Terminal 1 - Backend:
cd C:\Users\hp\Desktop\Savdogar\Savdogar-backend
python manage.py runserver

# 3. Terminal 2 - Flutter:
cd C:\Users\hp\Desktop\Savdogar\savdogar_app
flutter pub get
flutter run -d chrome

# BO'LDI! ✅
```

---

## 📚 7. KEYINGI QADAMLAR

1. ✅ Flutter SDK o'rnating
2. ✅ `flutter pub get`
3. ✅ `flutter run -d chrome`
4. 🔄 ERP screen to'ldirish (hozir placeholder)
5. 🔄 Products screen qo'shish
6. 🔄 Orders screen qo'shish
7. 🔄 Settings screen qo'shish

---

## 🆘 8. YORDAM

```powershell
# Flutter yordam:
flutter --help

# Doctor check:
flutter doctor -v

# Available devices:
flutter devices

# Run help:
flutter run --help
```

---

## ⚡ 9. CHEATSHEET

```powershell
# Install dependencies
flutter pub get

# Run on Chrome
flutter run -d chrome

# Run on Windows
flutter run -d windows

# Run on Android emulator
flutter run

# Hot reload (app run bo'lganda)
r

# Hot restart
R

# Quit
q

# Build APK
flutter build apk

# Build for Web
flutter build web

# Clean
flutter clean
flutter pub get
```

---

## 🎨 10. UI THEME

Flutter app **oq fon, qora elementlar** bilan:

- **Background**: #FFFFFF (Oq)
- **Elements**: #000000 (Qora)
- **Text**: #000000 (Qora)
- **Borders**: #E0E0E0 (Kulrang)
- **Accent**: #2196F3 (Ko'k)

---

**SAVOL BO'LSA SO'RANG!** 🚀

Flutter o'rnatib bo'lgach, men sizga to'liq ERP, Products, Orders screen'larni ham qo'shib beraman!
