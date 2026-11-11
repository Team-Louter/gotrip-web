import { BACKEND_BASE_URL, createApiClient } from '../api/client.js';
import { isDateKey } from '../data/scheduleDates.js';

export function serverId(value) {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) return null;
  return (typeof value === 'number' || typeof value === 'string') && /^[1-9]\d*$/.test(String(value)) ? String(value) : null;
}

export function createTripApi(options = {}) {
  const request = createApiClient({ baseUrl: BACKEND_BASE_URL, ...options });
  return {
    async addSchedule({ date, time, content }, { signal } = {}) {
      if (!isDateKey(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('날짜와 시간을 확인해 주세요.');
      const text = content?.trim();
      if (!text || text.length < 5) throw new Error('일정 내용은 5자 이상 입력해 주세요.');
      const [hour, minute] = time.split(':').map(Number);
      const result = await request('/calendar', { method: 'POST', body: { hour, minute, content: text }, signal });
      return { date, time, content: text, serverSynced: true, serverId: serverId(result?.scheduleId ?? result?.id), localChanges: false };
    },
    async addPlace(address, { signal } = {}) {
      const text = address?.trim();
      if (!text) throw new Error('주소를 입력해 주세요.');
      const result = await request('/schedule/map/new', { method: 'POST', body: { address: text }, signal });
      return { id: crypto.randomUUID(), address: text, serverId: serverId(result?.placeId ?? result?.id ?? result) };
    },
    async deletePlace(id, { signal } = {}) {
      const value = serverId(id);
      if (!value) throw new Error('장소 ID는 1 이상의 정수로 입력해 주세요.');
      await request(`/schedule/map/${value}`, { method: 'DELETE', signal });
    },
  };
}

export const tripApi = createTripApi();
