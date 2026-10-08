import { apiRequest } from './client';
import { Invite, Tally } from '../types';

// Call invites (/invites)

export type InviteAnswer = 'ACCEPTED' | 'DECLINED' | 'CANCELLED';

export function getMyInvites() {
  return apiRequest<Invite[]>('/invites/me');
}

export function respondToInvite(inviteId: string, status: InviteAnswer) {
  return apiRequest<Invite>(`/invites/${inviteId}`, { method: 'PATCH', body: { status } });
}

// Worked / declined / cancelled / no-show totals
export function getMyTally() {
  return apiRequest<Tally>('/invites/tally/me');
}

// Coordinators: one extra's tally on my production
export function getExtraTally(extraProfileId: string) {
  return apiRequest<Tally>(`/invites/tally/${extraProfileId}`);
}