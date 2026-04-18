## 📱 AERIS Service Booking Flow - Complete Implementation Guide

📋 Table of Contents

## Overview
## User Flow Architecture
## Screen Specifications
## Data Models
## Implementation Prompts
## Best Practices


## 🎯 Overview
Purpose
Complete implementation guide for AERIS service marketplace booking flow - from service selection through booking confirmation.
Key Objectives

✅ Fast: 90-second booking time (industry standard: 3-5 minutes)
✅ Transparent: Upfront pricing, clear provider info
✅ Trustworthy: Ratings, verification badges, reviews
✅ Accessible: Works for tech-savvy and non-tech users

Target Users

White Collar: Busy professionals, value speed and quality
Blue Collar: Families, value affordability and trust
Elderly: Simple interface, large buttons, clear text


## 🗺️ User Flow Architecture
### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    AERIS SERVICE BOOKING                     │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Services   │ ← User starts here
│   Landing    │
└──────┬───────┘
       │ Tap category (e.g., "Repair")
       ↓
┌──────────────┐
│ Subcategory  │
│   Selection  │ (Plumbing, Electrical, Aircon, etc.)
└──────┬───────┘
       │ Select subcategory
       ↓
┌──────────────┐
│   Describe   │
│   Problem    │ (Photos, description, urgency, location)
└──────┬───────┘
       │ Submit request
       ↓
┌──────────────┐
│   Provider   │
│     List     │ (Available providers with ratings, distance, price)
└──────┬───────┘
       │ Select provider
       ├─────────────┐
       ↓             ↓
┌──────────────┐ ┌──────────────┐
│   Provider   │ │   Booking    │
│   Profile    │ │   Details    │ (Optional: View full profile)
│  (Optional)  │ │              │
└──────┬───────┘ └──────┬───────┘
       │ Book           │ Confirm
       └────────┬───────┘
                ↓
       ┌──────────────┐
       │   Booking    │
       │  Confirmed   │ (Live tracking, chat, payment)
       └──────────────┘

### Flow States
typescripttype BookingFlowState = 
  | 'service_selection'      // Landing page
  | 'subcategory_selection'  // Choose specific service
  | 'problem_description'    // Describe issue + details
  | 'provider_list'          // Browse available providers
  | 'provider_profile'       // View provider details (optional)
  | 'booking_details'        // Review and confirm
  | 'booking_confirmed'      // Active booking with tracking
  | 'service_in_progress'    // Provider on site
  | 'service_completed'      // Rate and pay
```

---

## 📱 **Screen Specifications**

---

### **Screen 1: Services Landing** *(Current Screen)*

**File:** `app/(tabs)/services.tsx` or `app/(tabs)/index.tsx`

**Purpose:** Entry point for service discovery

**Components:**
- Header (Location, LIVE status, Notifications)
- Tab Navigation (Emergency vs Services)
- Smart Search Bar
- Service Category Grid
- Near You section
- Partner CTA

**Already Implemented** ✅

---

### **Screen 2: Subcategory Selection**

**File:** `app/services/[category].tsx`

**Purpose:** Choose specific service type within category

**Route Example:** `/services/repair`

**UI Layout:**
```
┌─────────────────────────────────────┐
│  ← Repair Services          [Search]│
│                                      │
│  🔧 What needs fixing?               │
│  ┌──────────────────────────────┐   │
│  │ 🔍 Search: plumbing, aircon  │   │
│  └──────────────────────────────┘   │
│                                      │
│  MOST REQUESTED                      │
│  ┌────────────────────────────┐     │
│  │ 💧 Plumbing                │ →  │
│  │ Leaks, clogs, pipes        │     │
│  │ ⭐ 4.8 avg • 234 providers │     │
│  │ From ₱400                  │     │
│  └────────────────────────────┘     │
│  ┌────────────────────────────┐     │
│  │ ⚡ Electrical              │ →  │
│  │ Wiring, outlets, lights    │     │
│  │ ⭐ 4.7 avg • 189 providers │     │
│  │ From ₱500                  │     │
│  └────────────────────────────┘     │
│  ┌────────────────────────────┐     │
│  │ ❄️ Aircon                  │ →  │
│  │ Cleaning, repair, gas      │     │
│  │ ⭐ 4.9 avg • 312 providers │     │
│  │ From ₱350                  │     │
│  └────────────────────────────┘     │
│                                      │
│  ALL REPAIR SERVICES                 │
│  • Appliance Repair                  │
│  • Gadget Repair                     │
│  • Furniture Restoration             │
│  • Auto Repair (Mobile)              │
│  • See all (12 services)             │
└─────────────────────────────────────┘
Data Structure:
typescriptinterface ServiceSubcategory {
  id: string;
  parentCategory: string; // 'repair'
  name: string;           // 'Plumbing'
  icon: string;           // '💧' or IconComponent
  description: string;    // 'Leaks, clogs, pipes'
  avgRating: number;      // 4.8
  providerCount: number;  // 234
  basePrice: number;      // 400
  isPopular: boolean;
  searchKeywords: string[]; // ['plumbing', 'leak', 'tubig', etc.]
}

const REPAIR_SUBCATEGORIES: ServiceSubcategory[] = [
  {
    id: 'plumbing',
    parentCategory: 'repair',
    name: 'Plumbing',
    icon: '💧',
    description: 'Leaks, clogs, pipes',
    avgRating: 4.8,
    providerCount: 234,
    basePrice: 400,
    isPopular: true,
    searchKeywords: ['plumbing', 'leak', 'pipe', 'faucet', 'drain', 'tubig', 'gripo'],
  },
  {
    id: 'electrical',
    parentCategory: 'repair',
    name: 'Electrical',
    icon: '⚡',
    description: 'Wiring, outlets, lights',
    avgRating: 4.7,
    providerCount: 189,
    basePrice: 500,
    isPopular: true,
    searchKeywords: ['electrical', 'wiring', 'outlet', 'switch', 'kuryente', 'ilaw'],
  },
  // ... more subcategories
];
```

**Key Features:**
- Smart search with autocomplete
- Sort by: Most Requested, Rating, Price
- Quick stats (avg rating, provider count, price)
- Popular services highlighted

---

### **Screen 3: Problem Description**

**File:** `app/services/request.tsx`

**Route Params:** `{ category: 'repair', subcategory: 'plumbing' }`

**Purpose:** Gather details about service request

**UI Layout:**
```
┌─────────────────────────────────────┐
│  ← Plumbing Repair                  │
│                                      │
│  📸 Add Photos (Optional)            │
│  ┌──────────────────────────────┐   │
│  │  [+] [+] [+]                 │   │
│  │  Tap to add photos           │   │
│  │  (Max 5 photos)              │   │
│  └──────────────────────────────┘   │
│                                      │
│  💬 Describe the Issue               │
│  ┌──────────────────────────────┐   │
│  │ Kitchen faucet leaking...    │   │
│  │                              │   │
│  │                              │   │
│  └──────────────────────────────┘   │
│  0/500 characters                    │
│                                      │
│  ⏰ When do you need this?           │
│  ● Now (₱100 urgent fee)             │
│  ○ Today                             │
│  ○ Tomorrow                          │
│  ○ Schedule (pick date/time)         │
│                                      │
│  📍 Service Location                 │
│  ┌──────────────────────────────┐   │
│  │ 📍 123 Main St, Taguig       │   │
│  │    [Change location]         │   │
│  └──────────────────────────────┘   │
│                                      │
│  💡 TIPS FOR BETTER SERVICE          │
│  • Take clear photos of the problem  │
│  • Describe sounds, smells, etc.     │
│  • Mention recent changes            │
│                                      │
│  ┌──────────────────────────────┐   │
│  │    Find Providers    →       │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
Data Structure:
typescriptinterface ServiceRequest {
  id: string;
  category: string;          // 'repair'
  subcategory: string;       // 'plumbing'
  description: string;       // User's text description
  photos: string[];          // Array of photo URLs
  urgency: 'now' | 'today' | 'tomorrow' | 'scheduled';
  scheduledDate?: Date;      // If urgency === 'scheduled'
  location: {
    address: string;
    latitude: number;
    longitude: number;
    placeId: string;
  };
  createdAt: Date;
  userId: string;
  status: 'draft' | 'submitted' | 'matched';
}
```

**Validation Rules:**
- Description: Optional but recommended (0-500 chars)
- Photos: 0-5 images, max 5MB each
- Urgency: Required
- Location: Required (auto-filled from GPS)

**Key Features:**
- Photo upload with compression
- Character counter
- Urgency selector with price info
- Location autofill with edit option
- Tips section for better results

---

### **Screen 4: Provider List**

**File:** `app/services/providers.tsx`

**Route Params:** `{ requestId: string }`

**Purpose:** Show available providers matching request

**UI Layout:**
```
┌─────────────────────────────────────┐
│  ← Plumbing Providers               │
│                                      │
│  🔍 5 providers available            │
│  📍 Within 10 km • Now available     │
│                                      │
│  [Filter: All] [Sort: Distance ▼]   │
│                                      │
│  ┌────────────────────────────┐     │
│  │ 👤 Mario Santos            │     │
│  │ ⭐ 4.9 ★★★★★ (234)        │     │
│  │ 📍 2.3 km • ⚡ 25 min      │     │
│  │ 💰 ₱500 base rate          │     │
│  │ ✅ Licensed • 8 yrs exp    │     │
│  │ 🏆 Top Rated • Fast Reply  │     │
│  │                            │     │
│  │ Recent: "Fixed leak fast!" │     │
│  │ - Maria L., 2 days ago     │     │
│  │                            │     │
│  │ [View Profile]    [Book →] │     │
│  └────────────────────────────┘     │
│                                      │
│  ┌────────────────────────────┐     │
│  │ 👤 Juan Cruz               │     │
│  │ ⭐ 4.8 ★★★★☆ (156)        │     │
│  │ 📍 3.8 km • ⚡ 40 min      │     │
│  │ 💰 ₱450 base rate          │     │
│  │ ✅ Licensed • 6 yrs exp    │     │
│  │ 💬 Quick Response          │     │
│  │                            │     │
│  │ Recent: "Professional!"    │     │
│  │ - John D., 1 week ago      │     │
│  │                            │     │
│  │ [View Profile]    [Book →] │     │
│  └────────────────────────────┘     │
│                                      │
│  [Load more (3 remaining)]           │
│                                      │
│  💡 Can't find what you need?        │
│     [Adjust filters] [Try later]     │
└─────────────────────────────────────┘
Data Structure:
typescriptinterface Provider {
  id: string;
  name: string;
  avatar: string;
  rating: number;              // 4.9
  reviewCount: number;         // 234
  distance: number;            // 2.3 km
  eta: number;                 // 25 minutes
  baseRate: number;            // 500
  isLicensed: boolean;
  yearsExperience: number;     // 8
  badges: Badge[];             // ['top_rated', 'fast_reply', 'verified']
  recentReview?: {
    text: string;
    author: string;
    date: Date;
    rating: number;
  };
  availability: 'now' | 'today' | 'tomorrow' | 'unavailable';
  specializations: string[];   // ['leak_repair', 'pipe_installation']
  completedJobs: number;       // 1,234
  responseTime: string;        // '< 5 min'
}

interface Badge {
  type: 'top_rated' | 'fast_reply' | 'verified' | 'licensed' | 'new_provider';
  label: string;
  icon: string;
  color: string;
}
```

**Sorting Options:**
- **Distance** (default): Nearest first
- **Rating**: Highest rated first
- **Price**: Lowest price first
- **Response Time**: Fastest responders first

**Filtering Options:**
- **Availability**: Now, Today, Tomorrow
- **Price Range**: ₱0-500, ₱500-1000, ₱1000+
- **Rating**: 4.5+, 4.0+, 3.5+
- **Distance**: 5km, 10km, 20km
- **Badges**: Top Rated, Licensed, Fast Reply

**Key Features:**
- Real-time availability
- Distance and ETA calculation
- Recent review preview
- Badge system for trust
- Quick book or view full profile

---

### **Screen 5: Provider Profile** *(Optional)*

**File:** `app/services/provider/[id].tsx`

**Purpose:** Detailed provider information

**UI Layout:**
```
┌─────────────────────────────────────┐
│  ← Back                   [Share]   │
│                                      │
│  ┌────────────────────────────┐     │
│  │     [Profile Photo]        │     │
│  │     Mario Santos           │     │
│  │  ⭐ 4.9 ★★★★★ (234 reviews)│     │
│  │  🛠️ 8 years experience     │     │
│  │  📍 2.3 km away            │     │
│  └────────────────────────────┘     │
│                                      │
│  SERVICES OFFERED                    │
│  ✓ Leak repairs                      │
│  ✓ Pipe installation                 │
│  ✓ Drain cleaning                    │
│  ✓ Water heater repair               │
│  ✓ Toilet repairs                    │
│  [See all 12 services]               │
│                                      │
│  CERTIFICATIONS & VERIFICATION       │
│  ✅ TESDA Certified Plumber          │
│  ✅ Government ID Verified           │
│  ✅ Background Check Passed          │
│  ✅ Insurance Coverage: ₱500k        │
│                                      │
│  STATS                               │
│  🏆 1,234 completed jobs             │
│  ⚡ Response time: < 5 min           │
│  ✅ 98% completion rate              │
│  🔁 85% repeat customers             │
│                                      │
│  RECENT WORK                         │
│  [Photo] [Photo] [Photo] [Photo]     │
│  [See all 47 photos]                 │
│                                      │
│  REVIEWS (234)         [Filter ▼]    │
│  ⭐⭐⭐⭐⭐ 5.0                      │
│  "Fast, professional, fixed my       │
│   leaking pipe in 30 minutes!"       │
│  - Maria Lopez, 2 days ago           │
│  📷 [Before] [After]                 │
│                                      │
│  ⭐⭐⭐⭐⭐ 5.0                      │
│  "Very knowledgeable. Explained      │
│   everything clearly."               │
│  - John Doe, 1 week ago              │
│                                      │
│  ⭐⭐⭐⭐☆ 4.0                      │
│  "Good work but came 15 min late."   │
│  - Sarah Chen, 2 weeks ago           │
│  ↳ Mario: "Apologies for the delay..." │
│                                      │
│  [Load more reviews (231 remaining)] │
│                                      │
│  ┌────────────────────────────┐     │
│  │   Book Mario Santos   →    │     │
│  │   Base rate: ₱500          │     │
│  └────────────────────────────┘     │
└─────────────────────────────────────┘
Data Structure:
typescriptinterface ProviderProfile extends Provider {
  bio: string;
  servicesOffered: string[];
  certifications: Certification[];
  stats: {
    completedJobs: number;
    responseTime: string;
    completionRate: number;
    repeatCustomerRate: number;
  };
  workPhotos: string[];          // Portfolio images
  reviews: Review[];
  insuranceCoverage: number;     // ₱500,000
  languages: string[];           // ['English', 'Tagalog']
  activeHours: {
    start: string;               // '08:00'
    end: string;                 // '20:00'
  };
}

interface Certification {
  name: string;                  // 'TESDA Certified Plumber'
  issuer: string;                // 'TESDA'
  issueDate: Date;
  expiryDate?: Date;
  verified: boolean;
  certificateUrl?: string;
}

interface Review {
  id: string;
  rating: number;                // 1-5
  text: string;
  author: {
    name: string;
    avatar?: string;
  };
  date: Date;
  photos?: string[];             // Before/after photos
  providerResponse?: {
    text: string;
    date: Date;
  };
  serviceType: string;           // 'Plumbing'
  verified: boolean;             // Actual completed booking
}
```

**Key Features:**
- Comprehensive provider info
- Work portfolio gallery
- Reviews with photos
- Provider responses to reviews
- Verification badges
- Stats and metrics
- Ability to share profile

---

### **Screen 6: Booking Details**

**File:** `app/services/booking/confirm.tsx`

**Route Params:** `{ requestId: string, providerId: string }`

**Purpose:** Review and confirm booking

**UI Layout:**
```
┌─────────────────────────────────────┐
│  ← Booking Details                  │
│                                      │
│  PROVIDER                            │
│  ┌────────────────────────────┐     │
│  │ 👤 Mario Santos            │     │
│  │ ⭐ 4.9 • ⚡ Arrives in 25 min│    │
│  │ 📞 0917-123-4567           │     │
│  └────────────────────────────┘     │
│                                      │
│  SERVICE REQUEST                     │
│  📦 Plumbing Repair                  │
│  📝 "Kitchen faucet leaking..."      │
│  📸 [Photo] [Photo]                  │
│                                      │
│  SCHEDULE                            │
│  🗓️ Today, Feb 5, 2026              │
│  ⏰ As soon as possible (Now)        │
│  [Change schedule]                   │
│                                      │
│  LOCATION                            │
│  📍 123 Main St, Taguig City         │
│     Unit 4B, Tower 1                 │
│  [View on map] [Edit address]        │
│                                      │
│  PRICING                             │
│  Base rate              ₱500         │
│  Urgent booking fee     ₱100         │
│  AERIS service fee      ₱50          │
│  ─────────────────────  ────         │
│  Subtotal               ₱650         │
│                                      │
│  💡 Final price confirmed after      │
│     provider inspection              │
│                                      │
│  PAYMENT METHOD                      │
│  💵 Cash (Pay on completion)         │
│  [Add GCash / Credit Card]           │
│                                      │
│  SPECIAL INSTRUCTIONS (Optional)     │
│  ┌────────────────────────────┐     │
│  │ Gate code: 1234            │     │
│  │ Park in Visitor slot B3    │     │
│  └────────────────────────────┘     │
│                                      │
│  ☑️ I agree to AERIS Terms           │
│  ☑️ Cancel within 5 min for free     │
│                                      │
│  ┌────────────────────────────┐     │
│  │   Confirm Booking    →     │     │
│  └────────────────────────────┘     │
│                                      │
│  🔒 Secure booking • Money-back      │
│     guarantee if provider no-show    │
└─────────────────────────────────────┘
Data Structure:
typescriptinterface BookingDetails {
  id: string;
  request: ServiceRequest;
  provider: Provider;
  schedule: {
    type: 'now' | 'scheduled';
    date: Date;
    estimatedArrival?: Date;
  };
  location: {
    address: string;
    unit?: string;
    landmarks?: string;
    latitude: number;
    longitude: number;
  };
  pricing: {
    baseRate: number;
    urgentFee: number;
    serviceFee: number;
    total: number;
    currency: 'PHP';
  };
  paymentMethod: 'cash' | 'gcash' | 'credit_card' | 'debit_card';
  specialInstructions?: string;
  agreedToTerms: boolean;
  status: 'pending_confirmation' | 'confirmed' | 'cancelled';
}
```

**Validation:**
- Provider selected ✅
- Schedule confirmed ✅
- Location valid ✅
- Payment method selected ✅
- Terms agreed ✅

**Key Features:**
- Complete booking summary
- Editable fields
- Transparent pricing
- Payment method selection
- Special instructions
- Terms agreement
- Security badges

---

### **Screen 7: Booking Confirmed**

**File:** `app/services/booking/[id].tsx`

**Purpose:** Active booking with live tracking

**UI Layout:**
```
┌─────────────────────────────────────┐
│  Booking Details      [Share] [Help]│
│                                      │
│         ✅ Confirmed!                │
│     Mario is on the way              │
│                                      │
│  ┌────────────────────────────┐     │
│  │                            │     │
│  │      [Live Map View]       │     │
│  │                            │     │
│  │   📍 Your location         │     │
│  │   🚗 Mario's location      │     │
│  │                            │     │
│  │   ⚡ ETA: 25 minutes       │     │
│  │   📏 2.3 km away           │     │
│  │                            │     │
│  └────────────────────────────┘     │
│                                      │
│  BOOKING ID: #AER12345               │
│  Today, Feb 5 • 7:45 AM              │
│                                      │
│  PROVIDER                            │
│  ┌────────────────────────────┐     │
│  │ 👤 Mario Santos  ⭐ 4.9    │     │
│  │ 📞 0917-123-4567           │     │
│  │ "On my way! See you soon!" │     │
│  │ 2 min ago                  │     │
│  └────────────────────────────┘     │
│                                      │
│  WHAT'S NEXT?                        │
│  1. ⏰ Mario arrives in ~25 min      │
│  2. 🔍 He'll inspect the problem     │
│  3. 💰 You approve final price       │
│  4. 🛠️ Work begins                  │
│  5. ✅ You approve completion        │
│  6. 💳 Payment                       │
│  7. ⭐ Rate your experience          │
│                                      │
│  QUICK ACTIONS                       │
│  ┌────────────────────────────┐     │
│  │   💬 Chat with Mario       │     │
│  └────────────────────────────┘     │
│  ┌────────────────────────────┐     │
│  │   📞 Call Mario            │     │
│  └────────────────────────────┘     │
│  ┌────────────────────────────┐     │
│  │   📍 Share Live Location   │     │
│  └────────────────────────────┘     │
│  ┌────────────────────────────┐     │
│  │   ⚠️ Report Issue          │     │
│  └────────────────────────────┘     │
│                                      │
│  ⚠️ Need to cancel?                 │
│  Free cancellation within 5 min      │
│  [Cancel booking]                    │
│                                      │
│  🔒 Safety: Share this booking with  │
│     trusted contacts                 │
│  [Share booking details]             │
└─────────────────────────────────────┘
Real-Time Updates:
typescriptinterface BookingStatus {
  id: string;
  status: 
    | 'confirmed'           // Provider accepted
    | 'en_route'            // Provider traveling
    | 'arrived'             // Provider on-site
    | 'inspecting'          // Checking the issue
    | 'price_approval'      // Waiting for price confirmation
    | 'in_progress'         // Work started
    | 'completed'           // Work done
    | 'payment_pending'     // Awaiting payment
    | 'paid'                // Payment received
    | 'cancelled';          // Booking cancelled
    
  provider: {
    id: string;
    name: string;
    location: {
      latitude: number;
      longitude: number;
      lastUpdated: Date;
    };
    eta: number;            // Minutes
  };
  
  timeline: BookingEvent[];
  
  priceUpdate?: {
    originalEstimate: number;
    finalQuote: number;
    reason: string;
    status: 'pending_approval' | 'approved' | 'declined';
  };
}

interface BookingEvent {
  timestamp: Date;
  type: 
    | 'booking_created'
    | 'provider_accepted'
    | 'provider_en_route'
    | 'provider_arrived'
    | 'inspection_started'
    | 'price_quoted'
    | 'price_approved'
    | 'work_started'
    | 'work_completed'
    | 'payment_received'
    | 'booking_cancelled';
  message: string;
  actor: 'user' | 'provider' | 'system';
}
```

**Key Features:**
- **Live Map**: Real-time provider location
- **ETA Updates**: Dynamic arrival time
- **Chat**: Direct messaging with provider
- **Call**: One-tap phone call
- **Share Location**: Send live location to provider
- **Timeline**: Step-by-step process guide
- **Safety Features**: Share booking, report issues
- **Cancellation**: Free within 5 minutes

---

### **Screen 8: Service In Progress**

**File:** `app/services/booking/[id].tsx` (same file, different status)

**Purpose:** Monitor active service

**UI Layout:**
```
┌─────────────────────────────────────┐
│  ← Active Service          [Help]   │
│                                      │
│      🛠️ Work in Progress            │
│                                      │
│  PROVIDER ON-SITE                    │
│  ┌────────────────────────────┐     │
│  │ 👤 Mario Santos            │     │
│  │ ✅ Arrived 10 min ago      │     │
│  │ 🛠️ Working on leak         │     │
│  └────────────────────────────┘     │
│                                      │
│  PRICE CONFIRMATION                  │
│  ┌────────────────────────────┐     │
│  │ Original estimate:  ₱500   │     │
│  │ Final quote:        ₱650   │     │
│  │                            │     │
│  │ Additional work needed:    │     │
│  │ • Replace corroded pipe    │     │
│  │ • New faucet washer        │     │
│  │                            │     │
│  │ [Approve ₱650] [Decline]   │     │
│  └────────────────────────────┘     │
│                                      │
│  TIMELINE                            │
│  ✅ Booking confirmed    7:45 AM     │
│  ✅ Mario arrived        8:10 AM     │
│  ✅ Inspection done      8:15 AM     │
│  ⏳ Price approved       --:--       │
│  ⏳ Work completed       --:--       │
│  ⏳ Payment              --:--       │
│                                      │
│  CHAT WITH MARIO                     │
│  ┌────────────────────────────┐     │
│  │ Mario: "Found the issue.   │     │
│  │  Need to replace a pipe."  │     │
│  │  5 min ago                 │     │
│  │                            │     │
│  │ You: "How long will it     │     │
│  │  take?"                    │     │
│  │  3 min ago                 │     │
│  │                            │     │
│  │ Mario: "About 30 minutes." │     │
│  │  Just now                  │     │
│  │                            │     │
│  │ [Type message...]   [Send] │     │
│  └────────────────────────────┘     │
│                                      │
│  QUICK ACTIONS                       │
│  [📞 Call] [📸 Request Photo]       │
│  [⚠️ Report Issue]                  │
└─────────────────────────────────────┘
Price Approval Flow:
typescriptinterface PriceQuote {
  bookingId: string;
  originalEstimate: number;
  finalQuote: number;
  breakdown: {
    labor: number;
    materials: MaterialItem[];
    additionalWork: string[];
  };
  reason: string;
  photos?: string[];           // Evidence of issue
  status: 'pending' | 'approved' | 'declined';
  quotedAt: Date;
  respondedAt?: Date;
}

interface MaterialItem {
  name: string;                // 'Copper pipe, 1m'
  quantity: number;
  unitPrice: number;
  total: number;
}
```

**Key Features:**
- **Price Approval**: Accept or decline quote changes
- **Live Chat**: Communicate during service
- **Timeline**: Real-time progress tracking
- **Photo Requests**: Ask provider for evidence
- **Report Issues**: Flag problems immediately

---

### **Screen 9: Service Completed**

**File:** `app/services/booking/complete.tsx`

**Purpose:** Rate, pay, and close booking

**UI Layout:**
```
┌─────────────────────────────────────┐
│  Service Completed                  │
│                                      │
│         ✅ Work Done!                │
│                                      │
│  BEFORE & AFTER                      │
│  ┌────────────┐  ┌────────────┐     │
│  │  [BEFORE]  │  │  [AFTER]   │     │
│  │   Photo    │  │   Photo    │     │
│  └────────────┘  └────────────┘     │
│                                      │
│  WORK COMPLETED                      │
│  ✅ Fixed leaking kitchen faucet     │
│  ✅ Replaced corroded pipe           │
│  ✅ Installed new washer             │
│  ✅ Tested for leaks                 │
│                                      │
│  📋 PROVIDER NOTES                   │
│  "Replaced 50cm copper pipe and      │
│   faucet washer. Tested thoroughly.  │
│   No more leaks. Recommend annual    │
│   maintenance check."                │
│                                      │
│  PAYMENT                             │
│  ┌────────────────────────────┐     │
│  │ Final amount:       ₱650   │     │
│  │ (Approved earlier)         │     │
│  │                            │     │
│  │ Payment method:            │     │
│  │ ● Cash                     │     │
│  │ ○ GCash                    │     │
│  │ ○ Credit Card              │     │
│  │                            │     │
│  │ [Confirm Payment ₱650]     │     │
│  └────────────────────────────┘     │
│                                      │
│  RATE YOUR EXPERIENCE                │
│  How was your service with Mario?    │
│                                      │
│  ☆ ☆ ☆ ☆ ☆                          │
│  Tap to rate                         │
│                                      │
│  What went well?                     │
│  ☐ On time                           │
│  ☐ Professional                      │
│  ☐ Quality work                      │
│  ☐ Fair price                        │
│  ☐ Clean workspace                   │
│                                      │
│  Additional feedback (optional)      │
│  ┌────────────────────────────┐     │
│  │                            │     │
│  └────────────────────────────┘     │
│                                      │
│  📸 Add photos (optional)            │
│  [+] [+] [+]                         │
│                                      │
│  ┌────────────────────────────┐     │
│  │   Submit Review & Pay  →   │     │
│  └────────────────────────────┘     │
│                                      │
│  [Skip for now]                      │
└─────────────────────────────────────┘
Data Structure:
typescriptinterface CompletedBooking {
  bookingId: string;
  completedAt: Date;
  duration: number;           // Minutes
  finalAmount: number;
  workDone: string[];
  providerNotes: string;
  beforePhotos: string[];
  afterPhotos: string[];
  
  payment: {
    method: 'cash' | 'gcash' | 'credit_card';
    amount: number;
    status: 'pending' | 'processing' | 'completed';
    transactionId?: string;
  };
  
  review?: {
    rating: number;           // 1-5
    tags: string[];          // ['on_time', 'professional', etc.]
    comment: string;
    photos: string[];
    submittedAt: Date;
  };
}
```

**Post-Service Flow:**
```
Work Done
    ↓
1. Review before/after photos
2. Select payment method
3. Confirm payment
4. Rate provider (1-5 stars)
5. Select positive tags
6. Write review (optional)
7. Add photos (optional)
8. Submit
    ↓
Booking Archived
Receipt Emailed
Review Published
Key Features:

Before/After Photos: Visual proof of work
Payment Processing: Multiple payment methods
Rating System: 1-5 stars with tags
Photo Reviews: Upload before/after photos
Digital Receipt: Automatic email/SMS
Warranty Info: Work guarantee details


💾 Data Models
Complete Firestore Schema
typescript// ─── COLLECTIONS ────────────────────────────────────────────

/**
 * /serviceCategories/{categoryId}
 */
interface ServiceCategory {
  id: string;
  name: string;              // 'Repair', 'Cleaning', 'Moving'
  icon: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  subcategories: string[];   // Array of subcategory IDs
  createdAt: Timestamp;
}

/**
 * /serviceSubcategories/{subcategoryId}
 */
interface ServiceSubcategory {
  id: string;
  parentCategory: string;    // Category ID
  name: string;              // 'Plumbing', 'Electrical'
  icon: string;
  description: string;
  avgRating: number;
  providerCount: number;
  basePrice: number;
  isPopular: boolean;
  searchKeywords: string[];
  createdAt: Timestamp;
}

/**
 * /providers/{providerId}
 */
interface Provider {
  id: string;
  userId: string;            // Link to auth user
  personalInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    avatar: string;
    dateOfBirth: Date;
  };
  businessInfo: {
    businessName?: string;
    registrationNumber?: string;
    taxId?: string;
  };
  location: {
    address: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  services: string[];        // Subcategory IDs
  pricing: {
    [subcategoryId: string]: number;  // Base rates per service
  };
  availability: {
    schedule: WeeklySchedule;
    isAvailable: boolean;
    currentLocation?: GeoPoint;
  };
  stats: {
    totalJobs: number;
    completedJobs: number;
    cancelledJobs: number;
    avgRating: number;
    reviewCount: number;
    responseTime: number;    // Average in minutes
    completionRate: number;  // Percentage
    repeatCustomerRate: number;
  };
  verification: {
    isVerified: boolean;
    governmentId: {
      type: string;
      number: string;
      verified: boolean;
    };
    backgroundCheck: {
      status: 'pending' | 'passed' | 'failed';
      date: Date;
    };
    certifications: Certification[];
  };
  badges: string[];          // ['top_rated', 'fast_reply', 'verified']
  insurance: {
    provider: string;
    policyNumber: string;
    coverage: number;
    expiryDate: Date;
  };
  bankAccount: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  status: 'active' | 'inactive' | 'suspended' | 'pending_approval';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface DaySchedule {
  isAvailable: boolean;
  slots: TimeSlot[];
}

interface TimeSlot {
  start: string;             // '08:00'
  end: string;               // '17:00'
}

/**
 * /serviceRequests/{requestId}
 */
interface ServiceRequest {
  id: string;
  userId: string;
  category: string;
  subcategory: string;
  description: string;
  photos: string[];
  urgency: 'now' | 'today' | 'tomorrow' | 'scheduled';
  scheduledDate?: Timestamp;
  location: {
    address: string;
    unit?: string;
    latitude: number;
    longitude: number;
    placeId: string;
  };
  status: 'pending' | 'matched' | 'cancelled' | 'expired';
  createdAt: Timestamp;
  expiresAt: Timestamp;      // Requests expire after 24 hours
}

/**
 * /bookings/{bookingId}
 */
interface Booking {
  id: string;
  requestId: string;
  userId: string;
  providerId: string;
  
  service: {
    category: string;
    subcategory: string;
    description: string;
    photos: string[];
  };
  
  schedule: {
    type: 'now' | 'scheduled';
    requestedDate: Timestamp;
    confirmedDate?: Timestamp;
    completedDate?: Timestamp;
  };
  
  location: {
    address: string;
    unit?: string;
    latitude: number;
    longitude: number;
    specialInstructions?: string;
  };
  
  pricing: {
    baseRate: number;
    urgentFee: number;
    serviceFee: number;
    subtotal: number;
    materialsCost?: number;
    additionalWork?: number;
    total: number;
    finalQuote?: PriceQuote;
  };
  
  payment: {
    method: 'cash' | 'gcash' | 'credit_card' | 'debit_card';
    status: 'pending' | 'processing' | 'completed' | 'refunded';
    transactionId?: string;
    paidAt?: Timestamp;
  };
  
  status: BookingStatus;
  
  timeline: BookingEvent[];
  
  providerNotes?: string;
  workCompleted?: string[];
  beforePhotos?: string[];
  afterPhotos?: string[];
  
  cancellation?: {
    cancelledBy: 'user' | 'provider' | 'system';
    reason: string;
    cancelledAt: Timestamp;
    refundAmount?: number;
  };
  
  review?: {
    rating: number;
    tags: string[];
    comment: string;
    photos: string[];
    submittedAt: Timestamp;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type BookingStatus = 
  | 'pending_confirmation'
  | 'confirmed'
  | 'provider_en_route'
  | 'provider_arrived'
  | 'inspecting'
  | 'price_approval_pending'
  | 'price_approved'
  | 'in_progress'
  | 'work_completed'
  | 'payment_pending'
  | 'completed'
  | 'cancelled';

/**
 * /reviews/{reviewId}
 */
interface Review {
  id: string;
  bookingId: string;
  providerId: string;
  userId: string;
  rating: number;            // 1-5
  tags: string[];
  comment: string;
  photos: string[];
  verified: boolean;         // From actual completed booking
  helpful: number;           // Helpful votes
  providerResponse?: {
    text: string;
    date: Timestamp;
  };
  createdAt: Timestamp;
}

/**
 * /chats/{chatId}
 */
interface Chat {
  id: string;
  bookingId: string;
  participants: string[];    // [userId, providerId]
  lastMessage: string;
  lastMessageTime: Timestamp;
  unreadCount: {
    [userId: string]: number;
  };
  createdAt: Timestamp;
}

/**
 * /chats/{chatId}/messages/{messageId}
 */
interface Message {
  id: string;
  senderId: string;
  senderType: 'user' | 'provider';
  text?: string;
  image?: string;
  type: 'text' | 'image' | 'system';
  read: boolean;
  createdAt: Timestamp;
}

/**
 * /providerLocations/{providerId}
 */
interface ProviderLocation {
  providerId: string;
  location: GeoPoint;
  lastUpdated: Timestamp;
  isActive: boolean;
  currentBookingId?: string;
}
Firestore Security Rules
javascriptrules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isProvider() {
      return exists(/databases/$(database)/documents/providers/$(request.auth.uid));
    }
    
    // Service Categories (Public read)
    match /serviceCategories/{categoryId} {
      allow read: if true;
      allow write: if false; // Admin only (handled by Cloud Functions)
    }
    
    match /serviceSubcategories/{subcategoryId} {
      allow read: if true;
      allow write: if false; // Admin only
    }
    
    // Providers
    match /providers/{providerId} {
      allow read: if true; // Public profiles
      allow create: if isAuthenticated();
      allow update: if isOwner(providerId);
      allow delete: if false; // Admin only
    }
    
    // Service Requests
    match /serviceRequests/{requestId} {
      allow read: if isAuthenticated() && 
        (isOwner(resource.data.userId) || isProvider());
      allow create: if isAuthenticated();
      allow update: if isOwner(resource.data.userId);
      allow delete: if isOwner(resource.data.userId);
    }
    
    // Bookings
    match /bookings/{bookingId} {
      allow read: if isAuthenticated() && 
        (isOwner(resource.data.userId) || 
         isOwner(resource.data.providerId));
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
        (isOwner(resource.data.userId) || 
         isOwner(resource.data.providerId));
      allow delete: if false; // Never delete bookings
    }
    
    // Reviews
    match /reviews/{reviewId} {
      allow read: if true; // Public reviews
      allow create: if isAuthenticated() && 
        isOwner(request.resource.data.userId);
      allow update: if isOwner(resource.data.userId) ||
        isOwner(resource.data.providerId); // Provider can respond
      allow delete: if false; // Never delete reviews
    }
    
    // Chats
    match /chats/{chatId} {
      allow read: if isAuthenticated() && 
        request.auth.uid in resource.data.participants;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
        request.auth.uid in resource.data.participants;
      
      match /messages/{messageId} {
        allow read: if isAuthenticated() && 
          request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
        allow create: if isAuthenticated() && 
          request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      }
    }
    
    // Provider Locations (for live tracking)
    match /providerLocations/{providerId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isOwner(providerId);
    }
  }
}

🚀 Implementation Prompts
Prompt 1: Service Subcategory Screen
markdownBuild service subcategory selection screen for AERIS service marketplace.

CONTEXT:
User tapped a service category (e.g., "Repair") and needs to select specific subcategory (e.g., "Plumbing", "Electrical").
Screen shows searchable list of subcategories with stats and quick actions.

LOCATION: app/services/[category].tsx

DESIGN REQUIREMENTS:
- Dark theme matching Claude.ai aesthetic (#1A1A1A background)
- Smart search bar at top (autofocus, predictive)
- Popular subcategories highlighted
- Show avg rating, provider count, base price per subcategory
- Tappable cards navigating to problem description

FEATURES:
✅ Dynamic route param from category selection
✅ Smart search with keyword matching
✅ Sort options (Popular, Rating, Price)
✅ Quick stats display
✅ Skeleton loading states

DATA STRUCTURE:
Use ServiceSubcategory interface from data models section
Load from Firestore: /serviceSubcategories where parentCategory == {category}

UI COMPONENTS:
- Header with back button and search
- Search bar with autocomplete
- Subcategory cards (icon, name, description, stats, price)
- Sort/filter options
- Empty state for no results

NAVIGATION:
On subcategory tap → Navigate to /services/request with params:
{ category: string, subcategory: string }

EXAMPLE CATEGORIES:
REPAIR: Plumbing, Electrical, Aircon, Appliance, Gadget, Auto, Carpentry, Painting
CLEANING: Deep Clean, Regular Clean, Move-in/out, Aircon Clean, Upholstery
MOVING: Residential, Commercial, Packing, Storage, Junk Removal

Build production-ready screen with proper error handling, loading states, and responsive design.

Prompt 2: Problem Description Screen
markdownBuild service request form screen where users describe their problem and add details.

CONTEXT:
User selected a specific service subcategory (e.g., "Plumbing").
Now they need to describe the issue, add photos, set urgency, and confirm location.

LOCATION: app/services/request.tsx

ROUTE PARAMS:
{ category: string, subcategory: string }

DESIGN REQUIREMENTS:
- Dark theme (#1A1A1A)
- Form fields with validation
- Photo upload with compression
- Location autocomplete
- Clear CTAs

FORM FIELDS:
1. Photo Upload (Optional)
   - Max 5 photos
   - Camera or gallery
   - Image compression to < 1MB
   - Preview thumbnails

2. Description (Optional but recommended)
   - Multiline TextInput
   - 0-500 character limit
   - Character counter
   - Placeholder text with examples

3. Urgency (Required)
   - Radio buttons: Now, Today, Tomorrow, Schedule
   - Show price adjustment for "Now" (₱100 urgent fee)
   - Date/time picker if "Schedule" selected

4. Location (Required)
   - Pre-filled from GPS
   - Editable address field
   - Google Places autocomplete
   - "Change location" button
   - Optional unit/floor number

5. Tips Section
   - Helpful suggestions for better service
   - Expandable/collapsible

VALIDATION:
- Urgency must be selected
- Location must be valid
- If description empty, show warning (not blocking)

SUBMISSION:
Create ServiceRequest document in Firestore
Navigate to /services/providers with { requestId: string }

ERROR HANDLING:
- Photo upload failures
- Location permission denied
- Network errors
- Firestore write errors

Build with proper form state management, validation, and user feedback.

Prompt 3: Provider List Screen
markdownBuild provider list screen showing available service providers matching user's request.

CONTEXT:
User submitted service request.
Show providers sorted by distance, rating, or price with real-time availability.

LOCATION: app/services/providers.tsx

ROUTE PARAMS:
{ requestId: string }

DESIGN REQUIREMENTS:
- Dark theme
- Provider cards with key info
- Sort and filter options
- Skeleton loading while fetching

PROVIDER CARD LAYOUT:
┌────────────────────────────┐
│ 👤 Provider Name           │
│ ⭐ 4.9 ★★★★★ (234)        │
│ 📍 2.3 km • ⚡ 25 min      │
│ 💰 ₱500 base rate          │
│ ✅ Licensed • 8 yrs exp    │
│ 🏆 Top Rated • Fast Reply  │
│                            │
│ "Fixed leak fast!"         │
│ - Recent review            │
│                            │
│ [View Profile]    [Book]   │
└────────────────────────────┘

DATA FETCHING:
1. Load ServiceRequest by requestId
2. Query Providers where:
   - services array contains subcategory
   - location within 20km radius (use Firestore GeoQueries or manual filter)
   - status == 'active'
   - isAvailable == true

SORTING OPTIONS:
- Distance (default): Nearest first
- Rating: Highest rated first
- Price: Lowest price first
- Response Time: Fastest first

FILTERS:
- Availability: Now, Today, Tomorrow
- Price Range: ₱0-500, ₱500-1000, ₱1000+
- Rating: 4.5+, 4.0+, 3.5+
- Distance: 5km, 10km, 20km
- Badges: Top Rated, Licensed, Fast Reply

ACTIONS:
- "View Profile" → Navigate to /services/provider/[id]
- "Book" → Navigate to /services/booking/confirm with { requestId, providerId }

FEATURES:
✅ Real-time availability status
✅ Distance calculation (Haversine formula)
✅ ETA estimation
✅ Badge display (top_rated, verified, fast_reply)
✅ Recent review preview
✅ Pagination (load 5 at a time)
✅ Empty state (no providers found)
✅ Retry on error

Build with proper loading states, error handling, and responsive design.

Prompt 4: Provider Profile Screen
markdownBuild detailed provider profile screen with comprehensive information and reviews.

CONTEXT:
User tapped "View Profile" from provider list.
Show complete provider details, certifications, work portfolio, and reviews.

LOCATION: app/services/provider/[id].tsx

ROUTE PARAMS:
{ id: string } (provider ID)

DESIGN REQUIREMENTS:
- Scrollable long-form content
- Dark theme
- Section headers
- Tabbed or sectioned layout

SECTIONS:

1. HEADER
   - Avatar photo
   - Name
   - Rating with stars and count
   - Years of experience
   - Distance from user
   - Share button

2. SERVICES OFFERED
   - List of subcategories
   - Expandable "See all"

3. CERTIFICATIONS & VERIFICATION
   - Government ID verified badge
   - Professional certifications (TESDA, etc.)
   - Background check status
   - Insurance coverage amount

4. STATS
   - Total completed jobs
   - Average response time
   - Completion rate
   - Repeat customer rate

5. RECENT WORK (Portfolio)
   - Grid of before/after photos
   - Tappable to view full-screen
   - "See all photos" button

6. REVIEWS
   - Overall rating breakdown (5★, 4★, 3★, etc.)
   - Filterable reviews (All, 5★, 4★, etc.)
   - Paginated list (10 per page)
   - Photo reviews highlighted
   - Provider responses visible
   - Helpful vote count

REVIEW CARD:
┌────────────────────────────┐
│ ⭐⭐⭐⭐⭐ 5.0            │
│ "Fast, professional work!" │
│ - Maria Lopez, 2 days ago  │
│ 📷 [Before] [After]        │
│ ♥️ 12 people found helpful│
│                            │
│ ↳ Mario: "Thank you!"      │
│   1 day ago                │
└────────────────────────────┘

FOOTER ACTION:
Fixed bottom bar with:
"Book [Provider Name] → Base rate: ₱XXX"

Button navigates to /services/booking/confirm

DATA FETCHING:
1. Load Provider by id
2. Load Reviews where providerId == id (sorted by date desc)

FEATURES:
✅ Share provider profile (deep link)
✅ Report provider option
✅ Expandable sections
✅ Image lightbox for portfolio
✅ Review filtering
✅ Infinite scroll for reviews
✅ Back navigation

Build with proper image loading, lazy loading for reviews, and error handling.

Prompt 5: Booking Confirmation Screen
markdownBuild booking confirmation screen where users review details and confirm booking.

CONTEXT:
User selected a provider.
Show complete booking summary, pricing breakdown, and payment options.

LOCATION: app/services/booking/confirm.tsx

ROUTE PARAMS:
{ requestId: string, providerId: string }

DESIGN REQUIREMENTS:
- Dark theme
- Clear sections
- Editable fields
- Trust indicators

SECTIONS:

1. PROVIDER INFO
   - Name, avatar, rating
   - Phone number (masked: 0917-***-4567)
   - ETA to arrival

2. SERVICE REQUEST SUMMARY
   - Service type (subcategory)
   - User's description
   - Uploaded photos (thumbnails)

3. SCHEDULE
   - Date and time
   - Urgency level
   - "Change schedule" button (edits ServiceRequest)

4. LOCATION
   - Full address
   - Unit/floor number (editable)
   - "View on map" button
   - "Edit address" button

5. PRICING BREAKDOWN
   Base rate:             ₱500
   Urgent booking fee:    ₱100
   AERIS service fee:     ₱50
   ─────────────────────  ────
   Subtotal:              ₱650

   💡 Final price confirmed after provider inspection

6. PAYMENT METHOD
   - Cash (default, selected)
   - GCash (add account)
   - Credit Card (add card)

7. SPECIAL INSTRUCTIONS (Optional)
   - Multiline text input
   - Examples: "Gate code: 1234", "Park in Visitor B3"

8. TERMS AGREEMENT
   - Checkbox: "I agree to AERIS Terms of Service"
   - Checkbox: "Free cancellation within 5 minutes"

9. CONFIRM BUTTON
   Large green button: "Confirm Booking →"

VALIDATION:
- Payment method selected
- Terms agreed (checked)
- Location valid

SUBMISSION FLOW:
1. Create Booking document in Firestore
2. Update ServiceRequest status to 'matched'
3. Send notification to Provider (FCM)
4. Navigate to /services/booking/[bookingId] (live tracking)

ERROR HANDLING:
- Provider became unavailable
- Payment method issues
- Network errors
- Firestore write failures

FEATURES:
✅ Auto-fill from ServiceRequest
✅ Editable fields with validation
✅ Real-time price calculation
✅ Terms modal (tappable)
✅ Loading state during submission
✅ Success/error feedback

Build with proper form management, validation, and error handling.

Prompt 6: Live Booking Tracking Screen
markdownBuild active booking screen with live provider tracking and real-time updates.

CONTEXT:
Booking confirmed.
Show provider's live location, ETA, status updates, and communication options.

LOCATION: app/services/booking/[id].tsx

ROUTE PARAMS:
{ id: string } (booking ID)

DESIGN REQUIREMENTS:
- Dark theme
- Live map view
- Real-time updates via Firestore onSnapshot
- Chat integration

COMPONENTS:

1. HEADER
   - "Booking Details" title
   - Share button (share booking with contacts)
   - Help button (customer support)

2. STATUS INDICATOR
   ✅ Confirmed! / 🚗 On the way / 🛠️ In progress

3. LIVE MAP
   - Google Maps / Map3DElement
   - User's location (blue pin)
   - Provider's location (moving pin with avatar)
   - Route line between locations
   - ETA badge overlay
   - Distance remaining

4. BOOKING INFO
   - Booking ID
   - Date and time
   - Provider details (name, rating, phone)

5. TIMELINE / WHAT'S NEXT
   Step-by-step guide:
   1. ⏰ Provider arrives in ~25 min
   2. 🔍 Inspection and quote
   3. 💰 Approve final price
   4. 🛠️ Work begins
   5. ✅ Approve completion
   6. 💳 Payment
   7. ⭐ Rate experience

6. QUICK ACTIONS
   - 💬 Chat with Provider (navigate to chat)
   - 📞 Call Provider (tel: link)
   - 📍 Share Live Location (share booking URL)
   - ⚠️ Report Issue (modal)

7. CANCELLATION
   "⚠️ Need to cancel?"
   Free cancellation within 5 minutes
   [Cancel booking] button (confirmation modal)

8. SAFETY FEATURES
   🔒 Share this booking with trusted contacts
   [Share booking details] (SMS/WhatsApp share)

REAL-TIME UPDATES:
Use Firestore onSnapshot on /bookings/{id} to listen for:
- Status changes (en_route → arrived → in_progress, etc.)
- Provider location updates (from /providerLocations/{providerId})
- New chat messages
- Price quote updates
- Timeline events

STATUS FLOW:
confirmed → provider_en_route → provider_arrived → inspecting 
→ price_approval_pending → in_progress → work_completed 
→ payment_pending → completed

PRICE APPROVAL MODAL:
When status === 'price_approval_pending', show modal:

┌────────────────────────────┐
│ Price Confirmation         │
│                            │
│ Original estimate:  ₱500   │
│ Final quote:        ₱650   │
│                            │
│ Additional work:           │
│ • Replace corroded pipe    │
│ • New faucet washer        │
│                            │
│ [Decline] [Approve ₱650]   │
└────────────────────────────┘

FEATURES:
✅ Live map tracking (update every 10 seconds)
✅ ETA calculation (Google Directions API)
✅ Push notifications for status changes
✅ Chat integration (unread badge)
✅ Call provider (tel: link)
✅ Share location (deep link)
✅ Cancellation with refund logic
✅ Timeline progress visualization

Build with Firestore real-time listeners, proper cleanup on unmount, and error handling.

Prompt 7: Service Completion & Review Screen
markdownBuild service completion screen with payment, rating, and review submission.

CONTEXT:
Provider marked work as completed.
User needs to review work, approve completion, pay, and rate the service.

LOCATION: app/services/booking/complete.tsx

ROUTE PARAMS:
{ bookingId: string }

DESIGN REQUIREMENTS:
- Dark theme
- Visual proof of completion (before/after photos)
- Payment processing
- Rating system

SECTIONS:

1. COMPLETION HEADER
   ✅ Work Done! / Service Completed

2. BEFORE & AFTER PHOTOS
   Side-by-side comparison
   [Before Photo]  [After Photo]
   Swipeable or tappable for full-screen

3. WORK COMPLETED CHECKLIST
   ✅ Fixed leaking kitchen faucet
   ✅ Replaced corroded pipe
   ✅ Installed new washer
   ✅ Tested for leaks

4. PROVIDER NOTES
   Text from provider explaining work done, recommendations, etc.

5. PAYMENT SECTION
   ┌────────────────────────────┐
   │ Final amount:       ₱650   │
   │ (Approved earlier)         │
   │                            │
   │ Payment method:            │
   │ ● Cash                     │
   │ ○ GCash                    │
   │ ○ Credit Card              │
   │                            │
   │ [Confirm Payment ₱650]     │
   └────────────────────────────┘

6. RATE YOUR EXPERIENCE
   - Star rating (1-5, tappable)
   - Quick tags (checkboxes):
     ☐ On time
     ☐ Professional
     ☐ Quality work
     ☐ Fair price
     ☐ Clean workspace
   - Additional feedback (optional text)
   - Photo upload (optional, before/after photos)

7. SUBMIT BUTTON
   "Submit Review & Pay →"
   (or "Pay Now →" if payment not completed)

8. SKIP OPTION
   "Skip for now" (can review later from booking history)

PAYMENT FLOW:
1. Select payment method
2. Tap "Confirm Payment"
3. Process payment (integrations: GCash API, Stripe, etc.)
4. Update booking.payment.status = 'completed'
5. Generate digital receipt
6. Send email/SMS receipt

REVIEW SUBMISSION:
1. Validate rating (1-5 stars required)
2. Create Review document in Firestore
3. Update Provider stats (avgRating, reviewCount)
4. Update Booking status = 'completed'
5. Show success message
6. Navigate to booking history or home

FEATURES:
✅ Before/after photo comparison
✅ Payment method selection
✅ Payment processing with loading state
✅ Star rating with visual feedback
✅ Quick tag selection
✅ Optional photo review upload
✅ Digital receipt generation
✅ Email/SMS notification
✅ Success animation
✅ Skip and review later option

ERROR HANDLING:
- Payment failures (show error, allow retry)
- Network errors (save draft review locally)
- Firestore errors (retry logic)

Build with proper payment integration, form validation, and user feedback.

🎨 Best Practices
Performance Optimization
typescript// 1. Image Optimization
import * as ImageManipulator from 'expo-image-manipulator';

async function compressImage(uri: string): Promise<string> {
  const manipResult = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }], // Max width 1200px
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return manipResult.uri;
}

// 2. Firestore Query Optimization
// ❌ Bad: Load all providers then filter client-side
const allProviders = await getDocs(collection(db, 'providers'));
const filtered = allProviders.docs.filter(/* ... */);

// ✅ Good: Filter server-side
const providersQuery = query(
  collection(db, 'providers'),
  where('services', 'array-contains', subcategoryId),
  where('status', '==', 'active'),
  limit(10)
);

// 3. Real-time Listener Cleanup
useEffect(() => {
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    // Handle updates
  });
  
  return () => unsubscribe(); // Always cleanup!
}, []);

// 4. Pagination
const [lastDoc, setLastDoc] = useState(null);

const loadMore = async () => {
  const q = query(
    collection(db, 'providers'),
    orderBy('distance'),
    startAfter(lastDoc),
    limit(5)
  );
  const snapshot = await getDocs(q);
  setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
};
Error Handling Patterns
typescript// 1. User-Friendly Error Messages
const ERROR_MESSAGES = {
  'permission-denied': 'You don\'t have permission to access this.',
  'not-found': 'Booking not found. It may have been cancelled.',
  'network-error': 'Connection issue. Please check your internet.',
  'payment-failed': 'Payment failed. Please try again or use another method.',
};

function getErrorMessage(error: any): string {
  return ERROR_MESSAGES[error.code] || 'Something went wrong. Please try again.';
}

// 2. Retry Logic
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

// 3. Graceful Degradation
try {
  const providers = await fetchProviders();
  setProviders(providers);
} catch (error) {
  console.error('Failed to load providers:', error);
  // Show cached data if available
  if (cachedProviders.length > 0) {
    setProviders(cachedProviders);
    showToast('Showing cached results');
  } else {
    setError(getErrorMessage(error));
  }
}
Accessibility
typescript// 1. Accessible Buttons
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Book Mario Santos for plumbing repair, base rate 500 pesos"
  accessibilityRole="button"
  accessibilityHint="Tap to proceed to booking confirmation"
  onPress={handleBook}
>
  <Text>Book</Text>
</TouchableOpacity>

// 2. Screen Reader Support
<View accessible={true} accessibilityLabel="Provider rating">
  <Text>⭐ 4.9</Text>
  <Text>(234 reviews)</Text>
</View>

// 3. Minimum Touch Targets
const styles = StyleSheet.create({
  button: {
    minHeight: 44, // iOS minimum
    minWidth: 44,
  },
});

// 4. Color Contrast
// Ensure text meets WCAG AA standards
// White (#FFF) on dark (#1A1A1A) = Good contrast
// Light gray (#A8A8A8) on dark = Check with tool
State Management
typescript// Use Context for shared state across booking flow
interface BookingFlowContext {
  request: ServiceRequest | null;
  selectedProvider: Provider | null;
  bookingDetails: Partial<Booking>;
  setRequest: (request: ServiceRequest) => void;
  setProvider: (provider: Provider) => void;
  updateBookingDetails: (details: Partial<Booking>) => void;
  resetFlow: () => void;
}

const BookingFlowProvider: React.FC = ({ children }) => {
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [bookingDetails, setBookingDetails] = useState<Partial<Booking>>({});
  
  const updateBookingDetails = (details: Partial<Booking>) => {
    setBookingDetails(prev => ({ ...prev, ...details }));
  };
  
  const resetFlow = () => {
    setRequest(null);
    setSelectedProvider(null);
    setBookingDetails({});
  };
  
  return (
    <BookingFlowContext.Provider
      value={{
        request,
        selectedProvider,
        bookingDetails,
        setRequest,
        setProvider: setSelectedProvider,
        updateBookingDetails,
        resetFlow,
      }}
    >
      {children}
    </BookingFlowContext.Provider>
  );
};
Analytics & Tracking
typescript// Track key events
import analytics from '@react-native-firebase/analytics';

// Screen views
useEffect(() => {
  analytics().logScreenView({
    screen_name: 'ServiceSubcategories',
    screen_class: 'ServiceSubcategoriesScreen',
  });
}, []);

// User actions
const trackBookingStarted = (subcategory: string) => {
  analytics().logEvent('booking_started', {
    service_category: 'repair',
    service_subcategory: subcategory,
    urgency: 'now',
  });
};

const trackBookingCompleted = (bookingId: string, amount: number) => {
  analytics().logEvent('purchase', {
    transaction_id: bookingId,
    value: amount,
    currency: 'PHP',
    items: [{ item_id: subcategoryId, item_name: subcategoryName }],
  });
};

// Conversion funnel
// 1. service_viewed
// 2. subcategory_selected
// 3. request_submitted
// 4. provider_selected
// 5. booking_confirmed
// 6. booking_completed
Testing Strategy
typescript// 1. Unit Tests (Jest)
describe('searchProviders', () => {
  it('filters providers by distance', () => {
    const providers = [
      { id: '1', distance: 2.3 },
      { id: '2', distance: 5.1 },
      { id: '3', distance: 1.8 },
    ];
    
    const filtered = filterByDistance(providers, 5);
    expect(filtered).toHaveLength(3);
    
    const filtered2 = filterByDistance(providers, 3);
    expect(filtered2).toHaveLength(2);
  });
});

// 2. Integration Tests
describe('Booking Flow', () => {
  it('completes full booking flow', async () => {
    // 1. Create service request
    const request = await createServiceRequest({ /* ... */ });
    expect(request.id).toBeDefined();
    
    // 2. Find providers
    const providers = await findProviders(request.subcategory);
    expect(providers.length).toBeGreaterThan(0);
    
    // 3. Create booking
    const booking = await createBooking(request.id, providers[0].id);
    expect(booking.status).toBe('pending_confirmation');
    
    // 4. Confirm booking
    const confirmed = await confirmBooking(booking.id);
    expect(confirmed.status).toBe('confirmed');
  });
});

// 3. E2E Tests (Detox)
describe('Booking', () => {
  it('should complete booking flow', async () => {
    await element(by.id('services-tab')).tap();
    await element(by.id('repair-category')).tap();
    await element(by.id('plumbing-subcategory')).tap();
    await element(by.id('description-input')).typeText('Leaking faucet');
    await element(by.id('submit-request')).tap();
    await element(by.id('provider-0')).tap();
    await element(by.id('confirm-booking')).tap();
    await expect(element(by.text('Booking Confirmed!'))).toBeVisible();
  });
});

✅ Implementation Checklist
Phase 1: Core Screens (Week 1)

 Service subcategory screen
 Problem description form
 Provider list screen
 Booking confirmation screen

Phase 2: Advanced Features (Week 2)

 Provider profile screen
 Live booking tracking
 Chat integration
 Payment processing

Phase 3: Completion Flow (Week 3)

 Service completion screen
 Rating and review system
 Digital receipts
 Booking history

Phase 4: Polish & Optimization (Week 4)

 Loading states and skeletons
 Error handling and retry logic
 Performance optimization
 Analytics implementation
 Accessibility improvements
 Testing (unit, integration, E2E)


🎯 Success Metrics
Track these KPIs to measure implementation success:
User Experience:

⏱️ Average booking time: Target < 90 seconds
📈 Booking completion rate: Target > 80%
⭐ User satisfaction: Target > 4.5 stars
🔄 Repeat booking rate: Target > 40%

Technical:

📱 App crash rate: Target < 1%
⚡ Screen load time: Target < 2 seconds
🐛 Error rate: Target < 5%
📊 API success rate: Target > 99%

Business:

💰 GMV (Gross Merchandise Value)
📊 Conversion rate (request → booking)
👥 Active users (daily/monthly)
🔁 Customer retention rate