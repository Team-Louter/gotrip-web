import { dateKey, defaultTripEnd, isDateKey } from './scheduleDates.js';
import { getAccountId } from '../api/session.js';

export const SCHEDULE_STORAGE_KEY = 'gotrip.schedules.v1';
const listeners = new Set();
let snapshot;
let snapshotKey;
function storageKey() { const owner = getAccountId(); return owner ? `${SCHEDULE_STORAGE_KEY}:${encodeURIComponent(owner)}` : SCHEDULE_STORAGE_KEY; }

function validEvent(event) {
  return event && typeof event.id === 'string' && isDateKey(event.date)
    && /^([01]\d|2[0-3]):[0-5]\d$/.test(event.time)
    && typeof event.content === 'string' && event.content.trim().length > 0;
}

function readSaved() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey()));
    if (saved && isDateKey(saved.startDate) && isDateKey(saved.selectedDate) && Array.isArray(saved.events)) {
      const events = saved.events.filter(validEvent);
      if (new Set(events.map((event) => event.id)).size !== events.length) return null;
      const endDate = isDateKey(saved.endDate) && saved.endDate >= saved.startDate ? saved.endDate : defaultTripEnd(saved.startDate);
      return { startDate: saved.startDate, endDate, selectedDate: saved.selectedDate, events, storageError: false };
    }
  } catch { /* 저장할 수 없는 환경에서도 현재 화면의 일정은 사용할 수 있습니다. */ }
  return null;
}

export function getScheduleSnapshot() {
  if (!snapshot || snapshotKey !== storageKey()) {
    snapshotKey = storageKey();
    const today = dateKey();
    snapshot = readSaved() ?? { startDate: today, endDate: defaultTripEnd(today), selectedDate: today, events: [], storageError: false };
  }
  return snapshot;
}

function update(next) {
  snapshot = { ...next, storageError: false };
  try {
    window.localStorage.setItem(storageKey(), JSON.stringify(snapshot));
  } catch {
    snapshot = { ...snapshot, storageError: true };
  }
  listeners.forEach((listener) => listener());
}

export function subscribeSchedules(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function selectScheduleDate(date) {
  if (isDateKey(date)) update({ ...getScheduleSnapshot(), selectedDate: date });
}

export function setTripStart(date) {
  if (!isDateKey(date)) return;
  const current = getScheduleSnapshot();
  update({ ...current, startDate: date, endDate: current.endDate < date ? date : current.endDate, selectedDate: date });
}

export function setTripEnd(date) {
  const current = getScheduleSnapshot();
  if (!isDateKey(date) || date < current.startDate) return;
  const selectedDate = current.selectedDate < current.startDate ? current.startDate : current.selectedDate > date ? date : current.selectedDate;
  update({ ...current, endDate: date, selectedDate });
}

export function saveSchedule(event) {
  const current = getScheduleSnapshot();
  const previous = current.events.find((item) => item.id === event.id);
  const next = { ...previous, ...event, id: event.id || crypto.randomUUID(), content: event.content.trim() };
  if (previous?.serverSynced && (previous.time !== next.time || previous.content !== next.content || previous.date !== next.date)) next.localChanges = true;
  if (!validEvent(next)) return false;
  const exists = current.events.some((item) => item.id === next.id);
  update({
    ...current,
    selectedDate: next.date,
    events: exists ? current.events.map((item) => item.id === next.id ? next : item) : [...current.events, next],
  });
  return true;
}

export function deleteSchedule(id) {
  const current = getScheduleSnapshot();
  update({ ...current, events: current.events.filter((event) => event.id !== id) });
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey() && event.key !== null) return;
    snapshot = undefined;
    getScheduleSnapshot();
    listeners.forEach((listener) => listener());
  });
}
