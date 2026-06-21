import { useState } from 'react';
import { useWarband } from '../../hooks/useWarband';
import { useStorageQuota } from '../../hooks/useStorageQuota';
import styles from './StorageWarningBanner.module.scss';

export default function StorageWarningBanner() {
  const { storageError } = useWarband();
  const nearFull = useStorageQuota();
  const [dismissed, setDismissed] = useState(false);

  if (storageError) {
    return (
      <div className={`storage-warning-banner ${styles.banner} ${styles.error}`} role="alert">
        <span>{storageError}</span>
      </div>
    );
  }

  if (!nearFull || dismissed) {
    return null;
  }

  return (
    <div className={`storage-warning-banner ${styles.banner}`} role="alert">
      <span>Storage nearly full — export your data before it fills up.</span>
      <button
        type="button"
        className={styles.dismiss}
        aria-label="Dismiss storage warning"
        onClick={() => setDismissed(true)}
      >
        ✕
      </button>
    </div>
  );
}
