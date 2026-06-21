import { useState } from 'react';
import { createId } from '../../utils/ids';
import type { EquipmentItem } from '../../types/equipment';
import styles from './EquipmentList.module.scss';

interface EquipmentListProps {
  items: EquipmentItem[];
  onChange: (items: EquipmentItem[]) => void;
  /** Optional warband custom library for "Add from Library" */
  libraryItems?: { id: string; name: string; cost: number | null }[];
  /** When provided, renders a "From catalogue" button that opens the EquipmentPicker */
  onOpenCatalogue?: () => void;
}

export default function EquipmentList({ items, onChange, libraryItems = [], onOpenCatalogue }: EquipmentListProps) {
  const [draftName, setDraftName] = useState('');
  const [draftCost, setDraftCost] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  function handleAdd() {
    const name = draftName.trim();
    if (!name) return;
    const cost = draftCost.trim() === '' ? null : Number(draftCost);
    const item: EquipmentItem = {
      id: createId(),
      name,
      cost: isNaN(cost as number) ? null : cost,
      source: 'custom',
    };
    onChange([...items, item]);
    setDraftName('');
    setDraftCost('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
  }

  function handleRemove(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  function handleFieldChange(id: string, field: keyof EquipmentItem, value: string) {
    onChange(
      items.map((i) => {
        if (i.id !== id) return i;
        if (field === 'cost') {
          const num = value.trim() === '' ? null : Number(value);
          return { ...i, cost: isNaN(num as number) ? null : num };
        }
        return { ...i, [field]: value };
      })
    );
  }

  function handleAddFromLibrary(lib: { id: string; name: string; cost: number | null }) {
    const item: EquipmentItem = {
      id: createId(),
      name: lib.name,
      cost: lib.cost,
      source: 'custom',
      catalogueId: lib.id,
    };
    onChange([...items, item]);
    setShowLibrary(false);
  }

  return (
    <div className={styles.list}>
      {items.length > 0 && (
        <ul className={styles.items}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              {editingId === item.id ? (
                <div className={styles.editRow}>
                  <input
                    type="text"
                    className={styles.editInput}
                    value={item.name}
                    onChange={(e) => handleFieldChange(item.id, 'name', e.target.value)}
                    placeholder="Item name"
                    aria-label="Item name"
                  />
                  <input
                    type="number"
                    className={`${styles.editInput} ${styles.costInput}`}
                    value={item.cost ?? ''}
                    onChange={(e) => handleFieldChange(item.id, 'cost', e.target.value)}
                    placeholder="Cost"
                    aria-label="Item cost"
                  />
                  <button className={styles.doneBtn} onClick={() => setEditingId(null)}>Done</button>
                  <button className={styles.removeBtn} onClick={() => handleRemove(item.id)} aria-label={`Remove ${item.name}`}>×</button>
                </div>
              ) : (
                <button className={styles.itemBtn} onClick={() => setEditingId(item.id)}>
                  <span className={styles.itemName}>{item.name}</span>
                  {item.cost != null && <span className={styles.itemCost}>{item.cost} gc</span>}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {libraryItems.length > 0 && (
        <div className={styles.librarySection}>
          <button className={styles.libraryToggle} onClick={() => setShowLibrary((v) => !v)}>
            {showLibrary ? 'Hide Library' : 'Add from Library'}
          </button>
          {showLibrary && (
            <ul className={styles.libraryList}>
              {libraryItems.map((lib) => (
                <li key={lib.id}>
                  <button className={styles.libraryItem} onClick={() => handleAddFromLibrary(lib)}>
                    <span>{lib.name}</span>
                    {lib.cost != null && <span className={styles.itemCost}>{lib.cost} gc</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className={styles.addRow}>
        <input
          type="text"
          className={styles.input}
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Item name"
          aria-label="New item name"
        />
        <input
          type="number"
          className={`${styles.input} ${styles.costInput}`}
          value={draftCost}
          onChange={(e) => setDraftCost(e.target.value)}
          placeholder="Cost"
          aria-label="New item cost"
        />
        <button className={styles.addBtn} onClick={handleAdd} disabled={!draftName.trim()}>
          + Add
        </button>
        {onOpenCatalogue && (
          <button className={styles.catalogueBtn} onClick={onOpenCatalogue}>
            From catalogue
          </button>
        )}
      </div>
    </div>
  );
}
