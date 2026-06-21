import { useState } from 'react';
import styles from './FreeTextList.module.scss';

interface FreeTextListProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}

export default function FreeTextList({
  items,
  onChange,
  placeholder = 'Add entry…',
  addLabel = '+ Add',
}: FreeTextListProps) {
  const [draft, setDraft] = useState('');

  function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...items, trimmed]);
    setDraft('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  function handleRemove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className={styles.list}>
      {items.length > 0 && (
        <ul className={styles.items}>
          {items.map((item, i) => (
            <li key={`${i}-${item}`} className={styles.item}>
              <span className={styles.text}>{item}</span>
              <button
                className={styles.removeBtn}
                onClick={() => handleRemove(i)}
                aria-label={`Remove ${item}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.addRow}>
        <input
          type="text"
          className={styles.input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <button className={styles.addBtn} onClick={handleAdd} disabled={!draft.trim()}>
          {addLabel}
        </button>
      </div>
    </div>
  );
}
