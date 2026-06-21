import { useState } from 'react';
import { useReferenceData } from '../../hooks/useReferenceData';
import type { ModelTypeTemplate, FactionTemplate } from '../../types/reference';
import styles from './TemplatePicker.module.scss';

interface TemplatePickerProps {
  mode: 'hero' | 'henchman';
  factionId?: string;
  onSelect: (template: ModelTypeTemplate) => void;
  onClose: () => void;
}

export default function TemplatePicker({ mode, factionId, onSelect, onClose }: TemplatePickerProps) {
  const { factions } = useReferenceData();
  const preselected = factionId
    ? (factions.find((f) => f.id === factionId || f.name === factionId) ?? null)
    : null;
  const [selectedFaction, setSelectedFaction] = useState<FactionTemplate | null>(preselected);

  const modelTypes = selectedFaction
    ? selectedFaction.modelTypes.filter((m) => m.role === mode)
    : [];

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="Pick from template">
      <div className={styles.dialog}>
        <div className={styles.header}>
          {selectedFaction && preselected === null && (
            <button className={styles.backBtn} onClick={() => setSelectedFaction(null)}>
              ◀ Back
            </button>
          )}
          <p className={styles.title}>
            {selectedFaction ? selectedFaction.name : 'Select Faction'}
          </p>
          <button className={styles.cancelBtn} aria-label="Close picker" onClick={onClose}>
            ×
          </button>
        </div>

        {selectedFaction === null ? (
          <ul className={styles.list}>
            {factions.map((faction) => (
              <li key={faction.id}>
                <button className={styles.item} onClick={() => setSelectedFaction(faction)}>
                  <span className={styles.itemName}>{faction.name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <ul className={styles.list}>
            {modelTypes.length === 0 ? (
              <li>
                <p className={styles.empty}>No {mode} types in this faction.</p>
              </li>
            ) : (
              modelTypes.map((model) => (
                <li key={model.id}>
                  <button className={styles.item} onClick={() => onSelect(model)}>
                    <span className={styles.itemName}>{model.name}</span>
                    {model.recruitmentCost !== null && (
                      <span className={styles.itemMeta}>{model.recruitmentCost} gc</span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
