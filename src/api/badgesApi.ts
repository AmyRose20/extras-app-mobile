import { apiRequest } from './client';

// The red notification badges (/badges)

export type BadgeType = 'invites' | 'deletionRequests' | 'productionRequests';
export type BadgeCounts = Record<BadgeType, number>;

export function getBadgeCounts() {
  return apiRequest<Partial<BadgeCounts>>('/badges');
}

// Opening a screen resets its badge
export function markBadgeSeen(type: BadgeType) {
  return apiRequest<any>(`/badges/seen/${type}`, { method: 'PATCH' });
}