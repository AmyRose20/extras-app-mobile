// Shared type definitions used across multiple screens.

export type Screen =
  | 'login'
  | 'home'
  | 'profile'
  | 'invites'
  | 'createShootDay'
  | 'createCallRequest'
  | 'callRequestStatus'
  | 'extrasList'
  | 'extraProfileDetail'
  | 'shootDaysList'
  | 'shootDayDetail'
  | 'inviteList'
  | 'bulkCreateShootDays'
  | 'calendar';

export type Role = 'ADMIN' | 'EXTRA';

export type Invite = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';
  isExpired: boolean;
  callRequest: {
    description: string;
    shootDay: {
      productionName: string;
      location: string;
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
  productionName: string;
  date: string;
  location: string;
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
};