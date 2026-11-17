import { useEffect, useRef, useState } from 'react';
import '../styles/toast.css';

export function useToast() {
  const [notice, setNotice] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  function notify(message, type = 'error') {
    clearTimeout(timer.current);
    setNotice({ message, type });
    timer.current = setTimeout(() => setNotice(null), 3500);
  }

  return [notice, notify];
}

export default function Toast({ notice }) {
  return (
    <div className="app-toast-region" role="status" aria-live="polite" aria-atomic="true">
      {notice && <div className={`app-toast app-toast-${notice.type}`}>{notice.message}</div>}
    </div>
  );
}
