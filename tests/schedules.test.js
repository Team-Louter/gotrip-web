import test from 'node:test';
import assert from 'node:assert/strict';
import { TRIP_DURATION, addDays, isDateKey, schedulesOn } from '../src/data/scheduleDates.js';

let saved = new Map();
let failWrites = false;
let storageListener;
globalThis.window = {
  localStorage: {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => { if (failWrites) throw new Error('Storage unavailable'); saved.set(key, value); },
  },
  addEventListener: (type, listener) => { if (type === 'storage') storageListener = listener; },
};
const store = await import('../src/data/scheduleStore.js');

function reset() {
  saved.clear();
  saved.set(store.SCHEDULE_STORAGE_KEY, JSON.stringify({ startDate: '2026-10-27', selectedDate: '2026-10-27', events: [] }));
  failWrites = false;
  storageListener({ key: null });
}

test('five travel days cross month, year, and leap-day boundaries', () => {
  assert.equal(TRIP_DURATION, 5);
  assert.equal(addDays('2026-10-27', TRIP_DURATION - 1), '2026-10-31');
  assert.equal(addDays('2026-12-29', TRIP_DURATION - 1), '2027-01-02');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(isDateKey('2026-02-29'), false);
  assert.equal(isDateKey('2026-13-01'), false);
});

test('add, independently edit time/content, move date, and delete share one saved event', () => {
  reset();
  store.setTripStart('2026-10-27');
  store.selectScheduleDate('2026-10-28');
  assert.equal(store.saveSchedule({ date: '2026-10-28', time: '10:30', content: ' 라멘 식사 ' }), true);
  const event = store.getScheduleSnapshot().events[0];
  assert.equal(event.content, '라멘 식사');
  store.saveSchedule({ ...event, time: '12:45' });
  assert.equal(store.getScheduleSnapshot().events[0].content, '라멘 식사');
  store.saveSchedule({ ...store.getScheduleSnapshot().events[0], content: '교토에서 점심' });
  assert.equal(store.getScheduleSnapshot().events[0].time, '12:45');
  store.saveSchedule({ ...store.getScheduleSnapshot().events[0], date: '2026-11-02' });
  const next = store.getScheduleSnapshot();
  assert.equal(next.events.length, 1);
  assert.equal(schedulesOn(next.events, '2026-10-28').length, 0);
  assert.equal(schedulesOn(next.events, '2026-11-02').length, 1);
  assert.equal(next.selectedDate, '2026-11-02');
  assert.equal(JSON.parse(saved.get(store.SCHEDULE_STORAGE_KEY)).events[0].date, '2026-11-02');
  store.deleteSchedule(event.id);
  assert.deepEqual(store.getScheduleSnapshot().events, []);
  assert.deepEqual(JSON.parse(saved.get(store.SCHEDULE_STORAGE_KEY)).events, []);
});

test('start-date changes preserve the actual dates of existing events', () => {
  reset();
  store.saveSchedule({ date: '2026-10-28', time: '09:00', content: '공항 도착' });
  store.setTripStart('2026-12-30');
  assert.equal(store.getScheduleSnapshot().events[0].date, '2026-10-28');
  assert.equal(store.getScheduleSnapshot().selectedDate, '2026-12-30');
});

test('invalid and blank input never changes stored events', () => {
  reset();
  for (const patch of [{ date: '2026-02-30' }, { time: '24:00' }, { time: '12:60' }, { content: '   ' }]) {
    assert.equal(store.saveSchedule({ date: '2026-10-28', time: '09:00', content: '공항', ...patch }), false);
  }
  assert.equal(store.getScheduleSnapshot().events.length, 0);
});

test('both views receive updates; chronological sort does not mutate saved order', () => {
  reset();
  let updates = 0;
  const unsubscribe = store.subscribeSchedules(() => updates++);
  store.saveSchedule({ date: '2026-10-28', time: '19:00', content: '저녁' });
  store.saveSchedule({ date: '2026-10-28', time: '07:15', content: '공항' });
  const events = store.getScheduleSnapshot().events;
  assert.deepEqual(schedulesOn(events, '2026-10-28').map((event) => event.time), ['07:15', '19:00']);
  assert.equal(events[0].time, '19:00');
  assert.equal(updates, 2);
  unsubscribe();
});

test('reload and storage events restore saved schedules and tolerate malformed data', () => {
  reset();
  store.saveSchedule({ date: '2027-01-04', time: '16:00', content: '체크인' });
  storageListener({ key: store.SCHEDULE_STORAGE_KEY });
  assert.equal(store.getScheduleSnapshot().events[0].content, '체크인');
  saved.set(store.SCHEDULE_STORAGE_KEY, '{broken JSON');
  storageListener({ key: store.SCHEDULE_STORAGE_KEY });
  assert.equal(store.getScheduleSnapshot().events.length, 7);
  assert.equal(store.getScheduleSnapshot().events[0].content, '공항 도착');
});

test('unavailable browser storage keeps current edits and exposes a warning', () => {
  reset();
  failWrites = true;
  store.saveSchedule({ date: '2026-10-28', time: '12:00', content: '점심' });
  assert.equal(store.getScheduleSnapshot().events[0].content, '점심');
  assert.equal(store.getScheduleSnapshot().storageError, true);
});
