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
  | 'extraProfileDetail';

export type Role = 'ADMIN' | 'EXTRA';

export type Invite = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
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