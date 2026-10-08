import { apiRequest } from './client';
import { Role } from '../types';

// Logging in, and forgot / change password (/auth)

export type LoginResult = {
  token: string;
  firebaseToken: string; // signs in to Firebase too, so photo uploads are allowed
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    production: { id: string; name: string } | null; // coordinators only
  };
};

export function login(email: string, password: string) {
  return apiRequest<LoginResult>('/auth/login', { method: 'POST', body: { email, password }, auth: false });
}

// Emails a 6-digit code (same reply whether or not the account exists)
export function requestPasswordReset(email: string) {
  return apiRequest<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email }, auth: false });
}

export function resetPassword(email: string, code: string, newPassword: string) {
  return apiRequest<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: { email, code, newPassword },
    auth: false,
  });
}

// Returns a fresh login token for this phone (other phones are logged out)
export function changePassword(currentPassword: string, newPassword: string) {
  return apiRequest<{ token: string; message?: string }>('/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  });
}