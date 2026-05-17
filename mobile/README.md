# Savdogar Flutter App

Multi-vendor E-commerce Platform with POS & ERP - Flutter Mobile App

## 📱 Features

✅ **POS System** - Point of Sale for retail  
✅ **ERP System** - Enterprise Resource Planning  
✅ **Dashboard** - Business analytics  
✅ **Authentication** - Login/Register  
✅ **Responsive** - Works on all devices  
✅ **White Theme** - Clean white background with black elements  

## 🚀 Prerequisites (Kerakli narsalar)

### 1. **Install Flutter SDK**

**Windows:**
```bash
# Download Flutter SDK
# Go to: https://docs.flutter.dev/get-started/install/windows

# Extract to C:\src\flutter
# Add to PATH:
C:\src\flutter\bin

# Verify installation:
flutter doctor
```

### 2. **Install Android Command Line Tools** (NO Android Studio needed!)

```bash
# Download Command Line Tools only:
# https://developer.android.com/studio#command-line-tools-only

# Extract to: C:\Android\cmdline-tools

# Create structure:
C:\Android\cmdline-tools\latest\bin

# Set environment variables:
ANDROID_HOME = C:\Android
PATH += %ANDROID_HOME%\cmdline-tools\latest\bin
PATH += %ANDROID_HOME%\platform-tools
PATH += %ANDROID_HOME%\emulator

# Install SDK components:
sdkmanager "platform-tools"
sdkmanager "platforms;android-34"
sdkmanager "build-tools;34.0.0"
sdkmanager "system-images;android-34;google_apis;x86_64"

# Accept licenses:
sdkmanager --licenses
```

### 3. **Create Android Emulator** (without Android Studio)

```bash
# Create AVD (Android Virtual Device):
avdmanager create avd -n Pixel_6 -k "system-images;android-34;google_apis;x86_64" -d pixel_6

# List available devices:
avdmanager list avd

# Start emulator:
emulator -avd Pixel_6
```

## 🏃 Run the App (Ishga tushirish)

### **Step 1: Start Backend (Django)**

```bash
cd C:\Users\hp\Desktop\Savdogar\Savdogar-backend

# Activate virtual environment (if you have one)
# python -m venv venv
# venv\Scripts\activate

# Run server
python manage.py runserver

# Backend running at: http://127.0.0.1:8000
```

### **Step 2: Start Flutter App**

Open **NEW terminal** (keep backend running):

```bash
cd C:\Users\hp\Desktop\Savdogar\savdogar_app

# Install dependencies
flutter pub get

# Check connected devices
flutter devices

# Run on emulator
flutter run

# OR run on Chrome (web)
flutter run -d chrome

# OR run on Windows (desktop)
flutter run -d windows
```

### **Step 3: Hot Reload (Development)**

While app is running:
- Press `r` - Hot reload
- Press `R` - Hot restart  
- Press `q` - Quit

## 📱 Run on Physical Device (Real Phone)

### **Enable Developer Mode on Phone:**

1. **Settings** → **About Phone**
2. Tap **Build Number** 7 times
3. Go back → **Developer Options**
4. Enable **USB Debugging**

### **Connect Phone:**

```bash
# Connect via USB
# Check if device is detected:
adb devices

# Should show your device ID

# Run on device:
flutter run
```

### **Update Backend URL:**

Edit `lib/config/constants.dart`:

```dart
// Change from:
static const String baseUrl = 'http://10.0.2.2:8000'; // Emulator

// To your computer's IP:
static const String baseUrl = 'http://192.168.1.100:8000'; // Physical device
```

Find your computer's IP:
```bash
# Windows:
ipconfig

# Look for IPv4 Address
```

## 🛠️ Common Commands

```bash
# Check Flutter setup
flutter doctor

# Install dependencies
flutter pub get

# Run app
flutter run

# Run on specific device
flutter run -d chrome
flutter run -d windows
flutter run -d <device-id>

# Build APK (for Android)
flutter build apk

# Build App Bundle (for Play Store)
flutter build appbundle

# Clean build
flutter clean
flutter pub get

# Check for issues
flutter analyze

# Format code
flutter format .
```

## 📂 Project Structure

```
savdogar_app/
├── lib/
│   ├── config/
│   │   ├── constants.dart      # API endpoints
│   │   └── routes.dart         # App routing
│   ├── providers/
│   │   ├── auth_provider.dart  # Authentication state
│   │   └── cart_provider.dart  # Shopping cart
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── login_screen.dart
│   │   │   └── register_screen.dart
│   │   ├── home/
│   │   │   └── home_screen.dart
│   │   ├── pos/
│   │   │   └── pos_screen.dart
│   │   └── erp/
│   │       └── erp_screen.dart
│   ├── theme/
│   │   └── app_theme.dart      # White theme
│   └── main.dart               # App entry point
└── pubspec.yaml                # Dependencies
```

## 🎨 Theme

- **Background**: White (#FFFFFF)
- **Elements**: Black (#000000)
- **Text**: Black (#000000)
- **Borders**: Light Gray (#E0E0E0)
- **Accent**: Blue (#2196F3)

## 🔧 Troubleshooting

### **Issue: "No devices found"**

```bash
# For web:
flutter config --enable-web
flutter run -d chrome

# For Windows:
flutter config --enable-windows-desktop
flutter run -d windows

# For Android emulator:
emulator -avd Pixel_6
flutter run
```

### **Issue: "Backend connection refused"**

1. Make sure Django is running: `python manage.py runserver`
2. Check URL in `constants.dart`
3. For emulator: use `10.0.2.2` (not 127.0.0.1)
4. For physical device: use your computer's IP

### **Issue: "Flutter not found"**

```bash
# Add Flutter to PATH
# Windows:
setx PATH "%PATH%;C:\src\flutter\bin"

# Restart terminal
```

### **Issue: "SDK licenses not accepted"**

```bash
sdkmanager --licenses
# Press 'y' for all
```

## 📦 Build for Production

### **Android APK:**
```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

### **Android App Bundle:**
```bash
flutter build appbundle --release
# Output: build/app/outputs/bundle/release/app-release.aab
```

### **Web:**
```bash
flutter build web --release
# Output: build/web/
```

### **Windows:**
```bash
flutter build windows --release
# Output: build/windows/
```

## 🔗 Backend Integration

The app connects to your existing Django REST Framework backend:

- **Auth**: `/api/auth/login/`, `/api/auth/register/`
- **POS**: `/api/pos/registers/`, `/api/pos/transactions/`
- **ERP**: `/api/erp/vendors/`, `/api/erp/purchase-orders/`
- **Products**: `/api/products/`
- **Orders**: `/api/orders/`

No backend changes needed! ✅

## 📝 Next Steps

1. ✅ Install Flutter SDK
2. ✅ Install Android Command Line Tools
3. ✅ Create emulator OR connect phone
4. ✅ Start backend: `python manage.py runserver`
5. ✅ Run app: `flutter run`
6. 🔄 Complete remaining screens (register, products, etc.)

## 🆘 Need Help?

```bash
# Flutter documentation
flutter --help

# Specific command help
flutter run --help

# Check setup
flutter doctor -v
```

## 🎯 Quick Start (TL;DR)

```bash
# Terminal 1 - Backend
cd C:\Users\hp\Desktop\Savdogar\Savdogar-backend
python manage.py runserver

# Terminal 2 - Flutter
cd C:\Users\hp\Desktop\Savdogar\savdogar_app
flutter pub get
flutter run -d chrome  # OR flutter run -d windows
```

**That's it!** 🚀
