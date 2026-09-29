// Manager's night (S7), from fanglle-pengelola-mockup.jsx: Overview, Table bookings, Guestlist, Door log. No React here.
import { clock, dayParts, earliest, headliners, hhmm, nightMinutes } from './night.js';

// API status -> [label, badge tone]. "arrived" is a paid table with someone inside; no_show is the mockup's released look.
export const STATUS = {
  held: ['Held, unpaid', 'held'],
  paid: ['Paid, not arrived', 'paid'],
  arrived: ['Arrived', 'in'],
  released: ['Released', 'off'],
  no_show: ['No-show', 'off'],
};

export const HOW = { scan: 'Scan', code: 'Typed code', search: 'Search by name', override: 'Manager override' };

// Whole minutes until an ISO moment, rounded up; 0 once it has passed.
export const minsLeft = (iso, now = Date.now()) => Math.max(0, Math.ceil((Date.parse(iso) - now) / 60_000));

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// The night's marks on the overview, in night order (F2): doors, guestlist cutoff, first headliner, close. A cutoff can
// fall after the headliner. now: the club's clock, "HH:MM".
export function timeline(e, now) {
  const head = earliest(headliners(e.lineup).map((s) => s.starts_at));
  const past = (t) => nightMinutes(t) <= nightMinutes(now);
  const marks = [
    [e.opens_at, 'Doors'],
    [e.guestlist_cutoff, past(e.guestlist_cutoff) ? 'Guestlist closed' : 'Guestlist closes'],
    ...(head ? [[head, 'Headliner']] : []),
    [e.close_time, 'Close'],
  ].sort((a, b) => nightMinutes(a[0]) - nightMinutes(b[0]));
  const next = marks.findIndex(([t]) => !past(t));
  return marks.map(([time, label], i) => {
    const wait = nightMinutes(time) - nightMinutes(now);
    if (past(time)) return { time, label, state: 'done' };
    if (i === next) return { time, label: wait < 60 ? `${label}, in ${wait} min` : label, state: 'next' };
    return { time, label, state: '' };
  });
}

// "When did people arrive?" The bar that starts selected: the hour now, else the last one anyone came in.
export function pickHour(arrivals, now) {
  const i = arrivals.findIndex((h) => h.hour === `${now.slice(0, 2)}:00`);
  if (i !== -1) return i;
  const last = arrivals.findLastIndex((h) => h.total > 0);
  return last === -1 ? 0 : last;
}

export function readout(h, now) {
  if (nightMinutes(h.hour) > nightMinutes(now)) return `${h.hour} hasn't happened yet.`;
  if (!h.total) return `${h.hour} to the next hour: nobody arrived.`;
  return `${h.hour} to the next hour: ${h.total} arrived. ${h.guestlist} from the guestlist, ${h.tables} from tables.`;
}

// "Needs you": nights this week nearly out of guestlist places, paid tables not here yet, overrides tonight.
// t: GET /admin/tonight. events: GET /admin/events. now: the club's clock.
export function attention(t, events, now) {
  const out = [];
  const date = t.event.date;
  for (const e of events.filter((x) => x.date >= date).slice(0, 7)) {
    if (e.signed < e.guestlist_quota * 0.9) continue;
    const who = e.date === date ? "Tonight's" : dayParts(e.date).weekday;
    out.push({
      key: `gl-${e.date}`,
      title: `${who} guestlist ${e.signed >= e.guestlist_quota ? 'is full' : 'almost full'}`,
      sub: `${e.signed} of ${e.guestlist_quota} places taken`,
      action: 'Add places',
      to: ['/admin/events', { state: { date: e.date } }],
    });
  }
  if (t.tables.to_arrive > 0) {
    const head = earliest(headliners(t.event.lineup).map((s) => s.starts_at));
    const started = head && nightMinutes(now) >= nightMinutes(head);
    out.push({
      key: 'tables',
      title: `${plural(t.tables.to_arrive, 'paid table')} not here yet`,
      sub: head ? `Headliner ${started ? 'started' : 'starts'} at ${clock(head)}` : '',
      action: 'Show tables',
      to: ['/admin/tables?status=paid'],
    });
  }
  const o = t.overrides;
  if (o.count > 0)
    out.push({
      key: 'overrides',
      title: `${plural(o.count, 'manager override')} tonight`,
      sub: `${o.latest.holder_name}, ${plural(o.latest.count, 'person', 'people')} at ${hhmm(o.latest.scanned_at)}`,
      action: 'Open door log',
      to: ['/admin/door?overrides=1'],
      flag: true,
    });
  return out;
}

// "What happened" in the booking panel, from the fields the list already carries.
export function bookingLog(b) {
  const log = [`${hhmm(b.created_at)} Held ${b.table_code}`];
  if (b.paid_at) log.push(`${hhmm(b.paid_at)} Deposit paid`);
  let n = 0;
  for (const c of [...b.check_ins].sort((x, y) => x.scanned_at.localeCompare(y.scanned_at))) {
    n += c.count;
    log.push(`${hhmm(c.scanned_at)} ${n} of ${b.party_size} arrived${c.method === 'override' ? ', manager override' : ''}`);
  }
  if (b.status === 'released') log.push(`${hhmm(b.updated_at)} Released, not paid`);
  if (b.status === 'no_show') log.push(`${hhmm(b.updated_at)} Marked no-show`);
  return log;
}

export const signupLine = (s) =>
  `${hhmm(s.created_at)} Signed up, ${s.qr_mode === 'group' ? `group of ${s.party_size}` : plural(s.party_size, 'personal QR')}`;

export const arrivalOf = (s) => (s.inside === 0 ? 'none' : s.inside >= s.party_size ? 'all' : 'part');

const has = (q, ...fields) => !q || fields.some((f) => f?.toLowerCase().includes(q));

// The same search the server does (name, code, table, last 4 of phone), done here so every keystroke is instant.
export function bookingRows(list, { status, q, sort }) {
  const s = q.trim().toLowerCase();
  const rows = list.filter((b) => (status === 'all' || b.status === status) && has(s, b.name, b.code, b.table_code, b.phone_last4));
  return sort === 'table' ? rows.sort((a, b) => a.table_code.localeCompare(b.table_code, 'en', { numeric: true })) : rows;
}

export function signupRows(list, { mode, arrival, q }) {
  const s = q.trim().toLowerCase();
  return list.filter(
    (g) =>
      (mode === 'all' || g.qr_mode === mode) &&
      (arrival === 'any' || arrivalOf(g) === arrival) &&
      has(s, g.name, g.phone_last4, ...g.passes.map((p) => p.holder_name)),
  );
}
