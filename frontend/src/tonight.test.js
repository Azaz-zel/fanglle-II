// S7 manager's night: the logic behind the overview, the lists and the booking panel.
import { expect, test } from 'vitest';
import { attention, bookingLog, bookingRows, lastSeen, minsLeft, pickHour, readout, signupLine, signupRows, timeline } from './tonight.js';

const EVENT = {
  date: '2026-09-25', opens_at: '15:00', guestlist_cutoff: '23:00', close_time: '04:00',
  lineup: [{ performer: 'Kirana', role: 'warm_up', starts_at: '22:00' }, { performer: 'Marcel Oduya', role: 'headliner', starts_at: '00:30' }],
};

test('F2 timeline: 23:20 has doors and the cutoff behind it, the headliner next, close after midnight', () => {
  expect(timeline(EVENT, '23:20')).toEqual([
    { time: '15:00', label: 'Doors', state: 'done' },
    { time: '23:00', label: 'Guestlist closed', state: 'done' },
    { time: '00:30', label: 'Headliner', state: 'next' },
    { time: '04:00', label: 'Close', state: '' },
  ]);
  expect(timeline(EVENT, '00:04')[2]).toEqual({ time: '00:30', label: 'Headliner, in 26 min', state: 'next' });
  expect(timeline(EVENT, '20:00')[1]).toMatchObject({ label: 'Guestlist closes', state: 'next' });
  expect(timeline(EVENT, '04:30').every((m) => m.state === 'done')).toBe(true);
});

test('a cutoff after the headliner goes after it, and a headliner already on is crossed off', () => {
  const late = { ...EVENT, guestlist_cutoff: '04:00', close_time: '06:00' };
  expect(timeline(late, '03:34').map((m) => [m.time, m.state])).toEqual([['15:00', 'done'], ['00:30', 'done'], ['04:00', 'next'], ['06:00', '']]);
  expect(timeline(late, '03:34')[2].label).toBe('Guestlist closes, in 26 min');
});

test('arrivals: the bar for the hour now, and what an hour to come says', () => {
  const hours = [{ hour: '22:00', total: 18, guestlist: 6, tables: 12 }, { hour: '23:00', total: 0, guestlist: 0, tables: 0 }, { hour: '00:00', total: 0, guestlist: 0, tables: 0 }];
  expect(pickHour(hours, '23:34')).toBe(1);
  expect(pickHour(hours, '02:10')).toBe(0);
  expect(readout(hours[0], '23:34')).toBe('22:00 to the next hour: 18 arrived. 6 from the guestlist, 12 from tables.');
  expect(readout(hours[1], '23:34')).toBe('23:00 to the next hour: nobody arrived.');
  expect(readout(hours[2], '23:34')).toBe("00:00 hasn't happened yet.");
});

test('needs you: a nearly full night this week, paid tables still out, overrides with the latest one', () => {
  const t = {
    event: EVENT,
    tables: { to_arrive: 2 },
    overrides: { count: 1, latest: { holder_name: 'Ayu Pratiwi', count: 2, scanned_at: '2026-09-25T23:12:00+08:00' } },
  };
  const events = [
    { date: '2026-09-24', signed: 200, guestlist_quota: 200 },
    { date: '2026-09-25', signed: 120, guestlist_quota: 200 },
    { date: '2026-09-26', signed: 194, guestlist_quota: 200 },
  ];
  expect(attention(t, events, '23:34').map(({ title, sub }) => [title, sub])).toEqual([
    ['Saturday guestlist almost full', '194 of 200 places taken'],
    ['2 paid tables not here yet', 'Headliner starts at 12:30 am'],
    ['1 manager override tonight', 'Ayu Pratiwi, 2 people at 23:12'],
  ]);
  expect(attention({ ...t, tables: { to_arrive: 0 }, overrides: { count: 0 } }, [], '23:34')).toEqual([]);
});

test('booking panel: held, paid, arrivals counted up, and how it ended', () => {
  const b = {
    table_code: 'B5', party_size: 7, status: 'arrived', created_at: '2026-09-25T14:02:10+08:00', paid_at: '2026-09-25T14:05:00+08:00',
    updated_at: '2026-09-25T14:05:00+08:00',
    check_ins: [
      { scanned_at: '2026-09-25T23:05:00+08:00', count: 2, method: 'override' },
      { scanned_at: '2026-09-25T22:40:00+08:00', count: 3, method: 'scan' },
    ],
  };
  expect(bookingLog(b)).toEqual(['14:02 Held B5', '14:05 Deposit paid', '22:40 3 of 7 arrived', '23:05 5 of 7 arrived, manager override']);
  expect(bookingLog({ ...b, status: 'released', paid_at: null, check_ins: [], updated_at: '2026-09-25T14:17:00+08:00' }))
    .toEqual(['14:02 Held B5', '14:17 Released, not paid']);
  expect(signupLine({ created_at: '2026-09-25T19:20:00+08:00', qr_mode: 'personal', party_size: 6 })).toBe('19:20 Signed up, 6 personal QRs');
});

test('held bookings count down in whole minutes', () => {
  expect(minsLeft('2026-09-25T23:40:00+08:00', Date.parse('2026-09-25T23:34:30+08:00'))).toBe(6);
  expect(minsLeft('2026-09-25T23:40:00+08:00', Date.parse('2026-09-25T23:41:00+08:00'))).toBe(0);
});

test('list filters and search: status, table order, QR type, arrival, a guest name inside a personal signup', () => {
  const bookings = [
    { code: 'F2-1', status: 'paid', name: 'Sang Ayu', table_code: 'S10', phone_last4: '2291' },
    { code: 'F2-2', status: 'held', name: 'Komang Adi', table_code: 'S3', phone_last4: '1156' },
  ];
  expect(bookingRows(bookings, { status: 'all', q: '', sort: 'table' }).map((b) => b.table_code)).toEqual(['S3', 'S10']);
  expect(bookingRows(bookings, { status: 'held', q: '', sort: 'urgency' }).map((b) => b.code)).toEqual(['F2-2']);
  expect(bookingRows(bookings, { status: 'all', q: '2291', sort: 'urgency' }).map((b) => b.code)).toEqual(['F2-1']);

  const signups = [
    { name: 'Ayu Pratiwi', phone_last4: '1234', qr_mode: 'group', party_size: 4, inside: 2, passes: [{ holder_name: 'Ayu Pratiwi' }] },
    { name: 'Nengah Budi', phone_last4: '5170', qr_mode: 'personal', party_size: 2, inside: 0, passes: [{ holder_name: 'Nengah Budi' }, { holder_name: 'Luh Sari' }] },
  ];
  expect(signupRows(signups, { mode: 'all', arrival: 'part', q: '' }).map((g) => g.name)).toEqual(['Ayu Pratiwi']);
  expect(signupRows(signups, { mode: 'personal', arrival: 'any', q: 'luh' }).map((g) => g.name)).toEqual(['Nengah Budi']);
});

test('team: last sign-in on the club clock, invites until their link runs out', () => {
  const now = Date.parse('2026-09-30T02:00:00+08:00');
  expect(lastSeen({ you: true }, now)).toBe('Now');
  expect(lastSeen({ status: 'active', last_active_at: '2026-09-30T01:31:00+08:00' }, now)).toBe('Today, 01:31');
  expect(lastSeen({ status: 'disabled', last_active_at: '2026-09-12T22:58:00+08:00' }, now)).toBe('12 Sep, 22:58');
  expect(lastSeen({ status: 'active', last_active_at: null }, now)).toBe('Never signed in');
  expect(lastSeen({ status: 'invited', invite_expires_at: '2026-10-01T20:00:00+08:00' }, now)).toBe('Invite link works until 1 Oct, 20:00');
  expect(lastSeen({ status: 'invited', invite_expires_at: '2026-09-29T20:00:00+08:00' }, now)).toBe('Invite link expired');
});
