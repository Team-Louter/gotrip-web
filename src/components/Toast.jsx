import { useEffect, useState } from 'react';
import './Toast.css';

function Toast({ message, onClose, tone = 'error' }) {
  const [paused, setPaused] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!message || paused || closing) return undefined;
    const timer = window.setTimeout(() => setClosing(true), 6000);
    return () => window.clearTimeout(timer);
  }, [message, paused, closing]);

  useEffect(() => {
    if (!closing) return undefined;
    const timer = window.setTimeout(() => onClose(''), 160);
    return () => window.clearTimeout(timer);
  }, [closing, onClose]);

  if (!message) return null;

  return (
    <div className="auth-toast-region">
      <div
        className={`auth-toast${closing ? ' is-closing' : ''}`}
        data-tone={tone}
        role={tone === 'error' ? 'alert' : 'status'}
        aria-atomic="true"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}
      >
        <svg className="auth-toast-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          {tone === 'success' ? <path d="m8 12 3 3 5-6" /> : <path d="M12 7v6m0 3v1" />}
        </svg>
        <span className="auth-toast-message">{message}</span>
        <button className="auth-toast-close" type="button" aria-label="알림 닫기" onClick={() => setClosing(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </div>
    </div>
  );
}

export default Toast;
