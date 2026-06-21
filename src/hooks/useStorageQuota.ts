import { useState, useEffect } from 'react';

const STORAGE_BUDGET_BYTES = 5 * 1024 * 1024; // 5 MB fallback when quota is absent
const WARN_THRESHOLD = 0.8;

export function useStorageQuota(): boolean {
  const [nearFull, setNearFull] = useState(false);

  useEffect(() => {
    if (!navigator.storage?.estimate) return;
    navigator.storage
      .estimate()
      .then(({ usage = 0, quota = STORAGE_BUDGET_BYTES }) => {
        setNearFull(usage / quota >= WARN_THRESHOLD);
      })
      .catch(() => {
        // Ignore — banner stays hidden
      });
  }, []);

  return nearFull;
}
