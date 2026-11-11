import { getAccountId } from '../api/session.js';

export function createPlaceStore({ storage, account = getAccountId } = {}) {
  const target = () => storage ?? globalThis.localStorage;
  const key = () => { const owner = account(); return owner ? `gotrip.places.v1:${encodeURIComponent(owner)}` : null; };
  return {
    read() {
      try {
        const name = key();
        const places = name ? JSON.parse(target()?.getItem(name) ?? '[]') : [];
        return Array.isArray(places) ? places.filter((place) => typeof place?.id === 'string' && typeof place.address === 'string' && (place.serverId == null || /^[1-9]\d*$/.test(place.serverId))) : [];
      } catch { return []; }
    },
    save(places) {
      try {
        const name = key();
        if (!name || !target()) return false;
        target().setItem(name, JSON.stringify(places));
        return true;
      } catch { return false; }
    },
  };
}

export const placeStore = createPlaceStore();
