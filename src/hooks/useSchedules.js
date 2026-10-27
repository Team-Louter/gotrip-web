import { useSyncExternalStore } from 'react';
import { getScheduleSnapshot, subscribeSchedules } from '../data/scheduleStore';

export function useSchedules() {
  return useSyncExternalStore(subscribeSchedules, getScheduleSnapshot);
}
