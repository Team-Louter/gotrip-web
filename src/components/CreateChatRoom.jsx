import { useEffect, useRef, useState } from 'react';
import { chatApi } from '../services/chatApi';
import { parseMemberIds } from '../services/serverChatApi';

export default function CreateChatRoom({ onClose, onCreated }) {
  const dialogRef = useRef(null);
  const submitted = useRef(false);
  const [name, setName] = useState('');
  const [memberIdsInput, setMemberIdsInput] = useState('');
  const supportsFriends = chatApi.capabilities.friends;
  const [query, setQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
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
    chatApi.getFriends({ signal: controller.signal }).then((items) => {
      if (controller.signal.aborted) return;
      setFriends(items); setFriendsStatus('ready'); setFriendError('');
    }).catch((reason) => {
      if (controller.signal.aborted) return;
      setFriendsStatus('error'); setFriendError(reason.message);
    });
    return () => controller.abort();
  }, [retry, supportsFriends]);

  function toggleFriend(id) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setError('');
  }

  async function createRoom(e) {
    e.preventDefault();
    if (submitted.current) return;
    if (!name.trim()) { setError('방 이름을 입력해 주세요.'); return; }
    let memberIds = selectedIds;
    try {
      if (!supportsFriends) memberIds = parseMemberIds(memberIdsInput);
      if (!memberIds.length) throw new Error('친구를 한 명 이상 선택해 주세요.');
    } catch (reason) { setError(reason.message); return; }
    submitted.current = true;
    setSaving(true); setError('');
    try {
      const room = await chatApi.createChatRoom({ name, memberIds });
      onCreated(room);
    } catch (reason) { setError(reason.message); }
    finally { submitted.current = false; setSaving(false); }
  }

  const visibleFriends = friends.filter((friend) => friend.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));

  return (
    <dialog ref={dialogRef} className="chat-create-dialog" aria-labelledby="chat-create-title"
      onCancel={(e) => { e.preventDefault(); if (!saving) onClose(); }}
      onClick={(e) => { if (e.target === dialogRef.current && !saving) onClose(); }}>
      <form className="chat-create-form" onSubmit={createRoom}>
        <h2 id="chat-create-title">채팅방 만들기</h2>
        <fieldset disabled={saving}>
          <label className="chat-create-label" htmlFor="chat-create-name">방 이름</label>
          <input id="chat-create-name" className="chat-create-input" autoFocus maxLength={chatApi.maxRoomNameLength} placeholder="방 이름 입력" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} />
          {supportsFriends ? <>
          <div className="chat-friend-heading"><label className="chat-create-label" htmlFor="chat-friend-search">친구 추가</label><span>{selectedIds.length}명 선택</span></div>
          <input id="chat-friend-search" className="chat-create-input" type="search" placeholder="친구 이름 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
          {selectedIds.length > 0 && <div className="chat-selected-friends" aria-label="선택한 친구">{friends.filter((friend) => selectedIds.includes(friend.id)).map((friend) => <button type="button" key={friend.id} onClick={() => toggleFriend(friend.id)} aria-label={`${friend.name} 선택 취소`}>{friend.name} <span aria-hidden="true">×</span></button>)}</div>}
          <div className="chat-friend-list" aria-label="친구 목록" aria-busy={friendsStatus === 'loading'}>
            {friendsStatus === 'loading' ? <p className="chat-feedback" role="status">친구 목록을 불러오는 중이에요.</p> : friendsStatus === 'error' ? <div className="chat-feedback" role="alert"><p>{friendError}</p><button type="button" className="chat-retry" onClick={() => { setFriendsStatus('loading'); setRetry((value) => value + 1); }}>다시 시도</button></div> : visibleFriends.length === 0 ? <p className="chat-feedback">{friends.length ? '검색된 친구가 없어요.' : '추가할 수 있는 친구가 없어요.'}</p> : visibleFriends.map((friend) => (
              <label className={`chat-friend-row${selectedIds.includes(friend.id) ? ' is-selected' : ''}`} key={friend.id}>
                <span className="chat-friend-avatar" aria-hidden="true">{friend.name.slice(-2)}</span><span>{friend.name}</span>
                <input type="checkbox" checked={selectedIds.includes(friend.id)} onChange={() => toggleFriend(friend.id)} aria-label={`${friend.name} 추가`} />
              </label>
            ))}
          </div>
          </> : <>
            <label className="chat-create-label chat-member-label" htmlFor="chat-member-ids">초대할 회원 ID</label>
            <input id="chat-member-ids" className="chat-create-input" placeholder="예: 2, 3" aria-describedby="chat-member-help" value={memberIdsInput} onChange={(e) => { setMemberIdsInput(e.target.value); setError(''); }} />
            <p id="chat-member-help" className="chat-member-help">상대방의 숫자 회원 ID를 쉼표나 공백으로 구분해 입력해 주세요. 본인은 자동으로 참여합니다.</p>
          </>}
        </fieldset>
        <p className="chat-create-error" role="alert">{error}</p>
        <div className="chat-create-actions">
          <button type="button" className="chat-create-cancel" disabled={saving} onClick={onClose}>취소</button>
          <button type="submit" className="chat-create-confirm" disabled={saving || (supportsFriends && friendsStatus !== 'ready')}>{saving ? '생성 중…' : '생성'}</button>
        </div>
      </form>
    </dialog>
  );
}
