# AERIS BOLO System â€” Citizen App Implementation Guide
> Platform: `z:/platform/aeris/apps/aeris` (React Native, Expo Router, `@react-native-firebase` native SDK)
> Cross-reference: `BOLO_SYSTEM.md` (Responder App) | `AERIS_BOLO_System.md` (schema + cloud functions) | `AERIS_BOLO_Addendum.md` (rewards system)
> **Status: NOT YET IMPLEMENTED â€” this is the build guide**

---

## Overview

Citizens (E4) have the most restricted BOLO access in the system. They receive push notifications and can submit sightings, but **never** see identifying operational details (plate numbers, issuer name, case numbers, other sightings).

### E4 Access Gate (Triple Lock)
A citizen receives a BOLO notification **only when ALL THREE are true**:
1. **Global toggle ON** â€” AERIS Super Admin has enabled citizen BOLO broadcasts platform-wide
2. **Per-BOLO opt-in ON** â€” The issuing Agency Admin checked "Broadcast to citizens" when creating the BOLO
3. **Eligibility** â€” BOLO severity is `critical` AND citizen is within the broadcast radius AND category is citizen-eligible

> If any lock is OFF, the citizen receives **nothing** â€” no notification, no list entry.

---

## Implementation Status

| Screen / File | Status | Notes |
|---|---|---|
| `app/bolo/index.tsx` â€” BOLO Alert list | â¬œ Not built | Push-triggered or inbox entry point |
| `app/bolo/[boloId].tsx` â€” BOLO detail (E4 view) | â¬œ Not built | Strictly limited info |
| `app/bolo/[boloId]/sighting.tsx` â€” Submit sighting | â¬œ Not built | Camera + gallery, anonymous toggle |
| `app/bolo/my-sightings.tsx` â€” My sighting history | â¬œ Not built | Own submissions + points |
| `hooks/useBOLOSightings.ts` | â¬œ Not built | Real-time own sightings listener |
| Push notification handler | â¬œ Not built | Route `data.screen === 'BOLOAlert'` |
| Rewards points display | â¬œ Not built | In profile or my-sightings |

---

## Navigation Placement

Citizens access BOLO via two entry points:

### 1. Push Notification (primary)
Tapping a BOLO push notification opens `app/bolo/[boloId].tsx` directly.

### 2. Inbox tab (secondary)
BOLO alerts appear as cards in the Inbox tab alongside other notifications. Tapping â†’ `app/bolo/[boloId].tsx`.

> **No dedicated BOLO tab** for E4 â€” unlike the Responder App. Citizens discover BOLOs reactively via push, not proactively via a list they browse.

If a citizen-facing BOLO list is desired later, add `app/bolo/index.tsx` and link it from the Inbox or a new tab.

---

## Screens to Build

---

### Screen 1: `app/bolo/[boloId].tsx` â€” BOLO Alert Detail (E4)

**Access**: Authenticated citizen with a valid push notification link OR inbox entry
**Guard**: If BOLO's `broadcastToCitizens !== true` OR `status !== 'active'` â†’ show "This alert is no longer active."

#### What the citizen sees

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  ðŸ“¢ COMMUNITY ALERT              ðŸ”´ SERIOUS          â”‚
â”‚  Authorities are looking for a person / vehicle      â”‚
â”‚  in your area. Please stay alert.                    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  [SUBJECT PHOTO â€” shown if available]               â”‚
â”‚  General description (no clothing specifics)        â”‚
â”‚  e.g. "Male, medium build, approximately 5'7""      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  ðŸ“ Area: Barangay Fort Bonifacio, Taguig City       â”‚
â”‚  Last seen: ~2 hours ago                            â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  âš ï¸  DO NOT APPROACH OR CONFRONT THIS PERSON        â”‚
â”‚  Your safety is the priority.                       â”‚
â”‚  If you see this person, report via the button      â”‚
â”‚  below and move to a safe location.                 â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚              [ ðŸ“¸ Report a Sighting ]               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

#### E4 content rules â€” strictly enforced in code

| Field | Show to E4? |
|---|---|
| Subject photo | âœ… Yes |
| General physical description (age, gender, build) | âœ… Yes |
| Barangay / area name | âœ… Yes |
| "Last seen ~N hours ago" (relative time only) | âœ… Yes |
| BOLO severity label (Critical / Serious / Minor) | âœ… Yes |
| Specific clothing description | âŒ No |
| Plate number / vehicle plate | âŒ No |
| Issuer name, badge, or agency | âŒ No |
| Linked case number | âŒ No |
| Other sightings ("X sightings reported") | âŒ No |
| "Action Taken" field | âŒ No (report only) |
| Exact time of last sighting | âŒ No (relative only) |

#### Firestore read
```typescript
doc(db, 'bolos', boloId)
// Guard: broadcastToCitizens === true && status === 'active'
```

---

### Screen 2: `app/bolo/[boloId]/sighting.tsx` â€” Submit Sighting (E4)

**Access**: Any authenticated citizen (or anonymous â€” see toggle below)

#### UI Layout

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  â† Report a Sighting                                â”‚
â”‚  Community Alert â€” [Area name]                      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  What did you see? *                                â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚ Describe what you observed...                 â”‚  â”‚
â”‚  â”‚ (location, direction of travel, behavior)     â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  ðŸ“ Where did you see them?                         â”‚
â”‚  [ Barangay / area text field ]                     â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  ðŸ“· Add Photo  (optional)                           â”‚
â”‚  [ Camera ]  [ Gallery ]                           â”‚
â”‚  [photo preview if taken]                           â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  ðŸ”’ Submit anonymously   [ Toggle ]                 â”‚
â”‚  Your identity will be protected. You may still     â”‚
â”‚  earn points if validated (credited anonymously).   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  âš ï¸  By submitting you confirm this is a genuine   â”‚
â”‚  sighting. False reports may be penalized.          â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚            [ Submit Sighting ]                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

#### No "Action Taken" field for E4
Citizens are never asked what action they took. The action block for E4 is always: **DO NOT APPROACH OR CONFRONT**.

#### Photo upload
Use the same pattern as the Responder App. For `@react-native-firebase/storage` (native SDK):
```typescript
import storage from '@react-native-firebase/storage';

const ref = storage().ref(`bolos/${boloId}/sightings/${Date.now()}.jpg`);
await ref.putFile(localUri);  // native SDK â€” no Blob/ArrayBuffer issues
const photoUrl = await ref.getDownloadURL();
```
> The citizen app uses the **native Firebase SDK** (`@react-native-firebase/storage`), so `putFile(uri)` works directly â€” no REST API workaround needed (unlike the Responder App which uses the JS SDK).

#### Firestore write
```typescript
// Collection: bolos/{boloId}/sightings  (subcollection â€” same as Responder App)
{
  boloId,
  reporterId: user.uid,          // or 'anonymous' if toggle on
  reporterName: isAnonymous ? 'Anonymous' : user.displayName,
  reporterTier: 'E4',
  isAnonymous,
  location: {
    lat: coords.latitude,
    lng: coords.longitude,
    address: barangay.trim() || null,
    distanceFromLastKnownKm: 0,
  },
  description: description.trim(),
  actionTaken: null,             // always null for E4
  photoUrl,                      // Firebase Storage download URL, or null
  validationStatus: 'pending',
  pointsAwarded: null,
  pointsMultiplier: 1,
  createdAt: firestore.FieldValue.serverTimestamp(),
  updatedAt: firestore.FieldValue.serverTimestamp(),
}
```

After write, also increment parent BOLO's `sightingCount`:
```typescript
doc(db, 'bolos', boloId).update({ sightingCount: firestore.FieldValue.increment(1) })
```

#### On success
Show confirmation screen / modal:
```
âœ… Sighting Reported
Thank you for helping keep your community safe.
A supervisor will review your report shortly.
You may earn points when your sighting is validated.
[ Back to Alert ]  [ My Sightings ]
```

---

### Screen 3: `app/bolo/my-sightings.tsx` â€” My Sightings History

**Access**: Authenticated citizens only
**Navigation**: Profile tab â†’ "My BOLO Sightings" OR confirmation screen CTA

#### UI Layout

```
My Sightings
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
PENDING REVIEW  â€¢  Mar 22, 2026 10:32 PM
Community Alert â€” Taguig Area
"Saw a person matching description near 7-Eleven..."
ðŸ“ Bgry Fort Bonifacio
[Photo thumbnail if uploaded]

â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
âœ… VALIDATED  â€¢  Mar 20, 2026 8:14 PM
Community Alert â€” BGC Area
"Subject was walking toward the overpass..."
+500 pts  (Ã—1 multiplier)

â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
DISMISSED  â€¢  Mar 18, 2026 3:01 PM
Community Alert â€” Makati Area
"Saw someone near the park..."
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
```

#### Status meanings shown to user
| Status | Badge | Explanation shown |
|---|---|---|
| `pending` | ðŸŸ¡ PENDING REVIEW | "Your sighting is being reviewed by authorities." |
| `validated` | âœ… VALIDATED | "+{points} pts awarded" |
| `dismissed` | âš« DISMISSED | "This sighting was not confirmed by authorities." |

> Citizens see **points earned** per validated sighting. Do NOT show the supervisor's dismissal reason.

#### Firestore query
```typescript
// Collection group query â€” reads across all BOLOs the citizen has reported on
db.collectionGroup('sightings')
  .where('reporterId', '==', user.uid)
  .orderBy('createdAt', 'desc')
```

Required Firestore index (add to `firestore.indexes.json`):
```json
{
  "collectionGroup": "sightings",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "reporterId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

> This index is **already deployed** (added by Responder App). No new index needed.

---

## Push Notification Handling

### Incoming BOLO notification payload
```json
{
  "notification": {
    "title": "ðŸ“¢ Community Alert â€” SERIOUS",
    "body": "Be alert for a suspicious individual in Barangay Fort Bonifacio, Taguig."
  },
  "data": {
    "screen": "BOLOAlert",
    "boloId": "abc123xyz",
    "recipientTier": "E4"
  }
}
```

### Handler (add to notification listener in `app/_layout.tsx`)
```typescript
if (data.screen === 'BOLOAlert' && data.boloId) {
  router.push(`/bolo/${data.boloId}`);
}
```

### Notification copy by severity (E4)
| Severity | Title | Body |
|---|---|---|
| Critical | ðŸ“¢ URGENT Community Alert | Authorities need your help. Be alert for a person/vehicle in your area. |
| Serious | ðŸ“¢ Community Alert â€” SERIOUS | Be alert for a suspicious individual in [Barangay], [City]. |
| Minor | ðŸ“¢ Community Notice | Authorities are monitoring a situation in your area. |

> **E4 never receives Minor BOLOs** unless Agency Admin explicitly enables it (not default).

---

## Rewards & Points (E4)

Points are **awarded by the Cloud Function** (`onSightingValidated`) when a supervisor validates a sighting. The citizen app only needs to **display** them â€” no client-side points logic.

### Points display locations
1. `app/bolo/my-sightings.tsx` â€” per-sighting points next to VALIDATED badge
2. `app/(tabs)/profile.tsx` â€” total lifetime points in profile header (read from `users/{uid}.boloPoints`)

### Points field in Firestore (on sighting document, after validation)
```typescript
pointsAwarded: 500,        // set by Cloud Function
pointsMultiplier: 2,       // e.g. 2Ã— for Critical BOLO
// pointsAwarded Ã— pointsMultiplier = total for that sighting
```

### User total points field
```typescript
// On users/{uid}:
boloPoints: 1500           // running total, incremented by Cloud Function
```

---

## Firestore Security Rules

Add to `firestore.rules` (citizen app):

```javascript
// BOLO alerts â€” citizen read access (broadcast BOLOs only)
match /bolos/{boloId} {
  // Citizens can only read BOLOs that have been broadcast to them
  allow read: if request.auth != null
    && resource.data.broadcastToCitizens == true
    && resource.data.status == 'active';

  // Sightings subcollection
  match /sightings/{sightingId} {
    // Citizen can read their own sightings only
    allow read: if request.auth != null
      && resource.data.reporterId == request.auth.uid;

    // Any authenticated user can submit a sighting
    allow create: if request.auth != null;

    // No updates or deletes by citizens
    allow update, delete: if false;
  }
}
```

---

## Firebase Storage Rules

The citizen app uses `@react-native-firebase/storage`. Uploads to `bolos/{boloId}/sightings/{filename}` are already allowed by the Storage rules deployed from `aeris-web`:

```javascript
// Already deployed â€” no change needed:
match /bolos/{boloId}/sightings/{filename} {
  allow read: if true;
  allow write: if request.auth != null
    && request.resource.size < 10 * 1024 * 1024
    && request.resource.contentType.matches('image/.*');
}
```

---

## Firestore Collections Used

| Collection | Operation | Purpose |
|---|---|---|
| `bolos/{boloId}` | read | Display BOLO alert detail |
| `bolos/{boloId}/sightings/{id}` | create | Submit sighting |
| `bolos/{boloId}/sightings` (collectionGroup) | read (own only) | My Sightings history |
| `users/{uid}` | read | Show total `boloPoints` in profile |

---

## Data Isolation â€” What Citizens Must Never See

These must be enforced in **both** Firestore rules AND the UI. Never rely on rules alone.

| Data | Enforcement |
|---|---|
| `subjectVehicle.plate` | Never render, even if field exists on document |
| `issuedByName`, `issuedByRole` | Never render |
| `linkedCaseNumber` | Never render |
| Other users' sightings | Firestore rule blocks collectionGroup read unless `reporterId == uid` |
| Anonymous sighting reporter identity | Never expose `reporterId` of anonymous sightings in any UI |

---

## QA Checklist

**Before marking feature complete:**

- [ ] Citizen receives push notification for an active Critical BOLO with `broadcastToCitizens: true`
- [ ] Tapping notification opens `app/bolo/[boloId].tsx` with limited detail view
- [ ] Plate number, issuer name, case number are NOT visible anywhere in citizen view
- [ ] Citizen submits sighting (with photo) â†’ sighting appears in `bolos/{boloId}/sightings` subcollection with `validationStatus: 'pending'`
- [ ] Photo uploads successfully to `bolos/{boloId}/sightings/{filename}` in Firebase Storage
- [ ] Supervisor validates sighting in aeris-web â†’ Cloud Function awards points â†’ `pointsAwarded` field updates on sighting document
- [ ] `My Sightings` screen shows validated sighting with correct points
- [ ] `users/{uid}.boloPoints` increments after validation
- [ ] Anonymous sighting: `reporterName` shows "Anonymous" in aeris-web, `reporterId` is stored but not displayed
- [ ] If `broadcastToCitizens === false` on a BOLO â†’ citizen cannot read it (Firestore rule blocks)
- [ ] If BOLO `status !== 'active'` â†’ citizen sees "This alert is no longer active"
- [ ] Inactive / expired BOLOs no longer appear in citizen inbox or trigger new push notifications

---

## Citizen App Tech Stack Notes

| Concern | Citizen App Approach |
|---|---|
| Firebase SDK | `@react-native-firebase/storage` â€” **native SDK** |
| File upload | `ref.putFile(localUri)` â€” works directly, no Blob/REST workaround needed |
| Auth | `@react-native-firebase/auth` â€” native |
| Firestore | `@react-native-firebase/firestore` OR `firebase/compat` â€” check existing usage |
| Navigation | Expo Router (file-based) â€” use `router.push('/bolo/[id]')` |
| Push notifications | Expo Notifications OR `@react-native-firebase/messaging` â€” check `_layout.tsx` |

> The Responder App uses the **Firebase JS SDK** and requires a REST API workaround for uploads (`uploadFileToStorage.ts`). The Citizen App uses the **native SDK** which supports `putFile()` directly â€” do NOT copy the REST workaround.

---

*End of AERIS BOLO System â€” Citizen App Guide*
*Cross-reference: `BOLO_SYSTEM.md` (Responder App) | `AERIS_BOLO_System.md` | `AERIS_BOLO_Addendum.md`*
