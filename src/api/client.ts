// One place for talking to the backend (Phase 3 Part 12a).
// Every request goes through apiRequest(), which:
//   - adds the backend's address and the login token
//   - sends the body as JSON and reads the reply as JSON
//   - throws an ApiError with the backend's message if something went wrong
//   - tells the app to log out if the password was changed on another phone

// 10.0.2.2 is how the Android emulator reaches "localhost" on your computer
export const API_URL = 'http://10.0.2.2:4000';

// ---------- The login token ----------
// Kept here (set at login, cleared at logout), so API calls don't need it passed in every time.

let authToken = '';

export function setAuthToken(token: string) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

// ---------- "Your password was changed" ----------
// App.tsx gives us a function to run when the backend says this phone's login is out of date.

let onPasswordChanged: (() => void) | null = null;

export function setPasswordChangedHandler(handler: (() => void) | null) {
  onPasswordChanged = handler;
}

// ---------- Errors ----------

// An error from the backend. message = the backend's own error text, ready to show on screen.
export class ApiError extends Error {
  status: number; // e.g. 400, 404; 0 = the backend couldn't be reached at all
  data: any;      // the whole reply, for the few screens that need more (e.g. data.field)

  constructor(message: string, status: number, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// The message to show for any error: the backend's message, or a general one
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return error instanceof ApiError ? error.message : fallback;
}

// ---------- The request itself ----------

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;  // sent as JSON
  auth?: boolean;  // false for calls made before logging in (login, forgot password)
};

// Sends one request and returns the reply's data.
//   apiRequest('/invites/me')                                       → GET
//   apiRequest('/invites/123', { method: 'PATCH', body: { status: 'ACCEPTED' } })
// <T> lets each caller say what shape of data comes back, e.g. apiRequest<Invite[]>(...)
export async function apiRequest<T = any>(
  path: string,
  { method = 'GET', body, auth = true }: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && authToken) headers.Authorization = `Bearer ${authToken}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    throw new ApiError("Couldn't reach the server. Is the backend running?", 0);
  }

  // Read the reply. Some replies have no body at all, so don't assume there's JSON.
  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    // Logged in on a phone whose login is now out of date (password changed elsewhere)
    if (response.status === 401 && data?.code === 'PASSWORD_CHANGED' && onPasswordChanged) {
      onPasswordChanged();
    }
    throw new ApiError(data?.error || `Something went wrong (error ${response.status}).`, response.status, data);
  }

  return data as T;
}