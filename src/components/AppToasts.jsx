import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Toast from './Toast';

const listeners = new Set();
let toastSequence = 0;
const MAX_VISIBLE_TOASTS = 2;

export function showToast(message, tone = 'error') {
  if (!message) return;
  const item = { id: ++toastSequence, message, tone };
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
  const [dialogTarget, setDialogTarget] = useState(null);
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
    const updateDialogTarget = () => {
      setDialogTarget(document.querySelector('dialog[open]'));
    };
    updateDialogTarget();
    const observer = new MutationObserver(updateDialogTarget);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
    return () => observer.disconnect();
  }, []);

  const stack = (
    <div className={`auth-toast-stack${dialogTarget ? ' auth-toast-stack-in-dialog' : ''}`} aria-label="알림">
      {activeToasts.map((item) => (
        <Toast
          key={item.id}
          message={item.message}
          tone={item.tone}
          onClose={() => closeToast(item.id)}
        />
      ))}
    </div>
  );

  return dialogTarget ? createPortal(stack, dialogTarget) : stack;
}
