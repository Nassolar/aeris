# AERIS â€” Project Context
> Last updated: 2026-03-09 | Firebase project: `aeris-citizen-app-16265` (shared by all apps)

AERIS (Adaptive Emergency Response & Integrated Services) is a multi-platform emergency response ecosystem connecting citizens, service providers, first responders, and government agencies in the Philippines.

---

## Ecosystem Overview

| App | Repo | Platform | Stack | Status |
|-----|------|----------|-------|--------|
| Citizen App | `z:/platform/aeris/apps/aeris` | React Native (Expo Router) | RN 0.81.5, Expo SDK 54, TypeScript, Firebase Native | âœ… Most Complete |
| Partner App | `z:/platform/aeris/apps/aeris-partner` | React Native (React Navigation) | Expo SDK 54, TypeScript, Firebase JS SDK | ðŸŸ¡ Stable, gaps remain |
| Responder App | `z:/platform/aeris/apps/aeris-responder` | React Native (React Navigation) | Expo SDK 54, TypeScript, NativeWind, Gemini AI | ðŸŸ¡ Active development |
| Web Dashboard | `z:/platform/aeris/apps/aeris-web` | Next.js 14 App Router | TypeScript, Tailwind, Zustand, firebase-admin | âœ… Feature-rich |
| Partner Web Portal | `z:/platform/aeris/apps/aeris-partner-web` | Next.js 14 App Router | TypeScript, Tailwind, Radix UI, firebase-admin | ðŸŸ¡ Built, pending deploy |

---

## 1. Citizen App (`z:/platform/aeris/apps/aeris`)

### Tech Stack
- **Runtime**: React Native 0.81.5, Expo SDK 54, React 19, Expo Router v6
- **Language**: TypeScript (strict)
- **Firebase**: `@react-native-firebase/app+auth+firestore+storage` (native SDK) + `firebase/compat` (JS SDK for Firestore/Storage)
- **State**: Zustand v5, AsyncStorage
- **Maps**: `react-native-maps` v1.20.1 (Google Maps, PROVIDER_GOOGLE)
- **Media**: `expo-image-picker`, `expo-image-manipulator`, `expo-av`
- **Location**: `expo-location` v19
- **Network**: `@react-native-community/netinfo` v11.4.1
- **Auth**: `expo-local-authentication`, `expo-secure-store`
- **UI**: `lucide-react-native`, `react-native-svg`, `react-native-reanimated`
- **Build**: EAS (last build: `6c8ffe91`, profile: development, ~2026-03-06)

### Route Structure (`app/`)
```
app/
â”œâ”€â”€ _layout.tsx              â€” Root layout + auth gate
â”œâ”€â”€ (auth)/                  â€” Login, OTP, profile creation, security setup
â”œâ”€â”€ (tabs)/
â”‚   â”œâ”€â”€ index.tsx            â€” Home: Emergency/Services tab switcher
â”‚   â”œâ”€â”€ emergency.tsx        â€” Emergency cards (Police/Medical/Fire/Violation)
â”‚   â”œâ”€â”€ bookings.tsx         â€” Booking history + Track Report CTA
â”‚   â”œâ”€â”€ inbox.tsx            â€” Notifications
â”‚   â””â”€â”€ profile.tsx          â€” User profile
â”œâ”€â”€ report/                  â€” Incident report wizard + status tracker
â”œâ”€â”€ booking/[id].tsx         â€” Old partner booking details
â”œâ”€â”€ chat/[chatId].tsx        â€” Real-time chat
â”œâ”€â”€ track-report/            â€” Find report by ID
â”œâ”€â”€ emergency/               â€” Emergency detail screens
â””â”€â”€ services/                â€” Service marketplace (9 screens)
    â”œâ”€â”€ [category].tsx       â€” Subcategory selection + search/sort
    â”œâ”€â”€ request.tsx          â€” Problem description + GPS + photo
    â”œâ”€â”€ providers.tsx        â€” Provider list (Haversine sort)
    â”œâ”€â”€ provider/[id].tsx    â€” Provider profile + portfolio + reviews
    â””â”€â”€ booking/
        â”œâ”€â”€ confirm.tsx      â€” Pricing breakdown + payment method
        â”œâ”€â”€ [id].tsx         â€” Live tracking (MapView + real-time)
        â””â”€â”€ complete.tsx     â€” Payment confirmation + star rating
```

### Key Services & Files
| File | Purpose |
|------|---------|
| `firebaseConfig.ts` | Firebase compat init (auth, db, storage) |
| `services/reportService.ts` | Emergency report creation + evidence upload |
| `services/offlineQueueService.ts` | AsyncStorage queue, auto-upload on reconnect |
| `services/serviceMarketplaceService.ts` | Full marketplace CRUD + real-time subscriptions |
| `services/bookingService.ts` | Old partner booking system |
| `services/chatService.ts` | Chat creation + messaging |
| `services/searchService.ts` | Fuzzy search for incident types (bilingual EN/TL) |
| `services/imageService.ts` | Image upload to Firebase Storage |
| `hooks/useNetworkStatus.ts` | Network monitoring + offline queue trigger |
| `components/NetworkStatusBar.tsx` | Shows "Sending N report(s)..." when queue pending |
| `components/dashboard/SOSBar.tsx` | One-tap SOS button |
| `types/serviceMarketplace.ts` | All marketplace TypeScript interfaces |
| `types/index.ts` | Core app interfaces |
| `constants/theme.ts` | Design system (colors, spacing, shadows) |
| `constants/categories.ts` | Emergency categories + subcategories |
| `constants/incidentTypes.ts` | 20+ incident types, bilingual, agency routing |
| `backend/modal_app.py` | Python/Modal backend â€” **STUB ONLY** (TODOs for Firebase Admin + dispatch logic) |

### Feature Status
| Feature | Status | Notes |
|---------|--------|-------|
| Phone OTP login (native, no reCAPTCHA) | âœ… | `@react-native-firebase/auth` |
| Profile creation flow | âœ… | Name, photo, role selection |
| Auth gate in `_layout.tsx` | âœ… | Dev bypass still present |
| Offline-first report queue | âœ… | AsyncStorage â†’ auto-upload on reconnect |
| Report wizard (4 steps) | âœ… | Category â†’ Details â†’ Location â†’ Evidence |
| Photo + Video evidence upload | âœ… | Storage upload, mimeType support |
| Anonymous reporting | âœ… | Waiver modal, device IP logged |
| Report tracking by ID | âœ… | `track-report/index.tsx` |
| Real-time report status | âœ… | `report/[id].tsx` |
| SOS button | âœ… | Crash fixed |
| Smart search (Emergency tab) | âœ… | Fuzzy, bilingual EN/TL |
| Service Marketplace (9 screens) | âœ… | Full booking flow |
| Real-time chat | âœ… | `chats/{chatId}/messages` |
| Partner onboarding modal | âœ… | Deep links to `aeris-partner://signup` |
| GPS reliability | âš ï¸ | Sometimes stale/null â€” next priority |
| `service_providers` collection | ðŸ”´ | Needs Firestore seeding |
| `service_bookings` in bookings tab | ðŸ”´ | Not surfaced in `bookings.tsx` yet |
| Payment (GCash/Card) | ðŸ”´ | UI scaffolded, no API |
| KYC verification | ðŸ”´ | Not started |
| Remove `any` types | ðŸ”´ | `bookingService.ts`, `index.tsx` |
| Replace `new Date()` with `Timestamp.now()` | ðŸ”´ | `reportService.ts` violates Rule #3 |

### Zustand Stores (`store/`)
- `authStore.ts` â€” Auth state (user, token, role)
- `emergencyStore.ts` â€” Emergency state (active reports, dispatch)

### App Config Notes
- **Bundle ID**: `com.aeris.app` | **Scheme**: `aeris`
- **EAS Project ID**: `e8304c4c-4f80-4d54-915a-b6fe58a765c4`
- **New Architecture**: enabled (`newArchEnabled: true`)
- **Permissions**: camera, microphone, location (foreground + background), contacts, biometric, storage

### .docs/ Reference Docs
Internal design docs in `.docs/`:
`AUTHENTICATION_SYSTEM.md`, `Anonymous_reporting_feature.md`, `SMART_SEARCH.md`, `CATEGORY_CONSTANTS.md`, `EVIDENCE_SUBCOLLECTION_FIX.md`, `SERVICE_BOOKING_FLOW.md`, `OFFLINE-FIRST_ARCHI.md`

### .agents/ System (11 Agents)
Agent definitions live in `.agents/` â€” each has `INSTRUCTIONS.md` + `SKILLS.md`:
`conductor`, `builder`, `designer`, `qa`, `researcher`, `guardian`, `ux-architect`, `data-schema-lead`, `ai-integration-lead`, `devops-lead`, `error-handling-lead`

### Cloud Functions (7 deployed)
- `onReportCreated` â€” Batch-writes to `live_dispatch` AND `responderInbox`
- Sets `agencyId`, `stationAgencyId`, `stationAgencyName` on all dispatches

---

## 2. Partner App (`z:/platform/aeris/apps/aeris-partner`)

### Tech Stack
- **Runtime**: React Native, Expo SDK 54
- **Language**: TypeScript
- **Navigation**: React Navigation v7 (`AuthStack` â†’ `AppStack`)
- **Firebase**: `firebase` JS SDK
- **Location**: `expo-location` + `expo-task-manager` (background tracking)
- **UI**: Lucide icons, Uber-inspired dark theme

### Screens
| Screen | Purpose |
|--------|---------|
| `LoginScreen` | Auth entry point (AuthStack) |
| `DashboardScreen` | Main hub with real-time stats |
| `StandbyShiftsScreen` | Browse + join standby shifts |
| `ShiftDetailsScreen` | Active shift view with zone map |
| `BookingsScreen` | Booking history (PENDING/ACCEPTED/etc.) |
| `ChatScreen` | Real-time messaging |
| `InboxScreen` | Notifications |
| `ProfileScreen` | Provider profile view |
| `ProfileEditScreen` | Edit profile info + photo |

### Components
- `ActiveShiftTrackerWidget` â€” Live GPS widget during active shift
- `JobDetailsModal` â€” Job/booking detail overlay
- `PINEntryModal` â€” PIN security for sensitive actions
- `RatingModal` â€” Post-job rating submission

### Services
| Service | Purpose |
|---------|---------|
| `locationTrackingService.ts` | Background GPS with offline queue (20 heartbeats), zone compliance |
| `partnerProfileService.ts` | Profile CRUD |
| `profilePictureService.ts` | Photo upload to Firebase Storage |
| `ratingService.ts` | Submit + fetch ratings |
| `standbyShiftService.ts` | Shift lifecycle management |

### Feature Status
| Feature | Status |
|---------|--------|
| Background location tracking | âœ… Production-ready (8-12% battery) |
| Zone compliance monitoring | âœ… Auto-abandons after 30 min out-of-zone |
| Standby shifts (OPENâ†’CONFIRMEDâ†’ACTIVEâ†’COMPLETED) | âœ… |
| Offline location queue (20 heartbeats) | âœ… |
| Push notifications | âœ… |
| Ratings system | âœ… |
| Dark mode UI | âœ… Uber-inspired |
| Phone OTP account creation | ðŸ”´ Not started |

### Firebase Collections Used
- `standby_shifts` â€” Shift documents
- `bookings` â€” Partner booking records
- `providers` â€” Partner provider profiles
- `chats/{chatId}/messages` â€” Real-time chat
- `notifications` â€” Push notification records

---

## 3. Responder App (`z:/platform/aeris/apps/aeris-responder`)

### Tech Stack
- **Runtime**: React Native, Expo SDK
- **Language**: TypeScript + NativeWind (Tailwind)
- **Navigation**: React Navigation (`TaskStack`, `BOLOStack`)
- **Firebase**: `firebase` JS SDK
- **AI**: `@google/generative-ai` (Gemini) + Claude claude-sonnet-4-6 via REST (`EXPO_PUBLIC_ANTHROPIC_KEY`)
- **UI**: `react-native-gifted-chat`, `moti`, `react-native-reanimated`, `expo-blur`
- **Media**: `expo-av`, `expo-image-picker`
- **Theme**: Dark â€” Midnight Blue (#0B1121)

### Screens
| Screen | Purpose |
|--------|---------|
| `LoginScreen` | Auth entry |
| `HomeScreen` | Dispatch inbox (responderInbox collection) |
| `DispatchScreen` | Dispatch list view |
| `DispatchDetailScreen` | 4-tab incident detail: SCENE/EVIDENCE/UNITS/NOTES + floating AERIS button |
| `AERISScreen` | Full-screen Claude AI chat (case-scoped context) |
| `TasksScreen` | Task management |
| `InterviewScreen` | Voice-driven witness interview |
| `SituationUpdateScreen` | On-scene status update |
| `VoiceMemoScreen` | Voice recording + transcription |
| `AnalysisResultScreen` | Gemini multimodal analysis results |
| `BOLO/BOLOListScreen` | Be On Lookout â€” active BOLOs |
| `BOLO/BOLODetailScreen` | BOLO full detail |
| `BOLO/BOLOSightingSubmitScreen` | Submit sighting report |
| `ChatScreen` | Real-time chat (react-native-gifted-chat) |
| `InboxScreen` | Notifications |
| `ProfileScreen` | Responder profile |

### Smart Incident Forms (Config-Driven)
- Templates: `src/config/policeIncidentTemplates.ts`, `medicalIncidentTemplates.ts`, `rescueIncidentTemplates.ts`
- Registry: `src/config/incidentTemplates.ts` â€” maps Firebase `category` â†’ template
- Component: `SmartIncidentForm.tsx` â€” renders any template dynamically
- All templates share first 3 sections: Citizen Report (auto-fill), Response Info, Person ID

### AERIS Intelligence Layer
- Flow: Home â†’ Accept â†’ `DispatchDetailScreen` â†’ ã€ŒAã€ â†’ `AERISScreen` (Claude AI) â†’ Start Report
- Files: `src/services/aerisIntelligence.ts`, `src/utils/buildAERISContext.ts`, `src/hooks/useDispatchDetail.ts`
- Audit: Writes to `aerisLogs` collection

### Dynamic Form System
- Agency-configured forms pulled from `form_templates` Firestore collection
- Cached in AsyncStorage per `agencyId` for offline use
- Files: `formService.ts`, `DynamicForm.tsx`, `DynamicFormFields.tsx`, `types/formBuilder.ts`
- Field types: text, textarea, number, dropdown, checkbox, date, time, photo_upload, location

### Feature Status
| Feature | Status |
|---------|--------|
| Smart Incident Forms (police/medical/rescue) | âœ… |
| AERIS Intelligence (Claude AI chat) | âœ… |
| Real-time dispatch inbox | âœ… `responderInbox` collection |
| BOLO system | âœ… Create/list/detail/sighting |
| Dynamic agency forms | âœ… |
| Draft â†’ HQ workflow | âœ… immutableEvidence locking |
| Real-time chat (GiftedChat) | âœ… |
| Voice input | âœ… `VoiceInput.tsx`, `speechToText.ts` |
| Push notifications | âœ… |
| AI Violation Routing (Cloud Functions) | ðŸ”´ Planned |
| Voice-First Interview Mode (full AI) | ðŸ”´ Planned (Modal backend scaffolded) |

### Firebase Collections Used
- `reports` â€” Primary incident reports (reads from citizen app)
- `reports/{id}/evidence` â€” Evidence subcollection
- `responderInbox` â€” Dispatch assignments (mirror of `live_dispatch`)
- `live_dispatch` â€” Active dispatches
- `bolos` â€” BOLO records
- `form_templates` â€” Agency-configured dynamic forms
- `aerisLogs` â€” AERIS AI audit trail
- `chats/{chatId}/messages` â€” Real-time chat
- `responders` â€” Responder profiles

---

## 4. Web Dashboard (`z:/platform/aeris/apps/aeris-web`)

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui + class-variance-authority
- **State**: Zustand
- **Firebase**: `firebase` (client) + `firebase-admin` (server API routes)
- **Forms**: React Hook Form + Zod
- **Maps**: `@react-google-maps/api`, `@vis.gl/react-google-maps`
- **Data**: TanStack Query, Recharts (charts), hls.js (video playback)
- **PDF**: pdfmake + react-to-print
- **CSV**: papaparse
- **Auth**: jose (JWT), Firebase Auth
- **DnD**: @dnd-kit/core + @dnd-kit/sortable
- **PWA**: @ducanh2912/next-pwa

### Role Hierarchy
```
aeris_admin          â€” AERIS super admin (all agencies, platform settings)
agency_admin         â€” Agency-level admin
pnp_hq_admin         â€” PNP HQ admin (personnel, stations)
supervisor           â€” Report approval, edit request review
team_leader          â€” Team management
responder            â€” Basic access, own reports
```

### Route Structure
```
/login                        â€” Auth entry
/dashboard                    â€” Main dashboard
/reports                      â€” All reports list
/reports/[reportId]           â€” Report detail + evidence viewer
/forms                        â€” Dynamic form templates list
/forms/new                    â€” Create form template
/forms/[id]                   â€” Edit form template
/edit-requests                â€” mutableNarrative edit approvals
/approvals                    â€” Responder onboarding approvals
/audit-logs                   â€” General audit trail
/profile                      â€” User profile

/hq/dashboard                 â€” HQ command center
/hq/personnel                 â€” Officer CRUD list
/hq/personnel/[id]            â€” Officer detail
/hq/personnel/create          â€” Create officer
/hq/personnel/bulk-upload     â€” CSV bulk import
/hq/stations                  â€” Station list
/hq/stations/create           â€” Create station
/hq/admins                    â€” HQ admin management
/hq/audit-logs                â€” HQ-scoped audit log

/agency/manage                â€” Agency settings
/agency/teams                 â€” Team management
/agency/personnel-map         â€” Real-time personnel map
/agency/inter-agency          â€” Inter-agency coordination
/agency/bolo                  â€” BOLO list
/agency/bolo/new              â€” Create BOLO
/agency/bolo/[id]             â€” BOLO detail
/agency/bolo/history          â€” Past BOLOs
/agency/analytics             â€” Agency-level analytics

/aeris/dashboard              â€” Super admin dashboard
/aeris/agencies               â€” All agencies list
/aeris/agencies/[id]          â€” Agency detail
/aeris/agencies/create        â€” Create agency
/aeris/analytics              â€” Platform-wide analytics
/aeris/anonymous-reports      â€” Anonymous report viewer
/aeris/audit-logs             â€” Master audit log
/aeris/bulk-upload            â€” Bulk agency/officer upload
/aeris/create-admin           â€” Create admin account
/aeris/identity-access-logs   â€” Identity reveal audit
/aeris/map                    â€” Platform-wide incident map
/aeris/platform-settings      â€” System config
/aeris/team                   â€” AERIS team management
/aeris/unaffiliated           â€” Unaffiliated responders

/admin/verify                 â€” Account verification
/debug                        â€” Debug page
```

### Key Libraries (`lib/`)
| File | Purpose |
|------|---------|
| `firebase.ts` / `firebase-admin.ts` | Firebase client + admin init |
| `permissions.ts` | Role-based access control helpers |
| `auditLog.ts` / `auditLogServer.ts` | Audit log write helpers |
| `pdfGenerator.ts` | Report PDF generation |
| `csvParser.ts` | Bulk upload CSV parsing |
| `formTemplates.ts` | Dynamic form template definitions |
| `reportTemplates.ts` | Report format templates |
| `googleMapsConfig.ts` | Maps configuration |
| `incidentMapConfig.ts` | Live incident map config |
| `categoryToAgencyTypes.ts` | Category â†’ agency routing |
| `boloConfig.ts` | BOLO configuration |
| `passwordGenerator.ts` | Secure password generation |

### Feature Status
| Feature | Status |
|---------|--------|
| Role-based auth (6 roles) | âœ… |
| Report list + detail + evidence viewer | âœ… |
| Video playback (hls.js) | âœ… |
| Edit request workflow | âœ… |
| Responder approvals | âœ… |
| Dynamic form template builder | âœ… |
| HQ admin (personnel/stations/bulk CSV) | âœ… |
| Agency admin (BOLO, teams, inter-agency) | âœ… |
| AERIS super admin (agencies, platform) | âœ… |
| Real-time incident map | âœ… |
| Personnel map | âœ… |
| Analytics + charts | âœ… |
| PDF report export | âœ… |
| Audit logging (all actions) | âœ… |
| PWA support | âœ… |

---

## 5. Partner Web Portal (`z:/platform/aeris/apps/aeris-partner-web`)

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (CSS-based config) + Radix UI components
- **Firebase**: `firebase` (client) + `firebase-admin` (server)
- **Forms**: React Hook Form + Zod v4
- **External APIs**: PRC API (license verification), TESDA API (certificate verification)

### Partner Tier System
| Tier | Type | Verification |
|------|------|-------------|
| Tier 2 | Authority / Licensed Professional (doctor, lawyer, etc.) | PRC license API |
| Tier 3 | Skilled Trades (plumber, electrician, etc.) | TESDA certificate API |
| Tier 4 | Verified Gig Worker | OTP + safety quiz (8/10 pass) |
| Tier 5 | Citizen registration | Optional eKYC |

### Admin Roles
| Role | Access |
|------|--------|
| Admin | Full access, can promote/demote supervisors |
| Supervisor | Final approval, views all docs, suspends/promotes partners |
| Analyst | Reviews AI-flagged apps, verifies doc existence (no viewing) |
| Encoder | Text-field edits only, no doc access |

### Routes
```
/                             â€” Landing page (tier cards)
/apply                        â€” Tier selection
/apply/tier2                  â€” Licensed professional form (9-step)
/apply/tier3                  â€” Skilled trades form (9-step)
/apply/tier4                  â€” Gig worker form (7-step: OTP + safety quiz)
/apply/tier5                  â€” Citizen registration (4-step)
/apply/success                â€” Confirmation

/admin/dashboard              â€” Stats + recent applications
/admin/applications           â€” Queue with status/tier filters
/admin/applications/[id]      â€” Side-by-side review + approve/reject
/admin/partners               â€” Partners list + suspend/activate
/admin/partners/promote       â€” Tier promotion queue
/admin/citizens               â€” Citizens DB + KYC stats + CSV export
/admin/analytics              â€” Approval rates + tier breakdown
/admin/staff                  â€” Staff management
/admin/setup                  â€” Portal setup
/admin/profile                â€” Admin profile
```

### Services
| Service | Purpose |
|---------|---------|
| `applicationService.ts` | Submit, get, list, update applications; audit log |
| `partnerService.ts` | Partner list, tier promotions, suspend/activate |
| `citizenService.ts` | Citizens DB, KYC stats |
| `storageService.ts` | Document + selfie upload (10MB limit) |
| `prcVerification.ts` | PRC API proxy calls |
| `tesdaVerification.ts` | TESDA API proxy calls |
| `staffService.ts` | Staff CRUD |

### Cloud Functions
| Function | Trigger | Purpose |
|----------|---------|---------|
| `analyzeDocument` | Storage onCreate | Google Cloud Vision OCR + authenticity score |
| `verifyFaceMatch` | Firestore trigger | AWS Rekognition face match (placeholder) |
| `onApplicationStatusChange` | Firestore trigger | Creates Firebase Auth user on approval |
| `cleanupOldAuditLogs` | Scheduled | Purges audit logs >2 years old |

### Firebase Collections
- `partner_applications` â€” Application documents + AI verification results
- `users` â€” All portal user accounts
- `audit_logs` â€” Immutable action trail (no update/delete in rules)
- `tier_promotions` â€” Pending/approved tier promotions
- `citizens` â€” Tier 5 registrations

### Feature Status
| Feature | Status |
|---------|--------|
| Multi-tier application forms | âœ… |
| PRC license API verification | âœ… |
| TESDA certificate API verification | âœ… |
| AI document analysis (Cloud Vision) | âœ… |
| Admin dashboard + application queue | âœ… |
| Role-based document visibility (Analyst cannot view) | âœ… |
| Partner management + tier promotions | âœ… |
| Citizens DB + CSV export | âœ… |
| Analytics | âœ… |
| Immutable audit logs | âœ… |
| Middleware auth for `/admin/*` | ðŸ”´ Not yet implemented |
| Partner detail page `/admin/partners/[id]` | ðŸ”´ Not yet built |
| Phone OTP (real) | ðŸ”´ Currently mocked |
| Face match (AWS Rekognition) | ðŸ”´ Placeholder only |
| Deployment | ðŸ”´ Not yet deployed |
| PRC/TESDA API env vars | ðŸ”´ Need real values |

---

## Shared Firebase Collections

### Emergency Pipeline
```
users/{uid}                          â€” User profiles (all roles, all apps)
reports/{reportId}                   â€” Incident reports (from Citizen App)
reports/{reportId}/evidence/{id}     â€” Photo/video (fileUrl, mimeType)
live_dispatch/{dispatchId}           â€” Active dispatches (Cloud Function writes)
responderInbox/{dispatchId}          â€” Mirror of live_dispatch (responder reads)
complaint_queue/{id}                 â€” Non-emergency complaints
dispatch_records/{id}                â€” Completed dispatch records
aerisLogs/{id}                       â€” AERIS AI audit trail
```

### Service Marketplace
```
service_subcategories/{id}           â€” Service types â€” NEEDS SEEDING
service_providers/{id}               â€” Marketplace providers â€” NEEDS SEEDING
service_requests/{id}                â€” Citizen service requests
service_bookings/{id}                â€” Confirmed bookings
service_reviews/{id}                 â€” Provider reviews (public read)
provider_locations/{providerId}      â€” Real-time GPS (live tracking)
```

### Partner App
```
standby_shifts/{id}                  â€” Standby shift documents
bookings/{bookingId}                 â€” Old partner booking system
providers/{id}                       â€” Partner provider profiles
chats/{chatId}/messages              â€” Chat messages
notifications/{id}                   â€” Push notification records
```

### Responder App
```
responders/{id}                      â€” Responder profiles
bolos/{id}                           â€” Be On Lookout records
form_templates/{id}                  â€” Agency-configured dynamic forms
```

### Web Dashboard / Admin
```
editRequests/{id}                    â€” mutableNarrative edit approvals
auditLog/{id}                        â€” General audit trail
admins/{id}                          â€” Admin accounts
responderApprovals/{id}              â€” New responder onboarding
agencies/{id}                        â€” Agency records
```

### Partner Web Portal
```
partner_applications/{id}            â€” Partner onboarding applications
tier_promotions/{id}                 â€” Tier upgrade requests
citizens/{id}                        â€” Tier 5 citizen registrations
audit_logs/{id}                      â€” Immutable portal audit trail
```

---

## Cross-App Priorities (As of 2026-03-09)

| # | Task | App | Status |
|---|------|-----|--------|
| 1 | Fix GPS reliability in incident reporting | Citizen | âš ï¸ In Progress |
| 2 | Seed `service_providers` + `service_subcategories` | Backend | ðŸ”´ Blocked (shows empty state) |
| 3 | Surface `service_bookings` in bookings tab | Citizen | ðŸ”´ Not started |
| 4 | Payment integration (GCash/Card) | Citizen | ðŸ”´ UI only |
| 5 | Phone OTP account creation | Partner App | ðŸ”´ Not started |
| 6 | Phone OTP account creation | Responder App | ðŸ”´ Not started |
| 7 | Middleware auth for `/admin/*` | Partner Web | ðŸ”´ Not started |
| 8 | Deploy Partner Web Portal | Partner Web | ðŸ”´ Not deployed |
| 9 | Face match Cloud Function (real) | Partner Web | ðŸ”´ Placeholder only |
| 10 | AI Violation Routing pipeline | Responder/Web | ðŸ”´ Planned |
| 11 | Voice-First Interview Mode | Responder | ðŸ”´ Modal scaffolded |
| 12 | Remove `any` types | Citizen | ðŸ”´ `bookingService.ts` |
| 13 | Replace `new Date()` with `Timestamp.now()` | Citizen | ðŸ”´ `reportService.ts` |
| 14 | KYC verification flow | Citizen | ðŸ”´ Not started |

---

## Development Environment

### Firebase Project
- **ID**: `aeris-citizen-app-16265`
- **Services**: Firestore, Auth (Phone OTP), Storage, Cloud Functions, FCM
- **Rules**: Currently permissive â€” do NOT tighten without explicit instruction
- **CLI project**: Set to `aeris-citizen-app-16265`
- **Cloud Functions**: 7 deployed (from `z:/platform/aeris/apps/aeris` backend)

### Build Systems
| App | Build Tool | Notes |
|-----|-----------|-------|
| Citizen | EAS (Expo Application Services) | Rebuild required for new native packages |
| Partner | EAS / `expo run:android` | Dev build required for background location |
| Responder | EAS / `expo run:android` | â€” |
| Web Dashboard | Next.js (`next build`) | â€” |
| Partner Web | Next.js (`next build`) | Not yet deployed |

### Environment Variables Needed
| App | Variable | Purpose |
|-----|----------|---------|
| Responder | `EXPO_PUBLIC_ANTHROPIC_KEY` | Claude AI (AERIS Intelligence) |
| Partner Web | `PRC_API_BASE_URL` | PRC license verification |
| Partner Web | `TESDA_API_BASE_URL` | TESDA certificate verification |
| Partner Web | `GOOGLE_CLOUD_VISION_API_KEY` | Document OCR |
| All | Firebase config vars | All apps share one Firebase project |

### Coding Standards (All Apps)
- Relative imports only (`./`, `../`) â€” never absolute paths
- No `any` types â€” use `unknown` + narrow, or define interfaces
- `Timestamp.now()` â€” never `new Date()` for Firestore writes
- All Firestore writes include `updatedAt: Timestamp.now()`
- Functional components only (no class components)
- Cleanup all Firestore listeners in `useEffect` return
- Collection names: `snake_case` | Field names: `camelCase`
