import { useState, useRef } from 'react';
import type { StatLine } from '../../types/reference';
import styles from './StatRow.module.scss';

const STAT_KEYS: (keyof StatLine)[] = ['M', 'WS', 'BS', 'S', 'T', 'W', 'I', 'A', 'Ld'];

interface StatRowProps {
  stats: StatLine;
  onChange: (updated: StatLine) => void;
}

export default function StatRow({ stats, onChange }: StatRowProps) {
  const [editing, setEditing] = useState<keyof StatLine | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit(key: keyof StatLine) {
    setEditing(key);
    setDraftValue(String(stats[key]));
    // Focus happens via autoFocus on the input
  }

  function commitEdit(key: keyof StatLine) {
    const parsed = parseInt(draftValue, 10);
    const value = isNaN(parsed) ? 0 : parsed;
    onChange({ ...stats, [key]: value });
    setEditing(null);
  }

  function handleKeyDown(e: React.KeyboardEvent, key: keyof StatLine) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit(key);
    } else if (e.key === 'Escape') {
      setEditing(null);
    }
  }

  return (
    <div className={styles.row} role="group" aria-label="Stat line">
      {STAT_KEYS.map((key) => (
        <div key={key} className={styles.cell}>
          <span className={styles.label}>{key}</span>
          {editing === key ? (
            <input
              ref={inputRef}
              className={styles.input}
              type="number"
              value={draftValue}
              autoFocus
              onChange={(e) => setDraftValue(e.target.value)}
              onBlur={() => commitEdit(key)}
              onKeyDown={(e) => handleKeyDown(e, key)}
              aria-label={`${key} value`}
            />
          ) : (
            <button
              className={styles.value}
              onClick={() => startEdit(key)}
              aria-label={`Edit ${key}, current value ${stats[key]}`}
            >
              {stats[key]}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
