// Thin fetch wrapper for the Laravel API (Sanctum cookie session). Errors carry the §2.4 JSON body.
export class ApiError extends Error {
  constructor(status, body) {
    super(body.message || 'Something went wrong on our side. Try again in a moment.');
    this.status = status;
    this.errors = body.errors || {};
  }
}

// Read fresh every call: Laravel rotates the token on login and logout.
const xsrf = () => {
  const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
};

const csrfCookie = () => fetch('/sanctum/csrf-cookie', { credentials: 'same-origin', headers: { Accept: 'application/json' } });

// guest: public routes run without the session middleware (F1), so there is no CSRF cookie to fetch.
export async function api(path, { method = 'GET', body, guest = false } = {}, retried = false) {
  const csrf = !guest && method !== 'GET' && method !== 'HEAD';
  if (csrf && !xsrf()) await csrfCookie();

  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = csrf && xsrf();
  if (token) headers['X-XSRF-TOKEN'] = token;

  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // 419 = stale CSRF token (tab left open past the session). Refresh it and try once more.
  if (res.status === 419 && csrf && !retried) {
    await csrfCookie();
    return api(path, { method, body }, true);
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

// This week's nights. Shared by Home, the event page and admin Events (which reads opens_at from it).
export const weekQuery = { queryKey: ['events'], queryFn: () => api('/api/events') };

// What to show for any thrown error: the server's own sentence, or a network hint when fetch itself failed.
export const errorText = (e) =>
  e instanceof ApiError ? e.message : "Can't reach the server. Check the connection, then try again.";
