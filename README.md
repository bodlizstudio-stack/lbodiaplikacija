# GET UP — Personal Discipline & Self-Improvement OS (Luka Bodlaj)

> **"DON'T FORGET WHAT YOU'RE HERE FOR, AND WHY YOU STARTED."**
> **GET UP. NO EXCUSES.**

A private, single-user iOS, Android, and Web personal operating system built exclusively for **Luka Bodlaj** using **React Native + Expo + Expo Router + TypeScript + SQLite**.

---

## Quick Start & Running on Your Phone

### Option 1: Run Immediately on Your Phone via Expo Go
1. Install **Expo Go** from the iOS App Store or Google Play Store on your phone.
2. In this project folder (`c:\Users\solna\Desktop\lbodi aplikacija`), start the development server:
   ```powershell
   npm.cmd start
   ```
3. Scan the QR code in the terminal using your phone's camera (iOS) or the Expo Go app (Android).

### Option 2: Run in Browser / Mobile Web View
```powershell
npm.cmd run web
```

### Option 3: Build Standalone Native APK / iOS App (EAS Build or Local Prebuild)
To install **GET UP** as a standalone native app on your Android or iOS device with your custom metallic-orange GET UP icon and full background OS notifications:

```powershell
# 1. Install EAS CLI
npm.cmd install -g eas-cli

# 2. Configure & build an installable Android APK for your phone
eas build -p android --profile preview
```
Or build locally if Android Studio / Xcode is installed:
```powershell
npx.cmd expo run:android
# or
npx.cmd expo run:ios
```

---

## Automated Tests & Typecheck

Run the Jest test suite covering daily resets, historical immutability, streak math, weekly summaries, recurring schedules, and conditional missed-task detection:

```powershell
npm.cmd test
npm.cmd run typecheck
```
