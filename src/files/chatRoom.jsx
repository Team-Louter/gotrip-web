import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import gotrippro from '../images/gotrip-pro.jpg';
import gotripsearch from '../icons/gotrip-search.png';
import gotriplogo4 from '../images/gotrip-logo4.png';
import ChatHome from './chatHome';
import CreateChatRoom from '../components/CreateChatRoom';
import { SkeletonConversation, SkeletonList } from '../components/Skeleton';
import { chatApi, matchesRoom } from '../services/chatApi';
import { getToken } from '../api/session';
import { mergeMessages } from '../services/serverChatApi';
import { createChatReadStore, getChatReadStorageKey } from '../data/chatReadStore.js';
import '../styles/chatHome.css';
import '../styles/chatRoom.css';
import '../styles/chatRooms.css';

function ChatRoom() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [query, setQuery] = useState('');
  const [list, setList] = useState({ rooms: [], status: 'loading', error: '' });
  const [detail, setDetail] = useState({ id: null, room: null, error: '' });
  const [refresh, setRefresh] = useState(0);
  const [detailRetry, setDetailRetry] = useState(0);
  const [creating, setCreating] = useState(false);
  const [syncError, setSyncError] = useState('');
  const chatReadStore = useMemo(() => createChatReadStore({ storageKey: getChatReadStorageKey() }), []);
  const [unreadByRoom, setUnreadByRoom] = useState(() => chatReadStore.read());

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setList((current) => ({ ...current, status: current.rooms.length ? 'ready' : 'loading', error: '' }));
      chatApi.getChatRooms({ query, signal: controller.signal }).then((rooms) => {
        if (!controller.signal.aborted) setList((current) => ({ rooms: rooms.map((room) => ({ ...room, lastMessage: room.lastMessage || current.rooms.find((item) => item.id === room.id)?.lastMessage || '' })), status: 'ready', error: '' }));
      }).catch((reason) => {
        if (!controller.signal.aborted) setList({ rooms: [], status: 'error', error: reason.message });
      });
    }, query ? 180 : 0);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [query, refresh]);

  useEffect(() => setUnreadByRoom(chatReadStore.read()), [chatReadStore]);

  useEffect(() => {
    if (list.status !== 'ready') return undefined;
    if (!list.rooms.length) {
      setUnreadByRoom(chatReadStore.read());
      return undefined;
    }

    const controller = new AbortController();
    let disposed = false;
    async function updateUnreadCounts() {
      const current = chatReadStore.read();
      await Promise.all(list.rooms.map(async (room) => {
        try {
          const messages = typeof chatApi.getNewMessages === 'function'
            ? await chatApi.getNewMessages(room.id, { after: current[room.id]?.cursorMessageId, signal: controller.signal })
            : (await chatApi.getChatRoom(room.id, { signal: controller.signal })).messages;
          if (!disposed) chatReadStore.observeMessages(room.id, messages, { active: room.id === roomId });
        } catch { /* 목록 표시는 유지하고 다음 새로고침에서 읽음 수를 다시 확인합니다. */ }
      }));
      if (!disposed) setUnreadByRoom(chatReadStore.read());
    }
    updateUnreadCounts();
    return () => { disposed = true; controller.abort(); };
  }, [list.status, list.rooms, roomId, chatReadStore]);

  useEffect(() => {
    const refreshList = () => { if (!document.hidden) setRefresh((value) => value + 1); };
    const interval = setInterval(refreshList, 10000);
    window.addEventListener('focus', refreshList);
    return () => { clearInterval(interval); window.removeEventListener('focus', refreshList); };
  }, []);

  useEffect(() => {
    if (!roomId) return;
    const controller = new AbortController();
    let timer;
    let latestMessageId;
    async function poll() {
      if (controller.signal.aborted) return;
      let retry = true;
      try {
        if (!document.hidden) {
          const messages = await chatApi.getNewMessages(roomId, { after: latestMessageId, signal: controller.signal });
          if (!controller.signal.aborted) {
            latestMessageId = messages.at(-1)?.id ?? latestMessageId;
            setSyncError('');
            setDetail((current) => current.id === roomId && current.room ? {
              ...current, room: { ...current.room, messages: mergeMessages(current.room.messages, messages) },
            } : current);
            if (messages.length) setList((current) => ({ ...current, rooms: current.rooms.map((room) => room.id === roomId ? { ...room, lastMessage: messages.at(-1).content } : room) }));
          }
        }
      } catch (reason) {
        if (!controller.signal.aborted) setSyncError(reason.message);
        retry = reason.status !== 401 && reason.status !== 403;
      } finally {
        if (retry && !controller.signal.aborted) timer = setTimeout(poll, 3000);
      }
    }
    chatApi.getChatRoom(roomId, { signal: controller.signal }).then((room) => {
      if (!controller.signal.aborted) {
        latestMessageId = room.messages.at(-1)?.id;
        setSyncError('');
        setDetail((current) => ({ id: roomId, room: current.id === roomId && current.room ? { ...room, messages: mergeMessages(room.messages, current.room.messages) } : room, error: '' }));
        setList((current) => ({ ...current, rooms: current.rooms.map((item) => item.id === roomId ? { ...item, lastMessage: room.lastMessage } : item) }));
        timer = setTimeout(poll, 3000);
      }
    }).catch((reason) => {
      if (!controller.signal.aborted) setDetail({ id: roomId, room: null, error: reason.message });
    });
    return () => { controller.abort(); clearTimeout(timer); };
  }, [roomId, detailRetry]);

  function roomCreated(room) {
    setCreating(false);
    setQuery('');
    setList((current) => ({ ...current, rooms: [room, ...current.rooms.filter((item) => item.id !== room.id)], status: 'ready', error: '' }));
    setDetail({ id: room.id, room, error: '' });
    setRefresh((value) => value + 1);
    navigate(`/chat/rooms/${encodeURIComponent(room.id)}`);
  }

  function roomUpdated(room) {
    const { deletedMessageId, ...updatedRoom } = room;
    setDetail((current) => current.id === updatedRoom.id ? {
      id: updatedRoom.id,
      room: !current.room ? updatedRoom : {
        ...current.room,
        ...updatedRoom,
        messages: mergeMessages(
          deletedMessageId == null ? current.room.messages : current.room.messages.filter((message) => message.id !== String(deletedMessageId)),
          updatedRoom.messages,
        ),
      },
      error: '',
    } : current);
    setList((current) => ({ ...current, rooms: current.rooms.map((item) => item.id === updatedRoom.id ? { ...item, lastMessage: updatedRoom.lastMessage ?? item.lastMessage } : item) }));
  }

  const visibleRooms = list.rooms.filter((room) => matchesRoom(room, query));
  const activeRoom = roomId && detail.id === roomId ? detail.room : null;
  const detailError = detail.id === roomId ? detail.error : '';
  const activeLatestMessage = detail.id === roomId ? detail.room?.messages.at(-1) : undefined;

  useEffect(() => {
    if (!roomId || detail.id !== roomId) return;
    chatReadStore.markRead(roomId, activeLatestMessage);
    setUnreadByRoom(chatReadStore.read());
  }, [roomId, detail.id, detail.room, activeLatestMessage, chatReadStore]);

  return (
    <div className="chatroom-layout chat-rooms-page">
      <aside className="chat-left" aria-label="채팅방 목록">
        <div className="chat-header">
          <h2 className="chat-h">채팅</h2>
          <form className="search-box" role="search" onSubmit={(e) => { e.preventDefault(); setRefresh((value) => value + 1); }}>
            <input className="chattext-input" type="search" aria-label="채팅방 검색" placeholder="채팅방 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button type="submit" className="chat-search-button" aria-label="검색"><img src={gotripsearch} alt="" /></button>
          </form>
        </div>
        <div className="chat-list" aria-busy={list.status === 'loading'}>
          {list.status === 'error' ? <div className="chat-feedback" role="alert"><p>{list.error}</p>{!getToken() ? <Link className="chat-retry" to="/login" state={{ from: roomId ? `/chat/rooms/${roomId}` : '/chat' }}>로그인하기</Link> : <button type="button" className="chat-retry" onClick={() => setRefresh((value) => value + 1)}>다시 시도</button>}</div> : <>
            {visibleRooms.map((room) => (
              <button type="button" className={`chat-item${room.id === roomId ? ' is-active' : ''}`} key={room.id}
                aria-label={`${room.name} 채팅방 열기${unreadByRoom[room.id]?.unreadCount ? `, 안 읽은 메시지 ${unreadByRoom[room.id].unreadCount}개` : ''}`} aria-current={room.id === roomId ? 'page' : undefined} onClick={() => navigate(`/chat/rooms/${encodeURIComponent(room.id)}`)}>
                <img className="gotrip-pro" src={gotrippro} alt="" />
                <span className="chat-item-text"><span className="chatroom-name">{room.name}</span><span className="chat-detail">{room.lastMessage || (room.membersKnown === false ? '대화를 시작해 보세요.' : `${room.members.length + 1}명이 함께하는 채팅방`)}</span></span>
                {unreadByRoom[room.id]?.unreadCount > 0 && <span className="chat-unread-badge" aria-hidden="true">{unreadByRoom[room.id].unreadCount > 99 ? '99+' : unreadByRoom[room.id].unreadCount}</span>}
              </button>
            ))}
            {list.status === 'loading' && <SkeletonList variant="chat" label="채팅방을 불러오는 중이에요." />}
            {list.status === 'ready' && visibleRooms.length === 0 && <p className="chat-feedback chat-empty-message" role="status">{query.trim() ? '검색된 채팅방이 없어요.' : '아직 채팅방이 없어요'}</p>}
          </>}
        </div>
        <button type="button" className="chat-plus" aria-label="채팅방 만들기" disabled={!getToken()} onClick={() => setCreating(true)}>+</button>
      </aside>
      {roomId ? activeRoom ? <ChatHome key={activeRoom.id} room={activeRoom} onRoomUpdated={roomUpdated} syncError={syncError} onRetrySync={() => setDetailRetry((value) => value + 1)} /> : detailError ? <main className="chat-right"><div className="chat-feedback" role="alert">{detailError}<button type="button" className="chat-retry" onClick={() => { setDetail({ id: null, room: null, error: '' }); setDetailRetry((value) => value + 1); }}>다시 시도</button></div></main> : <SkeletonConversation /> : (
        <main className="chat-right">
          <img className="chat-gotriplogo" src={gotriplogo4} alt="GoTrip" />
          <div className="chat-empty"><p className="lets-plan">여행 계획이라도 짜볼까요?</p><button className="lets-main" onClick={() => navigate('/calendar')}>캘린더로 가기</button></div>
        </main>
      )}
      {creating && <CreateChatRoom onClose={() => setCreating(false)} onCreated={roomCreated} />}
    </div>
  );
}
export default ChatRoom;
