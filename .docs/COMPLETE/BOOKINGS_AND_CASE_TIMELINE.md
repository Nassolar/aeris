# Bookings Screen â€” Case Timeline & Card Differentiation
> Authored: 2026-03-22 | For implementation in `z:/platform/aeris/apps/aeris` (Citizen App)

---

## Overview

The Bookings screen (`app/(tabs)/bookings.tsx`) currently shows two types of items:

| Type | Source | Navigation on tap |
|------|--------|-------------------|
| Emergency report | `reports` collection (`reportedBy == uid`) | `report/[id]` |
| Partner service booking | `service_bookings` collection (not yet fetched) | `booking/[id]` |

These two types must look **visually distinct** and carry different information. Emergency reports also need to show a **Case Timeline** so citizens can track their report's progress.

---

## 1. Card Visual Differentiation

### Emergency Case Card (current â€” needs enrichment)
- **Background**: Red (`#EF4444`) â€” urgent, high-contrast
- **Badge**: Warning icon + `EMERGENCY â€¢ {CATEGORY}`
- **Extra fields to add**:
  - `report.reportTrack` â€” `'live_dispatch'` or `'complaint_queue'`
  - `report.caseNumber` â€” e.g. `"LTO-2026-000001"` (complaint_queue only; null for live_dispatch)
  - `report.trackingStatus` â€” current step in the timeline (e.g. `'under_review'`)
  - `report.timeline` â€” array of `TrackingEvent` objects (see Â§3)
- **"View Progress" CTA** at the bottom of the card (opens the detail screen which shows the timeline)

### Partner Service Card (future)
- **Background**: White with border (`#e2e8f0`) â€” neutral, commercial
- **Badge**: Wrench icon + service category
- **Shows**: Provider name, booking status, booking date
- **Tap**: Goes to `booking/[id]` â€” the existing partner booking detail screen
- Partner bookings come from `service_bookings` collection (not from `reports`)

> **Rule**: Never mix emergency and partner cards. Emergency cards always sort above partner cards when both appear on the same tab.

---

## 2. Firestore Data â€” Emergency Reports

The `reports` collection document has these relevant fields for the Bookings screen:

```typescript
// All on the top-level reports/{reportId} document
reportTrack: 'live_dispatch' | 'complaint_queue'  // which pipeline this report is in
caseNumber: string | null          // e.g. "LTO-2026-000001" â€” only set for complaint_queue
trackingStatus: TrackingStatus     // current status (see Â§4)
timeline: TrackingEvent[]          // append-only array of events (see Â§3)

// Already used:
reportId: string                   // human-readable ID (e.g. "RPT-20260322-0001")
description: string                // citizen's description of the incident
category: string                   // e.g. "traffic_violation", "fire"
status: string                     // legacy field â€” prefer trackingStatus going forward
timestamp: Timestamp               // when the report was filed
```

The query is already correct:
```typescript
firestore()
  .collection("reports")
  .where("reportedBy", "==", user.uid)
  .orderBy("timestamp", "desc")
```

---

## 3. Case Timeline Data Structure

`report.timeline` is an **append-only array** on the report document. Each entry:

```typescript
interface TrackingEvent {
  status: TrackingStatus        // the new status at this event
  title: string                 // e.g. "Complaint Submitted", "Officer Assigned"
  description: string           // e.g. "Case No. LTO-2026-000001 has been received by LTO NCR"
  agencyId: string
  agencyName: string            // denormalized â€” e.g. "LTO NCR â€“ Taguig District"
  agencyType: string
  actorId: string | null        // null for system-generated events
  actorName: string | null
  timestamp: Timestamp
  isSystemGenerated: boolean    // true = written by Cloud Function, false = human officer
}
```

Display the timeline **newest-first** (reverse chronological). The most recent event is the citizen's current status.

---

## 4. TrackingStatus Values

| Value | Meaning | Track |
|-------|---------|-------|
| `submitted` | Report just created | Both |
| `received` | Agency acknowledged | Both |
| `under_review` | Officer assigned, reviewing | Both |
| `dispatched` | Responder en route | live_dispatch |
| `on_scene` | Responder arrived | live_dispatch |
| `actioned` | Summons/notice issued | complaint_queue |
| `forwarded` | Transferred to another agency | Both |
| `resolved` | Case closed/completed | Both |
| `unroutable` | No agency covers this area | Both |
| `dismissed` | Invalid or duplicate | Both |

---

## 5. What to Build in `report/[id]` Detail Screen

The detail screen at `app/report/[id].tsx` (or `[id]/index.tsx`) should show the Case Timeline when `report.timeline` exists. Layout suggestion:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  ðŸš¨ EMERGENCY â€¢ TRAFFIC         â”‚
â”‚  Case No. LTO-2026-000001       â”‚
â”‚  Status: UNDER REVIEW           â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Your description...            â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  ðŸ“ Location: Purok 3, Pinagsamaâ”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  CASE TIMELINE                  â”‚
â”‚                                 â”‚
â”‚  â— Under Review          12:30  â”‚
â”‚  â”‚ Officer assigned...          â”‚
â”‚  â”‚ Agency: LTO NCR              â”‚
â”‚  â—  Received             10:14  â”‚
â”‚  â”‚ Case received by LTO NCR     â”‚
â”‚  â—  Submitted             9:55  â”‚
â”‚    Report filed by you          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

- Show `caseNumber` prominently when `reportTrack == 'complaint_queue'`
- For `live_dispatch`, show responder ETA / dispatch status instead
- Timeline dot colors:
  - `submitted` â†’ yellow
  - `received` / `under_review` â†’ blue
  - `dispatched` / `on_scene` â†’ green
  - `actioned` / `resolved` â†’ emerald
  - `forwarded` â†’ indigo
  - `dismissed` / `unroutable` â†’ red/gray

---

## 6. Partner Service Booking Card (when implemented)

Partner service bookings live in `service_bookings` collection:
```typescript
// service_bookings/{bookingId}
userId: string            // matches auth().currentUser.uid
status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
serviceCategory: string   // e.g. "Plumbing"
providerName: string
providerPhoto: string | null
price: number
createdAt: Timestamp
```

Query:
```typescript
firestore()
  .collection("service_bookings")
  .where("userId", "==", user.uid)
  .orderBy("createdAt", "desc")
```

The partner service card should **never** show a Case Timeline â€” it has its own detail view at `booking/[id]`.

---

## 7. Tab Status Mapping (update needed)

The current Bookings tab filters by `item.status`. Update to also check `trackingStatus` for emergency reports:

```typescript
// Emergency report â€” use trackingStatus (preferred) or fall back to status
const activeStatuses = ['accepted', 'responding', 'on_route', 'on_scene', 'dispatched', 'received', 'under_review', 'actioned'];
const historyStatuses = ['resolved', 'cancelled', 'completed', 'dismissed', 'unroutable'];
const pendingStatuses = ['submitted', 'pending'];

// For partner service bookings â€” use status field directly
```

---

## 8. Files to Change in z:/platform/aeris/apps/aeris

| File | What to do |
|------|-----------|
| `app/(tabs)/bookings.tsx` | Enrich emergency card (show caseNumber, trackingStatus, timeline preview); fix tab status mapping; add service_bookings query |
| `app/report/[id].tsx` (or equivalent) | Add Case Timeline section that reads `report.timeline[]` and renders it vertically |
| `services/reportService.ts` | Verify the `reports` query includes `timeline` (Firestore returns all fields by default â€” no change needed) |

---

## 9. Firestore Rules (citizen app reads)

The citizen app reads `reports` where `reportedBy == uid`. The existing Firestore rule allows this. The `timeline` field is part of the same document â€” no extra rule needed.

For `service_bookings`, a rule allowing `userId == request.auth.uid` reads is needed if not already present.
