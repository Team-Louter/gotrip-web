import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getToken } from '../api/session';
import { chatApi } from '../services/chatApi';
import { matchesMember } from '../services/memberApi';

export default function CreateChatRoom({ onClose, onCreated, initialMemberIds = [] }) {
  const dialogRef = useRef(null);
  const submitted = useRef(false);
  const [name, setName] = useState('');
  const source = 'server';
  const supportsFriends = chatApi.capabilities.friends;
  const [query, setQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedIds, setSelectedIds] = useState(initialMemberIds);
  const [friendsStatus, setFriendsStatus] = useState('loading');
  const [friendError, setFriendError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; };
  }, []);

  useEffect(() => {
    if (!supportsFriends) return;
    const controller = new AbortController();
    chatApi.getFriends({ source, signal: controller.signal }).then((items) => {
      if (controller.signal.aborted) return;
      setFriends(items); setFriendsStatus('ready'); setFriendError('');
      setSelectedIds(items.filter((friend) => friend.id != null).map((friend) => friend.id));
    }).catch((reason) => {
      if (controller.signal.aborted) return;
      setFriendsStatus('error'); setFriendError(reason.message);
    });
    return () => controller.abort();
  }, [retry, supportsFriends, source]);

  function toggleFriend(id) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setError('');
  }

  async function createRoom(e) {
    e.preventDefault();
    if (submitted.current) return;
    if (!name.trim()) { setError('방 이름을 입력해 주세요.'); return; }
    if (!selectedIds.length) { setError('친구를 한 명 이상 선택해 주세요.'); return; }
    submitted.current = true;
    setSaving(true); setError('');
    try {
      const room = await chatApi.createChatRoom({ name, memberIds: selectedIds, source });
      onCreated(room);
    } catch (reason) { setError(reason.message); }
    finally { submitted.current = false; setSaving(false); }
  }

  const visibleFriends = friends.filter((friend) => matchesMember(friend, query));

  return (
    <dialog ref={dialogRef} className="chat-create-dialog" aria-labelledby="chat-create-title"
      onCancel={(e) => { e.preventDefault(); if (!saving) onClose(); }}
      onClick={(e) => { if (e.target === dialogRef.current && !saving) onClose(); }}>
      <form className="chat-create-form" onSubmit={createRoom}>
        <h2 id="chat-create-title">채팅방 만들기</h2>
        <fieldset disabled={saving}>
          {!chatApi.useMock && <p className="chat-mode-note">서버 채팅{!getToken() && <> · <Link to="/islogin" state={{ from: '/chat' }}>로그인하기</Link></>}</p>}
          <label className="chat-create-label" htmlFor="chat-create-name">방 이름</label>
          <input id="chat-create-name" className="chat-create-input" autoFocus maxLength={chatApi.roomNameLimit?.(source) ?? chatApi.maxRoomNameLength} placeholder="방 이름 입력" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} />
          {supportsFriends ? <>
          <div className="chat-friend-heading"><label className="chat-create-label" htmlFor="chat-friend-search">받는 사람 · 전체 사용자{friendsStatus === 'ready' ? ` ${friends.length}명` : ''}</label><div className="chat-recipient-actions"><button type="button" disabled={friendsStatus !== 'ready' || !friends.some((friend) => friend.id != null)} onClick={() => { const ids = friends.filter((friend) => friend.id != null).map((friend) => friend.id); setSelectedIds(ids.every((id) => selectedIds.includes(id)) ? [] : ids); }}>{friends.some((friend) => friend.id != null) && friends.filter((friend) => friend.id != null).every((friend) => selectedIds.includes(friend.id)) ? '선택 해제' : '전체 선택'}</button><span>{selectedIds.length}명 선택</span></div></div>
          <input id="chat-friend-search" className="chat-create-input" type="search" placeholder="닉네임 또는 아이디 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
          {selectedIds.length > 0 && <div className="chat-selected-friends" aria-label="선택한 친구">{friends.filter((friend) => selectedIds.includes(friend.id)).map((friend) => <button type="button" key={friend.id} onClick={() => toggleFriend(friend.id)} aria-label={`${friend.name} 선택 취소`}>{friend.name} <span aria-hidden="true">×</span></button>)}</div>}
          <div className="chat-friend-list" aria-label="친구 목록" aria-busy={friendsStatus === 'loading'}>
            {friendsStatus === 'loading' ? <p className="chat-feedback" role="status">친구 목록을 불러오는 중이에요.</p> : friendsStatus === 'error' ? <div className="chat-feedback" role="alert"><p>{friendError}</p><button type="button" className="chat-retry" onClick={() => { setFriendsStatus('loading'); setRetry((value) => value + 1); }}>다시 시도</button></div> : visibleFriends.length === 0 ? <p className="chat-feedback">{friends.length ? '검색된 친구가 없어요.' : '추가할 수 있는 친구가 없어요.'}</p> : visibleFriends.map((friend) => (
              <label className={`chat-friend-row${selectedIds.includes(friend.id) ? ' is-selected' : ''}${friend.id == null ? ' is-unavailable' : ''}`} key={friend.id ?? friend.loginId}>
                <span className="chat-friend-avatar" aria-hidden="true">{friend.name.slice(-2)}</span><span className="chat-friend-identity">{friend.name}{friend.loginId && <small className="chat-friend-login">@{friend.loginId}</small>}</span>
                <input type="checkbox" disabled={friend.id == null} title={friend.id == null ? '회원 ID가 제공되지 않아 직접 선택할 수 없습니다.' : undefined} checked={selectedIds.includes(friend.id)} onChange={() => toggleFriend(friend.id)} aria-label={`${friend.name} 추가`} />
              </label>
            ))}
          </div>
          {friendsStatus === 'ready' && friends.some((friend) => friend.id == null) && <p className="chat-invite-note">{friends.every((friend) => friend.id == null) ? '서버에서 회원 ID를 제공하지 않아 채팅방을 만들 수 없어요. 회원 목록 API에 실제 회원 ID가 필요합니다.' : '서버에서 회원 ID를 제공하지 않은 사용자는 초대할 수 없어요.'}</p>}
          </> : null}
        </fieldset>
        <p className="chat-create-error" role="alert">{error}</p>
        <div className="chat-create-actions">
          <button type="button" className="chat-create-cancel" disabled={saving} onClick={onClose}>취소</button>
          <button type="submit" className="chat-create-confirm" disabled={saving || friendsStatus !== 'ready' || !selectedIds.length || (!chatApi.useMock && !getToken())}>{saving ? '생성 중…' : '생성'}</button>
        </div>
      </form>
    </dialog>
  );
}
