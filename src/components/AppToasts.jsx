import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Toast, { TOAST_DURATION } from './Toast';

const listeners = new Set();
const popupKeys = new WeakMap();
let toastSequence = 0;
const MAX_VISIBLE_TOASTS = 2;

function getOpenPopup() {
  const dialogs = document.querySelectorAll('dialog:modal');
  return Array.from(dialogs).find((dialog) => dialog.contains(document.activeElement))
    ?? dialogs[dialogs.length - 1]
    ?? document.querySelector('.place-add-backdrop, .pay-modal-backdrop');
}

export function showToast(message, tone = 'error') {
  if (!message) return;
  const item = {
    id: ++toastSequence,
    message,
    tone,
    popup: getOpenPopup(),
    expiresAt: Date.now() + TOAST_DURATION,
  };
  if (item.popup && !popupKeys.has(item.popup)) popupKeys.set(item.popup, item.id);
  listeners.forEach((listener) => listener(item));
}

export function showSuccessToast(message) {
  showToast(message, 'success');
}

export function showErrorToast(message) {
  showToast(message, 'error');
}

export default function AppToasts() {
  const [activeToasts, setActiveToasts] = useState([]);
  const addToast = useCallback((item) => {
    setActiveToasts((current) => [item, ...current].slice(0, MAX_VISIBLE_TOASTS));
  }, []);
  const closeToast = useCallback((id) => {
    setActiveToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    listeners.add(addToast);
    return () => listeners.delete(addToast);
  }, [addToast]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setActiveToasts((current) => {
        const closed = (item) => item.popup && (
          !item.popup.isConnected || item.popup.matches('dialog:not([open])')
        );
        if (!current.some(closed)) return current;
        return current.map((item) => closed(item) ? { ...item, popup: null } : item);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
    return () => observer.disconnect();
  }, []);

  const renderStack = (items, inPopup = false) => (
    <div className={`auth-toast-stack${inPopup ? ' auth-toast-stack-in-dialog' : ''}`} aria-label="알림">
      {items.map((item) => (
        <Toast
          key={item.id}
          message={item.message}
          tone={item.tone}
          expiresAt={item.expiresAt}
          onClose={() => closeToast(item.id)}
        />
      ))}
    </div>
  );

  const popupTargets = new Set(activeToasts.map((item) => item.popup).filter(Boolean));

  return (
    <>
      {renderStack(activeToasts.filter((item) => !item.popup))}
      {Array.from(popupTargets, (popup) => {
        const items = activeToasts.filter((item) => item.popup === popup);
        return createPortal(renderStack(items, true), popup, popupKeys.get(popup));
      })}
    </>
  );
}
