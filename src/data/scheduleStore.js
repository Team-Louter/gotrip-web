import { dateKey, isDateKey } from './scheduleDates.js';

export const SCHEDULE_STORAGE_KEY = 'gotrip.schedules.v1';
const listeners = new Set();
let snapshot;

export function originalSchedules(date) {
  return [
    ['07:15', '공항 도착'],
    ['09:00', '식사 후 출국'],
    ['12:00', '도착 후 오사카에서 라멘'],
    ['13:00', '식사 후 쇼핑'],
    ['16:30', '교토로 버스 타고 출발'],
    ['17:10', '도착 후 관광지 구경'],
    ['19:00', '식사후 숙소로 이동'],
  ].map(([time, content], index) => ({ id: `original-${date}-${index}`, date, time, content }));
}

function validEvent(event) {
  return event && typeof event.id === 'string' && isDateKey(event.date)
    && /^([01]\d|2[0-3]):[0-5]\d$/.test(event.time)
    && typeof event.content === 'string' && event.content.trim().length > 0;
}

function readSaved() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SCHEDULE_STORAGE_KEY));
    if (saved && isDateKey(saved.startDate) && isDateKey(saved.selectedDate) && Array.isArray(saved.events)) {
      const events = saved.events.filter(validEvent);
      if (new Set(events.map((event) => event.id)).size !== events.length) return null;
      return { startDate: saved.startDate, selectedDate: saved.selectedDate, events, storageError: false };
    }
  } catch { /* 저장할 수 없는 환경에서도 현재 화면의 일정은 사용할 수 있습니다. */ }
  return null;
}

export function getScheduleSnapshot() {
  if (!snapshot) {
    const today = dateKey();
    snapshot = readSaved() ?? { startDate: today, selectedDate: today, events: originalSchedules(today), storageError: false };
  }
  return snapshot;
}

function update(next) {
  snapshot = { ...next, storageError: false };
  try {
    window.localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(snapshot));
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
  if (isDateKey(date)) update({ ...getScheduleSnapshot(), startDate: date, selectedDate: date });
}

export function saveSchedule(event) {
  const current = getScheduleSnapshot();
  const next = { ...event, id: event.id || crypto.randomUUID(), content: event.content.trim() };
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
    if (event.key !== SCHEDULE_STORAGE_KEY && event.key !== null) return;
    snapshot = undefined;
    getScheduleSnapshot();
    listeners.forEach((listener) => listener());
  });
}
