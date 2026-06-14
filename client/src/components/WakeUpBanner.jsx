import { useState, useEffect } from 'react';
import { checkHealth } from '../services/api';

export default function WakeUpBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer;
    let dismissed = false;

    async function ping() {
      try {
        await checkHealth();
        dismissed = true;
        setVisible(false);
      } catch {
        setVisible(true);
        if (!dismissed) timer = setTimeout(ping, 3000);
      }
    }

    ping();
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-amber-50 border border-amber-200 text-amber-800 px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm">
      <svg className="animate-spin h-4 w-4 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Server is waking up, please wait…
    </div>
  );
}
