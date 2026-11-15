import { apiRequest } from './client';

// The choices for skills, languages and availability (/profile-options).
// They live on the backend, so the app and the web sign-up pages always offer the same list.

export type OptionGroup = { title: string; options: string[] };

export type ProfileOptions = {
  skillGroups: OptionGroup[];
  languageGroups: OptionGroup[];
  availabilityGroups: OptionGroup[];
};

export function getProfileOptions() {
  return apiRequest<ProfileOptions>('/profile-options');
}