import { apiRequest } from './client';

// Call requests (/call-requests) — coordinators only

export type NewCallRequest = {
  shootDayId: string;
  description: string;
  quantityNeeded: number;
  criteria: Record<string, unknown>; // e.g. { minAge, maxAge, gender, skills }
};

// Creates it and invites every matching extra (push or email)
export function createCallRequest(callRequest: NewCallRequest) {
  return apiRequest<{ callRequest: any; matchedCount: number; warning?: string }>('/call-requests', {
    method: 'POST',
    body: callRequest,
  });
}

// The call request with every invite + the accepted/declined/... tally
export function getCallRequest(callRequestId: string) {
  return apiRequest<any>(`/call-requests/${callRequestId}`);
}

export function updateCallRequest(callRequestId: string, changes: { description?: string; quantityNeeded?: number }) {
  return apiRequest<any>(`/call-requests/${callRequestId}`, { method: 'PATCH', body: changes });
}

// Copies it to other upcoming shoot days (matching + invites run for each)
export function copyCallRequest(callRequestId: string, shootDayIds: string[]) {
  return apiRequest<any>(`/call-requests/${callRequestId}/copy`, { method: 'POST', body: { shootDayIds } });
}