/**
 * AERIS Service Marketplace — Firestore Service Layer
 * Collections: service_subcategories, service_providers, service_requests,
 *              service_bookings, service_reviews, provider_locations
 */

import { db, auth, storage } from '../firebaseConfig';
import firebase from 'firebase/compat/app';
import {
  ServiceSubcategory,
  MarketplaceProvider,
  ServiceRequest,
  ServiceBooking,
  ServiceBookingStatus,
  ServiceReview,
  ProviderLocation,
  ServiceUrgency,
} from '../types/serviceMarketplace';

const FieldValue = firebase.firestore.FieldValue;
const Timestamp = firebase.firestore.Timestamp;

// ─── Utility ──────────────────────────────────────────────────────────────────

/** Haversine distance in km between two lat/lng coordinates */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Estimated ETA in minutes based on distance (avg 30 km/h urban speed) */
export function estimateETA(distanceKm: number): number {
  return Math.ceil((distanceKm / 30) * 60);
}

/** Service fee is 10% of base rate, min ₱50 */
export function calcServiceFee(baseRate: number): number {
  return Math.max(50, Math.round(baseRate * 0.1));
}

/** Urgent fee for 'now' bookings */
export const URGENT_FEE = 100;

// ─── Subcategories ────────────────────────────────────────────────────────────

export const STATIC_SUBCATEGORIES: Record<string, ServiceSubcategory[]> = {
  repair: [
    { id: 'plumbing', parentCategory: 'repair', name: 'Plumbing', icon: '💧', description: 'Leaks, clogs, pipes', avgRating: 4.8, providerCount: 234, basePrice: 400, isPopular: true, searchKeywords: ['plumbing', 'leak', 'pipe', 'faucet', 'drain', 'tubig', 'gripo'] },
    { id: 'electrical', parentCategory: 'repair', name: 'Electrical', icon: '⚡', description: 'Wiring, outlets, lights', avgRating: 4.7, providerCount: 189, basePrice: 500, isPopular: true, searchKeywords: ['electrical', 'wiring', 'outlet', 'switch', 'kuryente', 'ilaw'] },
    { id: 'aircon', parentCategory: 'repair', name: 'Aircon', icon: '❄️', description: 'Cleaning, repair, gas recharge', avgRating: 4.9, providerCount: 312, basePrice: 350, isPopular: true, searchKeywords: ['aircon', 'aircon repair', 'ac', 'aircon cleaning'] },
    { id: 'appliance', parentCategory: 'repair', name: 'Appliance', icon: '🔌', description: 'Fridge, washer, oven repair', avgRating: 4.6, providerCount: 145, basePrice: 450, isPopular: false, searchKeywords: ['appliance', 'refrigerator', 'washing machine', 'oven', 'ref'] },
    { id: 'carpentry', parentCategory: 'repair', name: 'Carpentry', icon: '🪵', description: 'Furniture, doors, cabinets', avgRating: 4.7, providerCount: 98, basePrice: 500, isPopular: false, searchKeywords: ['carpentry', 'carpenter', 'furniture', 'wood', 'door'] },
    { id: 'gadget_repair', parentCategory: 'repair', name: 'Gadget Repair', icon: '📱', description: 'Phone, laptop, screen repair', avgRating: 4.5, providerCount: 210, basePrice: 300, isPopular: false, searchKeywords: ['gadget', 'phone repair', 'laptop', 'screen', 'cellphone'] },
  ],
  cleaning: [
    { id: 'deep_clean', parentCategory: 'cleaning', name: 'Deep Cleaning', icon: '🧹', description: 'Full home deep clean', avgRating: 4.9, providerCount: 178, basePrice: 800, isPopular: true, searchKeywords: ['deep clean', 'house cleaning', 'general cleaning'] },
    { id: 'regular_clean', parentCategory: 'cleaning', name: 'Regular Cleaning', icon: '✨', description: 'Weekly or monthly maintenance', avgRating: 4.7, providerCount: 245, basePrice: 400, isPopular: true, searchKeywords: ['cleaning', 'regular', 'weekly', 'monthly'] },
    { id: 'aircon_clean', parentCategory: 'cleaning', name: 'Aircon Cleaning', icon: '❄️', description: 'Filter wash, coil clean', avgRating: 4.8, providerCount: 156, basePrice: 350, isPopular: true, searchKeywords: ['aircon cleaning', 'ac wash', 'aircon maintenance'] },
    { id: 'move_clean', parentCategory: 'cleaning', name: 'Move-in/Move-out', icon: '📦', description: 'Pre/post move cleaning', avgRating: 4.6, providerCount: 89, basePrice: 1200, isPopular: false, searchKeywords: ['move in', 'move out', 'post renovation'] },
  ],
  moving: [
    { id: 'residential_move', parentCategory: 'moving', name: 'Residential Moving', icon: '🏠', description: 'Full house relocation', avgRating: 4.7, providerCount: 132, basePrice: 2000, isPopular: true, searchKeywords: ['moving', 'lipat bahay', 'relocation', 'house move'] },
    { id: 'commercial_move', parentCategory: 'moving', name: 'Commercial Moving', icon: '🏢', description: 'Office and business moves', avgRating: 4.6, providerCount: 67, basePrice: 3500, isPopular: false, searchKeywords: ['office move', 'commercial', 'business relocation'] },
    { id: 'junk_removal', parentCategory: 'moving', name: 'Junk Removal', icon: '🗑️', description: 'Dispose old furniture, appliances', avgRating: 4.5, providerCount: 98, basePrice: 800, isPopular: false, searchKeywords: ['junk removal', 'disposal', 'old furniture', 'basura'] },
  ],
  painting: [
    { id: 'interior_paint', parentCategory: 'painting', name: 'Interior Painting', icon: '🖌️', description: 'Rooms, walls, ceilings', avgRating: 4.8, providerCount: 143, basePrice: 1500, isPopular: true, searchKeywords: ['painting', 'interior', 'wall', 'room paint'] },
    { id: 'exterior_paint', parentCategory: 'painting', name: 'Exterior Painting', icon: '🏗️', description: 'Facade, gates, fences', avgRating: 4.7, providerCount: 89, basePrice: 2000, isPopular: false, searchKeywords: ['exterior', 'facade', 'gate', 'fence painting'] },
  ],
  beauty: [
    { id: 'haircut', parentCategory: 'beauty', name: 'Haircut & Styling', icon: '✂️', description: 'Home service haircut', avgRating: 4.8, providerCount: 267, basePrice: 200, isPopular: true, searchKeywords: ['haircut', 'gupit', 'styling', 'blowout'] },
    { id: 'mani_pedi', parentCategory: 'beauty', name: 'Mani/Pedi', icon: '💅', description: 'Manicure and pedicure', avgRating: 4.9, providerCount: 312, basePrice: 250, isPopular: true, searchKeywords: ['manicure', 'pedicure', 'nails', 'kuko'] },
    { id: 'massage', parentCategory: 'beauty', name: 'Massage', icon: '💆', description: 'Relaxation, therapeutic massage', avgRating: 4.9, providerCount: 198, basePrice: 400, isPopular: true, searchKeywords: ['massage', 'hilot', 'therapy', 'relaxation'] },
  ],
  petCare: [
    { id: 'pet_grooming', parentCategory: 'petCare', name: 'Pet Grooming', icon: '🐾', description: 'Bath, trim, nail clipping', avgRating: 4.9, providerCount: 134, basePrice: 300, isPopular: true, searchKeywords: ['grooming', 'pet bath', 'dog grooming', 'cat grooming'] },
    { id: 'pet_sitting', parentCategory: 'petCare', name: 'Pet Sitting', icon: '🐶', description: 'Home visits and boarding', avgRating: 4.8, providerCount: 89, basePrice: 400, isPopular: false, searchKeywords: ['pet sitting', 'dog sitting', 'boarding'] },
  ],
  tech: [
    { id: 'pc_setup', parentCategory: 'tech', name: 'PC Setup & Repair', icon: '💻', description: 'Computer repair, setup, virus removal', avgRating: 4.7, providerCount: 167, basePrice: 400, isPopular: true, searchKeywords: ['computer', 'laptop', 'PC', 'virus', 'setup'] },
    { id: 'network_setup', parentCategory: 'tech', name: 'Network & WiFi', icon: '📡', description: 'Router setup, cable management', avgRating: 4.6, providerCount: 123, basePrice: 500, isPopular: false, searchKeywords: ['wifi', 'router', 'network', 'internet', 'cable'] },
    { id: 'cctv', parentCategory: 'tech', name: 'CCTV Installation', icon: '📷', description: 'Security camera setup', avgRating: 4.8, providerCount: 98, basePrice: 800, isPopular: false, searchKeywords: ['cctv', 'security camera', 'surveillance'] },
  ],
  professional: [
    { id: 'legal', parentCategory: 'professional', name: 'Legal Consultation', icon: '⚖️', description: 'IBP-accredited lawyers for pro bono and paid consultations. Family, labor, criminal, property, and more.', avgRating: 4.9, providerCount: 120, basePrice: 0, isPopular: true, searchKeywords: ['lawyer', 'legal', 'attorney', 'abogado', 'ibp', 'consultation', 'pro bono', 'libre', 'legal advice', 'family law', 'labor', 'criminal'] },
    { id: 'lawyer', parentCategory: 'professional', name: 'Lawyer', icon: '📋', description: 'Legal advice, contracts, representation', avgRating: 4.8, providerCount: 56, basePrice: 1500, isPopular: false, searchKeywords: ['lawyer', 'legal', 'attorney', 'abogado', 'contract', 'legal advice', 'litigation'] },
    { id: 'accountant', parentCategory: 'professional', name: 'Accountant', icon: '📊', description: 'Bookkeeping, tax filing, BIR compliance', avgRating: 4.7, providerCount: 89, basePrice: 1000, isPopular: true, searchKeywords: ['accountant', 'accounting', 'bookkeeping', 'tax', 'BIR', 'auditor', 'CPA'] },
    { id: 'financial_advisor', parentCategory: 'professional', name: 'Financial Advisor', icon: '💹', description: 'Investment planning, budgeting, insurance', avgRating: 4.6, providerCount: 43, basePrice: 1200, isPopular: false, searchKeywords: ['financial advisor', 'investment', 'insurance', 'budget', 'retirement', 'stocks', 'mutual fund'] },
    { id: 'nurse', parentCategory: 'professional', name: 'Home Nurse', icon: '🩺', description: 'Home care, wound dressing, monitoring', avgRating: 4.9, providerCount: 112, basePrice: 800, isPopular: true, searchKeywords: ['nurse', 'nars', 'home care', 'wound care', 'medical', 'caregiver', 'health monitoring'] },
  ],
};

/** Fetch subcategories for a category, falling back to static data */
export async function fetchSubcategories(category: string): Promise<ServiceSubcategory[]> {
  try {
    const snap = await db
      .collection('service_subcategories')
      .where('parentCategory', '==', category)
      .get();

    if (!snap.empty) {
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceSubcategory));
    }
  } catch (err) {
    console.warn('[serviceMarketplace] Firestore subcategories unavailable, using static data:', err);
  }
  return STATIC_SUBCATEGORIES[category] ?? [];
}

// ─── Providers ────────────────────────────────────────────────────────────────

export async function fetchProviders(
  subcategoryId: string,
  userLat: number,
  userLng: number,
  maxDistanceKm = 20
): Promise<MarketplaceProvider[]> {
  try {
    const snap = await db
      .collection('service_providers')
      .where('services', 'array-contains', subcategoryId)
      .where('status', '==', 'active')
      .limit(20)
      .get();

    const providers = snap.docs
      .map(doc => {
        const data = doc.data() as Omit<MarketplaceProvider, 'id'>;
        const distance = haversineDistance(
          userLat, userLng,
          data.location?.latitude ?? 0,
          data.location?.longitude ?? 0
        );
        return {
          id: doc.id,
          ...data,
          distance: Math.round(distance * 10) / 10,
          eta: estimateETA(distance),
        } as MarketplaceProvider;
      })
      .filter(p => p.distance <= maxDistanceKm)
      .sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99));

    return providers;
  } catch (err) {
    console.error('[serviceMarketplace] fetchProviders error:', err);
    throw err;
  }
}

export async function fetchProviderById(providerId: string): Promise<MarketplaceProvider | null> {
  try {
    const doc = await db.collection('service_providers').doc(providerId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as MarketplaceProvider;
  } catch (err) {
    console.error('[serviceMarketplace] fetchProviderById error:', err);
    throw err;
  }
}

export async function fetchProviderReviews(providerId: string): Promise<ServiceReview[]> {
  try {
    const snap = await db
      .collection('service_reviews')
      .where('providerId', '==', providerId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceReview));
  } catch (err) {
    console.error('[serviceMarketplace] fetchProviderReviews error:', err);
    return [];
  }
}

// ─── Service Requests ─────────────────────────────────────────────────────────

export async function createServiceRequest(params: {
  category: string;
  subcategory: string;
  description: string;
  photos: string[];
  urgency: ServiceUrgency;
  scheduledDate?: Date;
  location: { address: string; unit?: string; latitude: number; longitude: number };
}): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be logged in to create a service request');

  const now = Timestamp.now();
  const expiresAt = new Timestamp(now.seconds + 86400, 0); // expires in 24h

  const docRef = await db.collection('service_requests').add({
    userId: user.uid,
    category: params.category,
    subcategory: params.subcategory,
    description: params.description,
    photos: params.photos,
    urgency: params.urgency,
    scheduledDate: params.scheduledDate ? Timestamp.fromDate(params.scheduledDate) : null,
    location: params.location,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    expiresAt,
  });

  return docRef.id;
}

export async function fetchServiceRequest(requestId: string): Promise<ServiceRequest | null> {
  try {
    const doc = await db.collection('service_requests').doc(requestId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as ServiceRequest;
  } catch (err) {
    console.error('[serviceMarketplace] fetchServiceRequest error:', err);
    throw err;
  }
}

// ─── Service Bookings ─────────────────────────────────────────────────────────

export async function createServiceBooking(params: {
  requestId: string;
  provider: MarketplaceProvider;
  request: ServiceRequest;
  paymentMethod: 'cash' | 'gcash' | 'credit_card';
  specialInstructions?: string;
}): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be logged in to create a booking');

  const { requestId, provider, request, paymentMethod, specialInstructions } = params;
  const now = Timestamp.now();

  const baseRate = provider.baseRates?.[request.subcategory] ?? provider.baseRates?.default ?? 500;
  const urgentFee = request.urgency === 'now' ? URGENT_FEE : 0;
  const serviceFee = calcServiceFee(baseRate);
  const subtotal = baseRate + urgentFee + serviceFee;

  const docRef = await db.collection('service_bookings').add({
    requestId,
    userId: user.uid,
    providerId: provider.id,
    providerName: provider.name,
    providerAvatar: provider.avatar ?? null,
    service: {
      category: request.category,
      subcategory: request.subcategory,
      description: request.description,
      photos: request.photos,
    },
    schedule: {
      type: request.urgency === 'now' ? 'now' : 'scheduled',
      requestedDate: now,
    },
    location: {
      address: request.location.address,
      unit: request.location.unit ?? null,
      latitude: request.location.latitude,
      longitude: request.location.longitude,
      specialInstructions: specialInstructions ?? null,
    },
    pricing: {
      baseRate,
      urgentFee,
      serviceFee,
      subtotal,
      total: subtotal,
    },
    payment: {
      method: paymentMethod,
      status: 'pending',
    },
    status: 'pending_confirmation',
    timeline: [
      {
        timestamp: now,
        type: 'booking_created',
        message: 'Booking request sent to provider',
        actor: 'user',
      },
    ],
    createdAt: now,
    updatedAt: now,
  });

  // Mark the service request as matched
  await db.collection('service_requests').doc(requestId).update({
    status: 'matched',
    updatedAt: now,
  });

  return docRef.id;
}

export function subscribeToBooking(
  bookingId: string,
  callback: (booking: ServiceBooking) => void
): () => void {
  return db
    .collection('service_bookings')
    .doc(bookingId)
    .onSnapshot(
      (snap) => {
        if (snap.exists) {
          callback({ id: snap.id, ...snap.data() } as ServiceBooking);
        }
      },
      (err) => console.error('[serviceMarketplace] subscribeToBooking error:', err)
    );
}

export function subscribeToMyServiceBookings(
  callback: (bookings: ServiceBooking[]) => void
): () => void {
  const user = auth.currentUser;
  if (!user) return () => {};

  return db
    .collection('service_bookings')
    .where('userId', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snap) => {
        callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceBooking)));
      },
      (err) => console.error('[serviceMarketplace] subscribeToMyServiceBookings error:', err)
    );
}

export async function cancelServiceBooking(bookingId: string, reason: string): Promise<void> {
  const now = Timestamp.now();
  await db.collection('service_bookings').doc(bookingId).update({
    status: 'cancelled' as ServiceBookingStatus,
    cancellation: {
      cancelledBy: 'user',
      reason,
      cancelledAt: now,
    },
    timeline: FieldValue.arrayUnion({
      timestamp: now,
      type: 'booking_cancelled',
      message: `Booking cancelled by user: ${reason}`,
      actor: 'user',
    }),
    updatedAt: now,
  });
}

export async function approvePriceQuote(bookingId: string): Promise<void> {
  const now = Timestamp.now();
  await db.collection('service_bookings').doc(bookingId).update({
    'pricing.finalQuote.status': 'approved',
    status: 'price_approved' as ServiceBookingStatus,
    timeline: FieldValue.arrayUnion({
      timestamp: now,
      type: 'price_approved',
      message: 'Customer approved the final price quote',
      actor: 'user',
    }),
    updatedAt: now,
  });
}

export async function declinePriceQuote(bookingId: string): Promise<void> {
  const now = Timestamp.now();
  await db.collection('service_bookings').doc(bookingId).update({
    'pricing.finalQuote.status': 'declined',
    status: 'cancelled' as ServiceBookingStatus,
    cancellation: {
      cancelledBy: 'user',
      reason: 'Price quote declined',
      cancelledAt: now,
    },
    updatedAt: now,
  });
}

export async function confirmPayment(
  bookingId: string,
  method: 'cash' | 'gcash' | 'credit_card'
): Promise<void> {
  const now = Timestamp.now();
  await db.collection('service_bookings').doc(bookingId).update({
    'payment.method': method,
    'payment.status': 'completed',
    'payment.paidAt': now,
    status: 'completed' as ServiceBookingStatus,
    timeline: FieldValue.arrayUnion({
      timestamp: now,
      type: 'payment_received',
      message: 'Payment confirmed',
      actor: 'user',
    }),
    updatedAt: now,
  });
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function submitReview(params: {
  bookingId: string;
  providerId: string;
  rating: number;
  tags: string[];
  comment: string;
  photos: string[];
}): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be logged in to submit a review');

  const now = Timestamp.now();
  const { bookingId, providerId, rating, tags, comment, photos } = params;

  const batch = db.batch();

  // Create review document
  const reviewRef = db.collection('service_reviews').doc();
  batch.set(reviewRef, {
    bookingId,
    providerId,
    userId: user.uid,
    rating,
    tags,
    comment,
    photos,
    verified: true,
    createdAt: now,
  });

  // Update booking with review
  const bookingRef = db.collection('service_bookings').doc(bookingId);
  batch.update(bookingRef, {
    review: { rating, tags, comment, photos, submittedAt: now },
    updatedAt: now,
  });

  await batch.commit();
}

// ─── Provider Location (live tracking) ───────────────────────────────────────

export function subscribeToProviderLocation(
  providerId: string,
  callback: (location: ProviderLocation | null) => void
): () => void {
  return db
    .collection('provider_locations')
    .doc(providerId)
    .onSnapshot(
      (snap) => {
        if (snap.exists) {
          callback({ providerId, ...snap.data() } as ProviderLocation);
        } else {
          callback(null);
        }
      },
      (err) => console.error('[serviceMarketplace] subscribeToProviderLocation error:', err)
    );
}
