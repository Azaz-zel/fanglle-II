// Door scanner logic (S6, PRD Frontend 2.4). No React and no IndexedDB here, so Vitest runs all of it.
import { clock, dayLabel, nightMinutes } from './night.js';

const bytes = (b64url) => Uint8Array.from(atob(b64url.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

export const importKey = (jwk) => crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);

// F10: FNG2.{payload}.{sig}, sig raw r‖s over the payload string. The payload { p, e, k }, or null when the text
// isn't one of ours or was changed after signing.
export async function readQr(text, key) {
  const [prefix, payload, sig, extra] = String(text).trim().split('.');
  if (prefix !== 'FNG2' || !payload || !sig || extra !== undefined) return null;
  try {
    const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, bytes(sig), new TextEncoder().encode(payload));
    return ok ? JSON.parse(new TextDecoder().decode(bytes(payload))) : null;
  } catch {
    return null; // not base64url, or not JSON: not a Fanglle QR either way
  }
}

// F17, the same rule as EntryCode::normalize on the server.
export const normalizeCode = (typed) =>
  String(typed).replace(/[\s-]+/g, '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1');

// The manifest carries only this hash of the normalized code, never the code.
export async function codeHash(typed) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizeCode(typed)));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// The code field as the door types it: capitals, a hyphen after the fourth character.
export const typedCode = (v) => {
  const s = String(v).toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 8);
  return s.length > 4 ? `${s.slice(0, 4)}-${s.slice(4)}` : s;
};

// F17: ten wrong codes inside a minute lock the field for a minute. times: when the recent wrong codes were typed.
export function wrongCode(times, now) {
  const recent = [...times.filter((t) => now - t < 60_000), now];
  return recent.length >= 10 ? { times: [], lockedUntil: now + 60_000 } : { times: recent, lockedUntil: 0 };
}

// F2: the night a moment belongs to. Before 12:00 on the club's clock is still the night before.
export const nightOf = (ms, offset) => new Date(ms + offset * 60_000 - 12 * 3_600_000).toISOString().slice(0, 10);
export const shiftDate = (iso, days) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

// A basement with one bar answers late or never; after ms the call counts as no signal, like a failed fetch.
// Safe for check-ins too: a retry carries the same client_uuid (F12).
export const within = (promise, ms = 8000) =>
  Promise.race([promise, new Promise((_, no) => setTimeout(no, ms, new TypeError('No answer')))]);

// Check-ins from this device that the server hasn't counted yet, per pass.
export function pendingBy(queue) {
  const m = {};
  for (const c of queue) m[c.public_id] = (m[c.public_id] ?? 0) + c.count;
  return m;
}

// The result screen for one pass. item: its manifest row, or undefined for a genuinely signed QR made after the last
// sync (PRD 2.4 step 4: let it in and record it). inside: the row's count plus unsynced check-ins from this device.
// now: the club's wall clock, "HH:MM". Order: cancelled, used up, past the guestlist cutoff (F2), then welcome.
export function judge({ item, kind, publicId, inside, event, now }) {
  // A personal QR is one person by definition (F9); other unknown passes leave the count to the door.
  const guest = item
    ? { ...item, inside }
    : { public_id: publicId, kind, holder_name: null, people: kind === 'personal' ? 1 : null, inside, table_code: null, revoked: false };
  const name = guest.holder_name ?? 'This guest';
  const { people: n } = guest;

  if (guest.revoked) return { tone: 'bad', title: 'Cancelled', sub: `${name}'s QR was cancelled. Don't let them in.`, guest };
  if (n !== null && guest.inside >= n)
    return {
      tone: 'bad',
      title: 'Already used',
      sub: `${name}: ${n === 1 ? 'already' : `all ${n}`} checked in. This QR can't enter again.`,
      guest,
    };
  if (guest.kind !== 'table' && nightMinutes(now) >= nightMinutes(event.guestlist_cutoff)) {
    const at = clock(event.guestlist_cutoff);
    const who = guest.kind === 'group' && n ? `${name}, group of ${n}.` : `${name}.`;
    return { tone: 'warn', title: `Guestlist closed at ${at}`, sub: `${who} Free entry ended at ${at}.`, guest, override: true };
  }
  const title = guest.kind !== 'table' ? 'Welcome in' : guest.table_code ? `Table ${guest.table_code}` : 'Table booking';
  return { tone: 'ok', title, guest };
}

// A QR for another night. The manifest holds tonight only, so the night is named from the week's events when known.
export const wrongNight = (date, names) => ({
  tone: 'warn',
  title: 'Wrong night',
  sub: `This QR is for ${dayLabel(date)}${names[date] ? `, ${names[date]}` : ''}.`,
});

export const notOurs = {
  tone: 'bad',
  title: 'Not a Fanglle QR',
  sub: "This code isn't signed by us. It may be edited, or from another venue.",
};

// How many are still to come in. null people = a pass made after the last sync, so the door asks.
export const remainingOf = (g) => (g.people === null ? null : Math.max(0, g.people - g.inside));

// Handheld scanner (PRD 2.4): it types the whole QR and presses Enter within milliseconds. Keys more than 120 ms apart
// are a person typing, so the buffer starts over. result: the screen showing now, null when idle.
// act: scan | blocked (a new QR while a green result waits: refused, the waiting group is not let in) | letIn | close | count
export function keyAction(state, key, now, result) {
  const buf = now - state.at > 120 ? '' : state.buf;
  const ok = result?.tone === 'ok';
  if (key === 'Enter') {
    const next = { buf: '', at: 0 };
    if (buf.length >= 6) return { state: next, act: ok ? 'blocked' : 'scan', text: buf };
    return { state: next, act: ok ? 'letIn' : result ? 'close' : null };
  }
  if (key === 'Escape') return { state: { buf: '', at: 0 }, act: result ? 'close' : null };
  if (ok && buf === '' && /^[1-9]$/.test(key)) return { state: { buf: '', at: 0 }, act: 'count', n: Number(key) };
  if (key.length === 1) return { state: { buf: buf + key, at: now }, act: null };
  return { state: { buf, at: state.at }, act: null };
}

// One check-in for the queue. Its client_uuid is fixed here and sent unchanged on every retry (F12).
export const checkIn = (publicId, count, method, now = Date.now()) => ({
  client_uuid: crypto.randomUUID(),
  public_id: publicId,
  count,
  method,
  scanned_at: new Date(now).toISOString(),
});

// POST the oldest 200 waiting. A lone live check-in of a pass cancelled since the last sync comes back as a 409, not a result.
export async function sendQueue(queue, post) {
  const batch = queue.slice(0, 200);
  try {
    return (await post(batch)).results;
  } catch (e) {
    if (e.status === 409 && batch.length === 1) return [{ client_uuid: batch[0].client_uuid, error: 'revoked' }];
    throw e;
  }
}

// F12: what the server said about a batch. Every answered check-in leaves the queue; inside_count only grows, so a
// manifest read that started before this answer can't pull it back. revoked: passes cancelled since the last sync.
export function applyResults(passes, queue, results) {
  const next = { ...passes };
  const revoked = [];
  for (const r of results) {
    const c = queue.find((q) => q.client_uuid === r.client_uuid);
    const p = c && next[c.public_id];
    if (!p) continue;
    if (r.error === 'revoked') {
      next[c.public_id] = { ...p, revoked: true };
      revoked.push(next[c.public_id]);
    } else if (r.inside_count !== undefined) next[c.public_id] = { ...p, inside_count: Math.max(p.inside_count, r.inside_count) };
  }
  const answered = new Set(results.map((r) => r.client_uuid));
  return { passes: next, queue: queue.filter((q) => !answered.has(q.client_uuid)), revoked };
}

// A manifest delta on top of what the device holds, with the same only-grows rule.
export function mergePasses(passes, rows) {
  const m = { ...passes };
  for (const p of rows) m[p.public_id] = { ...p, inside_count: Math.max(m[p.public_id]?.inside_count ?? 0, p.inside_count) };
  return m;
}

// Header numbers, as the admin overview counts them: everyone inside, guestlist arrived of signed up, tables arrived
// of tables booked. A cancelled pass stays in "inside" (they are in the building) but out of both lists.
export function tally(passes, pending) {
  const t = { inside: 0, gl: 0, glOf: 0, tb: 0, tbOf: 0 };
  for (const p of Object.values(passes)) {
    const inside = p.inside_count + (pending[p.public_id] ?? 0);
    t.inside += inside;
    if (p.revoked) continue;
    if (p.kind === 'table') {
      t.tbOf += 1;
      if (inside > 0) t.tb += 1;
    } else {
      t.glOf += p.people;
      t.gl += inside;
    }
  }
  return t;
}

// The second line under a name, in the search list and on the result screen. The manifest has no organiser, so a
// personal QR can't say "Guest of …" as the mockup does; it says what it is instead.
export const kindLabel = (p) =>
  p.kind === 'table' ? `Table ${p.table_code}` : p.kind === 'personal' ? 'Guestlist · personal' : `Group of ${p.people}`;

export function guestLine(g) {
  if (g.holder_name === null) return 'Signed up after this device last synced. The QR is genuine.';
  if (g.kind === 'personal') return kindLabel(g);
  return `${g.kind === 'table' ? `Table for ${g.people}` : `Group of ${g.people}`} · ${g.inside} already in`;
}

// The sync bar under the header. savedAt: when tonight's list last came from the server, "HH:MM".
export function syncLine({ online, trouble, waiting, savedAt }) {
  const n = `${waiting} check-in${waiting === 1 ? '' : 's'}`;
  if (!online) return `Offline. Tonight's list saved at ${savedAt}. ${n} waiting to sync.`;
  if (trouble) return `${n} waiting to sync. ${trouble}`;
  return waiting ? 'Back online. Syncing check-ins...' : 'Online. All check-ins synced.';
}

// Tonight's list for "Search by name or last 4 digits of phone", two characters at least.
export function search(passes, query) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return Object.values(passes)
    .filter((p) => p.holder_name.toLowerCase().includes(q) || p.phone_last4?.includes(q))
    .sort((a, b) => a.holder_name.localeCompare(b.holder_name))
    .slice(0, 20);
}

export const HOW = { scan: 'Scan', code: 'Code', search: 'Search', override: 'Manager override' };
