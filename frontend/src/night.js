// Night-time helpers (F2). Every comparison of night times goes through nightMinutes, never raw "HH:MM" strings.

// Minutes since the start of the night's calendar day; before 12:00 belongs to the night before, so it counts past 24:00.
export const nightMinutes = (t) => {
  const [h, m] = String(t).split(':').map(Number);
  const v = h * 60 + m;
  return v < 720 ? v + 1440 : v;
};

// "15:00" -> "3 pm", "23:30" -> "11:30 pm", "00:00" -> "midnight"
export const clock = (t) => {
  const [h, m] = t.split(':').map(Number);
  if (h === 0 && m === 0) return 'midnight';
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`;
};

// Noon avoids the date slipping a day in any timezone.
// en-US names: en-GB writes September as "Sept", the mockup writes "Sep".
export const dayParts = (iso) => {
  const d = new Date(`${iso}T12:00:00`);
  const f = (o) => d.toLocaleDateString('en-US', o);
  return { date: String(d.getDate()), day: f({ weekday: 'short' }), weekday: f({ weekday: 'long' }), month: f({ month: 'short' }) };
};
// "Thu 24 Sep"
export const dayLabel = (iso) => {
  const p = dayParts(iso);
  return `${p.day} ${p.date} ${p.month}`;
};

export const idr = (n) => `IDR ${Number(n).toLocaleString('en-US')}`;

// The club's wall clock. The offset comes from a server timestamp ("…+08:00"), so the device's own zone never matters.
export const offsetOf = (iso) => {
  const m = /([+-])(\d\d):(\d\d)$/.exec(iso ?? '');
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
};
export const wallClock = (ms, offset) => new Date(ms + offset * 60_000).toISOString().slice(11, 16);
// "HH:MM" of a server timestamp, already on the club's clock.
export const hhmm = (iso) => iso.slice(11, 16);

export const ROLES = { headliner: 'Headliner', guest_star: 'Guest star', support: 'Support', warm_up: 'Warm-up', closing: 'Closing', b2b: 'B2B' };

export const headliners = (lineup) => lineup.filter((s) => s.role === 'headliner');
export const others = (lineup) => [...new Set(lineup.filter((s) => s.role !== 'headliner').map((s) => s.performer))];
export const earliest = (times) => times.reduce((a, t) => (a === undefined || nightMinutes(t) < nightMinutes(a) ? t : a), undefined);
export const latest = (times) => times.reduce((a, t) => (a === undefined || nightMinutes(t) > nightMinutes(a) ? t : a), undefined);

// Line-up warnings from fanglle-pengelola-mockup.jsx: adjacent sets that overlap (unless either is B2B),
// and sets outside opening hours. Rows: { performer, role, starts_at, ends_at }.
export function lineupWarnings(rows, close, opens) {
  const w = [];
  const s = rows
    .filter((r) => r.starts_at && r.ends_at && r.starts_at !== r.ends_at)
    .map((r) => {
      const a = nightMinutes(r.starts_at);
      const e = nightMinutes(r.ends_at);
      return { ...r, a, b: e < a ? e + 1440 : e };
    })
    .sort((x, y) => x.a - y.a);
  for (let i = 1; i < s.length; i++) {
    if (s[i].a < s[i - 1].b && s[i].role !== 'b2b' && s[i - 1].role !== 'b2b')
      w.push(`${s[i - 1].performer || 'A set'} and ${s[i].performer || 'the next set'} overlap. Mark one of them B2B if they play together.`);
  }
  if (opens && close)
    s.forEach((r) => {
      if (r.a < nightMinutes(opens) || r.b > nightMinutes(close))
        w.push(`${r.performer || 'One set'} runs outside opening hours, ${clock(opens)} to ${clock(close)}.`);
    });
  return w;
}

// Table booking (S3). A table is booked, held by someone else, too small for the group, or free.
export const tableState = (t, party) =>
  t.status === 'booked' ? 'booked' : t.status === 'held' ? 'held' : t.capacity < party ? 'small' : 'free';

// Whole seconds until the server's held_until (ISO with offset); 0 once it has passed.
// ponytail: trusts the guest's clock; send server time with the booking if skewed phones become a problem.
export const secondsLeft = (until, now = Date.now()) => Math.max(0, Math.ceil((Date.parse(until) - now) / 1000));
export const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// Guestlist (S4). guest_names are everyone after the organiser. A personal QR carries one name each, so the form sends
// exactly party - 1 of them; a group QR carries only the organiser's name, so it sends none (F9).
export const guestNames = (mode, party, guests) => (mode === 'personal' ? guests.slice(0, party - 1) : []);

export const ZONES = { stage: 'Stage front', booth: 'Booths', bar: 'Bar tables' };

// QR page (S5), from fanglle-qr-tamu-mockup.jsx. Every hour comes from the pass's event.
export const PASS_KINDS = { group: 'Guestlist · group', personal: 'Guestlist · personal', table: 'Table booking' };

// A guestlist QR stops at the guestlist cutoff; a table QR works until closing.
export const validUntil = (p) => (p.kind === 'table' ? 'Valid all night' : `Valid until ${clock(p.event.guestlist_cutoff)}`);

// "K7QM4TXP" or "k7qm-4txp" -> "K7QM-4TXP"
export const entryCode = (c) => {
  const s = String(c).toUpperCase().replace(/[^0-9A-Z]/g, '');
  return s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4)}` : s;
};

// The status line as [plain, emphasised, plain], and the stamp over the QR once it stops working (null while it works).
// The API has no check-in time, so "used" says who is in instead of the mockup's "Used at 22:14".
export function passState(p) {
  const { status, people: n, inside_count: inside, event: e } = p;
  const all = n === 1 ? 'Checked in' : `All ${n} checked in`;
  if (status === 'used') return { line: ['', all, ". This QR can't be scanned again."], stamp: ['USED', all] };
  if (status === 'revoked') return { line: ['This QR was ', 'cancelled', ". It won't open the door."], stamp: ['CANCELLED', 'No longer valid'] };
  if (status === 'expired')
    return p.kind === 'table'
      ? { line: ['The night ended at ', clock(e.close_time), '.'], stamp: ['CLOSED', `The night ended at ${clock(e.close_time)}`] }
      : {
          line: ['The guestlist closed at ', clock(e.guestlist_cutoff), '. Entry now is at the door price.'],
          stamp: ['CLOSED', `Guestlist ended at ${clock(e.guestlist_cutoff)}`],
        };
  if (status === 'partial') return { line: ['', `${inside} of ${n}`, ` in. The QR still works for the other ${n - inside}.`], stamp: null };
  return { line: ['Ready for the door. Show it with your ', 'ID', '.'], stamp: null };
}

// Online: the fresh pass, saved for later. No answer (offline, or nothing within `wait` ms in a basement with one bar):
// the copy saved on this phone, with the time it was saved. A real answer such as a 404 is shown as it is.
export async function passOrCopy(id, { fetchPass, store, wait = 8000, now = Date.now }) {
  try {
    const pass = await Promise.race([fetchPass(id), new Promise((_, no) => setTimeout(no, wait, new TypeError('No answer')))]);
    await store.put(id, { pass, saved_at: now() }).catch(() => {}); // storage off (private mode): still fine online
    return { pass, savedAt: null };
  } catch (e) {
    if (e.status) throw e;
    const copy = await store.get(id).catch(() => undefined);
    if (!copy) throw e;
    return { pass: copy.pass, savedAt: copy.saved_at };
  }
}

// F13: a plain wa.me link with no number in it. WhatsApp opens on the organiser's own phone and they choose the chat.
export const waShare = (holder, e, url) =>
  `https://wa.me/?text=${encodeURIComponent(
    `${holder}, here is your entry QR for The Fanglle II, ${e.name}, ${dayLabel(e.date)}. Valid until ${clock(e.guestlist_cutoff)} with your ID: ${url}`,
  )}`;

// About (S9), "How a night runs" for one night, in night order (F2). The mockup's fixed hours become this night's data (F3);
// its "Last entry" line has no field behind it, so it is left out. key: the moments the mockup marks in garnet.
export function nightRun(e) {
  const sets = [...e.lineup].sort((a, b) => nightMinutes(a.starts_at) - nightMinutes(b.starts_at));
  const heads = headliners(sets);
  const names = heads.map((s) => s.performer).join(' and ');
  const steps = [
    { at: e.opens_at, text: 'Doors open.' },
    ...(sets[0] && sets[0].role !== 'headliner' ? [{ at: sets[0].starts_at, text: `${sets[0].performer} opens the night.` }] : []),
    { at: e.guestlist_cutoff, text: 'Guestlist closes. After this, entry is at the door.', key: true },
    ...(heads.length
      ? [{ at: heads[0].starts_at, text: `${names} ${heads.length > 1 ? 'play' : 'plays'} until ${clock(latest(heads.map((s) => s.ends_at)))}.`, key: true }]
      : []),
    { at: e.close_time, text: 'Lights up.' },
  ];
  return steps.sort((a, b) => nightMinutes(a.at) - nightMinutes(b.at));
}
