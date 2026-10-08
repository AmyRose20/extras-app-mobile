import { apiRequest, API_URL } from './client';
import { ShootDaySummary, ShootDayDetail, Attendee } from '../types';

// Shoot days, attendance and payroll (/shoot-days) — coordinators only

export function getShootDays() {
  return apiRequest<ShootDaySummary[]>('/shoot-days');
}

export function getShootDay(shootDayId: string) {
  return apiRequest<ShootDayDetail>(`/shoot-days/${shootDayId}`);
}

// What a shoot day can be created or changed with (dates as ISO strings)
export type ShootDayChanges = {
  date?: string;
  estimatedWrapAt?: string | null;
  location?: string;
  locationAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
};

// The backend works out what actually changed and tells booked extras
export function updateShootDay(shootDayId: string, changes: ShootDayChanges) {
  return apiRequest<ShootDaySummary>(`/shoot-days/${shootDayId}`, { method: 'PATCH', body: changes });
}

// Several days at once (all or nothing)
export function createShootDays(shootDays: ShootDayChanges[]) {
  return apiRequest<any>('/shoot-days/bulk', { method: 'POST', body: { shootDays } });
}

// ----- Attendance -----

export function getAttendance(shootDayId: string) {
  return apiRequest<any>(`/shoot-days/${shootDayId}/attendance`);
}

export function updateAttendee(shootDayId: string, inviteId: string, changes: { noShow?: boolean; finishedAt?: string }) {
  return apiRequest<Attendee>(`/shoot-days/${shootDayId}/attendance/${inviteId}`, { method: 'PATCH', body: changes });
}

// Same finish time for everyone who turned up
export function setFinishTimeForAll(shootDayId: string, finishedAt: string) {
  return apiRequest<any>(`/shoot-days/${shootDayId}/finish-time`, { method: 'PATCH', body: { finishedAt } });
}

// The payroll file is downloaded straight to the phone (not as JSON), so the screen
// needs the full address rather than apiRequest
export function payrollUrl(shootDayId: string) {
  return `${API_URL}/shoot-days/${shootDayId}/payroll`;
}
