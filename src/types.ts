// Shared type definitions used across multiple screens.

export type Screen =
  | 'login'
  | 'home'
  | 'profile'
  | 'invites'
  | 'createShootDay'
  | 'createCallRequest'
  | 'callRequestStatus';

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