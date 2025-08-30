# Privo - AI-Powered Privacy Protection for Images

Privo is a comprehensive privacy protection application that uses artificial intelligence to automatically detect and blur sensitive content in images, including faces and personally identifiable information (PII). Built as a React Native cross-platform mobile application, Privo empowers users to take control of their visual privacy before sharing photos.
![Privo_5](https://github.com/user-attachments/assets/17a23204-4c90-498b-afb5-6a2a5aa73e07)
<img width="1206" height="2622" alt="Privo_1" src="https://github.com/user-attachments/assets/732a3bcd-abce-4d0f-9959-f58474793ee9" />

## Problem Statement

As AI technologies rapidly integrate into our daily lives, concerns about privacy and security have become more urgent than ever. With the rise of powerful generative AI models, large-scale data collection, and cloud-based deployment, users face increasing risks: sensitive data leakage, identity theft, and privacy violations. Privo addresses these concerns by using AI to defend user privacy and security - implementing "AI for Privacy" rather than AI that compromises privacy.

## Core Features

### 🎯 Intelligent Content Detection
- **Face Detection**: Automatically identifies and locates human faces in images using Google ML Kit's advanced computer vision
- **Text Recognition**: Extracts and analyzes text content within images using optical character recognition (OCR)
- **PII Detection**: Uses sophisticated pattern matching and entity extraction to identify:
  - Email addresses
  - Phone numbers (including international formats)
  - Social Security Numbers
  - Credit card numbers
  - URLs and IP addresses
  - Names and personal identifiers
  - Addresses and location data

### 🛡️ Advanced Privacy Protection
- **Automatic Blurring**: Applies pixelation and blur effects to sensitive content while preserving image quality
- **Selective Protection**: Users can choose to view original or protected versions of images
- **Password Protection**: Secure access to unblurred content with password authentication
- **Metadata Preservation**: Maintains detailed records of what was detected and protected

### 📱 Cross-Platform Mobile Experience
- **React Native Architecture**: Single codebase supporting both iOS and Android platforms
- **Native Performance**: Leverages platform-specific ML capabilities for optimal speed and accuracy
- **Intuitive Interface**: Clean, user-friendly design with gesture-based navigation
- **Offline Processing**: All image processing happens locally on device - no cloud uploads

### 🔒 Privacy-First Design
- **Local Processing**: Images never leave the user's device
- **No Data Collection**: Application does not transmit or store user data externally  
- **Transparent Operations**: Users can view detailed information about what was detected
- **User Control**: Complete control over when and how protection is applied

## Technology Stack

### Frontend & User Interface
- **React Native 0.79.5**: Cross-platform mobile development framework
- **TypeScript**: Type-safe JavaScript development
- **Expo SDK 53**: Development platform and toolchain
- **React Hooks**: Modern state management and component lifecycle

### Mobile Development Tools
- **Expo CLI**: Development server and build tools
- **Metro Bundler**: JavaScript bundler for React Native
- **Expo Dev Client**: Enhanced development experience
- **React Native Edge-to-Edge**: Modern UI design patterns

### AI/ML Technologies

#### iOS Implementation
- **ML Kit for iOS**: Google's machine learning SDK
  - Face Detection API (`MLKitFaceDetection`)
  - Text Recognition API (`MLKitTextRecognition`)
  - Entity Extraction API (`MLKitEntityExtraction`)
- **Core Image**: Apple's image processing framework for blur and visual effects
- **Core Graphics**: Low-level graphics rendering and image manipulation
- **Natural Language Framework**: Apple's text analysis and entity recognition
- **UIKit**: UI components and image handling

#### Android Implementation  
- **ML Kit for Android**: Google's machine learning SDK
  - Face Detection (v16.1.5)
  - Text Recognition (v16.0.0)
  - Entity Extraction (v16.0.0-beta6)
- **Kotlin**: Modern programming language for Android development
- **Coroutines**: Asynchronous programming for smooth UI performance

### Image Processing & Storage
- **Expo Image Picker**: Camera and gallery access
- **Expo Media Library**: Photo library permissions and management
- **Expo File System**: Local file storage and management
- **React Native Async Storage**: Persistent data storage

### Development & Build Tools
- **Xcode**: iOS development environment
- **Android Studio**: Android development environment  
- **Gradle**: Android build system
- **CocoaPods**: iOS dependency management
- **Babel**: JavaScript transpilation
- **ESLint**: Code quality and consistency

## Architecture Overview

### Application Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    React Native Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Gallery Screen │  │ Photo Viewer    │  │ Components   │ │
│  │                 │  │ Screen          │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Image Handler   │  │ Storage Manager │  │ Native Bridge│ │
│  │                 │  │                 │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Native ML Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Face Detection  │  │ Text Recognition│  │ PII Detection│ │
│  │                 │  │                 │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### AI/ML Processing Pipeline
```
[Image Input] 
    ↓
[Face Detection] → [Face Coordinates]
    ↓                       ↓
[Text Recognition] → [Text Extraction] → [PII Analysis] → [PII Coordinates]
    ↓                                                           ↓
[Coordinate Merge] ← ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ← 
    ↓
[Blur Application] → [Protected Image]
    ↓
[Metadata Storage] → [User Interface Display]
```

## APIs and Libraries

### Core Dependencies
- **@react-native-async-storage/async-storage**: Persistent key-value storage
- **expo**: Core Expo SDK functionality
- **expo-dev-client**: Enhanced development experience
- **expo-file-system**: File system access and management
- **expo-image-picker**: Camera and photo library access  
- **expo-media-library**: Media library permissions
- **expo-status-bar**: Status bar configuration
- **react**: React library for component-based UI
- **react-native**: Cross-platform mobile development framework

### ML Kit Dependencies (Native)

#### iOS (CocoaPods)
```ruby
pod 'GoogleMLKit/EntityExtraction'
pod 'GoogleMLKit/FaceDetection'
```

#### Android (Gradle)
```gradle
implementation 'com.google.mlkit:face-detection:16.1.5'
implementation 'com.google.mlkit:text-recognition:16.0.0'
implementation 'com.google.mlkit:entity-extraction:16.0.0-beta6'
```

### Development Tools
- **@babel/core**: JavaScript compilation
- **@types/react**: TypeScript definitions for React
- **typescript**: Static type checking

## Project Structure

```
privo/
├── frontend/                    # React Native application code
│   ├── components/             # Reusable UI components
│   │   ├── BottomNavBar.tsx   # Navigation component
│   │   ├── ClearButton.tsx    # Action button component  
│   │   ├── ImageGrid.tsx      # Image display grid
│   │   ├── ImageViewer.tsx    # Individual image viewer
│   │   └── PasswordPrompt.tsx # Security authentication
│   ├── screens/               # Application screens
│   │   ├── GalleryScreen.tsx  # Main gallery interface
│   │   └── PhotoViewerScreen.tsx # Full-screen image viewer
│   └── utils/                 # Utility functions
│       ├── ImageHandler.ts    # Image processing logic
│       ├── NativeBridge.ts    # Native module interface
│       └── StorageManager.ts  # Data persistence
├── ios/                        # iOS native implementation
│   ├── SensitiveScan.swift    # Main ML processing coordinator
│   ├── ScanforFace.swift      # Face detection using ML Kit
│   ├── ScanforText.swift      # Text recognition and OCR
│   ├── PIIDetector.swift      # PII identification and filtering
│   └── SensitiveCoordinates.swift # Data structures
├── android/                    # Android native implementation
│   └── app/src/main/java/com/kohzhirong/privo/
│       ├── SensitiveScan.kt   # Main ML processing coordinator
│       ├── ScanforFace.kt     # Face detection using ML Kit  
│       ├── ScanforText.kt     # Text recognition and OCR
│       ├── PIIDetector.kt     # PII identification and filtering
│       └── SensitiveCoordinate.kt # Data structures
├── assets/                     # Application assets
├── models/                     # ML model storage (unused in current version)
└── ml_env/                    # Python ML environment (unused in current version)
```

## Installation & Setup

### Prerequisites
- **Node.js** 16+ and npm
- **Expo CLI**: Install globally with `npm install -g @expo/cli`
- **iOS Development**: 
  - Xcode 14+ (macOS only)
  - iOS 15.1+ deployment target
  - Valid Apple Developer account (for device testing)
- **Android Development**: 
  - Android Studio with API level 26+ (Android 8.0)
  - Java Development Kit (JDK) 11 or higher
  - Android SDK Platform-Tools

### 🚨 **IMPORTANT: Physical Device Required**

**This application MUST be tested on physical devices, not simulators/emulators.** 

**Why physical devices are required:**
- **ML Kit Models**: Google ML Kit downloads optimized models that may not be available in simulators
- **Camera Access**: Real camera hardware needed for photo capture functionality
- **Performance**: ML processing requires actual device hardware acceleration
- **Storage**: File system behavior differs between simulators and real devices

**Simulator limitations:**
- iOS Simulator: ML Kit models may fail to download or provide inaccurate results
- Android Emulator: Limited ML Kit functionality and performance issues
- Camera simulation doesn't test real-world image processing scenarios

### Installation Steps

#### 1. **Clone and Setup**
```bash
# Clone the repository
git clone <repository-url>
cd privo

# Install Node.js dependencies
npm install

# Install Expo CLI globally (if not already installed)
npm install -g @expo/cli
```

#### 2. **iOS Setup (macOS only)**
```bash
# Install iOS dependencies
cd ios
pod install
cd ..

# Verify Xcode setup
xcode-select --install  # If needed
```

**iOS Device Setup:**
1. Connect your iPhone/iPad via USB
2. In Xcode, go to **Window → Devices and Simulators**
3. Select your device and click **Use for Development**
4. Trust the developer certificate on your device when prompted
5. Ensure your device is running iOS 15.1 or later

#### 3. **Android Setup**
```bash
# Verify Android SDK installation
# Make sure ANDROID_HOME environment variable is set
echo $ANDROID_HOME  # Should point to your Android SDK

# Enable USB debugging on your Android device:
# Settings → About Phone → Tap "Build Number" 7 times
# Settings → Developer Options → Enable "USB Debugging"
```

**Android Device Setup:**
1. Connect your Android device via USB
2. Accept the USB debugging prompt on your device
3. Verify device connection: `adb devices`
4. Ensure your device is running Android 8.0 (API 26) or later

#### 4. **Development Server**
```bash
# Start Expo development server
npm start
# or
expo start

# This will open Expo DevTools in your browser
# Scan the QR code with Expo Go app, or use the platform-specific commands below
```

#### 5. **Run on Physical Devices**

**For iOS (Physical Device):**
```bash
# Option 1: Using Expo Development Build (Recommended)
npm run ios

# Option 2: Using Expo Go app
# 1. Install Expo Go from App Store
# 2. Scan QR code from development server
# 3. Or open expo://localhost:19000 in Expo Go
```

**For Android (Physical Device):**
```bash
# Option 1: Using Expo Development Build (Recommended)  
npm run android

# Option 2: Using Expo Go app
# 1. Install Expo Go from Play Store
# 2. Scan QR code from development server
# 3. Or open exp://localhost:19000 in Expo Go
```

### Build Requirements & Dependencies

#### iOS Requirements
- **Xcode**: 14.0 or later
- **iOS Deployment Target**: 15.1+
- **CocoaPods**: Automatically manages native dependencies
- **ML Kit Pods**: Automatically installed via Podfile
  ```ruby
  pod 'GoogleMLKit/EntityExtraction'
  pod 'GoogleMLKit/FaceDetection'
  ```

#### Android Requirements  
- **Android Studio**: Latest stable version
- **Minimum SDK**: API 26 (Android 8.0)
- **Target SDK**: API 34 (Android 14)
- **Kotlin**: 1.9.0+
- **ML Kit Dependencies**: Automatically managed via Gradle
  ```gradle
  implementation 'com.google.mlkit:face-detection:16.1.5'
  implementation 'com.google.mlkit:text-recognition:16.0.0'
  implementation 'com.google.mlkit:entity-extraction:16.0.0-beta6'
  ```

### Troubleshooting Common Issues

#### iOS Issues
- **Pod install fails**: Run `cd ios && pod repo update && pod install`
- **Code signing errors**: Ensure valid Apple Developer account and proper team selection
- **ML Kit models not downloading**: Ensure device has internet connection on first run

#### Android Issues
- **Gradle build fails**: Run `cd android && ./gradlew clean && cd ..`
- **Device not detected**: Check USB debugging is enabled and device is authorized
- **ML Kit errors**: Ensure Google Play Services is updated on device

#### General Issues
- **Metro bundler issues**: Run `npx react-native start --reset-cache`
- **Node modules issues**: Delete `node_modules` and run `npm install` again
- **Expo issues**: Run `expo doctor` to diagnose common problems

### First Run Expectations

**On first launch:**
1. The app will request camera and photo library permissions
2. ML Kit models will download automatically (requires internet connection)
3. Model download may take 30-60 seconds depending on connection speed
4. You'll see loading indicators during the initial model setup

**Testing the AI features:**
1. Take a photo or select from gallery
2. The app will automatically detect faces and PII text
3. Sensitive content will be blurred automatically
4. Use the password feature (default: "1234") to view original content

## Privacy & Security Features

### Data Protection
- **Local Processing Only**: All image analysis occurs on-device
- **No Network Communication**: Images never transmitted externally
- **Secure Storage**: Metadata stored locally with encryption
- **User-Controlled Access**: Password protection for sensitive operations

### ML Model Security
- **On-Device Inference**: ML Kit models run entirely on device
- **Automatic Model Management**: Models downloaded and cached securely by ML Kit
- **Privacy-Preserving Design**: No image data sent to Google or external services

### Permission Handling
- **Camera Access**: Required for taking new photos
- **Photo Library Access**: Required for selecting existing images  
- **File System Access**: Required for local storage and caching
- **Transparent Permissions**: Clear explanations provided to users

## Performance Considerations

### Optimization Strategies
- **Lazy Loading**: ML models initialized only when needed
- **Background Processing**: Heavy ML operations run on background threads
- **Memory Management**: Efficient bitmap handling and memory cleanup
- **Caching**: Intelligent caching of processed images and metadata

### Device Compatibility
- **iOS**: Requires devices supporting ML Kit (iPhone 7+ with iOS 15.1+)
- **Android**: Requires devices with sufficient RAM and processing power (API 26+)
- **Fallback Handling**: Graceful degradation on older devices with limited ML capabilities

## Future Enhancements

### Planned Features
- **Batch Processing**: Process multiple images simultaneously
- **Custom Sensitivity Settings**: User-configurable detection thresholds
- **Export Options**: Save protected images with metadata
- **Cloud Sync**: Optional encrypted cloud backup (privacy-preserving)
- **Additional PII Types**: Expand detection to more data categories

### Technical Improvements
- **Performance Optimization**: Enhanced ML model efficiency
- **UI/UX Enhancements**: More intuitive user interface
- **Accessibility**: Improved support for users with disabilities
- **Internationalization**: Multi-language support

## Contributing

This project implements defensive security measures and privacy protection. Contributions should focus on:
- Improving detection accuracy
- Enhancing user privacy and security
- Adding defensive capabilities
- Fixing bugs and performance issues

Please ensure all contributions maintain the privacy-first design philosophy and do not introduce data collection or external communication features.

## License

This project is developed for educational and privacy protection purposes. Please refer to the license file for specific terms and conditions.

---

**Privo** - Protecting your privacy with the power of AI, keeping control in your hands.
