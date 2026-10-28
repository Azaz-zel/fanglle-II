import { expect, test } from 'vitest';
import { laneOf } from './night.js';

const set = (starts_at, ends_at, performer = 'X') => ({ starts_at, ends_at, performer, role: 'warm_up' });

test('laneOf: sets in night order on whole hours, past midnight after 23:00 (F2)', () => {
  const l = laneOf([set('00:00', '03:00', 'Head'), set('22:00', '00:00', 'Warm'), set('03:00', '04:00', 'Close')]);
  expect(l.from).toBe('22:00');
  expect(l.to).toBe('04:00');
  expect(l.hours).toEqual(['22:00', '23:00', '00:00', '01:00', '02:00', '03:00']);
  expect(l.sets.map((s) => [s.performer, s.left, s.width])).toEqual([
    ['Warm', 0, 33.33],
    ['Head', 33.33, 50],
    ['Close', 83.33, 16.67],
  ]);
});

test('laneOf: a set off the hour widens the axis to whole hours', () => {
  const l = laneOf([set('23:30', '00:30'), set('00:30', '02:15')]);
  expect([l.from, l.to]).toEqual(['23:00', '03:00']);
  expect(l.sets[0].left).toBe(12.5);
});
