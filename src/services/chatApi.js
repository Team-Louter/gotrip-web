import { createServerChatApi } from './serverChatApi.js';
import { API_BASE_URL } from '../api/client.js';

export function matchesRoom(room, query = '') {
  const normalize = (value) => String(value).normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, '');
  const haystack = [room.name, room.lastMessage, ...(room.members ?? []).map((member) => member.name)].join(' ');
  return normalize(haystack).includes(normalize(query));
}

export const chatApi = createServerChatApi({ baseUrl: API_BASE_URL });
