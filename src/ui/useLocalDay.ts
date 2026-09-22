import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Refresh calendar context at midnight and after returning from the background. */
export function useLocalDay() {
  const [day, setDay] = useState(() => localDay());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function refresh() {
      clearTimeout(timer);
      setDay(localDay());
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(refresh, Math.max(1000, midnight.getTime() - now.getTime() + 50));
    }
    refresh();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => { clearTimeout(timer); subscription.remove(); };
  }, []);
  return day;
}
