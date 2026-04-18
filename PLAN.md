# AERIS Development Plan (PLAN.md)
# Single source of truth for project state.
# Every agent reads this at the start. Every agent updates this at the end.
# Last updated: 2026-03-09

---

## Current Sprint: Stabilization + Remaining Features

### Priority Queue
| # | Task | App | Status | Notes |
|---|------|-----|--------|-------|
| 2 | Fix GPS/location reliability in incident reporting | Citizen | ⚠️ In Progress | — |
| 3 | Seed Firestore service_providers collection | Backend | 🔴 Not Started | Providers screen shows empty until seeded |
| 4 | Wire marketplace bookings into Bookings tab history | Citizen | 🔴 Not Started | `service_bookings` not shown in bookings.tsx yet |
| 5 | Payment integration (GCash, Credit Card) | Citizen | 🔴 Not Started | UI scaffolded, needs API |
| 6 | Phone OTP account creation | Partner App | 🔴 Not Started | — |
| 7 | Phone OTP account creation | Responder App | 🔴 Not Started | — |
| 8 | Refactor to remove `any` types | Citizen | 🔴 Not Started | In bookingService.ts, index.tsx |
| 9 | Standardize Timestamps — replace `new Date()` with `Timestamp.now()` | Citizen | 🔴 Not Started | reportService.ts violates Rule #3 |
| 10 | KYC verification flow | Citizen | 🔴 Not Started | — |

---

## Citizen App — Feature Completion Status

### Authentication
- ⚠️ Dev mode bypass still present in code (intentional for testing)

### Emergency Reporting
- ⚠️ GPS reliability issues — sometimes returns stale or null coords (next priority)

### Emergency Response Pipeline (end-to-end)

### Dashboard (Home Tab)

### Service Marketplace (NEW — 2026-03-08)
  - Search with keyword matching (English + Tagalog), sort by Popular/Rating/Price
  - Static fallback data for 7 categories (repair, cleaning, moving, painting, beauty, petCare, tech)
  - Loads live from `service_subcategories` Firestore collection when seeded
  - GPS auto-fill, photo upload with compression (expo-image-manipulator, max 1200px, 0.7 quality)
  - Urgency selector (Now +₱100 / Today / Tomorrow / Schedule), character counter
  - Creates `service_requests` Firestore document on submit
  - Haversine distance calculation, ETA estimation (30 km/h avg)
  - Sort: Nearest / Top Rated / Cheapest / Fastest
  - Loads from `service_providers` collection — shows empty state until seeded
  - Stats, certifications, work photo portfolio, paginated reviews
  - Sticky "Book" CTA footer
  - Pricing breakdown (base + urgent fee + 10% service fee), payment method selector
  - Special instructions, terms checkbox
  - Creates `service_bookings` document, marks `service_requests` as matched
  - Google MapView with real-time provider pin (from `provider_locations` collection)
  - Firestore onSnapshot for booking status changes
  - Price quote approval modal (approve/decline)
  - Timeline progress visualization (9 steps)
  - Cancel booking (free within 5 min), Chat + Call quick actions
  - Payment confirmation (Cash/GCash/Card), star rating (1-5)
  - Review tags + optional comment + photo upload

### Chat

### Bookings History
- ❌ `service_bookings` (marketplace) not yet surfaced in this tab

---

## Firebase Collections

### Emergency Pipeline
```
users/{uid}                          — User profiles (all roles)
reports/{reportId}                   — Incident reports
reports/{reportId}/evidence/{id}     — Photo/video evidence (fileUrl, mimeType)
live_dispatch/{dispatchId}           — Active dispatches (written by Cloud Function)
responderInbox/{dispatchId}          — Mirror of live_dispatch (responder reads here)
complaint_queue/{id}                 — Non-emergency complaints
dispatch_records/{id}                — Completed dispatch records
```

### Service Marketplace (NEW)
```
service_subcategories/{id}           — Service types (plumbing, electrical, etc.) — needs seeding
service_providers/{id}               — Marketplace service providers — needs seeding
service_requests/{id}                — Citizen service requests (scoped by userId)
service_bookings/{id}                — Bookings (scoped by userId + providerId)
service_reviews/{id}                 — Provider reviews (public read)
provider_locations/{providerId}      — Real-time GPS for live tracking
```

### Partner / Legacy
```
bookings/{bookingId}                 — Old partner booking system (PENDING/ACCEPTED/etc.)
standby_shifts/{id}                  — Partner standby shifts
chats/{chatId}/messages              — Chat messages
editRequests/{id}                    — Report edit approvals
auditLog/{id}                        — Change tracking
responderApprovals/{id}              — New responder onboarding
admins/{id}                          — Admin accounts
notifications/{id}                   — Push notification records
providers/{id}                       — Partner app provider profiles (role-based)
```

---

## Architecture Notes

### Tech Stack (Citizen App)
- React Native 0.81.5 + Expo SDK 54
- Expo Router (file-based routing)
- TypeScript (strict, no `any` in new code)
- Firebase: `@react-native-firebase/app` + `@react-native-firebase/auth` (native)
- Firebase: `firebase/compat` SDK for Firestore, Storage (JS SDK)
- `react-native-maps` v1.20.1 (Google Maps, PROVIDER_GOOGLE)
- `expo-location` v19 — GPS, reverse geocoding
- `expo-image-picker` + `expo-image-manipulator` — photo capture + compression
- `expo-av` — video capture and playback

### Route Structure
```
app/
├── _layout.tsx              — Root layout, auth gate
├── (auth)/                  — Login, OTP, profile creation, security setup
├── (tabs)/                  — Main tab navigator
│   ├── index.tsx            — Home (Emergency/Services switcher)
│   ├── emergency.tsx        — Emergency cards
│   ├── bookings.tsx         — Booking history + track report
│   ├── inbox.tsx            — Notifications
│   └── profile.tsx          — User profile
├── report/                  — Incident report wizard + status tracker
├── booking/[id].tsx         — Old partner booking details
├── chat/[chatId].tsx        — Real-time chat
├── track-report/            — Find report by ID
├── emergency/               — Emergency detail screens
└── services/                — Service marketplace (NEW)
    ├── [category].tsx       — Subcategory selection
    ├── request.tsx          — Problem description form
    ├── providers.tsx        — Provider list
    ├── provider/[id].tsx    — Provider profile
    └── booking/
        ├── confirm.tsx      — Booking confirmation
        ├── [id].tsx         — Live tracking
        └── complete.tsx     — Payment + review
```

### Key Files
| File | Purpose |
|------|---------|
| `firebaseConfig.ts` | Firebase compat init (auth, db, storage) |
| `services/reportService.ts` | Emergency report creation + evidence upload |
| `services/serviceMarketplaceService.ts` | Full marketplace CRUD + real-time subscriptions |
| `services/bookingService.ts` | Old partner booking system |
| `services/chatService.ts` | Chat creation + messaging |
| `services/searchService.ts` | Fuzzy search for incident types |
| `services/imageService.ts` | Image upload to Firebase Storage |
| `types/serviceMarketplace.ts` | All marketplace TypeScript interfaces |
| `types/index.ts` | Core app interfaces |
| `constants/theme.ts` | Design system (colors, spacing, shadows) |
| `constants/categories.ts` | Emergency report categories + subcategories |
| `constants/incidentTypes.ts` | Smart search incident database (bilingual) |

---

## Build Info
- **Last APK build**: EAS build `6c8ffe91` (development profile, ~2026-03-06)
- **Rebuild required when**: adding new native packages, changing `app.json` plugins, updating `google-services.json`
- **No rebuild needed for**: all JS/TS changes (hot reload via Metro)
- **EAS Project**: aeris-citizen-app-16265
- **Firebase Project**: aeris-citizen-app-16265

---

## Change Log

[2026-03-14] [CONDUCTOR] [FEATURE] Voice SOS Emergency Button — Full Implementation
- QA audit against .docs/VOICE_SOS_EMERGENCY_BUTTON.md — 14 critical defects found in Gemini's output
- NEW: types/voiceSOS.ts — DispatchUnit, SOSLocation, ConductorAIClassification, SOSIncidentPayload
- NEW: services/speechToTextService.ts — Google STT API (fil-PH + en-PH), base64 via expo-file-system
- NEW: services/conductorAIService.ts — Conductor AI Cloud Function call with 3s Promise.race timeout
- REBUILT: services/emergencyService.ts — collection → `incidents`, Timestamp.now(), full schema (voiceTranscript, audioUrl, audioHash, aiClassification, location.address+barangay), SHA-256 via crypto.subtle, reverse geocoding, updateIncidentWithAudio(), updateIncidentWithClassification(), updatedAt on all writes
- REBUILT: components/dashboard/SOSBar.tsx — MicIcon (was WarningTriangleIcon), always red #CD0E11 (removed green confirmed state), primary label stays "EMERGENCY SOS", pulsing ring glow on COMMIT, AppState backgrounding handler, full async dispatch pipeline, navigate to /report/[incidentId] after dispatch
- REBUILT: components/dashboard/SOSButton.tsx — ActivityIndicator spinner during PROCESSING, pulsing ring glow, AppState handler, full pipeline, navigation, removed console.log
- REBUILT: app/emergency/index.tsx — removed mock reportToPoliceResponder (Rule #1), removed any types, fixed named→default import, removed obsolete countdown state machine
- QA: No any types, all relative imports, Timestamp.now() on all writes, updatedAt present, no mocks, no console.logs in service layer
- NOTE: Env vars required — EXPO_PUBLIC_GOOGLE_SPEECH_API_KEY, EXPO_PUBLIC_CONDUCTOR_AI_URL
- NOTE: Tracker screen /report/[id] needs extending to read `incidents` collection (separate task)
- Agents: 🧪 QA (full spec audit), 🏗️ Builder (services + types), 🎨 Designer (SOSBar + SOSButton)

[2026-03-09] [CONDUCTOR] [FEATURE] Offline-First Emergency Report Queue
- NEW: services/offlineQueueService.ts — AsyncStorage queue, photo persistence to documentDirectory, processQueue() with exponential backoff, delegates upload to ReportService.submitReport()
- NEW: hooks/useNetworkStatus.ts — useNetworkSync() hook, triggers processQueue() on reconnect
- NEW: components/NetworkStatusBar.tsx — shows "Sending N report(s)..." only when queue has pending items, invisible otherwise (no "you're offline" message)
- MODIFIED: app/report/index.tsx — handleSubmit now calls queueRequest() instead of ReportService.submitReport() directly; always proceeds to success screen (no error path)
- MODIFIED: app/_layout.tsx — processQueue() on app start, useNetworkSync() mounted globally, NetworkStatusBar rendered in root
- INSTALLED: @react-native-community/netinfo@11.4.1 (native package — APK rebuild required)
- QA: No any types in new code, all relative imports, error narrowing with instanceof, no mock logic
- NOTE: APK rebuild required before testing (new native package added)

[2026-03-08] [CONDUCTOR] [FEATURE] Service Marketplace — Full Booking Flow (9 screens)
- NEW: types/serviceMarketplace.ts — all TS interfaces (ServiceSubcategory, MarketplaceProvider, ServiceRequest, ServiceBooking, PriceQuote, ServiceReview, ProviderLocation, etc.)
- NEW: services/serviceMarketplaceService.ts — Haversine distance, fetchProviders, createServiceRequest, createServiceBooking, subscribeToBooking, subscribeToProviderLocation, approvePriceQuote, confirmPayment, submitReview
- NEW: app/services/_layout.tsx + provider/_layout.tsx + booking/_layout.tsx — Expo Router layouts
- NEW: app/services/[category].tsx — subcategory selection with search + sort
- NEW: app/services/request.tsx — problem description + GPS + photo upload + urgency
- NEW: app/services/providers.tsx — provider list with sort/filter + empty state
- NEW: app/services/provider/[id].tsx — provider profile + reviews + portfolio
- NEW: app/services/booking/confirm.tsx — booking confirmation + pricing breakdown
- NEW: app/services/booking/[id].tsx — live tracking (MapView + real-time onSnapshot + price approval modal)
- NEW: app/services/booking/complete.tsx — payment + star rating + review submission
- MODIFIED: app/(tabs)/index.tsx — wired SERVICES_GRID onPress → /services/[category]
- New Firestore collections: service_subcategories, service_providers, service_requests, service_bookings, service_reviews, provider_locations
- QA: TS clean on all new files, no any types, no absolute imports, no console.logs

[2026-03-06] [CONDUCTOR] [FIX] Full end-to-end pipeline audit + 4 critical blockers fixed + video support
- FIXED: reportService.ts missing immutableEvidence → Cloud Function now receives full GPS + device info
- FIXED: Cloud Function now batch-writes to both live_dispatch AND responderInbox (same doc ID)
- FIXED: Evidence subcollection fileUrl/url fallback + mimeType field added
- FIXED: agencyId missing from dispatches → web dashboard queries now return results
- ADDED: Video support end-to-end (citizen upload → responder view → web dashboard player)
- DEPLOYED: 7 Cloud Functions to aeris-citizen-app-16265

[2026-03-06] [CONDUCTOR] [FIX] Wired Emergency screen buttons + renamed Rescue → Fire card
- Fixed: app/(tabs)/emergency.tsx — all 4 cards had no onPress after design revamp
- Added FireIcon SVG, fire title case in report wizard
- Dev APK rebuild: EAS build 6c8ffe91

[2026-03-03] [CONDUCTOR] [COMPLETE] Updated constants/categories.ts from .docs/CATEGORY_CONSTANTS.md

[2026-03-03] [CONDUCTOR] [FIX] SOSBar crash — TypeError: Cannot read property 'length' of undefined
- Root cause: image: null passed instead of images: [] to submitReport
- Fixed: components/dashboard/SOSBar.tsx

[2026-02-26] [CONDUCTOR] [FEATURE] Smart Search on Emergency tab
- NEW: constants/incidentTypes.ts — 20+ incident types, bilingual keywords, agency routing
- NEW: services/searchService.ts — weighted fuzzy search (exact > prefix > contains > alias)
- MODIFIED: components/dashboard/EmergencyView.tsx — live search bar with inline dropdown

[2026-02-20] [CONDUCTOR] [FEATURE] Anonymous Reporting Flow
- NEW: components/AnonymousWaiverModal.tsx
- MODIFIED: services/reportService.ts — logs device IP + anonymous state
- MODIFIED: app/report/index.tsx — anonymous flow + lock-screen success UI
- NEW: app/track-report/index.tsx — find report by ID
- MODIFIED: app/(tabs)/bookings.tsx — Track Report CTA in header

[2026-02-14] [CONDUCTOR] [FEATURE] TypewriterBanner + Partner Onboarding Modal
- NEW: components/TypewriterBanner.tsx — state machine animation, cycling + full typewriter modes
- NEW: components/PartnerOnboardingModal.tsx — 3-slide carousel, deep link to aeris-partner://signup
- MODIFIED: components/dashboard/ServiceView.tsx — integrated TypewriterBanner in empty state
- MODIFIED: app/(tabs)/index.tsx — modal state + onPartnerBannerPress callback

[2026-02-13] [CONDUCTOR] [UPGRADE] Migrated to Native Firebase Phone Auth
- Removed expo-firebase-recaptcha (deprecated)
- Installed @react-native-firebase/app + @react-native-firebase/auth
- Added google-services.json, updated app.json plugins
- Rewrote app/(auth)/login.tsx + verify-otp.tsx — native credential flow

[2026-02-12] [CONDUCTOR] [FIX] Fixed EAS build failures
- Updated 27 dependencies to SDK 54 (React 19, RN 0.81.5)
- Enabled New Architecture (newArchEnabled: true)

[2026-02-12] [CONDUCTOR] [COMPLETE] Profile Creation Flow + Auth Interceptor
- Auth gate in app/_layout.tsx, profile creation screens, dev mode bypass
