import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [toastPortalContainer, setToastPortalContainer] = useState(null);
  const toastPortalRef = useRef(null);
  const toastLayerRef = useRef(null);
  const activeDialogRef = useRef(null);
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
    const updateToastLayer = () => {
      const dialogs = [...document.querySelectorAll('dialog[open], [role="dialog"][aria-modal="true"]')]
        .filter((dialog) => dialog.getClientRects().length > 0);
      const activeDialog = dialogs.at(-1);
      const toastLayer = toastLayerRef.current;

      if (!activeDialog) {
        if (!toastLayer) return;
        toastPortalRef.current = null;
        toastLayerRef.current = null;
        activeDialogRef.current = null;
        setToastPortalContainer(null);
        if (toastLayer.matches(':popover-open')) toastLayer.hidePopover();
        window.setTimeout(() => toastLayer.remove(), 0);
        return;
      }

      if (!toastLayer || activeDialogRef.current !== activeDialog) {
        const nextLayer = document.createElement('div');
        nextLayer.className = 'auth-toast-top-layer';
        nextLayer.setAttribute('popover', 'manual');
        nextLayer.setAttribute('role', 'presentation');
        const nextContainer = document.createElement('div');
        nextContainer.className = 'auth-toast-stack auth-toast-dialog-stack';
        nextLayer.appendChild(nextContainer);
        activeDialog.appendChild(nextLayer);
        toastLayerRef.current = nextLayer;
        toastPortalRef.current = nextContainer;
        activeDialogRef.current = activeDialog;
        setToastPortalContainer(nextContainer);
        nextLayer.showPopover();
        if (toastLayer) {
          if (toastLayer.matches(':popover-open')) toastLayer.hidePopover();
          window.setTimeout(() => toastLayer.remove(), 0);
        }
      }
    };

    updateToastLayer();
    const observer = new MutationObserver(updateToastLayer);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'aria-modal'] });
    window.addEventListener('resize', updateToastLayer);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateToastLayer);
      if (toastLayerRef.current?.matches(':popover-open')) toastLayerRef.current.hidePopover();
      toastPortalRef.current?.remove();
      toastLayerRef.current?.remove();
      toastPortalRef.current = null;
      toastLayerRef.current = null;
      activeDialogRef.current = null;
    };
  }, []);

  return (
    <div className="auth-toast-stack" aria-label="알림">
      {activeToasts.map((item) => (
        <Toast
          key={item.id}
          message={item.message}
          tone={item.tone}
          portalContainer={toastPortalContainer}
          onClose={() => closeToast(item.id)}
        />
      ))}
    </div>
  );
}
