import { useEffect, useRef, useState } from 'react';
import { getToken } from '../api/session';
import { chatApi } from '../services/chatApi';
import { matchesMember } from '../services/memberApi';
import { chatCounterpartProfileImage } from '../services/profileApi.js';
import prepareChatRoomProfileImage from '../data/prepareChatRoomProfileImage.js';
import { showErrorToast } from './AppToasts';
import ProfileAvatar from './ProfileAvatar.jsx';
import { SkeletonFriendRows, SkeletonPanel } from './Skeleton';

export default function CreateChatRoom({ onClose, onCreated }) {
  const dialogRef = useRef(null);
  const fileInputRef = useRef(null);
  const submitted = useRef(false);
  const [name, setName] = useState('');
  const supportsFriends = chatApi.capabilities.friends;
  const [query, setQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [profileImage, setProfileImage] = useState('');
  const [imageError, setImageError] = useState('');
  const [loadingImage, setLoadingImage] = useState(false);
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

  async function chooseProfileImage(event) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setLoadingImage(true);
    try {
      setProfileImage(await prepareChatRoomProfileImage(file));
      setImageError('');
    } catch (reason) {
      setImageError(reason.message || '프로필 사진을 준비하지 못했습니다.');
    } finally {
      setLoadingImage(false);
    }
  }

  async function createRoom(e) {
    e.preventDefault();
    if (submitted.current) return;
    if (!name.trim()) { showErrorToast('방 이름을 입력해 주세요.'); return; }
    if (!selectedIds.length) { setError('친구를 한 명 이상 선택해 주세요.'); return; }
    submitted.current = true;
    setSaving(true); setError('');
    try {
      let room = await chatApi.createChatRoom({ name, memberIds: selectedIds });
      if (profileImage) {
        try {
          const roomProfileImage = await chatApi.updateChatRoomProfileImage(room.id, profileImage);
          room = { ...room, roomProfileImage };
        } catch {
          showErrorToast('채팅방은 만들었지만 프로필 사진을 저장하지 못했습니다. 채팅방에서 다시 변경해 주세요.');
        }
      }
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
        <div className="chat-create-profile">
          <img src={profileImage || chatCounterpartProfileImage({})} alt="채팅방 프로필 미리보기" />
          <div className="chat-create-profile-actions">
            <button type="button" className="chat-create-profile-button" disabled={saving || loadingImage} onClick={() => fileInputRef.current?.click()}>{loadingImage ? '사진 준비 중…' : '사진 선택'}</button>
            <input ref={fileInputRef} className="chat-create-profile-file" type="file" accept="image/jpeg,image/png,image/webp" aria-label="채팅방 프로필 사진 선택" disabled={saving || loadingImage} onChange={chooseProfileImage} />
          </div>
        </div>
        {imageError && <p className="chat-create-error" role="alert">{imageError}</p>}
        <fieldset disabled={saving}>
          <label className="chat-create-label" htmlFor="chat-create-name">방 이름</label>
          <input id="chat-create-name" className="chat-create-input" autoFocus maxLength={chatApi.maxRoomNameLength} placeholder="방 이름 입력" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} />
          {supportsFriends ? <>
          <div className="chat-friend-heading"><label className="chat-create-label" htmlFor="chat-friend-search">초대할 친구{friendsStatus === 'ready' ? ` ${friends.length}명` : ''}</label><div className="chat-recipient-actions"><button type="button" disabled={friendsStatus !== 'ready' || !friends.some((friend) => friend.id != null)} onClick={() => { const ids = friends.filter((friend) => friend.id != null).map((friend) => friend.id); setSelectedIds(ids.every((id) => selectedIds.includes(id)) ? [] : ids); }}>{friends.some((friend) => friend.id != null) && friends.filter((friend) => friend.id != null).every((friend) => selectedIds.includes(friend.id)) ? '선택 해제' : '전체 선택'}</button><span>{selectedIds.length}명 선택</span></div></div>
          <input id="chat-friend-search" className="chat-create-input" type="search" placeholder="친구 닉네임 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
          {selectedIds.length > 0 && <div className="chat-selected-friends" aria-label="선택한 친구">{friends.filter((friend) => selectedIds.includes(friend.id)).map((friend) => <button type="button" key={friend.id} onClick={() => toggleFriend(friend.id)} aria-label={`${friend.name} 선택 취소`}>{friend.name} <span aria-hidden="true">×</span></button>)}</div>}
          <div className="chat-friend-list" aria-label="친구 목록" aria-busy={friendsStatus === 'loading'}>
            {friendsStatus === 'loading' ? <SkeletonPanel label="친구 목록을 불러오는 중입니다." className="chat-create-friends-skeleton"><SkeletonFriendRows count={4} action="check" /></SkeletonPanel> : friendsStatus === 'error' ? <div className="chat-feedback" role="alert"><p>{friendError}</p><button type="button" className="chat-retry" onClick={() => { setFriendsStatus('loading'); setRetry((value) => value + 1); }}>다시 시도</button></div> : visibleFriends.length === 0 ? <p className="chat-feedback">{friends.length ? '검색된 친구가 없어요.' : '추가할 수 있는 친구가 없어요.'}</p> : visibleFriends.map((friend) => (
              <label className={`chat-friend-row${selectedIds.includes(friend.id) ? ' is-selected' : ''}${friend.id == null ? ' is-unavailable' : ''}`} key={friend.id ?? friend.loginId}>
                <ProfileAvatar className="chat-friend-avatar" imageUrl={friend.profileImageUrl} /><span className="chat-friend-identity">{friend.name}{friend.loginId && <small className="chat-friend-login">@{friend.loginId}</small>}</span>
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
          <button type="submit" className="chat-create-confirm" disabled={saving || loadingImage || friendsStatus !== 'ready' || !selectedIds.length || !getToken()}>{saving ? '생성 중…' : loadingImage ? '사진 준비 중…' : '생성'}</button>
        </div>
      </form>
    </dialog>
  );
}
