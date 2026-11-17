import { useEffect, useRef, useState } from 'react';
import { chatCounterpartProfileImage } from '../services/profileApi.js';
import prepareChatRoomProfileImage from '../data/prepareChatRoomProfileImage.js';

export default function ChatRoomEditDialog({ room, onClose, onSave }) {
  const dialogRef = useRef(null);
  const fileInputRef = useRef(null);
  const [name, setName] = useState(room.name);
  const [profileImage, setProfileImage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  async function chooseProfileImage(event) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setLoadingImage(true);
    try {
      setProfileImage(await prepareChatRoomProfileImage(file));
      setError('');
    } catch (reason) {
      setError(reason.message || '프로필 사진을 변경하지 못했습니다.');
    } finally {
      setLoadingImage(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 100) {
      setError('채팅방 이름을 1~100자로 입력해 주세요.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ name: trimmedName, profileImage });
      onClose();
    } catch (reason) {
      setError(reason.message || '채팅방을 수정하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="chat-room-action-dialog" aria-labelledby="chat-room-edit-title"
      onCancel={(event) => { event.preventDefault(); if (!saving) onClose(); }}
      onClick={(event) => { if (event.target === dialogRef.current && !saving) onClose(); }}>
      <form className="chat-room-action-form" noValidate onSubmit={submit}>
        <h2 id="chat-room-edit-title">채팅방 수정</h2>
        <div className="chat-room-profile-edit">
          <img src={profileImage || chatCounterpartProfileImage(room)} alt="채팅방 프로필 미리보기" />
          <div>
            <button type="button" className="chat-room-profile-change" disabled={saving || loadingImage} onClick={() => fileInputRef.current?.click()}>{loadingImage ? '사진 준비 중…' : '사진 변경'}</button>
            <input ref={fileInputRef} className="chat-room-profile-file" type="file" accept="image/jpeg,image/png,image/webp" aria-label="채팅방 프로필 사진 선택" disabled={saving || loadingImage} onChange={chooseProfileImage} />
          </div>
        </div>
        <label htmlFor="chat-room-name-edit">채팅방 이름</label>
        <input id="chat-room-name-edit" autoFocus maxLength={100} value={name} disabled={saving} onChange={(event) => { setName(event.target.value); setError(''); }} />
        <p className="chat-room-action-error" role="alert">{error}</p>
        <div className="chat-room-action-buttons">
          <button type="button" className="is-secondary" disabled={saving || loadingImage} onClick={onClose}>취소</button>
          <button type="submit" className="is-primary" disabled={saving || loadingImage}>{saving ? '저장 중…' : loadingImage ? '사진 준비 중…' : '저장'}</button>
        </div>
      </form>
    </dialog>
  );
}
