import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import gotrippro from '../images/gotrip-pro.jpg';
import gotripsearch from '../icons/gotrip-search.png';
import gotriplogo4 from '../images/gotrip-logo4.png';
import ChatHome from './chatHome';
import CreateChatRoom from '../components/CreateChatRoom';
import { chatApi, matchesRoom } from '../services/chatApi';
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

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setList((current) => ({ ...current, status: 'loading', error: '' }));
      chatApi.getChatRooms({ query, signal: controller.signal }).then((rooms) => {
        if (!controller.signal.aborted) setList({ rooms, status: 'ready', error: '' });
      }).catch((reason) => {
        if (!controller.signal.aborted) setList({ rooms: [], status: 'error', error: reason.message });
      });
    }, query ? 180 : 0);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [query, refresh]);

  useEffect(() => {
    if (!roomId) return;
    const controller = new AbortController();
    chatApi.getChatRoom(roomId, { signal: controller.signal }).then((room) => {
      if (!controller.signal.aborted) setDetail({ id: roomId, room, error: '' });
    }).catch((reason) => {
      if (!controller.signal.aborted) setDetail({ id: roomId, room: null, error: reason.message });
    });
    return () => controller.abort();
  }, [roomId, detailRetry]);

  function roomCreated(room) {
    setCreating(false);
    setQuery('');
    setList((current) => ({ rooms: [room, ...current.rooms.filter((item) => item.id !== room.id)], status: 'ready', error: '' }));
    setDetail({ id: room.id, room, error: '' });
    setRefresh((value) => value + 1);
    navigate(`/chat/${encodeURIComponent(room.id)}`);
  }

  function roomUpdated(room) {
    setDetail((current) => current.id === room.id ? { id: room.id, room, error: '' } : current);
    setList((current) => ({ ...current, rooms: current.rooms.map((item) => item.id === room.id ? room : item) }));
  }

  const visibleRooms = list.rooms.filter((room) => matchesRoom(room, query));
  const activeRoom = roomId && detail.id === roomId ? detail.room : null;
  const detailError = detail.id === roomId ? detail.error : '';

  return (
    <div className="chatroom-layout chat-rooms-page">
      <aside className="chat-left" aria-label="채팅방 목록">
        <div className="chat-header">
          <h2 className="chat-h">chats</h2>
          <form className="search-box" role="search" onSubmit={(e) => { e.preventDefault(); setRefresh((value) => value + 1); }}>
            <input className="chattext-input" type="search" aria-label="채팅방 검색" placeholder="채팅방 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button type="submit" className="chat-search-button" aria-label="검색"><img src={gotripsearch} alt="" /></button>
          </form>
        </div>
        <div className="chat-list" aria-busy={list.status === 'loading'}>
          {list.status === 'error' ? <div className="chat-feedback" role="alert"><p>{list.error}</p><button type="button" className="chat-retry" onClick={() => setRefresh((value) => value + 1)}>다시 시도</button></div> : <>
            {visibleRooms.map((room) => (
              <button type="button" className={`chat-item${room.id === roomId ? ' is-active' : ''}`} key={room.id}
                aria-label={`${room.name} 채팅방 열기`} aria-current={room.id === roomId ? 'page' : undefined} onClick={() => navigate(`/chat/${encodeURIComponent(room.id)}`)}>
                <img className="gotrip-pro" src={gotrippro} alt="" />
                <span className="chat-item-text"><span className="chatroom-name">{room.name}</span><span className="chat-detail">{room.lastMessage || `${room.members.length + 1}명이 함께하는 채팅방`}</span></span>
              </button>
            ))}
            {list.status === 'loading' && <p className="chat-feedback" role="status">채팅방을 불러오는 중이에요.</p>}
            {list.status === 'ready' && visibleRooms.length === 0 && <p className="chat-feedback" role="status">{query.trim() ? '검색된 채팅방이 없어요.' : '아직 채팅방이 없어요. + 버튼으로 만들어 보세요.'}</p>}
          </>}
        </div>
        <button type="button" className="chat-plus" aria-label="채팅방 만들기" onClick={() => setCreating(true)}>+</button>
      </aside>
      {roomId ? activeRoom ? <ChatHome key={activeRoom.id} room={activeRoom} onRoomUpdated={roomUpdated} /> : <main className="chat-right"><div className="chat-feedback" role={detailError ? 'alert' : 'status'}>{detailError || '채팅방을 불러오는 중이에요.'}{detailError && <button type="button" className="chat-retry" onClick={() => { setDetail({ id: null, room: null, error: '' }); setDetailRetry((value) => value + 1); }}>다시 시도</button>}</div></main> : (
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
