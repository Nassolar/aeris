# AERIS Citizen App — DOST Alert Banner (Home Tab)
## Spec for: `aeris` (React Native / Expo)
## Depends on: CITY_TAB.md (DOST alert detail screen already built there)
## Status: Ready to build

---

## Overview

When an active DOST-NOAH alert exists for the citizen's primary barangay, a
dismissible banner appears at the top of the Home tab (the Emergency/Services
toggle screen). This is separate from the DOST alert banner inside the City tab
— both show the same alert, in two places, so citizens see it regardless of
which tab they're on.

---

## Trigger Condition

Show the banner when ALL of the following are true:
1. Citizen is logged in
2. `citizens/{uid}/lguScopes.primary.psgcCode` exists
3. At least one document exists in `dost_alerts` where:
   - `affectedPsgcCodes` array contains the citizen's primary PSGC code
   - `status == 'active'`
   - `expiresAt > now` (or `expiresAt == null`)

---

## Banner Component

```
┌─────────────────────────────────────────┐
│ ⚠  FLOOD WARNING — Brgy. Batasan Hills │
│    DOST-NOAH: High rainfall intensity. │
│    Stay alert. Follow your captain.    │
│    [View Details]            [×]       │
└─────────────────────────────────────────┘
```

**Multiple active alerts:** If more than one alert is active for the citizen's
barangay, show the highest severity one. Add a small label: "1 of 2 alerts" with
left/right chevrons to scroll through them horizontally.

### Visual Spec

```
Background:     #FFF3CD   (amber — NOT red, red is reserved for SOS/emergency)
Left border:    4px solid #FFC107
Icon:           ⚠ warning triangle, color #856404
Title text:     bold, #856404, 14px
Body text:      regular, #856404, 12px
Dismiss (×):    top-right corner, #856404, 20px tap target
View Details:   underline text link, #856404
Border radius:  8px
Margin:         12px horizontal, 8px top (appears below the ticker/status bar)
```

### Critical color rule
Never use red (`#E84040`) for DOST banners. Red is exclusively for SOS and
overdue bills. Amber/yellow for weather and environmental alerts only.

---

## Placement in Home Tab

```
Home Tab Layout (top to bottom):
  ─────────────────────────────────
  [Status ticker — black bar]
  [DOST Alert Banner — amber, conditional]   ← INSERT HERE
  [Emergency / Services toggle]
  [Tab content]
  ─────────────────────────────────
```

The banner slides in with a smooth animation when it appears. It does not push
content down abruptly — use `LayoutAnimation.easeInEaseOut()` before setting
banner visibility state.

---

## Dismiss Behavior

- Tapping `[×]` dismisses the banner for the current app session only
- The banner reappears on next app launch if the alert is still active
- Dismissal is stored in local state / AsyncStorage — NOT in Firestore
- Key: `dismissed_alert_{alertId}` in AsyncStorage
- On each app launch, compare dismissed alert IDs against currently active
  alerts — if an alert has a new ID (new alert issued), banner shows again

**Do NOT permanently dismiss.** Citizens should see active alerts every time
they open the app.

---

## View Details Navigation

Tapping "View Details" navigates to `app/city/dost-alert/[id].tsx`
(already built in CITY_TAB phase).

If the citizen has NOT set up their City tab / lguScopes yet, the detail screen
still opens — it does not require KYC. Weather alerts are public information.

---

## Firestore Schema: dost_alerts

```
dost_alerts/{alertId}
  alertType: 'flood_warning' | 'typhoon' | 'storm_surge' | 'landslide' |
             'earthquake' | 'drought' | 'heatindex' | 'other'
  severity: 'advisory' | 'watch' | 'warning'     // advisory = lowest
  title: string                                    // "FLOOD WARNING"
  shortDescription: string                         // shown in banner
  fullDescription: string                          // shown in detail screen
  source: 'DOST-NOAH' | 'PAGASA' | 'PHIVOLCS' | 'LGU'
  affectedPsgcCodes: string[]                      // array of PSGC codes
  affectedAreaNames: string[]                      // human-readable names
  evacuationCenters: EvacuationCenter[]
  emergencyHotlines: Hotline[]
  status: 'active' | 'expired' | 'cancelled'
  issuedAt: Timestamp
  expiresAt: Timestamp | null
  updatedAt: Timestamp
```

```typescript
interface EvacuationCenter {
  name: string
  address: string
  capacity: number | null
  currentOccupancy: number | null
  coordinates: { lat: number; lng: number }
}

interface Hotline {
  label: string      // "NDRRMC Hotline"
  number: string     // "8-1777"
}
```

Security rules: public read for all authenticated users, write by LGU/AERIS
admin only.

---

## Alert Detail Screen (already built — verify these fields render)

`app/city/dost-alert/[id].tsx` should display:

```
┌─────────────────────────────────────────┐
│  ← Alert Details                       │
│                                         │
│  [severity badge]  FLOOD WARNING       │
│  Source: DOST-NOAH                     │
│  Issued: March 23, 2026 — 8:00 AM     │
│                                         │
│  Brgy. Batasan Hills, Quezon City      │
│  [+ other affected areas if any]       │
│                                         │
│  High rainfall intensity expected      │
│  between 8AM–6PM. Residents near       │
│  Batasan Creek advised to evacuate.    │
│                                         │
│  EVACUATION CENTERS                    │
│  ┌─────────────────────────────────┐   │
│  │ Batasan Hills Elementary School │   │
│  │ Batasan Hills, QC               │   │
│  │ Capacity: 300 · Occupancy: 45  │   │
│  │ [Get Directions]               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  EMERGENCY HOTLINES                    │
│  NDRRMC Hotline       [📞 8-1777]     │
│  QC DRRMO             [📞 8888]       │
│  PNP Emergency        [📞 911]        │
│                                         │
│  [Share this alert]                    │
└─────────────────────────────────────────┘
```

Hotline numbers are tappable (`Linking.openURL('tel:...')`).
"Get Directions" opens Google Maps with evacuation center coordinates.

---

## Severity Color Coding (for alert detail screen badges)

```
advisory:  background #E3F2FD, text #1565C0  (blue — informational)
watch:     background #FFF3CD, text #856404  (amber — elevated)
warning:   background #FDECEA, text #C62828  (red-tinted — serious)
```

Note: Even the "warning" severity badge uses a muted red-tinted background,
NOT the full `#E84040` red. Full red is reserved for SOS only.

---

## Acceptance Criteria

- [ ] Banner appears on Home tab when active DOST alert exists for citizen's barangay
- [ ] Banner does NOT appear when no active alert exists
- [ ] Banner uses amber/yellow colors only, never red
- [ ] Banner is dismissible per session via × button
- [ ] Banner reappears on next app launch if alert still active
- [ ] Multiple alerts show "1 of N" with navigation arrows
- [ ] Tapping View Details opens alert detail screen
- [ ] Alert detail screen shows evacuation centers and hotlines
- [ ] Hotline numbers are tappable and open phone dialer
- [ ] Get Directions opens Google Maps
- [ ] No KYC required to view alert details
- [ ] LayoutAnimation used for smooth banner appearance
