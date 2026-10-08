import { apiRequest } from './client';
import { SignupInvite } from '../types';

// Sign-up invite links coordinators email to new extras (/signup-invites)

export function getSignupInvites() {
  return apiRequest<SignupInvite[]>('/signup-invites');
}

// If the email already has an account, the production is added straight away instead
export function sendSignupInvite(email: string) {
  return apiRequest<{ message: string; invite: SignupInvite }>('/signup-invites', { method: 'POST', body: { email } });
}