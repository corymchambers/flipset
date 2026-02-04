# Welcome to Flipset

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Set up environment variables

   Create a `.env` file in the project root:

   ```bash
   EXPO_PUBLIC_WEB3FORMS_KEY=your_key_here
   EXPO_PUBLIC_FEEDBACK_EMAIL=your_email@example.com
   EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
   ```

   - `EXPO_PUBLIC_WEB3FORMS_KEY` - API key for the feedback form. Get a free key at https://web3forms.com
   - `EXPO_PUBLIC_FEEDBACK_EMAIL` - Email address to receive user feedback
   - `EXPO_PUBLIC_SENTRY_DSN` - Sentry DSN for error logging. Get one at https://sentry.io

3. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Build and run locally

First, generate the native projects:

```bash
npx expo prebuild
```

### iOS

```bash
npx expo run:ios
```

Or open in Xcode:

```bash
open ios/flipset.xcworkspace
```

### Android

```bash
npx expo run:android
```

## Build release versions for devices

### Android APK

Build a release APK:

```bash
cd android && ./gradlew assembleRelease
```

The APK will be at `android/app/build/outputs/apk/release/app-release.apk`. Install via:

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

Or upload the APK to Google Drive/Dropbox and download on your device.

### Android AAB (Google Play)

#### 1. Generate Release Keystore (first time only)

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore android/app/release.keystore -alias flipset -keyalg RSA -keysize 2048 -validity 10000
```

Remember the password you set. Add to `.gitignore`:

```bash
echo "android/app/release.keystore" >> .gitignore
```

**Back up the keystore** outside the project (it gets deleted with `prebuild --clean`):

```bash
cp android/app/release.keystore ~/flipset-release.keystore
```

#### 2. Add Credentials to `~/.gradle/gradle.properties`

Store credentials in your **user-level** gradle.properties (not the project one) so they survive `prebuild --clean`:

```bash
echo "FLIPSET_UPLOAD_STORE_FILE=release.keystore" >> ~/.gradle/gradle.properties
echo "FLIPSET_UPLOAD_KEY_ALIAS=flipset" >> ~/.gradle/gradle.properties
echo "FLIPSET_UPLOAD_STORE_PASSWORD=your_password" >> ~/.gradle/gradle.properties
echo "FLIPSET_UPLOAD_KEY_PASSWORD=your_password" >> ~/.gradle/gradle.properties
```

#### 3. Configure Signing in `android/app/build.gradle`

Add `release` signing config:

```groovy
signingConfigs {
    debug { ... }
    release {
        if (project.hasProperty('FLIPSET_UPLOAD_STORE_FILE')) {
            storeFile file(FLIPSET_UPLOAD_STORE_FILE)
            storePassword FLIPSET_UPLOAD_STORE_PASSWORD
            keyAlias FLIPSET_UPLOAD_KEY_ALIAS
            keyPassword FLIPSET_UPLOAD_KEY_PASSWORD
        }
    }
}
```

Update `buildTypes.release`:

```groovy
release {
    signingConfig signingConfigs.release
    // ... rest of config
}
```

#### 4. Build AAB

```bash
cd android && ./gradlew bundleRelease
```

The AAB will be at `android/app/build/outputs/bundle/release/app-release.aab`.

#### 5. Upload to Google Play

1. Go to Google Play Console
2. Select your app → **Testing** → **Internal testing**
3. **Create new release** → Upload the AAB
4. Add testers under the **Testers** tab
5. Share the opt-in link with testers

**Important:** Back up your `release.keystore` file. Google Play App Signing manages the distribution key, but you need the upload key to publish updates.

#### After Running `npx expo prebuild --clean`

Running `prebuild --clean` deletes the entire `android/` folder. Your credentials are safe in `~/.gradle/gradle.properties`, but you need to:

1. Copy your keystore back: `cp ~/path/to/backup/release.keystore android/app/`
2. Re-add the signing config to `android/app/build.gradle`:

1. In `signingConfigs`, add after `debug`:
```groovy
release {
    if (project.hasProperty('FLIPSET_UPLOAD_STORE_FILE')) {
        storeFile file(FLIPSET_UPLOAD_STORE_FILE)
        storePassword FLIPSET_UPLOAD_STORE_PASSWORD
        keyAlias FLIPSET_UPLOAD_KEY_ALIAS
        keyPassword FLIPSET_UPLOAD_KEY_PASSWORD
    }
}
```

2. In `buildTypes.release`, change:
```groovy
signingConfig signingConfigs.debug
```
to:
```groovy
signingConfig signingConfigs.release
```

### iOS (without TestFlight)

1. Open the project in Xcode:
   ```bash
   open ios/flipset.xcworkspace
   ```

2. Select your device as the build target

3. Change to Release configuration:
   - **Product → Scheme → Edit Scheme**
   - Select **Run** on the left
   - Set **Build Configuration** to "Release"

4. Build and run (Cmd+R)

Note: With a free Apple Developer account, apps expire after 7 days. A paid account ($99/year) removes this limitation.

## Image-to-Text (OCR) Libraries

The app uses `expo-image-picker` + `@bsky.app/expo-image-crop-tool` + `@react-native-ml-kit/text-recognition` for OCR.

**Other libraries considered:**
- `react-native-image-crop-picker` - Corrupts EXIF orientation on iOS, causing garbled OCR results
- `expo-image-picker` with `allowsEditing: true` - Works but no drag handles for flexible cropping
- `expo-text-extractor` - Vision Framework OCR, same iOS cropping issues as ML Kit
- `expo-image-manipulator` - Tried to fix orientation post-crop, didn't resolve the issue

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
