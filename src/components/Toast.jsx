import { useEffect, useState } from 'react';
import './Toast.css';

export const TOAST_DURATION = 3000;
const EXIT_DURATION = 160;

function Toast({ message, onClose, tone = 'error', expiresAt }) {
  const [mountedAt] = useState(() => performance.now());
  const deadline = expiresAt ?? mountedAt + TOAST_DURATION;
  const elapsed = Math.max(0, mountedAt + TOAST_DURATION - deadline);
  const [closingAt, setClosingAt] = useState(null);

  useEffect(() => {
    if (!message || closingAt !== null) return undefined;
    const timer = window.setTimeout(
      () => setClosingAt(deadline),
      Math.max(0, deadline - EXIT_DURATION - performance.now()),
    );
    return () => window.clearTimeout(timer);
  }, [message, closingAt, deadline]);

  useEffect(() => {
    if (closingAt === null) return undefined;
    const timer = window.setTimeout(() => onClose(''), Math.max(0, closingAt - performance.now()));
    return () => window.clearTimeout(timer);
  }, [closingAt, onClose]);

  if (!message) return null;

  return (
    <div className="auth-toast-region">
      <div
        className={`auth-toast${closingAt !== null ? ' is-closing' : ''}`}
        data-tone={tone}
        role={tone === 'error' ? 'alert' : 'status'}
        aria-atomic="true"
      >
        <svg className="auth-toast-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          {(tone === 'success' || tone === 'deleted') ? <path d="m8 12 3 3 5-6" /> : <path d="M12 7v6m0 3v1" />}
        </svg>
        <span className="auth-toast-message">{message}</span>
        <button className="auth-toast-close" type="button" aria-label="알림 닫기" onClick={() => setClosingAt(performance.now() + EXIT_DURATION)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
        <span
          className="auth-toast-progress"
          aria-hidden="true"
          style={{ animationDuration: `${TOAST_DURATION}ms`, animationDelay: `-${elapsed}ms` }}
        />
      </div>
    </div>
  );
}

export default Toast;
