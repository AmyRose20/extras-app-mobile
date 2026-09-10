// Shared date helpers so every screen that deals with a shoot day's
// date/time uses the same DD-MM-YYYY / HH:MM format and conversions.

// Converts a "DD-MM-YYYY" string to a Date (local midnight).
// Returns null if the string doesn't match that format, or isn't a real date
// (e.g. guards against JS silently rolling 31-02-2026 over into March).
export function parseDDMMYYYY(value: string): Date | null {
  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  const date = new Date(year, month - 1, day);

  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return null;
  }

  return date;
}

// Formats a Date (or ISO date string) as "DD-MM-YYYY".
export function formatToDDMMYYYY(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Formats a Date (or ISO date string) as "HH:MM" (24-hour).
export function formatToHHMM(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Combines a "DD-MM-YYYY" date string and "HH:MM" time string into one Date.
// Returns null if either part is invalid.
export function combineDateAndTime(dateStr: string, timeStr: string): Date | null {
  const date = parseDDMMYYYY(dateStr);
  if (!date) return null;

  const match = timeStr.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours > 23 || minutes > 59) return null;

  date.setHours(hours, minutes, 0, 0);
  return date;
}