import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { api, ApiError } from './api.js';

const json = (status, body) => ({ status, ok: status < 400, json: async () => body });
let doc;

beforeEach(() => {
  doc = { cookie: '' };
  vi.stubGlobal('document', doc);
});
afterEach(() => vi.unstubAllGlobals());

test('fetches the CSRF cookie first when XSRF-TOKEN is missing, then sends it decoded', async () => {
  const fetch = vi.fn(async (url) => {
    if (url === '/sanctum/csrf-cookie') {
      doc.cookie = 'laravel_session=x; XSRF-TOKEN=abc%3D%3D';
      return { status: 204, ok: true };
    }
    return json(200, { id: 1 });
  });
  vi.stubGlobal('fetch', fetch);

  await api('/api/login', { method: 'POST', body: { email: 'a@b.c' } });

  expect(fetch.mock.calls.map((c) => c[0])).toEqual(['/sanctum/csrf-cookie', '/api/login']);
  const init = fetch.mock.calls[1][1];
  expect(init.headers['X-XSRF-TOKEN']).toBe('abc==');
  expect(init.headers.Accept).toBe('application/json');
  expect(init.credentials).toBe('same-origin');
  expect(init.body).toBe('{"email":"a@b.c"}');
});

test('reads the cookie again on every write and skips the CSRF call when it exists', async () => {
  const fetch = vi.fn(async () => json(200, {}));
  vi.stubGlobal('fetch', fetch);

  doc.cookie = 'XSRF-TOKEN=first';
  await api('/api/logout', { method: 'POST' });
  doc.cookie = 'XSRF-TOKEN=second';
  await api('/api/logout', { method: 'POST' });

  expect(fetch.mock.calls.map((c) => c[0])).toEqual(['/api/logout', '/api/logout']);
  expect(fetch.mock.calls.map((c) => c[1].headers['X-XSRF-TOKEN'])).toEqual(['first', 'second']);
});

test('GET neither fetches the CSRF cookie nor sends the header', async () => {
  const fetch = vi.fn(async () => json(200, { role: 'door' }));
  vi.stubGlobal('fetch', fetch);
  doc.cookie = 'XSRF-TOKEN=t';

  expect(await api('/api/me')).toEqual({ role: 'door' });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][1].headers['X-XSRF-TOKEN']).toBeUndefined();
});

test('throws status, message and errors from the error JSON', async () => {
  const body = { message: "That email and password don't match.", errors: { email: ["That email and password don't match."] } };
  vi.stubGlobal('fetch', vi.fn(async () => json(422, body)));
  doc.cookie = 'XSRF-TOKEN=t';

  const err = await api('/api/login', { method: 'POST', body: {} }).catch((e) => e);
  expect(err).toBeInstanceOf(ApiError);
  expect(err.status).toBe(422);
  expect(err.message).toBe(body.message);
  expect(err.errors).toEqual(body.errors);
});

test('on 419 refreshes the CSRF cookie and retries once, no more', async () => {
  const fetch = vi.fn(async (url) => (url === '/sanctum/csrf-cookie' ? { status: 204, ok: true } : json(419, { message: 'CSRF token mismatch.' })));
  vi.stubGlobal('fetch', fetch);
  doc.cookie = 'XSRF-TOKEN=stale';

  const err = await api('/api/login', { method: 'POST', body: {} }).catch((e) => e);
  expect(fetch.mock.calls.map((c) => c[0])).toEqual(['/api/login', '/sanctum/csrf-cookie', '/api/login']);
  expect(err.status).toBe(419);
});
