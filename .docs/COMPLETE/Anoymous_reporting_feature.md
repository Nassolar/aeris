# AERIS Citizen App: Anonymous Reporting Feature

## Objective
Add an "Report Anonymously" option to the incident reporting flow with clear legal waiver explaining privacy protections and limitations.

---

## Implementation Requirements

### 1. Add Anonymous Reporting Checkbox

**Location:** Report submission flow, **BEFORE** final submit button

**UI Placement:** After user has filled in incident details but before review/submit screen

---

### 2. UI Design

**Screen: Report Review / Final Step**

```
┌─────────────────────────────────────────────────────┐
│  Review Your Report                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📍 Location: Taguig City, Metro Manila            │
│  📋 Type: Public Safety Concern                     │
│  📸 Evidence: 2 photos attached                     │
│                                                     │
│  ─────────────────────────────────────────────      │
│                                                     │
│  🔒 Privacy Options                                 │
│                                                     │
│  [ ] Report Anonymously                             │
│                                                     │
│  ℹ️  Tap to learn more about anonymous reporting   │
│                                                     │
│  ─────────────────────────────────────────────      │
│                                                     │
│  [Back]                [Submit Report]              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**When user taps the checkbox:**

**Show modal/bottom sheet with legal waiver:**

```
┌─────────────────────────────────────────────────────┐
│  🔒 Anonymous Reporting                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  WHAT IT MEANS:                                     │
│  • Your name, email, and phone number will be       │
│    hidden from responders and authorities           │
│  • You will receive a Report ID to track status     │
│  • You cannot edit this report after submission     │
│  • You will NOT receive direct updates              │
│                                                     │
│  YOUR PROTECTION:                                   │
│  ✅ Your identity is protected from:                │
│     - Police officers                               │
│     - Fire responders                               │
│     - Medical personnel                             │
│     - Agency administrators                         │
│                                                     │
│  ⚠️  IMPORTANT LEGAL NOTICE:                        │
│  Your identity CAN be revealed ONLY if:             │
│  • A valid court order is issued                    │
│  • Required by law for criminal prosecution         │
│  • Requested by National Bureau of Investigation    │
│    with proper legal authority                      │
│                                                     │
│  This is for your protection while maintaining      │
│  legal accountability.                              │
│                                                     │
│  WHAT WE STORE:                                     │
│  Even when anonymous, we securely store:            │
│  • Your actual contact info (encrypted)             │
│  • Device information                               │
│  • IP address and location                          │
│  • Timestamp of submission                          │
│                                                     │
│  This information is ONLY accessible by AERIS       │
│  administrators when legally required.              │
│                                                     │
│  ─────────────────────────────────────────────      │
│                                                     │
│  [✓] I understand and agree to these terms          │
│                                                     │
│  [Cancel]              [Report Anonymously]         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 3. Simplified Version (For Filipino Users)

**Provide both English and Filipino versions:**

```
┌─────────────────────────────────────────────────────┐
│  🔒 Anonymous na Pag-report                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ANO ANG IBIG SABIHIN:                              │
│  • Nakatago ang iyong pangalan at contact info      │
│  • Makakakuha ka ng Report ID para sa tracking      │
│  • Hindi ka makakareceive ng direktang updates      │
│                                                     │
│  PROTEKSYON MO:                                     │
│  ✅ Nakatago ang identity mo mula sa:               │
│     - Mga pulis                                     │
│     - Mga bumbero                                   │
│     - Medical responders                            │
│     - Mga administrator                             │
│                                                     │
│  ⚠️  MAHALAGANG LEGAL NOTICE:                       │
│  Ang iyong identity ay maaaring ilantad LAMANG kung:│
│  • May court order                                  │
│  • Kinakailangan ng batas para sa kaso             │
│  • Hiniling ng NBI na may legal authority          │
│                                                     │
│  Para ito sa iyong proteksyon habang may           │
│  accountability sa batas.                           │
│                                                     │
│  ANO ANG TINA-TAGO NAMIN:                          │
│  • Iyong contact information (encrypted)            │
│  • Device at location info                          │
│  • Oras ng pag-submit                              │
│                                                     │
│  Access lang ng AERIS admins kung kinakailangan     │
│  ng korte o batas.                                  │
│                                                     │
│  [✓] Nauunawaan at sumasang-ayon ako               │
│                                                     │
│  [Cancel]              [Mag-report na Anonymous]    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 4. State Management

**Add to report submission state:**

```typescript
// State variables
const [isAnonymous, setIsAnonymous] = useState(false);
const [hasReadWaiver, setHasReadWaiver] = useState(false);
const [showAnonymousModal, setShowAnonymousModal] = useState(false);

// Checkbox handler
const handleAnonymousToggle = () => {
  if (!isAnonymous) {
    // User wants to enable anonymous
    setShowAnonymousModal(true);
  } else {
    // User is unchecking
    setIsAnonymous(false);
    setHasReadWaiver(false);
  }
};

// Modal agreement handler
const handleAgreeToWaiver = () => {
  if (hasReadWaiver) {
    setIsAnonymous(true);
    setShowAnonymousModal(false);
  } else {
    Alert.alert(
      'Please Confirm',
      'You must check the box to confirm you understand the terms.'
    );
  }
};
```

---

### 5. Submit Report with Anonymous Flag

**Update report submission API call:**

```typescript
const submitReport = async () => {
  try {
    const reportData = {
      // Report details
      category: selectedCategory,
      description: description,
      location: locationData,
      evidence: photos,
      
      // Anonymous flag
      isAnonymous: isAnonymous,
      reporterName: isAnonymous ? 'Anonymous' : user.displayName,
      reportedBy: isAnonymous ? null : user.uid,
      
      // Reporter identity (stored even if anonymous for legal compliance)
      reporterIdentity: isAnonymous ? {
        actualName: user.displayName || 'Unknown',
        email: user.email || null,
        phone: user.phoneNumber || null,
        ipAddress: await getDeviceIP(),  // Get from device
        deviceInfo: `${Platform.OS} ${Platform.Version}`,
        submittedAt: serverTimestamp()
      } : null,
      
      // Standard fields
      status: 'pending',
      createdAt: serverTimestamp()
    };
    
    const reportRef = await addDoc(collection(db, 'reports'), reportData);
    
    // Show success with Report ID
    navigation.navigate('ReportSuccess', {
      reportId: reportRef.id,
      isAnonymous: isAnonymous
    });
    
  } catch (error) {
    Alert.alert('Error', 'Failed to submit report. Please try again.');
  }
};
```

---

### 6. Success Screen (Anonymous vs Regular)

**If Anonymous:**

```
┌─────────────────────────────────────────────────────┐
│  ✅ Report Submitted Anonymously                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Your report has been received.                     │
│                                                     │
│  📋 Report ID:                                      │
│  ┌───────────────────────────────────────────┐     │
│  │  RPT-2025-001234                          │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  [Copy Report ID]                                   │
│                                                     │
│  ⚠️  SAVE THIS REPORT ID                           │
│  This is the ONLY way to track your report.         │
│  You will NOT receive email or SMS updates.         │
│                                                     │
│  To check status:                                   │
│  1. Open AERIS app                                  │
│  2. Tap "Track Report"                              │
│  3. Enter this Report ID                            │
│                                                     │
│  🔒 Your identity remains protected                 │
│                                                     │
│  [Done]                                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**If Regular (Not Anonymous):**

```
┌─────────────────────────────────────────────────────┐
│  ✅ Report Submitted Successfully                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Your report has been received.                     │
│                                                     │
│  📋 Report ID: RPT-2025-001234                      │
│                                                     │
│  You will receive updates via:                      │
│  • Email: juan@email.com                            │
│  • SMS: +639171234567                               │
│  • In-app notifications                             │
│                                                     │
│  Track your report in the "My Reports" tab.         │
│                                                     │
│  [View My Reports]     [Submit Another]             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 7. Track Anonymous Report Feature

**Add "Track Report by ID" screen:**

```
┌─────────────────────────────────────────────────────┐
│  🔍 Track Report                                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Enter your Report ID:                              │
│  ┌───────────────────────────────────────────┐     │
│  │  RPT-2025-001234                          │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  [Track Report]                                     │
│                                                     │
│  ℹ️  Report IDs are provided after submission       │
│     and start with "RPT-"                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**After entering valid Report ID:**

```
┌─────────────────────────────────────────────────────┐
│  📋 Report: RPT-2025-001234                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Status: Under Investigation                        │
│  Submitted: Feb 18, 2025                            │
│  Category: Public Safety                            │
│  Location: Taguig City                              │
│                                                     │
│  Timeline:                                          │
│  ✅ Submitted - Feb 18, 10:30 AM                    │
│  ✅ Received - Feb 18, 10:31 AM                     │
│  ✅ Assigned - Feb 18, 11:00 AM                     │
│  🔄 Investigating - Feb 18, 2:15 PM                 │
│  ⏳ Resolution - Pending                            │
│                                                     │
│  🔒 Reported anonymously                            │
│                                                     │
│  [Check Again]                                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 8. Legal Waiver Content (Full Text for Copy-Paste)

**English Version:**

```
ANONYMOUS REPORTING TERMS

By choosing to report anonymously, you acknowledge and agree to the following:

WHAT "ANONYMOUS" MEANS:
• Your personal information (name, email, phone) will be hidden from all responders, police officers, firefighters, medical personnel, and agency administrators.
• You will be identified only as "Anonymous" in all public-facing systems.
• You will receive a Report ID which is the only way to track your report.

YOUR PRIVACY PROTECTION:
• Your identity is protected from disclosure to emergency responders and government agencies during normal operations.
• You will NOT receive direct email, SMS, or push notifications about your report.
• You cannot edit or delete your report after submission.

LEGAL DISCLOSURE REQUIREMENTS:
Your identity MAY be disclosed ONLY in the following circumstances:
• When required by a valid court order or subpoena
• When demanded by law enforcement with proper legal authority for criminal prosecution
• When requested by the National Bureau of Investigation (NBI) or similar agencies with legal authority
• When required by Philippine law or international treaty obligations

INFORMATION WE STORE:
Even when reporting anonymously, AERIS securely stores the following information in encrypted form for legal compliance:
• Your actual contact information
• Device type and operating system
• IP address and approximate location
• Date and time of submission

This information is accessible ONLY to AERIS super administrators and ONLY when legally required by court order or law enforcement.

AUDIT AND ACCOUNTABILITY:
• Every access to your identity information is permanently logged
• Unauthorized access is a criminal offense
• Access logs are available for legal review if requested

YOUR RIGHTS:
• You may reveal your identity at any time by contacting AERIS support with your Report ID
• You retain all legal protections as a witness under Philippine law
• You may request deletion of your stored information after any legal proceedings are concluded

LIMITATIONS:
• AERIS cannot guarantee absolute anonymity if legally compelled to disclose
• Technical limitations (IP tracking, metadata) may allow determined parties to identify you through other means
• Law enforcement may independently identify you through investigation

By checking the box below, you confirm that you have read, understood, and agree to these terms.
```

**Filipino Version:**

```
MGA TUNTUNIN NG ANONYMOUS NA PAG-REPORT

Sa pagpili na mag-report nang anonymous, kinikilala at sumasang-ayon ka sa sumusunod:

ANO ANG IBIG SABIHIN NG "ANONYMOUS":
• Ang iyong personal na impormasyon (pangalan, email, phone) ay nakatago mula sa lahat ng responders, pulis, bumbero, medical personnel, at administrators.
• Ikaw ay makikilala lamang bilang "Anonymous" sa lahat ng sistema.
• Makakatanggap ka ng Report ID na siyang tanging paraan para subaybayan ang iyong report.

PROTEKSYON NG IYONG PRIVACY:
• Ang iyong identity ay protektado mula sa emergency responders at government agencies sa normal na operasyon.
• HINDI ka makakatanggap ng direktang email, SMS, o push notification tungkol sa iyong report.
• Hindi mo maaaring baguhin o tanggalin ang iyong report pagkatapos isumite.

MGA KINAKAILANGAN NG BATAS:
Ang iyong identity ay maaaring ilantad LAMANG sa mga sumusunod na sitwasyon:
• Kung kinakailangan ng valid court order o subpoena
• Kung hinihinging ng law enforcement na may tamang legal authority para sa criminal prosecution
• Kung hinihiling ng National Bureau of Investigation (NBI) o katulad na ahensya na may legal authority
• Kung kinakailangan ng batas ng Pilipinas o international treaty

IMPORMASYON NA INA-IMBAK NAMIN:
Kahit nag-report ka nang anonymous, ang AERIS ay nag-iimbak ng sumusunod na impormasyon sa encrypted form para sa legal compliance:
• Iyong tunay na contact information
• Device type at operating system
• IP address at approximate location
• Petsa at oras ng pag-submit

Ang impormasyong ito ay accessible LAMANG sa AERIS super administrators at LAMANG kung kinakailangan ng batas o court order.

AUDIT AT ACCOUNTABILITY:
• Bawat pag-access sa iyong identity information ay permanenteng naka-log
• Ang unauthorized access ay krimen
• Ang access logs ay available para sa legal review kung hiniling

IYONG MGA KARAPATAN:
• Maaari mong ihayag ang iyong identity anumang oras sa pamamagitan ng pagkontak sa AERIS support gamit ang iyong Report ID
• Pinapanatili mo ang lahat ng legal protections bilang saksi sa ilalim ng batas ng Pilipinas
• Maaari mong hilingin ang pagtanggal ng iyong naka-imbak na impormasyon pagkatapos ng mga legal proceedings

MGA LIMITASYON:
• Ang AERIS ay hindi makakagrantiya ng absolute anonymity kung legal na puwersahing mag-disclose
• Ang mga technical limitations (IP tracking, metadata) ay maaaring payagan ang mga determinadong partido na matukoy ka sa pamamagitan ng ibang paraan
• Ang law enforcement ay maaaring independently na matukoy ka sa pamamagitan ng imbestigasyon

Sa pag-check sa box sa ibaba, kinukumpirma mo na nabasa, naintindihan, at sumasang-ayon ka sa mga tuntuning ito.
```

---

### 9. UI/UX Best Practices

**Color coding:**
- Anonymous checkbox: Yellow/orange (caution color)
- Waiver modal: Use attention-grabbing colors
- Success screen: Green for confirmation

**Icons:**
- 🔒 Lock icon for privacy/security
- ⚠️  Warning icon for legal notices
- ℹ️  Info icon for explanations
- ✅ Checkmark for confirmations

**Typography:**
- Legal text: Smaller but readable font
- Important warnings: Bold and larger
- Headers: Clear hierarchy

**Accessibility:**
- Support screen readers
- High contrast mode
- Text size adjustable
- Filipino and English toggle

---

### 10. Analytics Tracking

**Track user behavior:**

```typescript
// When user opens anonymous modal
analytics.logEvent('anonymous_waiver_viewed', {
  report_type: reportCategory,
  user_id: user.uid
});

// When user agrees
analytics.logEvent('anonymous_waiver_agreed', {
  report_type: reportCategory,
  user_id: user.uid
});

// When user submits anonymously
analytics.logEvent('anonymous_report_submitted', {
  report_type: reportCategory,
  report_id: reportId
});

// When user declines (unchecks)
analytics.logEvent('anonymous_waiver_declined', {
  report_type: reportCategory,
  user_id: user.uid
});
```

---

### 11. Testing Checklist

**Test scenarios:**

- [ ] Checkbox appears on report review screen
- [ ] Tapping checkbox shows waiver modal
- [ ] Cannot submit without checking "I agree"
- [ ] Modal shows both English and Filipino versions
- [ ] Success screen shows correct message for anonymous reports
- [ ] Report ID is copyable
- [ ] Can track anonymous report by ID
- [ ] Reporter identity stored in database (encrypted)
- [ ] Reporter shows as "Anonymous" to responders
- [ ] Analytics events fire correctly

---

### 12. Error Handling

**Handle edge cases:**

```typescript
// User lost internet before submission
if (!isConnected) {
  Alert.alert(
    'No Internet',
    'Anonymous reports require internet connection. Please connect and try again.'
  );
  return;
}

// User authentication expired
if (!user || !user.uid) {
  Alert.alert(
    'Session Expired',
    'Please log in again to submit a report.'
  );
  navigation.navigate('Login');
  return;
}

// Failed to get device info
try {
  const deviceInfo = await getDeviceInfo();
} catch (error) {
  // Use fallback values
  const deviceInfo = {
    ipAddress: 'unknown',
    deviceType: Platform.OS
  };
}
```

---

### 13. Success Criteria

**The feature is complete when:**

- [ ] Checkbox is prominent and easy to find
- [ ] Legal waiver is clear and comprehensive
- [ ] Both English and Filipino versions work
- [ ] User must explicitly agree to terms
- [ ] Anonymous reports hide reporter identity
- [ ] Report ID is provided for tracking
- [ ] Users can track anonymous reports by ID
- [ ] Success screen explains limitations clearly
- [ ] Analytics track user behavior
- [ ] All error cases handled gracefully

---

## Implementation Notes

**Files to modify:**

1. **Report submission screen** - Add checkbox
2. **Anonymous waiver modal** - New component
3. **Success screen** - Update for anonymous cases
4. **Track report screen** - New feature
5. **API calls** - Include `isAnonymous` flag
6. **Analytics** - Track events

**Dependencies:**

- No new packages required
- Use existing UI components
- Standard React Native components work

**Localization:**

- Add translations to i18n config
- Support language toggle
- Default to phone's language setting

---

## Legal Review Required

**Before launch, have legal team review:**

- [ ] Waiver text (English)
- [ ] Waiver text (Filipino)
- [ ] Compliance with Philippine privacy laws
- [ ] Court order disclosure procedures
- [ ] Data retention policies
- [ ] Terms of service updates

---

This feature balances citizen safety with legal accountability, making AERIS a trusted platform for reporting sensitive incidents.