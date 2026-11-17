import { useEffect, useRef } from 'react';

export default function ChatRoomConfirmDialog({ title, message, confirmLabel, onClose, onConfirm }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="chat-room-confirm-dialog"
      aria-labelledby="chat-room-confirm-title"
      aria-describedby="chat-room-confirm-message"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === dialogRef.current) onClose(); }}
    >
      <div className="chat-room-confirm-content">
        <h2 id="chat-room-confirm-title">{title}</h2>
        <p id="chat-room-confirm-message">{message}</p>
        <div className="chat-room-confirm-actions">
          <button type="button" className="is-secondary" autoFocus onClick={onClose}>취소</button>
          <button type="button" className="is-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </dialog>
  );
}
