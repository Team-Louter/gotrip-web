import { useEffect, useRef, useState } from 'react';
import './Toast.css';

const TOAST_DURATION_MS = 3000;

function Toast({ message, onClose, tone = 'error' }) {
  const [paused, setPaused] = useState(false);
  const [closing, setClosing] = useState(false);
  const pausedRef = useRef(false);
  const hoveredRef = useRef(false);
  const focusedRef = useRef(false);
  const remainingRef = useRef(TOAST_DURATION_MS);
  const startedAtRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!message || paused || closing) return undefined;
    startedAtRef.current = Date.now();
    timerRef.current = window.setTimeout(() => setClosing(true), remainingRef.current);
    return () => window.clearTimeout(timerRef.current);
  }, [message, paused, closing]);

  useEffect(() => {
    if (!closing) return undefined;
    const timer = window.setTimeout(() => onClose(''), 160);
    return () => window.clearTimeout(timer);
  }, [closing, onClose]);

  function pauseTimer() {
    if (pausedRef.current || closing) return;
    pausedRef.current = true;
    window.clearTimeout(timerRef.current);
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current));
    setPaused(true);
  }

  function resumeTimer() {
    if (hoveredRef.current || focusedRef.current || !pausedRef.current) return;
    pausedRef.current = false;
    setPaused(false);
  }

  if (!message) return null;

  return (
    <div className="auth-toast-region">
      <div
        className={`auth-toast${paused ? ' is-paused' : ''}${closing ? ' is-closing' : ''}`}
        data-tone={tone}
        role={tone === 'error' ? 'alert' : 'status'}
        aria-atomic="true"
        onPointerEnter={() => { hoveredRef.current = true; pauseTimer(); }}
        onPointerLeave={() => { hoveredRef.current = false; resumeTimer(); }}
        onFocus={() => { focusedRef.current = true; pauseTimer(); }}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { focusedRef.current = false; resumeTimer(); } }}
      >
        <svg className="auth-toast-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          {tone === 'success' ? <path d="m8 12 3 3 5-6" /> : <path d="M12 7v6m0 3v1" />}
        </svg>
        <span className="auth-toast-message">{message}</span>
        <button className="auth-toast-close" type="button" aria-label="알림 닫기" onClick={() => setClosing(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
        <span className="auth-toast-progress" aria-hidden="true" />
      </div>
    </div>
  );
}

export default Toast;
