import { apiRequest } from './client';
import { Production, PendingProduction, DeniedProduction, ExtraSummary, ExtraProfileDetail, BankDetails } from '../types';

// Extra profiles (/profiles) and the list of productions (/productions)

// ----- An extra's own profile -----

export function getMyProfile() {
  return apiRequest<any>('/profiles/me'); // a big object; App.tsx picks out the fields it needs
}

export function updateMyProfile(changes: Record<string, unknown>) {
  return apiRequest<any>('/profiles/me', { method: 'PATCH', body: changes });
}

export type MyProductions = {
  productions: Production[];
  pendingProductions: PendingProduction[];
  deniedProductions: DeniedProduction[];
};

// New productions become join requests; unticked ones are left
export function updateMyProductions(productionIds: string[]) {
  return apiRequest<MyProductions>('/profiles/me/productions', { method: 'PATCH', body: { productionIds } });
}

// Saves this phone's push notification token
export function saveFcmToken(fcmToken: string) {
  return apiRequest<{ success: boolean }>('/profiles/me/fcm-token', { method: 'PATCH', body: { fcmToken } });
}

export function getProductions() {
  return apiRequest<Production[]>('/productions');
}

// ----- Coordinators -----

export type ExtrasFilters = {
  skills?: string[];
  gender?: string;
  availability?: string[];
  minAge?: string;
  maxAge?: string;
  name?: string;
};

// The extras on my production, sorted A–Z, narrowed by any filters given
export function getExtras(filters: ExtrasFilters = {}) {
  const params = new URLSearchParams();
  if (filters.skills && filters.skills.length > 0) params.append('skill', filters.skills.join(','));
  if (filters.gender) params.append('gender', filters.gender);
  if (filters.availability && filters.availability.length > 0) params.append('availability', filters.availability.join(','));
  if (filters.minAge) params.append('minAge', filters.minAge);
  if (filters.maxAge) params.append('maxAge', filters.maxAge);
  if (filters.name && filters.name.trim()) params.append('name', filters.name.trim());
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<ExtraSummary[]>(`/profiles${query}`);
}

export function getExtraProfile(extraProfileId: string) {
  return apiRequest<ExtraProfileDetail>(`/profiles/${extraProfileId}`);
}

// Full IBAN/BIC (access is logged on the server)
export function getBankDetails(extraProfileId: string) {
  return apiRequest<BankDetails>(`/profiles/${extraProfileId}/bank-details`);
}

export function removeExtraFromMyProduction(extraProfileId: string) {
  return apiRequest<{ message: string }>(`/profiles/${extraProfileId}/production`, { method: 'DELETE' });
}