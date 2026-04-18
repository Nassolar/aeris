# AERIS Citizen App — Navigation Restructure
## Spec for: `aeris` (React Native / Expo)
## Status: Ready to build

---

## Summary of Changes

Replace the current 5-tab bottom nav with a restructured 5-tab nav that:
1. Replaces `BOOKINGS` with `CITY` (new LGU hub tab)
2. Merges Bookings into `INBOX` as a sub-tab
3. Divides Inbox into three internal tabs: Chat | Bookings | Announcements

No other tabs change. Emergency, Services, and Profile are untouched.

---

## New Bottom Navigation Structure

```
EMERGENCY  |  SERVICES  |  CITY  |  INBOX  |  PROFILE
```

| Tab | Icon | Label | Change |
|-----|------|-------|--------|
| Emergency | triangle warning | EMERGENCY | No change |
| Services | home/grid | SERVICES | No change |
| City | city/building | CITY | NEW — replaces Bookings |
| Inbox | chat bubble | INBOX | Restructured internally |
| Profile | person | PROFILE | No change |

---

## Inbox Tab — Internal Sub-tabs

Divide the Inbox screen into three horizontally scrollable sub-tabs:

```
[ Chat ]  [ Bookings ]  [ Announcements ]
```

### Chat
- Existing functionality: real-time messages between citizen and responder/dispatcher
- No change to data source or behavior

### Bookings
- Migrated from the old `BOOKINGS` tab
- Shows all marketplace service bookings (pending, active, completed)
- Data source: unchanged from current Bookings tab implementation
- Active booking card shows partner name, service, ETA, status
- Completed booking shows rating prompt if not yet rated

### Announcements
- New sub-tab
- Shows LGU-issued announcements scoped to citizen's `lguScopes.primary.psgcCode`
- Also shows AERIS platform-wide announcements
- Firestore source: `announcements/{announcementId}` where `psgcCode` matches or `scope == 'all'`
- Unread announcements show a badge count on the INBOX tab icon
- Each announcement card shows: title, source (LGU name or "AERIS"), date, short preview
- Tapping opens full announcement detail screen

### Sub-tab Badge Logic
- INBOX tab badge = sum of unread Chat messages + unread Announcements
- Bookings sub-tab shows a dot indicator if there is an active booking in progress
- Sub-tab active state: same underline style as the existing Emergency/Services toggle

---

## File Changes Required

### 1. Bottom Tab Navigator
**File:** `src/navigation/TabNavigator.tsx` (or equivalent)

- Remove `BookingsTab` from tab list
- Add `CityTab` in position 3 (between Services and Inbox)
- Update tab icons and labels accordingly

### 2. Inbox Screen
**File:** `src/screens/InboxScreen.tsx` (or equivalent)

- Wrap existing chat list in a top tab navigator
- Add `BookingsTab` component (move from old Bookings screen)
- Add `AnnouncementsTab` component (new — see stub below)

### 3. Bookings Screen
**File:** `src/screens/BookingsScreen.tsx` (or equivalent)

- Do NOT delete — extract into a reusable component `BookingsList`
- Import `BookingsList` inside the new Inbox Bookings sub-tab

### 4. City Tab
**File:** `src/screens/CityScreen.tsx` (new file)

- See `CITY_TAB.md` for full spec
- For this task: scaffold the screen with placeholder sections only

### 5. Announcements Component
**File:** `src/screens/inbox/AnnouncementsTab.tsx` (new file)

```tsx
// Stub — full spec in ANNOUNCEMENTS.md
// For now: show empty state "No announcements yet"
// Firestore hook ready but not yet populated
```

---

## Design Tokens (match existing app)

```
Background:        #F2F2F2
Card background:   #FFFFFF
Active tab color:  #E84040  (red — matches Emergency tab active state)
Tab icon inactive: #888888
Tab label:         11px, system font, uppercase
Bottom nav height: match existing
Sub-tab style:     match existing Emergency/Services toggle (underline style, green active)
```

Note: The City tab active color in the bottom nav should use the existing green `#2ECC71` to distinguish it from Emergency (red). City is civic, not urgent.

---

## Announcements Firestore Schema

```
announcements/{announcementId}
  title: string
  body: string
  source: string              // "Quezon City LGU" | "AERIS" | agency name
  psgcCode: string | null     // null = platform-wide
  publishedAt: Timestamp
  expiresAt: Timestamp | null
  readBy: string[]            // array of uids who have read it
  priority: 'normal' | 'urgent'
```

Security rules: public read (all authenticated citizens), write by LGU admin only.

---

## Acceptance Criteria

- [ ] Bottom nav shows exactly 5 tabs: Emergency, Services, City, Inbox, Profile
- [ ] Bookings tab is gone from bottom nav
- [ ] Inbox screen shows 3 sub-tabs: Chat, Bookings, Announcements
- [ ] Existing bookings functionality works inside Inbox > Bookings
- [ ] Announcements sub-tab renders (empty state acceptable for now)
- [ ] City tab renders (stub/placeholder acceptable for now)
- [ ] Badge count on Inbox icon reflects unread chat + unread announcements
- [ ] No regression on Emergency, Services, Profile tabs
