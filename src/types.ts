// Shared type definitions used across multiple screens.

export type Screen =
  | 'login'
  | 'home'
  | 'profile'
  | 'invites'
  | 'createCallRequest'
  | 'callRequestStatus'
  | 'extrasList'
  | 'extraProfileDetail'
  | 'shootDaysList'
  | 'shootDayDetail'
  | 'inviteList'
  | 'bulkCreateShootDays'
  | 'deletionRequests'
  | 'productionRequests'
  | 'attendance'
  | 'forgotPassword'
  | 'changePassword';

export type Role = 'ADMIN' | 'EXTRA';

// A production, e.g. "Wednesday season 3" (matches GET /productions)
export type Production = {
  id: string;
  name: string;
};

// A production the extra has asked to join, waiting for the coordinator
export type PendingProduction = Production & {
  requestedAt: string;
};

// A production the extra wasn't approved for, and when they can ask again
export type DeniedProduction = Production & {
  canRequestAgainAt: string;
};

// A saved meeting point for the coordinator's production (matches GET /locations)
export type Location = {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export type Invite = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED' | 'NO_SHOW';
  isExpired: boolean;
  callRequest: {
    description: string;
    shootDay: {
      production: Production;
      location: string;
      locationAddress: string | null;
      latitude: number | null;
      longitude: number | null;
      estimatedWrapAt: string | null;
      date: string;
    };
  };
};

export type Tally = {
  worked: number;
  declined: number;
  cancelled: number;
  threeStrikes: boolean;
  noShows: number;
};


// One extra on the Attendance screen (matches GET /shoot-days/:id/attendance)
export type Attendee = {
  inviteId: string;
  extraProfileId: string;
  name: string;
  callRequest: string; // which call request they were booked for
  noShow: boolean;
  finishedAt: string | null; // their finish time, or the estimated wrap if none set
  finishTimeIsEstimate: boolean; // true = nobody has set it yet, it's the estimated wrap
};

// One row in the admin's shoot days list (matches GET /shoot-days)
export type ShootDaySummary = {
  id: string;
  production: Production;
  date: string;
  location: string;
  locationAddress: string | null;
  estimatedWrapAt: string | null;
  latitude: number | null;
  longitude: number | null;
  isPast: boolean;
};

// One call request nested inside a shoot day's detail view
export type CallRequestSummary = {
  id: string;
  description: string;
  quantityNeeded: number;
  criteria: Record<string, unknown>;
  createdAt: string;
};

// A single shoot day plus its call requests (matches GET /shoot-days/:id)
export type ShootDayDetail = ShootDaySummary & {
  callRequests: CallRequestSummary[];
};

// One row in the admin's extras list (matches GET /profiles)
export type ExtraSummary = {
  id: string;
  name: string;
  skills: string[];
  availability: string[];
};

// A single extra's full profile, as an admin sees it (matches GET /profiles/:id)
export type ExtraProfileDetail = {
  id: string;
  userId: string;
  name: string;
  age: number | null;
  dateOfBirth: string | null; // e.g. "1997-03-14T00:00:00.000Z"; age above is worked out from this
  hasSmartphone: boolean;
  hasBankDetails: boolean; // the details themselves come from a separate "Show bank details" request
  gender: string | null;
  heightCm: number | null;
  skills: string[];
  languages: string[];
  phoneNumber: string | null;
  contactEmail: string | null;
  availability: string[];
  facePhotoUrl: string | null;
  fullBodyPhotoUrl: string | null;
  deletionRequestStatus: string;
  productions: Production[];
};

// Full bank details, only returned when a coordinator taps "Show bank details"
// (matches GET /profiles/:id/bank-details)
export type BankDetails = {
  iban: string; // e.g. "IE29 AIBK 9311 5212 3456 78"
  bic: string;
  accountHolderName: string; // name on the bank account (falls back to their app name)
};

// What an extra sees of their own bank details (never the full IBAN)
export type MaskedBankDetails = {
  ibanMasked: string; // e.g. "IE•• •••• •••• 5678"
  bic: string;
  accountHolderName: string | null; // null for older bank details saved before this field existed
};

// One row in the admin's pending-deletion-requests list (matches GET /deletion-requests)
export type DeletionRequestSummary = {
  id: string;
  name: string;
  email: string;
  deletionRequestedAt: string;
  deletionRequestedBy: 'EXTRA' | 'ADMIN';
  deletionReason: string | null;
};


// An extra asking to join the coordinator's production (matches GET /production-requests)
export type ProductionRequestSummary = {
  id: string; // the request id, used to approve/deny
  requestedAt: string;
  extraProfileId: string;
  name: string;
  age: number | null;
  gender: string | null;
  heightCm: number | null;
  skills: string[];
  languages: string[];
  facePhotoUrl: string | null;
  fullBodyPhotoUrl: string | null;
  currentProductions: string[]; // productions they're already approved on
};

// What the app-wide confirmation dialog should show
export type DialogConfig = {
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
  cancelText?: string;
  destructive?: boolean;
};