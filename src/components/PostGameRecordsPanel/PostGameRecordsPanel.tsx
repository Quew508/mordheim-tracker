import { useState } from 'react';
import type { Warband, LootEntry } from '../../types/warband';
import styles from './PostGameRecordsPanel.module.scss';

interface PostGameRecordsPanelProps {
  warband: Warband;
  onUpdate: (updated: Warband) => void;
}

type ConfirmDelete =
  | { type: 'achievement'; index: number; label: string }
  | { type: 'loot'; id: string; label: string }
  | null;

export default function PostGameRecordsPanel({ warband, onUpdate }: PostGameRecordsPanelProps) {
  const [achievementInput, setAchievementInput] = useState('');
  const [lootDesc, setLootDesc] = useState('');
  const [lootGold, setLootGold] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete>(null);

  const achievements = warband.achievements ?? [];
  const lootLog = warband.lootLog ?? [];

  function addAchievement() {
    const text = achievementInput.trim();
    if (!text) return;
    onUpdate({ ...warband, achievements: [...achievements, text] });
    setAchievementInput('');
  }

  function deleteAchievement(index: number) {
    onUpdate({ ...warband, achievements: achievements.filter((_, i) => i !== index) });
    setConfirmDelete(null);
  }

  function addLootEntry() {
    const desc = lootDesc.trim();
    if (!desc) return;
    const gv = lootGold.trim();
    let goldValue: number | null = null;
    if (gv !== '') {
      if (!/^\d+$/.test(gv)) return;
      goldValue = Number(gv);
    }
    const entry: LootEntry = {
      id: crypto.randomUUID(),
      description: desc,
      goldValue,
    };
    onUpdate({ ...warband, lootLog: [...lootLog, entry] });
    setLootDesc('');
    setLootGold('');
  }

  function deleteLootEntry(id: string) {
    onUpdate({ ...warband, lootLog: lootLog.filter((e) => e.id !== id) });
    setConfirmDelete(null);
  }

  function handleConfirmDelete() {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'achievement') {
      deleteAchievement(confirmDelete.index);
    } else {
      deleteLootEntry(confirmDelete.id);
    }
  }

  const confirmDeleteLabel = confirmDelete?.label ?? '';

  const lootGoldValid = lootGold.trim() === '' || /^\d+$/.test(lootGold.trim());

  return (
    <div className={styles.panel}>
      {/* Achievements */}
      <h3 className={styles.subheading}>Achievements</h3>

      {achievements.length > 0 && (
        <ul className={styles.list} aria-label="Achievements list">
          {achievements.map((text, i) => (
            <li key={`${i}-${text}`} className={styles.listEntry}>
              <span className={styles.entryText}>{text}</span>
              <button
                className={styles.deleteBtn}
                onClick={() => setConfirmDelete({ type: 'achievement', index: i, label: text })}
                aria-label={`Delete achievement: ${text}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.addRow}>
        <input
          className={styles.addInput}
          type="text"
          placeholder="New achievement"
          value={achievementInput}
          onChange={(e) => setAchievementInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addAchievement()}
          aria-label="Achievement text"
        />
        <button
          className={styles.addBtn}
          onClick={addAchievement}
          disabled={!achievementInput.trim()}
        >
          + Add
        </button>
      </div>

      {/* Loot Log */}
      <h3 className={styles.subheading}>Loot Log</h3>

      {lootLog.length > 0 && (
        <ul className={styles.list} aria-label="Loot log list">
          {lootLog.map((entry) => (
            <li key={entry.id} className={styles.listEntry}>
              <span className={styles.entryText}>{entry.description}</span>
              <span className={styles.entryGold}>
                {entry.goldValue !== null ? `${entry.goldValue} gc` : '—'}
              </span>
              <button
                className={styles.deleteBtn}
                onClick={() => setConfirmDelete({ type: 'loot', id: entry.id, label: entry.description })}
                aria-label={`Delete loot entry: ${entry.description}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.addRow}>
        <input
          className={styles.addInput}
          type="text"
          placeholder="Description"
          value={lootDesc}
          onChange={(e) => setLootDesc(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addLootEntry()}
          aria-label="Loot description"
        />
        <input
          className={styles.addGold}
          type="number"
          placeholder="gc"
          value={lootGold}
          onChange={(e) => setLootGold(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addLootEntry()}
          aria-label="Loot gold value"
        />
        <button
          className={styles.addBtn}
          onClick={addLootEntry}
          disabled={!lootDesc.trim() || !lootGoldValid}
        >
          + Add
        </button>
      </div>

      {/* Delete confirmation sheet */}
      {confirmDelete !== null && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pgr-delete-title"
        >
          <div className={styles.sheet}>
            <h2 id="pgr-delete-title" className={styles.sheetTitle}>Delete entry?</h2>
            <p className={styles.sheetBody}>
              <strong>{confirmDeleteLabel}</strong> will be removed.
            </p>
            <div className={styles.sheetActions}>
              <button
                className={styles.sheetCancelBtn}
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                className={styles.sheetDeleteBtn}
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
