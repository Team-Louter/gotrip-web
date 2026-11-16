import { useEffect, useRef, useState } from 'react';
import './Toast.css';

const AUTO_CLOSE_MS = 4000;

export default function Toast({ message, onClose, tone = 'error' }) {
  const [paused, setPaused] = useState(false);
  const [remainingMs, setRemainingMs] = useState(AUTO_CLOSE_MS);
  const remainingMsRef = useRef(AUTO_CLOSE_MS);

  useEffect(() => {
    if (!message || paused) return undefined;
    const startedAt = Date.now();
    const cycleDuration = remainingMsRef.current;
    const timer = window.setTimeout(() => onClose(''), cycleDuration);
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setRemainingMs(Math.max(0, cycleDuration - elapsed));
    }, 50);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
      const elapsed = Date.now() - startedAt;
      const nextRemaining = Math.max(0, cycleDuration - elapsed);
      remainingMsRef.current = nextRemaining;
      setRemainingMs(nextRemaining);
    };
  }, [message, paused, onClose]);

  if (!message) return null;

  return (
    <div className="auth-toast-region">
      <div
        className="auth-toast"
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
        <button className="auth-toast-close" type="button" aria-label="알림 닫기" onClick={() => onClose('')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
        <div className="auth-toast-timer">
          <div className="auth-toast-timer-track" role="progressbar" aria-label="알림이 사라지기까지 남은 시간" aria-valuemin={0} aria-valuemax={AUTO_CLOSE_MS} aria-valuenow={Math.round(remainingMs)}>
            <span className="auth-toast-timer-bar" style={{ width: `${(remainingMs / AUTO_CLOSE_MS) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
