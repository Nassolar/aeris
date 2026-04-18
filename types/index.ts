/**
 * AERIS Type Definitions
 * Centralized type system for the entire application
 */

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string; // Ionicons name
  color: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  role: string;
  rating: number;
  distance: number; // in km
  price: number; // hourly rate
  imageUrl: string; // URL or local asset
  isOnline: boolean;
  latitude: number;
  longitude: number;
}

export interface User {
  id: string;
  phoneNumber: string;
  displayName?: string;
  photoURL?: string;
  email?: string;
  createdAt: Date;
}

export interface Booking {
  id: string;
  userId: string;
  providerId: string;
  serviceId: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  scheduledDate: Date;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  totalPrice: number;
  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
  read: boolean;
}

// ─── City / LGU Types ────────────────────────────────────────────────────────

export type KycStatus = 'verified' | 'pending' | 'manual_review' | 'processing' | 'none';

export interface LguScope {
  psgcCode: string;
  lguName: string;
  barangay: string;
  enrolledAt: { seconds: number; nanoseconds: number };
  kycStatus: KycStatus;
}

export interface LguScopes {
  primary: LguScope;
  secondary: LguScope[];
}

export interface KycData {
  status: KycStatus;
  idType: string;
  nameExtracted: string;
  idNumberHash: string;
  verifiedAt: { seconds: number; nanoseconds: number };
  householdData: {
    dependents: number;
    hasSenior: boolean;
    hasPwd: boolean;
    pwdType?: string;
    homeAddress?: string;
  };
}

export type BillType = 'rpt' | 'business_permit' | 'ctc' | 'misc';
export type BillStatus = 'unpaid' | 'paid' | 'overdue' | 'partial';

export interface Bill {
  id: string;
  citizenUid: string;
  lguPsgcCode: string;
  billType: BillType;
  description: string;
  propertyRef: string | null;
  principal: number;
  penalties: number;
  totalAmount: number;
  dueDate: { seconds: number; nanoseconds: number };
  taxYear: number | null;
  status: BillStatus;
  paidAt: { seconds: number; nanoseconds: number } | null;
  paidAmount: number | null;
  referenceNumber: string | null;
  receiptNumber: string | null;
  receiptUrl: string | null;
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
}

export type WelfareProgramStatus = 'pending_delivery' | 'confirmed' | 'expired';

export interface WelfareProgram {
  id: string;
  citizenUid: string;
  lguPsgcCode: string;
  programName: string;
  period: string;
  deliveryCode: string;
  status: WelfareProgramStatus;
  deliveredAt?: { seconds: number; nanoseconds: number };
  expiresAt: { seconds: number; nanoseconds: number };
  createdAt: { seconds: number; nanoseconds: number };
}

export type AnnouncementPriority = 'normal' | 'urgent';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  source: string;
  psgcCode: string | null;
  publishedAt: { seconds: number; nanoseconds: number };
  expiresAt: { seconds: number; nanoseconds: number } | null;
  readBy: string[];
  priority: AnnouncementPriority;
}

export interface ImpactRates {
  roadResurfacingPerPeso: number;
  scholarAllowancePerPeso: number;
  seniorCashGiftPerPeso: number;
}

export interface DostAlert {
  id: string;
  psgcCode: string;
  barangay: string;
  alertType: string;
  title: string;
  body: string;
  isActive: boolean;
  publishedAt: { seconds: number; nanoseconds: number };
  expiresAt: { seconds: number; nanoseconds: number } | null;
  evacuationCenters?: { name: string; address: string }[];
  hotlines?: { label: string; number: string }[];
}

// ─── LGU Services Types ──────────────────────────────────────────────────────

export type LguServiceRequestStatus =
  | 'pending'
  | 'under_review'
  | 'appointment_scheduled'
  | 'docs_requested'
  | 'approved'
  | 'rejected'
  | 'issued';

export interface LguServiceTemplate {
  templateKey: string;
  name: string;
  description: string;
  office: string;
  category: string;
  icon: string; // Ionicons name
  feeAmount: number | null;
  feeLabel: string;
  processingDays: number;
  requiresKyc: boolean;
  situationGroups: string[];
}

export interface LguServiceRequest {
  id: string;
  citizenUid: string;
  templateKey: string;
  serviceName: string;
  office: string;
  referenceNumber: string;
  status: LguServiceRequestStatus;
  formData: Record<string, string | string[]>;
  feeAmount: number | null;
  submittedAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
  processedAt?: { seconds: number; nanoseconds: number } | null;
  rejectionReason?: string | null;
  outputPdfUrl?: string | null;
  certNumber?: string | null;
  lguPsgcCode: string;
}

export interface LguServiceStatusEvent {
  status: LguServiceRequestStatus;
  label: string;
  timestamp?: { seconds: number; nanoseconds: number } | null;
  note?: string;
}
