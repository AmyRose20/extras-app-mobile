import { apiRequest } from './client';
import { Location } from '../types';

// Saved meeting points (/locations) and Google Maps lookups done by the backend (/places, /geocode)

export function getLocations() {
  return apiRequest<Location[]>('/locations');
}

export function saveLocation(location: Omit<Location, 'id'>) {
  return apiRequest<Location>('/locations', { method: 'POST', body: location });
}

// Place suggestions while typing. sessionToken groups the typing + the final pick into one
// Google "session" (cheaper).
export function getPlaceSuggestions(input: string, sessionToken: string) {
  return apiRequest<{ suggestions: any[] }>(
    `/places/autocomplete?input=${encodeURIComponent(input)}&sessionToken=${sessionToken}`
  );
}

export function getPlaceDetails(placeId: string, sessionToken: string) {
  return apiRequest<any>(`/places/details/${encodeURIComponent(placeId)}?sessionToken=${sessionToken}`);
}

// A map pin → an address
export function getAddressForPin(latitude: number, longitude: number) {
  return apiRequest<any>(`/geocode/reverse?lat=${latitude}&lng=${longitude}`);
}