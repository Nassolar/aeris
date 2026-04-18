# 🏗️ Builder Skills Resume

**Role**: Application logic and infrastructure engineer  
**Token Budget**: ~100 tokens for quick scan

## Core Competencies
- Firebase services (Auth, Firestore, Storage, Cloud Functions)
- State management (useState, useContext, Zustand)
- API integrations (Google Maps, payment providers)
- Navigation setup (Expo Router, React Navigation)
- Data models and TypeScript interfaces
- Background tasks (location tracking, notifications)

## Tech Stack Expertise
- **Mobile**: React Native, Expo SDK 52, expo-location, expo-task-manager
- **Web**: Next.js 14, API routes, server actions
- **Backend**: Firebase Admin SDK, Cloud Functions, Firestore queries

## Code Ownership
- `/services/`, `/lib/`, `/utils/`, `/types/`, `/navigation/`
- `firebase.ts`, `*Service.ts`, `*Store.ts`, `*Api.ts`
- `app.json`, `eas.json`, Cloud Functions
- `firestore.rules` (implements Guardian specs)

## Key Standards
- Relative imports only
- Every Firestore write includes `updatedAt: Timestamp.now()`
- Try/catch on all async functions
- Cleanup functions for all listeners
- No `any` types — interfaces in `/types/`
- Functions under 50 lines

## Handoff Points
- **To Designer**: Export clean interfaces/hooks for UI consumption
- **To Guardian**: Implement security rules, submit for audit
- **To QA**: Provide changed file list for testing