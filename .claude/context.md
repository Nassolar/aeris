# AERIS Platform Context Snapshot
# App: aeris
# Family: aeris
# Generated: 2026-04-16 14:46
---

## Git Status
```
 M .gitignore
 D App.tsx
 M app.json
 A eas.json
 D index.ts
 M package-lock.json
 M package.json
?? .agents/
?? .claude/
?? .docs/
?? .npmrc
?? .vscode/
?? AERIS_Concept_Deck.pptx
?? AGENTS.md
?? App.tsx.backup
?? CLAUDE.md
?? PLAN.md
?? PROJECT_CONTEXT.md
?? __tests__/
?? app.config.js
?? app/
?? babel.config.js
?? backend/
?? components/
?? constants/
?? context/
?? docs/
?? firebaseConfig.ts
?? firestore.chat.index.txt
?? firestore.chat.rules.txt
?? firestore.rules
?? firestore.sos.rules.txt
?? google-services.json
?? hooks/
?? index.ts.backup
?? lib/
?? nul
?? scripts/
?? services/
?? storage.chat.rules.txt
?? store/
?? types/
```

**Branch:** main

## Last 5 Commits
```
0218b6b first commit
1521e0f Initial commit
```

## Package
- Name: ?
- Version: ?

## Recently Modified Files
```
Apr 15 22:04 app/services/legal/rate/[consultationId].tsx
Apr 15 22:04 app/services/legal/chat/[consultationId].tsx
Apr 15 22:03 app/services/legal/waiting/[consultationId].tsx
Apr 15 22:03 app/services/legal/request.tsx
Apr 15 22:02 app/services/[category].tsx
Apr 9 12:52 app/(tabs)/_layout.tsx
Apr 9 12:52 app/(tabs)/city.tsx
Apr 9 12:52 components/city/MyRequestsSection.tsx
Apr 9 12:52 components/city/ServiceDetailSheet.tsx
Apr 9 12:51 components/city/ServiceCard.tsx
```

## Open Tasks (PLAN.md)
```
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
- ⚠️ Dev mode bypass still present in code (intentional for testing)
- ⚠️ GPS reliability issues — sometimes returns stale or null coords (next priority)
  - Search with keyword matching (English + Tagalog), sort by Popular/Rating/Price
  - Static fallback data for 7 categories (repair, cleaning, moving, painting, beauty, petCare, tech)
```

## Recent Gotchas
```
[2026-04-04] orion-hermes  What broke: google.maps.LatLngLiteralTypes used as a TypeScript type for coordinate arrays — this type does not exist in the Google Maps JS API typings, causing a build-breaking type error. | Rule: Always use google.maps.LatLngLiteral for coordinate arrays in Google Maps TypeScript code; LatLngLiteralTypes is not a valid Maps API type.
[2026-04-04] orion-hermes  What broke: API routes /api/brief, /api/oracle-ris, /api/downlink returned 400/404 when JWT metadata claims (jurisdiction_psgc, agency) were missing — blocked the entire dashboard for users without those claims set. | Rule: Never gate a GET route on JWT metadata presence. Always read user_metadata → app_metadata → hardcoded fallback ('137600000' for jurisdiction, 'BFP' for agency). 400s from missing claims are never acceptable on read endpoints.
[2026-04-03] hermes  What broke: eslint-disable-next-line @typescript-eslint/no-explicit-any causes ESLint build failure when the project's ESLint config doesn't extend @typescript-eslint plugin — used for GeoJSON parsing in jurisdiction-boundary.ts. | Rule: Check .eslintrc before using @typescript-eslint disable comments. If the plugin isn't configured, use typed unknown + runtime narrowing instead of any + disable comment.
[2026-04-04] hermes  What broke: JWT hook injected role: 'supervisor' as a top-level JWT claim — PostgREST interpreted it as a PostgreSQL database role and issued SET ROLE supervisor, crashing all API routes with "role supervisor does not exist". | Rule: Never use 'role' as a custom JWT claim key in Supabase. PostgREST owns that key for database role switching. Use a namespaced key like hermes_role instead.
[2026-04-15] aeris-web  What broke: firebase deploy --only functions:aeris-classifyReport failed with "No function matches given --only filters" on a multi-codebase Firebase project. | Rule: For multi-codebase projects, use the colon separator format: functions:codebaseName:functionName (e.g. functions:aeris:classifyReport). The hyphenated format (functions:aeris-classifyReport) is not valid and silently aborts the deploy.
```

## Environment
- Node: v24.13.0
- npm: 11.6.2
