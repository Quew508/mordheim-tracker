import { useState } from 'react';
import { useReferenceData } from '../../hooks/useReferenceData';
import type { EquipmentCatalogueItem } from '../../types/reference';
import type { EquipmentItem, CustomEquipmentItem } from '../../types/equipment';
import { createId } from '../../utils/ids';
import styles from './EquipmentPicker.module.scss';

interface EquipmentPickerProps {
  factionId: string;
  customLibrary: CustomEquipmentItem[];
  onAdd: (item: EquipmentItem) => void;
  onClose: () => void;
}

export default function EquipmentPicker({ factionId, customLibrary, onAdd, onClose }: EquipmentPickerProps) {
  const { factions, commonEquipment } = useReferenceData();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  const faction = factions.find((f) => f.id === factionId || f.name === factionId);
  const factionItemIds = new Set(faction?.modelTypes.flatMap((m) => m.equipment) ?? []);
  const factionItems = commonEquipment
    .filter((item) => factionItemIds.has(item.id))
    .filter((item) => !q || item.name.toLowerCase().includes(q));

  const commonItems = commonEquipment.filter((item) => !q || item.name.toLowerCase().includes(q));

  const libraryItems = customLibrary.filter((lib) => !q || lib.name.toLowerCase().includes(q));

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleCatalogueAdd(item: EquipmentCatalogueItem) {
    onAdd(
      structuredClone({
        id: createId(),
        name: item.name,
        cost: item.cost,
        source: 'bundled' as const,
        catalogueId: item.id,
      }),
    );
  }

  function handleLibraryAdd(lib: CustomEquipmentItem) {
    onAdd(
      structuredClone({
        id: createId(),
        name: lib.name,
        cost: lib.cost,
        source: 'custom' as const,
        catalogueId: lib.id,
      }),
    );
  }

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Equipment catalogue"
    >
      <div className={styles.dialog}>
        <div className={styles.header}>
          <p className={styles.title}>Add from catalogue</p>
          <button className={styles.cancelBtn} aria-label="Close catalogue" onClick={onClose}>
            ×
          </button>
        </div>

        <input
          type="text"
          className={styles.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search equipment..."
          aria-label="Search equipment"
        />

        <div className={styles.sections}>
          {factionItems.length > 0 && (
            <section className={styles.section}>
              <p className={styles.sectionHeader}>Faction Catalogue</p>
              <ul className={styles.list}>
                {factionItems.map((item) => (
                  <li key={item.id}>
                    <button className={styles.item} onClick={() => handleCatalogueAdd(item)}>
                      <span className={styles.itemName}>{item.name}</span>
                      {item.cost != null && <span className={styles.itemMeta}>{item.cost} gc</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={styles.section}>
            <p className={styles.sectionHeader}>Common Catalogue</p>
            {commonItems.length === 0 ? (
              <p className={styles.empty}>No matches.</p>
            ) : (
              <ul className={styles.list}>
                {commonItems.map((item) => (
                  <li key={item.id}>
                    <button className={styles.item} onClick={() => handleCatalogueAdd(item)}>
                      <span className={styles.itemName}>{item.name}</span>
                      {item.cost != null && <span className={styles.itemMeta}>{item.cost} gc</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {libraryItems.length > 0 && (
            <section className={styles.section}>
              <p className={styles.sectionHeader}>Custom Library</p>
              <ul className={styles.list}>
                {libraryItems.map((lib) => (
                  <li key={lib.id}>
                    <button className={styles.item} onClick={() => handleLibraryAdd(lib)}>
                      <span className={styles.itemName}>{lib.name}</span>
                      {lib.cost != null && <span className={styles.itemMeta}>{lib.cost} gc</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
