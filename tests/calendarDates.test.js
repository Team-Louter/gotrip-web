import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDates, shiftMonth } from '../src/data/scheduleDates.js';

test('month cells align to weekdays and include adjacent month dates', () => {
  const october = calendarDates('2026-10');
  assert.equal(october.length, 35);
  assert.equal(october[0], '2026-09-27');
  assert.equal(october.at(-1), '2026-10-31');
  const november = calendarDates('2026-11');
  assert.equal(november[0], '2026-11-01');
  assert.deepEqual(november.filter((date) => date.startsWith('2026-12')), ['2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05']);
});

test('month cells handle leap years and six-week months', () => {
  const february = calendarDates('2028-02');
  assert.equal(february.filter((date) => date.startsWith('2028-02')).length, 29);
  assert.equal(new Date(`${february[0]}T12:00:00`).getDay(), 0);
  assert.equal(new Date(`${february.at(-1)}T12:00:00`).getDay(), 6);
  const august = calendarDates('2026-08');
  assert.equal(august.length, 42);
  assert.equal(august[0], '2026-07-26');
  assert.equal(august.at(-1), '2026-09-05');
});

test('month navigation crosses years in both directions', () => {
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2027-01', -1), '2026-12');
  assert.equal(shiftMonth('2026-10', 1), '2026-11');
  assert.equal(shiftMonth('0001-01', -1), '0001-01');
  assert.equal(shiftMonth('9999-12', 1), '9999-12');
});
