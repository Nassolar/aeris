/**
 * AERIS Service Marketplace — TypeScript Interfaces
 * Covers the full service booking flow (citizen → provider)
 */

import firebase from 'firebase/compat/app';
type Timestamp = firebase.firestore.Timestamp;

// ─── Subcategories ────────────────────────────────────────────────────────────

export interface ServiceSubcategory {
  id: string;
  parentCategory: string;  // 'repair' | 'cleaning' | 'moving' etc.
  name: string;
  icon: string;            // emoji or Ionicons name
  description: string;
  avgRating: number;
  providerCount: number;
  basePrice: number;
  isPopular: boolean;
  searchKeywords: string[];
  createdAt?: Timestamp;
}

// ─── Providers ────────────────────────────────────────────────────────────────

export interface ServiceBadge {
  type: 'top_rated' | 'fast_reply' | 'verified' | 'licensed' | 'new_provider';
  label: string;
  color: string;
}

export interface Certification {
  name: string;
  issuer: string;
  verified: boolean;
  expiryDate?: Timestamp;
}

export interface ProviderStats {
  totalJobs: number;
  completedJobs: number;
  avgRating: number;
  reviewCount: number;
  responseTime: number;   // average minutes
  completionRate: number; // percentage 0-100
  repeatCustomerRate: number;
}

export interface MarketplaceProvider {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  bio?: string;
  services: string[];       // subcategory IDs
  baseRates: Record<string, number>; // subcategoryId → price
  location: {
    address: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  stats: ProviderStats;
  badges: ServiceBadge[];
  isLicensed: boolean;
  yearsExperience: number;
  certifications: Certification[];
  availability: 'now' | 'today' | 'tomorrow' | 'unavailable';
  responseTime: string;     // '< 5 min'
  workPhotos?: string[];
  languages?: string[];
  activeHours?: { start: string; end: string };
  status: 'active' | 'inactive' | 'suspended' | 'pending_approval';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  // Computed at query time
  distance?: number;
  eta?: number;
  recentReview?: {
    text: string;
    author: string;
    rating: number;
  };
}

// ─── Service Requests ─────────────────────────────────────────────────────────

export type ServiceUrgency = 'now' | 'today' | 'tomorrow' | 'scheduled';

export interface ServiceRequest {
  id: string;
  userId: string;
  category: string;
  subcategory: string;
  description: string;
  photos: string[];
  urgency: ServiceUrgency;
  scheduledDate?: Timestamp;
  location: {
    address: string;
    unit?: string;
    latitude: number;
    longitude: number;
    placeId?: string;
  };
  status: 'pending' | 'matched' | 'cancelled' | 'expired';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export type ServiceBookingStatus =
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

export interface PriceQuote {
  originalEstimate: number;
  finalQuote: number;
  reason: string;
  additionalWork?: string[];
  status: 'pending_approval' | 'approved' | 'declined';
  quotedAt: Timestamp;
}

export interface BookingEvent {
  timestamp: Timestamp;
  type: string;
  message: string;
  actor: 'user' | 'provider' | 'system';
}

export interface ServiceBooking {
  id: string;
  requestId: string;
  userId: string;
  providerId: string;
  providerName: string;
  providerAvatar?: string;
  providerPhone?: string;
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
    total: number;
    finalQuote?: PriceQuote;
  };
  payment: {
    method: 'cash' | 'gcash' | 'credit_card';
    status: 'pending' | 'processing' | 'completed' | 'refunded';
    transactionId?: string;
    paidAt?: Timestamp;
  };
  status: ServiceBookingStatus;
  timeline: BookingEvent[];
  providerNotes?: string;
  workCompleted?: string[];
  beforePhotos?: string[];
  afterPhotos?: string[];
  cancellation?: {
    cancelledBy: 'user' | 'provider' | 'system';
    reason: string;
    cancelledAt: Timestamp;
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

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface ServiceReview {
  id: string;
  bookingId: string;
  providerId: string;
  userId: string;
  rating: number;
  tags: string[];
  comment: string;
  photos: string[];
  verified: boolean;
  providerResponse?: {
    text: string;
    date: Timestamp;
  };
  createdAt: Timestamp;
}

// ─── Live Tracking ────────────────────────────────────────────────────────────

export interface ProviderLocation {
  providerId: string;
  latitude: number;
  longitude: number;
  lastUpdated: Timestamp;
  isActive: boolean;
  currentBookingId?: string;
}
