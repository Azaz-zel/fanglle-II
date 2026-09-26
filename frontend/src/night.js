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

// F13: a plain wa.me link with no number in it. WhatsApp opens on the organiser's own phone and they choose the chat.
export const waShare = (holder, e, url) =>
  `https://wa.me/?text=${encodeURIComponent(
    `${holder}, here is your entry QR for The Fanglle II, ${e.name}, ${dayLabel(e.date)}. Valid until ${clock(e.guestlist_cutoff)} with your ID: ${url}`,
  )}`;
