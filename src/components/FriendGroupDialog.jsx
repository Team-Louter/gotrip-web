import { useEffect, useRef, useState } from 'react';
import { showErrorToast, showSuccessToast } from './AppToasts';

export default function FriendGroupDialog({ group, friends, busy = false, onClose, onSave, onDelete }) {
  const dialogRef = useRef(null);
  const [name, setName] = useState(group?.name ?? '');
  const [friendIds, setFriendIds] = useState((group?.friendIds ?? []).map(String));
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  function toggleFriend(id) {
    const key = String(id);
    setFriendIds((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  function submit(event) {
    event.preventDefault();
    const title = name.trim();
    if (!title) { showErrorToast('그룹 이름을 입력해 주세요.'); return; }
    onSave({ id: group?.id ?? crypto.randomUUID(), name: title, friendIds });
  }

  return (
    <dialog ref={dialogRef} className="friend-group-dialog" aria-labelledby="friend-group-dialog-title"
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
      onClick={(event) => { if (event.target === dialogRef.current && !busy) onClose(); }}>
      {confirmDelete ? <div className="friend-group-confirm">
        <h2 id="friend-group-dialog-title">그룹 삭제</h2>
        <p>‘{group?.name}’ 그룹을 삭제할까요?</p>
        <div className="friend-group-dialog-actions">
          <button type="button" className="is-secondary" disabled={busy} onClick={() => { setConfirmDelete(false); showSuccessToast('그룹 삭제를 취소했습니다.'); }}>취소</button>
          <button type="button" className="is-danger" disabled={busy} onClick={() => onDelete(group.id)}>{busy ? '삭제 중…' : '삭제하기'}</button>
        </div>
      </div> : <form className="friend-group-form" onSubmit={submit}>
        <h2 id="friend-group-dialog-title">{group ? '그룹 수정' : '그룹 추가'}</h2>
        <label htmlFor="friend-group-name">그룹 이름</label>
        <input id="friend-group-name" autoFocus maxLength={40} value={name} onChange={(event) => setName(event.target.value)} disabled={busy} />
        <div className="friend-group-members-heading"><h3>친구 선택</h3><span>{friendIds.length}명</span></div>
        <div className="friend-group-members" aria-label="그룹에 추가할 친구">
          {friends.length ? friends.map((friend) => <label className="friend-group-member" key={friend.friendshipId ?? friend.id}>
            <span><strong>{friend.name}</strong><small>@{friend.loginId}</small></span>
            <input type="checkbox" checked={friendIds.includes(String(friend.memberId ?? friend.id))} onChange={() => toggleFriend(friend.memberId ?? friend.id)} disabled={busy || (friend.memberId ?? friend.id) == null} aria-label={`${friend.name} 그룹에 포함`} />
          </label>) : <p className="friend-group-empty">그룹에 추가할 친구가 아직 없어요.</p>}
        </div>
        <div className="friend-group-dialog-actions">
          {group && <button type="button" className="is-danger-text" disabled={busy} onClick={() => setConfirmDelete(true)}>삭제</button>}
          <span />
          <button type="button" className="is-secondary" disabled={busy} onClick={onClose}>취소</button>
          <button type="submit" className="is-primary" disabled={busy}>{busy ? '저장 중…' : '저장'}</button>
        </div>
      </form>}
    </dialog>
  );
}
