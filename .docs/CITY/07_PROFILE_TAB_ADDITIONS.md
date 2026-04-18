# AERIS Citizen App — Profile Tab Additions
## Spec for: `aeris` (React Native / Expo)
## Depends on: KYC_FLOW.md, BILLS_TAB.md, CITY_SERVICES.md
## Status: Ready to build

---

## Overview

Three additions to the existing Profile tab:
1. KYC Status Card (top of profile, always visible when logged in)
2. My Documents section (links to issued certificates)
3. Payment History section (links to all receipts)

These are additive — do NOT restructure the existing profile layout, only
insert these sections in the correct positions.

---

## Insertion Points

Current Profile tab layout (assumed):
```
Profile photo + name
Account settings
Notifications
Help / Support
Logout
```

New layout:
```
Profile photo + name
[KYC Status Card]          ← INSERT after name/photo
Account settings
[My Documents]             ← INSERT before Help/Support
[Payment History]          ← INSERT after My Documents
Help / Support
Logout
```

---

## 1. KYC Status Card

### Verified State

```
┌─────────────────────────────────────────┐
│  VERIFICATION STATUS                   │
│                                         │
│  ✓ Verified — PhilSys ID              │
│    Verified: January 15, 2026          │
│    Barangay: Batasan Hills, QC         │
│                                         │
│  [Manage verification →]               │
└─────────────────────────────────────────┘
```

- Green checkmark icon `#2ECC71`
- Card background: white
- "Manage verification" navigates to a read-only KYC detail screen

### Pending / Manual Review State

```
┌─────────────────────────────────────────┐
│  VERIFICATION STATUS                   │
│                                         │
│  ⏳ Under Review                       │
│    Submitted: March 23, 2026           │
│    We'll notify you when it's done.    │
│                                         │
│  [Contact support if delayed →]        │
└─────────────────────────────────────────┘
```

- Orange clock icon `#FF9500`

### Unverified State

```
┌─────────────────────────────────────────┐
│  VERIFICATION STATUS                   │
│                                         │
│  Verify your identity to unlock        │
│  city government services.             │
│                                         │
│  [Start Verification →]               │
└─────────────────────────────────────────┘
```

- Grey shield icon `#888888`
- "Start Verification" launches KYC modal (same trigger as City tab gate)

### Multi-LGU State
If citizen has multiple lguScopes, show the primary one in the card and a
"+ 1 more city" label that expands to show all scopes.

---

## 2. My Documents Section

```
┌─────────────────────────────────────────┐
│  MY DOCUMENTS                          │
│                                    [→] │
│                                         │
│  Indigency Certificate — Jan 2026  [↓] │
│  Cedula 2026                       [↓] │
│  Solo Parent ID — valid until Dec  [↓] │
│                                         │
│  [View all documents →]                │
└─────────────────────────────────────────┘
```

- Shows max 3 most recent active documents
- `[↓]` = download PDF (calls `documentUrl` from Firestore)
- `[→]` header arrow and "View all documents" both navigate to
  `app/city/services/my-documents.tsx`
- Pending/processing certificates shown with clock icon instead of download
- If no documents: "No documents yet. Request your first certificate in
  City Services."

### Empty State

```
┌─────────────────────────────────────────┐
│  MY DOCUMENTS                          │
│                                         │
│  No documents yet.                     │
│  Request certificates in City          │
│  Services without queuing.             │
│                                         │
│  [Go to City Services →]              │
└─────────────────────────────────────────┘
```

Only show the "Go to City Services" CTA if KYC is verified. If not verified,
show "Verify your identity first" with a link to KYC.

---

## 3. Payment History Section

```
┌─────────────────────────────────────────┐
│  PAYMENT HISTORY                       │
│                                    [→] │
│                                         │
│  RPT Installment Q4 2025              │
│  ₱2,400.00 · Paid Jan 15          [↓] │
│                                         │
│  Business Permit Renewal 2025         │
│  ₱1,200.00 · Paid Dec 3           [↓] │
│                                         │
│  [View all receipts →]                 │
└─────────────────────────────────────────┘
```

- Shows max 2 most recent paid bills
- `[↓]` = download OR PDF
- "View all receipts" navigates to `app/city/bills/payment-history.tsx`
  (this is the full payment history screen — see below)
- If no payments: "No payments yet."

### Payment History Full Screen

**Route:** `app/city/bills/payment-history.tsx`

```
┌─────────────────────────────────────────┐
│  ← Payment History                     │
│                                         │
│  FILTER: [All ▾]  [2026 ▾]            │
│                                         │
│  March 2026                            │
│  ─────────────────────────────────     │
│  Real Property Tax — LOT-356           │
│  OR No. QC-2026-OR-019842             │
│  ₱9,600.00 · March 23, 2026       [↓] │
│                                         │
│  January 2026                          │
│  ─────────────────────────────────     │
│  RPT Installment Q4 2025              │
│  OR No. QC-2026-OR-009123             │
│  ₱2,400.00 · January 15, 2026     [↓] │
│                                         │
│  December 2025                         │
│  ─────────────────────────────────     │
│  Business Permit Renewal              │
│  OR No. QC-2025-OR-118742             │
│  ₱1,200.00 · December 3, 2025     [↓] │
│                                         │
└─────────────────────────────────────────┘
```

- Grouped by month
- Filter by bill type (All / RPT / Business Permit / Cedula / Other)
- Filter by year (current year default)
- Firestore query: `bills` where `citizenUid == uid` and `status == 'paid'`,
  ordered by `paidAt desc`

---

## KYC Detail Screen (read-only, from "Manage verification")

**Route:** `app/kyc/detail.tsx`

```
┌─────────────────────────────────────────┐
│  ← Verification Details                │
│                                         │
│  ✓ Identity Verified                   │
│                                         │
│  ID TYPE         PhilSys               │
│  NAME            Juan R. Dela Cruz     │
│  VERIFIED        January 15, 2026      │
│                                         │
│  LGU ENROLLMENTS                       │
│  Quezon City (Primary)                 │
│    Barangay: Batasan Hills             │
│    Enrolled: January 15, 2026         │
│                                         │
│  Makati City (Secondary)              │
│    Barangay: Bel-Air                   │
│    Enrolled: February 3, 2026         │
│                                         │
│  PRIVACY                               │
│  Your ID images were deleted           │
│  immediately after verification.       │
│  We do not store your raw ID.          │
│                                         │
│  [Request data deletion →]             │
└─────────────────────────────────────────┘
```

- Read-only — no editing
- "Request data deletion" opens a confirmation sheet, then calls a Cloud
  Function to queue a data deletion request (RA 10173 compliance)
- ID number is never shown — only ID type

---

## Design Notes

- All new cards match existing profile card style
- Section headers match existing profile section label style
- Download `[↓]` icon: `Ionicons` "download-outline", `#E84040` red
- Navigation `[→]` icon: `Ionicons` "chevron-forward", `#888888` grey
- KYC verified checkmark: filled circle, `#2ECC71`
- KYC pending clock: `#FF9500`
- KYC unverified: `#888888`

---

## Acceptance Criteria

- [ ] KYC Status Card shows correct state (verified / pending / unverified)
- [ ] Verified state shows ID type, verified date, and barangay
- [ ] Unverified state launches KYC modal on tap
- [ ] Multi-LGU state shows primary + expandable secondary scopes
- [ ] My Documents shows max 3 active documents with download buttons
- [ ] My Documents shows empty state with correct CTA based on KYC status
- [ ] Payment History shows max 2 recent paid bills
- [ ] "View all receipts" navigates to full payment history screen
- [ ] Full payment history is grouped by month
- [ ] Year and type filters work on full payment history screen
- [ ] PDF downloads open correctly from all download buttons
- [ ] KYC Detail screen is read-only and never shows raw ID number
- [ ] Existing profile sections unchanged (no regression)
