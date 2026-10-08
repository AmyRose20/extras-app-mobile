import { apiRequest } from './client';
import { DeletionRequestSummary, ProductionRequestSummary } from '../types';

// Account deletion requests (/deletion-requests) and production join requests (/production-requests)

// ----- Extras: their own account -----

export function requestMyDeletion() {
  return apiRequest<{ deletionRequestStatus: string }>('/deletion-requests/me', { method: 'POST', body: {} });
}

export function cancelMyDeletion() {
  return apiRequest<{ deletionRequestStatus: string }>('/deletion-requests/me', { method: 'DELETE' });
}

// ----- Coordinators -----

export function requestDeletionForExtra(userId: string) {
  return apiRequest<any>(`/deletion-requests/${userId}`, { method: 'POST', body: {} });
}

export function getDeletionRequests() {
  return apiRequest<DeletionRequestSummary[]>('/deletion-requests');
}

export function reviewDeletionRequest(userId: string, action: 'approve' | 'deny') {
  return apiRequest<any>(`/deletion-requests/${userId}/${action}`, { method: 'PATCH' });
}

export function getProductionRequests() {
  return apiRequest<ProductionRequestSummary[]>('/production-requests');
}

export function reviewProductionRequest(requestId: string, action: 'approve' | 'deny') {
  return apiRequest<{ id: string; status: string }>(`/production-requests/${requestId}/${action}`, { method: 'PATCH' });
}