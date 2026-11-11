import { getAccountId } from '../api/session.js';

// 체험 참여자와 미디어가 실제 서버 API로 전송되지 않도록 저장 위치를 구분합니다.
export function createHybridChatApi({ serverApi, createLocalApi, account = getAccountId }) {
  const localApis = new Map();
  const inviteeLists = new Map();
  const scope = () => account() ?? 'guest';
  function local() {
    const owner = scope();
    if (!localApis.has(owner)) localApis.set(owner, createLocalApi(owner));
    return localApis.get(owner);
  }
  const isLocalRoom = (id) => String(id).startsWith('local-');
  const decorate = (room, source) => {
    const api = source === 'local' ? local() : serverApi;
    return { ...room, source, capabilities: api.capabilities, maxMessageLength: api.maxMessageLength };
  };
  const forRoom = (id) => isLocalRoom(id) ? local() : serverApi;
  const update = (method) => async (roomId, ...args) => decorate(await forRoom(roomId)[method](roomId, ...args), isLocalRoom(roomId) ? 'local' : 'server');

  const api = {
    useMock: false,
    supportsLocalRooms: true,
    capabilities: serverApi.capabilities,
    maxMessageLength: serverApi.maxMessageLength,
    maxRoomNameLength: serverApi.maxRoomNameLength,
    roomNameLimit: (source) => source === 'server' ? serverApi.maxRoomNameLength : local().maxRoomNameLength,
    isLocalRoom,
    async getRoomList(options = {}) {
      const localRooms = (await local().getChatRooms(options)).map((room) => decorate(room, 'local'));
      let serverRooms = [], serverError = null;
      try { serverRooms = (await serverApi.getChatRooms(options)).map((room) => decorate(room, 'server')); }
      catch (error) { if (options.signal?.aborted || error.name === 'AbortError') throw error; serverError = error; }
      return { rooms: [...localRooms, ...serverRooms], serverError };
    },
    async getChatRooms(options) { return (await api.getRoomList(options)).rooms; },
    async getChatRoom(id, options) { return decorate(await forRoom(id).getChatRoom(id, options), isLocalRoom(id) ? 'local' : 'server'); },
    async getFriends({ source = 'local', ...options } = {}) {
      const owner = scope();
      const members = await serverApi.getFriends({ ...options, excludeSelf: false });
      const invitees = members.map((member) => ({ ...member, id: `user:${member.loginId ?? member.id}` }));
      inviteeLists.set(owner, invitees);
      return source === 'server' ? members : invitees;
    },
    async createChatRoom({ source = 'local', ...input }, options) {
      if (source === 'server') return decorate(await serverApi.createChatRoom(input, options), 'server');
      const members = inviteeLists.get(scope()) ?? await api.getFriends({ source: 'local', ...options });
      return decorate(await local().createChatRoom({ ...input, members }, options), 'local');
    },
    uploadImages: (files, options) => local().uploadImages(files, options),
    sendMessage: update('sendMessage'),
    editMessage: update('editMessage'),
    deleteMessage: update('deleteMessage'),
    setReaction: update('setReaction'),
    getMessages: (id, options) => serverApi.getMessages(id, options),
    getNewMessages: (id, options) => serverApi.getNewMessages(id, options),
  };
  return api;
}
