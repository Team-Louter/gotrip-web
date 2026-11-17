import { useEffect, useRef, useState } from 'react';
import { chatCounterpartProfileImage } from '../services/profileApi.js';

const PROFILE_IMAGE_SIZE = 320;
const MAX_PROFILE_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_PROFILE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function prepareProfileImage(file) {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_PROFILE_TYPES.has(file.type)) {
      reject(new Error('JPG, PNG 또는 WebP 사진을 선택해 주세요.'));
      return;
    }
    if (file.size > MAX_PROFILE_FILE_SIZE) {
      reject(new Error('프로필 사진은 8MB 이하로 선택해 주세요.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('사진을 불러오지 못했습니다.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('이미지 파일을 확인해 주세요.'));
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = PROFILE_IMAGE_SIZE;
        canvas.height = PROFILE_IMAGE_SIZE;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('사진을 준비하지 못했습니다.'));
          return;
        }
        const scale = Math.max(PROFILE_IMAGE_SIZE / image.width, PROFILE_IMAGE_SIZE / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, PROFILE_IMAGE_SIZE, PROFILE_IMAGE_SIZE);
        context.drawImage(image, (PROFILE_IMAGE_SIZE - width) / 2, (PROFILE_IMAGE_SIZE - height) / 2, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

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
      setProfileImage(await prepareProfileImage(file));
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
