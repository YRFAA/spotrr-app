# Spotrr - Gym Buddy Finder App

## Overview
Spotrr is an Expo mobile app (React Native) for finding gym buddies nearby. It works on iOS, Android, and web.

## Architecture
- **Framework**: Expo (React Native) with Expo Router for file-based navigation
- **Language**: TypeScript
- **Navigation**: Tab-based with 3 tabs: Discover, Matches, Profile
- **Styling**: React Native StyleSheet
- **State**: React Query (@tanstack/react-query)
- **Fonts**: Inter via @expo-google-fonts/inter

## Project Structure
```
app/
  _layout.tsx          # Root layout with providers
  +not-found.tsx       # 404 screen
  (tabs)/
    _layout.tsx        # Tab bar layout
    index.tsx          # Discover screen
    matches.tsx        # Matches screen
    profile.tsx        # Profile screen
components/
  ErrorBoundary.tsx    # Error boundary wrapper
  ErrorFallback.tsx    # Error fallback UI
constants/
  colors.ts            # Color theme constants
assets/
  images/
    spotrr-logo.png    # App logo
```

## Running the App
- **Dev Server**: Port 8081 (Expo Metro bundler)
- **Workflow**: "Start application" runs `npx expo start --web --port 8081 --host lan`
- Users can scan QR code from Replit's URL bar to test on physical device via Expo Go

## Deployment
- Configured as static deployment using `expo export --platform web`
- Output directory: `dist/`

## Design
- Dark mode support (`userInterfaceStyle: "automatic"`)
- Primary color: #E53935 (red)
- Dark background: #0c0c0c
- Gym buddy finding via card swipe UI (Discover tab)
