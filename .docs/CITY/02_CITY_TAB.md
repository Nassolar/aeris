# AERIS Citizen App — City Tab
## Spec for: `aeris` (React Native / Expo)
## Depends on: NAV_RESTRUCTURE.md (City tab must exist before this builds)
## Status: Ready to build (Phase 1: scaffold + multi-LGU scope)

---

## Overview

The City tab is the citizen's gateway to all LGU services. It is:
- Scoped to the citizen's verified LGU (via `lguScopes` in their Firestore profile)
- Hidden behind a soft KYC gate (see KYC_FLOW.md)
- The home for Bills, Government Services, Welfare, DOST Alerts, and Contribution tracking

---

## Multi-LGU Scope Architecture

Citizens may have more than one LGU scope (e.g., lives in QC, owns property in Makati, operates a business in Pasig).

### Firestore Schema

```
citizens/{uid}/lguScopes: {
  primary: {
    psgcCode: "137404000",
    lguName: "Quezon City",
    barangay: "Batasan Hills",
    enrolledAt: Timestamp,
    kycStatus: "verified" | "pending" | "none"
  },
  secondary: [
    {
      psgcCode: "137601000",
      lguName: "Makati City",
      barangay: "Bel-Air",
      enrolledAt: Timestamp,
      kycStatus: "verified"
    }
  ]
}
```

### Scope Rules

| Feature | Uses |
|---------|------|
| DOST Alerts | Primary scope barangay only |
| Welfare / Delivery codes | Primary scope only |
| Bills (RPT, permits) | All scopes — bills tagged with their lguScope |
| Indigency / Clearance | Primary scope only |
| Contribution card | Primary scope only |
| Announcements | Primary + any secondary with announcements |

---

## City Tab — Screen Structure

### Header

```
┌─────────────────────────────────────────┐
│  Quezon City          [Switch City ↓]   │
│  Batasan Hills                          │
└─────────────────────────────────────────┘
```

- Shows current active LGU scope name + barangay
- `[Switch City]` button appears only if citizen has 2+ scopes
- Tapping Switch City shows a bottom sheet with scope options:
  ```
  Your Cities
  ● Quezon City — Batasan Hills (Primary)
    Makati City — Bel-Air
  ```

### Unenrolled State (no lguScopes or kycStatus != verified)

```
┌─────────────────────────────────────────┐
│  Your LGU services will appear here     │
│  once your city deploys AERIS.          │
│                                         │
│  Already enrolled? Verify your          │
│  identity to unlock your account.       │
│                                         │
│  [Verify Identity]                      │
└─────────────────────────────────────────┘
```

Show this state when:
- `citizens/{uid}/lguScopes` does not exist, OR
- No scope has `kycStatus == 'verified'`

### Enrolled State — Main Sections

#### 1. Active Alert Banner (conditional)
Only shown when `dost_alerts` has an active alert for citizen's primary barangay PSGC code.

```
┌─────────────────────────────────────────┐
│ ⚠  FLOOD WARNING — Batasan Hills        │
│    DOST-NOAH: High rainfall intensity.  │
│    [View Details]              [×]      │
└─────────────────────────────────────────┘
```

- Background: `#FFF3CD` (amber/yellow — NOT red, red is reserved for SOS)
- Border left: `#FFC107` 3px
- Dismissible per session (not permanently — reappears on next open if still active)
- Tapping View Details navigates to `DOSTAlertDetailScreen`

#### 2. Bills Section

```
MY BILLS
────────────────────────────────────────
OVERDUE (1)
  Real Property Tax — LOT-356
  ₱9,600.00 · 82 days overdue
  [Pay Now]                            →

DUE SOON (2)
  Business Permit Renewal
  ₱1,200.00 · Due Mar 31              →

[See all bills]
```

- Shows max 3 bills (1 overdue, 2 due soon) as a summary
- "See all bills" navigates to `BillsInboxScreen`
- OVERDUE amount text color: `#E84040`
- DUE SOON amount text color: `#1A1A1A`
- PAID bills not shown on City tab summary — only in BillsInboxScreen

#### 3. Services Section

```
CITY SERVICES
────────────────────────────────────────
  📄 Request Indigency Certificate    →
  📄 Get Barangay Clearance          →
  🪪 Community Tax Certificate       →
  👶 Apply for Solo Parent ID        →
  [View all services]
```

- Each row navigates to its respective service screen (stubs for Phase 1)
- "View all services" navigates to `CityServicesScreen`

#### 4. Welfare Section (conditional)
Only shown if citizen has at least one active welfare program enrollment.

```
MY WELFARE
────────────────────────────────────────
  Senior Citizen Cash Gift — March 2026
  Status: PENDING DELIVERY
  [View Delivery Code]                →
```

#### 5. Contribution Card (conditional)
Only shown after citizen has at least one confirmed payment this year.

```
YOUR CONTRIBUTION IN 2026
────────────────────────────────────────
You've paid ₱9,600 in taxes this year.

Your contribution helped fund:
  🛣  3.8 meters of road resurfacing
  🎓  2 months of a scholar's allowance
  👴  6 senior citizen cash gifts

[See full public ledger]
```

- "See full public ledger" opens a WebView to `lgu.aeristech.ai/public/{lguSlug}`

---

## KYC Gate Behavior

When a citizen with no verified KYC taps Bills or any service:

```
┌─────────────────────────────────────────┐
│                                         │
│   🔒  Verify your identity              │
│                                         │
│   This feature requires identity        │
│   verification. It only takes           │
│   about 3 minutes.                      │
│                                         │
│   [Start Verification]                  │
│   [Maybe Later]                         │
│                                         │
└─────────────────────────────────────────┘
```

Shown as a bottom sheet modal — not a full screen navigation. Tapping Start Verification launches the KYC flow (see KYC_FLOW.md). Tapping Maybe Later dismisses the sheet.

---

## Navigation Map

```
CityScreen (index)
  ├── BillsInboxScreen
  │     ├── BillDetailScreen
  │     │     ├── PayAtHallScreen (generates reference QR)
  │     │     └── ReceiptScreen
  │     └── PaymentHistoryScreen
  ├── CityServicesScreen
  │     ├── IndigencyCertScreen (stub)
  │     ├── BarangayClearanceScreen (stub)
  │     ├── CedulaScreen (stub)
  │     └── SoloParentIDScreen (stub)
  ├── WelfareDeliveryCodeScreen
  ├── DOSTAlertDetailScreen
  └── ContributionWebViewScreen
```

---

## Phase 1 Deliverables (build now)

- [ ] `CityScreen.tsx` — main screen with all sections, multi-scope header with switcher
- [ ] `BillsInboxScreen.tsx` — full bills list (overdue, due soon, paid)
- [ ] `BillDetailScreen.tsx` — detail view with Pay at Hall flow
- [ ] `PayAtHallScreen.tsx` — reference number + QR code generation
- [ ] `WelfareDeliveryCodeScreen.tsx` — 4-digit code display (large, senior-friendly)
- [ ] `DOSTAlertDetailScreen.tsx` — alert detail, evacuation centers, hotlines
- [ ] `CityServicesScreen.tsx` — services list navigating to stubs
- [ ] Stub screens for each service (indigency, clearance, cedula, solo parent)

## Phase 2 Deliverables (scaffold now, activate later)

- [ ] Online payment buttons (GCash, Maya, Bank Transfer) — present but show "Coming Soon"
- [ ] `ContributionWebViewScreen.tsx` — WebView wrapper for public ledger
- [ ] AERIS Assistant contextual cards inside Bills screens

---

## Design Notes

- City tab icon: building/city hall outline (use `MaterialCommunityIcons` or `Ionicons`)
- City tab active color in bottom nav: `#2ECC71` green (civic, not urgent)
- Alert banner: amber/yellow only, never red
- Welfare delivery code: font size 48+, bold, monospaced digits, high contrast
- All cards follow existing card style: white background, 12px border radius, subtle shadow
- Bills overdue: `#E84040` text only — not background color
- Section headers: small caps grey label (match existing "NON-EMERGENCY" label style)
