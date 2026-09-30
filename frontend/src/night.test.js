import { expect, test } from 'vitest';
import {
  clock, dayLabel, dayParts, entryCode, guestNames, lineupWarnings, mmss, nightMinutes, nightRun, passOrCopy, passState, secondsLeft,
  tableState, validUntil, waShare,
} from './night.js';

test('nightMinutes: before 12:00 belongs to the night before (F2)', () => {
  const cases = {
    '12:00': 720, '12:01': 721, '15:00': 900, '18:30': 1110, '22:00': 1320, '23:59': 1439,
    '00:00': 1440, '00:30': 1470, '01:00': 1500, '03:30': 1650, '04:00': 1680, '11:59': 2159,
  };
  for (const [t, m] of Object.entries(cases)) expect(nightMinutes(t), t).toBe(m);
  // the point of it: 01:00 comes after 23:00, and 11:59 is the last minute of the night
  expect(nightMinutes('01:00')).toBeGreaterThan(nightMinutes('23:00'));
  expect(nightMinutes('11:59')).toBeGreaterThan(nightMinutes('04:00'));
  expect(nightMinutes('12:00')).toBeLessThan(nightMinutes('15:00'));
});

test('clock reads times the way the mockup writes them', () => {
  expect(['15:00', '23:00', '23:30', '00:00', '00:30', '04:00', '12:00'].map(clock)).toEqual([
    '3 pm', '11 pm', '11:30 pm', 'midnight', '12:30 am', '4 am', '12 pm',
  ]);
});

test('day labels match the mockup: "Thu 24 Sep", not "Sept"', () => {
  expect(dayLabel('2026-09-24')).toBe('Thu 24 Sep');
  expect(dayLabel('2026-10-01')).toBe('Thu 1 Oct');
  expect(dayParts('2026-09-25')).toEqual({ date: '25', day: 'Fri', weekday: 'Friday', month: 'Sep' });
});

const set = (performer, role, starts_at, ends_at) => ({ performer, role, starts_at, ends_at });

test('T-W4: overlapping sets warn, and the warning goes when one of them is B2B', () => {
  const rows = [set('Kirana', 'warm_up', '22:00', '00:30'), set('Marcel Oduya', 'headliner', '00:00', '02:30')];
  expect(lineupWarnings(rows, '04:00', '15:00')).toEqual([
    'Kirana and Marcel Oduya overlap. Mark one of them B2B if they play together.',
  ]);
  rows[0].role = 'b2b';
  expect(lineupWarnings(rows, '04:00', '15:00')).toEqual([]);
});

test('sets across midnight compare by night time, and sets outside opening hours warn', () => {
  const rows = [set('Saka', 'warm_up', '22:00', '00:00'), set('Theo Brandt', 'headliner', '00:00', '03:00'), set('Saka', 'closing', '03:00', '04:00')];
  expect(lineupWarnings(rows, '04:00', '15:00')).toEqual([]);
  expect(lineupWarnings(rows, '03:00', '15:00')).toEqual(['Saka runs outside opening hours, 3 pm to 3 am.']);
  expect(lineupWarnings([set('Early', 'support', '14:00', '16:00')], '04:00', '15:00')).toEqual([
    'Early runs outside opening hours, 3 pm to 4 am.',
  ]);
});

test('secondsLeft counts down to the server held_until and stops at 0', () => {
  const now = Date.parse('2026-09-24T22:00:00+08:00');
  expect(secondsLeft('2026-09-24T22:15:00+08:00', now)).toBe(900);
  expect(secondsLeft('2026-09-24T14:15:00Z', now)).toBe(900); // same instant, other offset
  expect(secondsLeft('2026-09-24T22:00:00.400+08:00', now)).toBe(1); // part of a second still counts
  expect(secondsLeft('2026-09-24T22:00:00+08:00', now)).toBe(0);
  expect(secondsLeft('2026-09-24T21:59:00+08:00', now)).toBe(0); // passed: 0, never negative
  expect([900, 61, 9, 0].map(mmss)).toEqual(['15:00', '01:01', '00:09', '00:00']);
});

test('tableState: booked and held win over size, then small, then free', () => {
  const t = (status, capacity) => ({ status, capacity });
  expect(tableState(t('booked', 12), 2)).toBe('booked');
  expect(tableState(t('held', 12), 2)).toBe('held');
  expect(tableState(t('booked', 4), 6)).toBe('booked');
  expect(tableState(t('free', 4), 6)).toBe('small');
  expect(tableState(t('free', 4), 4)).toBe('free');
  expect(tableState(t('free', 12), 1)).toBe('free');
});

test('guestNames: personal sends exactly party - 1 names, group sends none (F9)', () => {
  const typed = ['Rina', '', 'Dewi & Co', 'left over from a bigger group', '', '', '', '', ''];
  expect(guestNames('personal', 4, typed)).toEqual(['Rina', '', 'Dewi & Co']); // empties go too: the server names the gap
  expect(guestNames('personal', 1, typed)).toEqual([]);
  expect(guestNames('personal', 10, typed)).toHaveLength(9);
  expect(guestNames('group', 4, typed)).toEqual([]);
  expect(guestNames('group', 10, typed)).toEqual([]);
});

test('waShare: plain wa.me link, no number, message and pass link from data (F13)', () => {
  const e = { name: 'Second Wave', date: '2026-09-25', guestlist_cutoff: '23:30' };
  const url = 'https://fanglle.test/p/01J8Z6Q3';
  const link = waShare('Rina & Bayu', e, url);
  const u = new URL(link);
  expect(u.origin + u.pathname).toBe('https://wa.me/'); // no phone number: WhatsApp asks which chat
  expect([...u.searchParams.keys()]).toEqual(['text']); // the & in the name didn't split the query
  expect(u.searchParams.get('text')).toBe(
    'Rina & Bayu, here is your entry QR for The Fanglle II, Second Wave, Fri 25 Sep. Valid until 11:30 pm with your ID: https://fanglle.test/p/01J8Z6Q3',
  );
});

// Pass page (S5). Hours in these fixtures are deliberately not the demo's, so a hard-coded "11 pm" would fail.
const ev = { date: '2026-09-24', name: 'Descent', opens_at: '15:00', close_time: '03:30', guestlist_cutoff: '22:45' };
const pass = (o) => ({ kind: 'group', people: 4, inside_count: 0, status: 'ready', event: ev, ...o });
const said = (st) => st.line.join('');

test('validUntil: guestlist QR until the cutoff, table QR all night, both from data', () => {
  expect(validUntil(pass({ kind: 'group' }))).toBe('Valid until 10:45 pm');
  expect(validUntil(pass({ kind: 'personal', event: { ...ev, guestlist_cutoff: '00:00' } }))).toBe('Valid until midnight');
  expect(validUntil(pass({ kind: 'table' }))).toBe('Valid all night');
});

test('passState: status line, emphasis and stamp for every state', () => {
  const ready = passState(pass());
  expect(said(ready)).toBe('Ready for the door. Show it with your ID.');
  expect(ready.line[1]).toBe('ID'); // odd pieces are emphasised
  expect(ready.stamp).toBeNull();

  const partial = passState(pass({ status: 'partial', inside_count: 3 }));
  expect(said(partial)).toBe('3 of 4 in. The QR still works for the other 1.');
  expect(partial.line[1]).toBe('3 of 4');
  expect(partial.stamp).toBeNull();

  expect(passState(pass({ status: 'used', inside_count: 4 }))).toEqual({
    line: ['', 'All 4 checked in', ". This QR can't be scanned again."], stamp: ['USED', 'All 4 checked in'],
  });
  expect(passState(pass({ kind: 'personal', people: 1, status: 'used', inside_count: 1 })).stamp).toEqual(['USED', 'Checked in']);

  const late = passState(pass({ status: 'expired' }));
  expect(said(late)).toBe('The guestlist closed at 10:45 pm. Entry now is at the door price.');
  expect(late.stamp).toEqual(['CLOSED', 'Guestlist ended at 10:45 pm']);
  const over = passState(pass({ kind: 'table', status: 'expired' }));
  expect(said(over)).toBe('The night ended at 3:30 am.');
  expect(over.stamp).toEqual(['CLOSED', 'The night ended at 3:30 am']);

  const off = passState(pass({ status: 'revoked' }));
  expect(said(off)).toBe("This QR was cancelled. It won't open the door.");
  expect(off.stamp[0]).toBe('CANCELLED');
});

test('entryCode: capitals in two groups of four, whatever the input', () => {
  expect(entryCode('K7QM-4TXP')).toBe('K7QM-4TXP');
  expect(entryCode('k7qm4txp')).toBe('K7QM-4TXP');
  expect(entryCode(' k7qm 4txp ')).toBe('K7QM-4TXP');
});

// A Map stands in for IndexedDB: the fallback logic is what is tested, not the browser's storage.
const memory = () => {
  const m = new Map();
  return { m, get: async (id) => m.get(id), put: async (id, v) => void m.set(id, v) };
};
const offline = () => Promise.reject(new TypeError('Failed to fetch'));

test('passOrCopy: online saves the answer; offline shows the saved copy with its time', async () => {
  const store = memory();
  const p = pass({ qr: 'FNG2.x', entry_code: 'K7QM-4TXP' });
  expect(await passOrCopy('01J', { fetchPass: async () => p, store, now: () => 1000 })).toEqual({ pass: p, savedAt: null });
  expect(store.m.get('01J')).toEqual({ pass: p, saved_at: 1000 });

  expect(await passOrCopy('01J', { fetchPass: offline, store })).toEqual({ pass: p, savedAt: 1000 });
  // no answer at all within the wait counts as no signal too
  const hang = () => new Promise(() => {});
  expect(await passOrCopy('01J', { fetchPass: hang, store, wait: 5 })).toEqual({ pass: p, savedAt: 1000 });
});

test('passOrCopy: a real answer is never hidden, and offline with nothing saved is an error', async () => {
  const store = memory();
  await store.put('01J', { pass: pass(), saved_at: 1 });
  const gone = Object.assign(new Error("We couldn't find that pass."), { status: 404 });
  await expect(passOrCopy('01J', { fetchPass: () => Promise.reject(gone), store })).rejects.toBe(gone);
  await expect(passOrCopy('02K', { fetchPass: offline, store })).rejects.toThrow('Failed to fetch');
  // storage that fails (private mode) neither breaks the online page nor the offline error
  const broken = { get: () => Promise.reject(new Error('no idb')), put: () => Promise.reject(new Error('no idb')) };
  expect((await passOrCopy('01J', { fetchPass: async () => pass(), store: broken })).savedAt).toBeNull();
  await expect(passOrCopy('01J', { fetchPass: offline, store: broken })).rejects.toThrow('Failed to fetch');
});

test('About: how a night runs, from the night itself, in night order (F2, F3)', () => {
  const e = {
    opens_at: '15:00', guestlist_cutoff: '23:00', close_time: '04:00',
    lineup: [
      { performer: 'Ilse Varga', role: 'headliner', starts_at: '00:00', ends_at: '03:00' },
      { performer: 'Rafi Hartono', role: 'warm_up', starts_at: '22:00', ends_at: '00:00' },
      { performer: 'Rafi Hartono', role: 'closing', starts_at: '03:00', ends_at: '04:00' },
    ],
  };
  expect(nightRun(e).map((s) => [s.at, s.text, !!s.key])).toEqual([
    ['15:00', 'Doors open.', false],
    ['22:00', 'Rafi Hartono opens the night.', false],
    ['23:00', 'Guestlist closes. After this, entry is at the door.', true],
    ['00:00', 'Ilse Varga plays until 3 am.', true],
    ['04:00', 'Lights up.', false],
  ]);
  // A cutoff after midnight sorts after the headliner; a night with no line-up yet still has its hours.
  const late = nightRun({ ...e, guestlist_cutoff: '00:30' }).map((s) => s.at);
  expect(late).toEqual(['15:00', '22:00', '00:00', '00:30', '04:00']);
  expect(nightRun({ ...e, lineup: [] }).map((s) => s.at)).toEqual(['15:00', '23:00', '04:00']);
});
