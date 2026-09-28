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
  | 'deletionRequests';

export type Role = 'ADMIN' | 'EXTRA';

// A production, e.g. "Wednesday season 3" (matches GET /productions)
export type Production = {
  id: string;
  name: string;
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
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';
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

// One row in the admin's pending-deletion-requests list (matches GET /deletion-requests)
export type DeletionRequestSummary = {
  id: string;
  name: string;
  email: string;
  deletionRequestedAt: string;
  deletionRequestedBy: 'EXTRA' | 'ADMIN';
  deletionReason: string | null;
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