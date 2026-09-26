import { expect, test } from 'vitest';
import { clock, dayLabel, dayParts, guestNames, lineupWarnings, mmss, nightMinutes, secondsLeft, tableState, waShare } from './night.js';

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
