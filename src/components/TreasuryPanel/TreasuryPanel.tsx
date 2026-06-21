import { useState } from 'react';
import type { Warband, TransactionEntry } from '../../types/warband';
import styles from './TreasuryPanel.module.scss';

interface TreasuryPanelProps {
  warband: Warband;
  onUpdate: (updated: Warband) => void;
}

export default function TreasuryPanel({ warband, onUpdate }: TreasuryPanelProps) {
  const [editingGold, setEditingGold] = useState(false);
  const [goldInput, setGoldInput] = useState('');
  const [editingWyrdstone, setEditingWyrdstone] = useState(false);
  const [wyrdstoneInput, setWyrdstoneInput] = useState('');
  const [logOpen, setLogOpen] = useState(false);
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function commitGold() {
    setEditingGold(false);
    const value = parseInt(goldInput, 10);
    if (!isNaN(value)) {
      onUpdate({ ...warband, goldCrowns: Math.max(0, value) });
    }
  }

  function commitWyrdstone() {
    setEditingWyrdstone(false);
    const value = parseInt(wyrdstoneInput, 10);
    if (!isNaN(value)) {
      onUpdate({ ...warband, wyrdstoneFragments: Math.max(0, value) });
    }
  }

  const transactionLog = warband.transactionLog ?? [];

  function addTransaction() {
    const amount = Number(txAmount);
    if (!txDesc.trim() || !Number.isFinite(amount) || !Number.isInteger(amount)) return;
    const entry: TransactionEntry = {
      id: crypto.randomUUID(),
      description: txDesc.trim(),
      amount,
    };
    onUpdate({ ...warband, transactionLog: [...transactionLog, entry] });
    setTxDesc('');
    setTxAmount('');
  }

  function deleteTransaction(id: string) {
    onUpdate({
      ...warband,
      transactionLog: transactionLog.filter((e) => e.id !== id),
    });
    setConfirmDeleteId(null);
  }

  const logCount = transactionLog.length;

  return (
    <div className={styles.panel}>
      <div className={styles.statRow}>
        <div className={styles.stat}>
          <span className={styles.statLabelGold}>Gold</span>
          {editingGold ? (
            <input
              className={styles.statInput}
              type="number"
              value={goldInput}
              onChange={(e) => setGoldInput(e.target.value)}
              onBlur={commitGold}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              autoFocus
              aria-label="Gold Crowns"
            />
          ) : (
            <button
              className={`${styles.statValue} ${styles.statValueGold}`}
              onClick={() => { setGoldInput(String(warband.goldCrowns)); setEditingGold(true); }}
              aria-label={`Gold Crowns: ${warband.goldCrowns}. Tap to edit.`}
            >
              {warband.goldCrowns}
            </button>
          )}
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabelWyrdstone}>Wyrdstone</span>
          {editingWyrdstone ? (
            <input
              className={styles.statInput}
              type="number"
              value={wyrdstoneInput}
              onChange={(e) => setWyrdstoneInput(e.target.value)}
              onBlur={commitWyrdstone}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              autoFocus
              aria-label="Wyrdstone Fragments"
            />
          ) : (
            <button
              className={`${styles.statValue} ${styles.statValueWyrdstone}`}
              onClick={() => { setWyrdstoneInput(String(warband.wyrdstoneFragments)); setEditingWyrdstone(true); }}
              aria-label={`Wyrdstone Fragments: ${warband.wyrdstoneFragments}. Tap to edit.`}
            >
              {warband.wyrdstoneFragments}
            </button>
          )}
        </div>
      </div>

      <button
        className={styles.logToggle}
        onClick={() => setLogOpen((v) => !v)}
        aria-expanded={logOpen}
      >
        Transaction Log{logCount > 0 ? <span className={styles.countBadge}>{logCount}</span> : null}
        <span className={styles.logChevron} aria-hidden="true">{logOpen ? '▲' : '▼'}</span>
      </button>

      {logOpen && (
        <div className={styles.log}>
          {transactionLog.map((entry) => (
            <div key={entry.id} className={styles.logEntry}>
              <span className={styles.logDesc}>{entry.description}</span>
              <span className={styles.logAmount}>
                {entry.amount > 0 ? `+${entry.amount}` : entry.amount}
              </span>
              <button
                className={styles.logDelete}
                onClick={() => setConfirmDeleteId(entry.id)}
                aria-label={`Delete transaction: ${entry.description}`}
              >
                ×
              </button>
            </div>
          ))}

          <div className={styles.addRow}>
            <input
              className={styles.addDesc}
              type="text"
              placeholder="Description"
              value={txDesc}
              onChange={(e) => setTxDesc(e.target.value)}
              aria-label="Transaction description"
            />
            <input
              className={styles.addAmount}
              type="number"
              placeholder="Amount"
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTransaction()}
              aria-label="Transaction amount"
            />
            <button
              className={styles.addBtn}
              onClick={addTransaction}
              disabled={!txDesc.trim() || !Number.isFinite(Number(txAmount)) || !Number.isInteger(Number(txAmount))}
            >
              + Add
            </button>
          </div>
        </div>
      )}

      {confirmDeleteId !== null && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="tx-delete-title">
          <div className={styles.sheet}>
            <h2 id="tx-delete-title" className={styles.sheetTitle}>Delete transaction?</h2>
            <p className={styles.sheetBody}>
              <strong>
                {transactionLog.find((e) => e.id === confirmDeleteId)?.description}
              </strong>{' '}
              will be removed.
            </p>
            <div className={styles.sheetActions}>
              <button className={styles.sheetCancelBtn} onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </button>
              <button
                className={styles.sheetDeleteBtn}
                onClick={() => deleteTransaction(confirmDeleteId)}
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
