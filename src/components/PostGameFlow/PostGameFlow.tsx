import { useState, useMemo } from 'react';
import type { Warband } from '../../types/warband';
import { useWarband } from '../../hooks/useWarband';
import {
  HERO_ADVANCEMENT_THRESHOLDS,
  HENCHMAN_ADVANCEMENT_THRESHOLDS,
} from '../../utils/advancements';
import styles from './PostGameFlow.module.scss';

// ---------------------------------------------------------------------------
// Draft state shapes
// ---------------------------------------------------------------------------
interface HeroDraft {
  xpDelta: string;
  injuryEntry: string;
  skillEntry: string;
}
interface GroupDraft {
  xpDelta: string;
  injuryEntry: string;
  advancementNote: string;
}
interface TreasuryDraft {
  goldDelta: string;
  wyrdstoneDelta: string;
  transactionDescription: string;
}

const EMPTY_HERO_DRAFT: HeroDraft = { xpDelta: '', injuryEntry: '', skillEntry: '' };
const EMPTY_GROUP_DRAFT: GroupDraft = { xpDelta: '', injuryEntry: '', advancementNote: '' };
const EMPTY_TREASURY_DRAFT: TreasuryDraft = {
  goldDelta: '',
  wyrdstoneDelta: '',
  transactionDescription: '',
};

// ---------------------------------------------------------------------------
// Advancement check helper
// ---------------------------------------------------------------------------
function countThresholdsCrossed(
  currentXp: number,
  delta: number,
  thresholds: readonly number[],
): number {
  return thresholds.filter((t) => currentXp < t && currentXp + delta >= t).length;
}

// ---------------------------------------------------------------------------
// Step discriminated union
// ---------------------------------------------------------------------------
type Step =
  | { kind: 'hero'; id: string }
  | { kind: 'group'; id: string }
  | { kind: 'treasury' };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface Props {
  warband: Warband;
  onClose: () => void;
}

export default function PostGameFlow({ warband, onClose }: Props) {
  const { dispatch } = useWarband();

  const activeHeroes = useMemo(
    () => warband.heroes.filter((h) => h.status === 'Active'),
    [warband.heroes],
  );
  const activeGroups = useMemo(
    () => warband.henchmanGroups.filter((g) => g.status === 'Active'),
    [warband.henchmanGroups],
  );
  const steps = useMemo<Step[]>(
    () => [
      ...activeHeroes.map((h) => ({ kind: 'hero' as const, id: h.id })),
      ...activeGroups.map((g) => ({ kind: 'group' as const, id: g.id })),
      { kind: 'treasury' as const },
    ],
    [activeHeroes, activeGroups],
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [showDiscardGuard, setShowDiscardGuard] = useState(false);

  const [heroDrafts, setHeroDrafts] = useState<Record<string, HeroDraft>>(
    () => Object.fromEntries(activeHeroes.map((h) => [h.id, { ...EMPTY_HERO_DRAFT }])),
  );
  const [groupDrafts, setGroupDrafts] = useState<Record<string, GroupDraft>>(
    () => Object.fromEntries(activeGroups.map((g) => [g.id, { ...EMPTY_GROUP_DRAFT }])),
  );
  const [treasuryDraft, setTreasuryDraft] = useState<TreasuryDraft>({ ...EMPTY_TREASURY_DRAFT });

  // ---------------------------------------------------------------------------
  // Dirty check
  // ---------------------------------------------------------------------------
  function isDirty(): boolean {
    const heroClean = activeHeroes.every((h) => {
      const d = heroDrafts[h.id];
      return !d || (d.xpDelta === '' && d.injuryEntry === '' && d.skillEntry === '');
    });
    const groupClean = activeGroups.every((g) => {
      const d = groupDrafts[g.id];
      return !d || (d.xpDelta === '' && d.injuryEntry === '' && d.advancementNote === '');
    });
    const treasuryClean =
      treasuryDraft.goldDelta === '' &&
      treasuryDraft.wyrdstoneDelta === '' &&
      treasuryDraft.transactionDescription === '';
    return !(heroClean && groupClean && treasuryClean);
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  function handleClose() {
    if (isDirty()) {
      setShowDiscardGuard(true);
    } else {
      onClose();
    }
  }

  function handleConfirm() {
    const heroEntries = activeHeroes.map((h) => {
      const d = heroDrafts[h.id] ?? { ...EMPTY_HERO_DRAFT };
      const xpDelta = Math.max(0, parseInt(d.xpDelta, 10) || 0);
      return {
        heroId: h.id,
        xpDelta,
        injuryEntry: d.injuryEntry.trim() || null,
        skillEntry: d.skillEntry.trim() || null,
      };
    });

    const groupEntries = activeGroups.map((g) => {
      const d = groupDrafts[g.id] ?? { ...EMPTY_GROUP_DRAFT };
      const xpDelta = Math.max(0, parseInt(d.xpDelta, 10) || 0);
      return {
        groupId: g.id,
        xpDelta,
        injuryEntry: d.injuryEntry.trim() || null,
        advancementNote: d.advancementNote.trim() || null,
      };
    });

    const goldDelta = parseInt(treasuryDraft.goldDelta, 10) || 0;
    const wyrdstoneDelta = parseInt(treasuryDraft.wyrdstoneDelta, 10) || 0;

    dispatch({
      type: 'RECORD_POST_GAME',
      payload: {
        warbandId: warband.id,
        heroes: heroEntries,
        groups: groupEntries,
        goldDelta,
        wyrdstoneDelta,
        transactionDescription: treasuryDraft.transactionDescription.trim(),
      },
    });

    onClose();
  }

  // ---------------------------------------------------------------------------
  // Step renderer
  // ---------------------------------------------------------------------------
  function renderStepContent() {
    const step = steps[currentStep];

    if (step.kind === 'treasury') {
      return (
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>Treasury</h2>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="pgf-gold">
              Gold Crowns change
            </label>
            <input
              id="pgf-gold"
              className={styles.input}
              type="number"
              value={treasuryDraft.goldDelta}
              onChange={(e) =>
                setTreasuryDraft((d) => ({ ...d, goldDelta: e.target.value }))
              }
              placeholder="0"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="pgf-wyrdstone">
              Wyrdstone Fragments change
            </label>
            <input
              id="pgf-wyrdstone"
              className={styles.input}
              type="number"
              value={treasuryDraft.wyrdstoneDelta}
              onChange={(e) =>
                setTreasuryDraft((d) => ({ ...d, wyrdstoneDelta: e.target.value }))
              }
              placeholder="0"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="pgf-desc">
              Transaction description (optional)
            </label>
            <input
              id="pgf-desc"
              className={styles.input}
              type="text"
              value={treasuryDraft.transactionDescription}
              onChange={(e) =>
                setTreasuryDraft((d) => ({
                  ...d,
                  transactionDescription: e.target.value,
                }))
              }
              placeholder="e.g. Sold wyrdstone"
            />
          </div>
        </div>
      );
    }

    if (step.kind === 'hero') {
      const hero = warband.heroes.find((h) => h.id === step.id);
      if (!hero) return null;
      const draft = heroDrafts[hero.id] ?? { ...EMPTY_HERO_DRAFT };
      const xpDeltaNum = Math.max(0, parseInt(draft.xpDelta, 10) || 0);
      const advancementCount =
        draft.xpDelta !== '' && xpDeltaNum > 0
          ? countThresholdsCrossed(hero.xp, xpDeltaNum, HERO_ADVANCEMENT_THRESHOLDS)
          : 0;

      return (
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>{hero.name || '(Unnamed Hero)'}</h2>
          <p className={styles.stepMeta}>
            Hero · XP: {hero.xp}
          </p>
          {advancementCount > 0 && (
            <div className={styles.advancementCallout} role="status">
              {advancementCount === 1
                ? 'Advancement! Roll on the Hero Advancement table.'
                : `${advancementCount} Advancements! Roll ${advancementCount} times on the Hero Advancement table.`}
            </div>
          )}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor={`pgf-xp-${hero.id}`}>
              XP earned
            </label>
            <input
              id={`pgf-xp-${hero.id}`}
              className={styles.input}
              type="number"
              min={0}
              value={draft.xpDelta}
              onChange={(e) =>
                setHeroDrafts((d) => ({
                  ...d,
                  [hero.id]: { ...d[hero.id], xpDelta: e.target.value },
                }))
              }
              placeholder="0"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor={`pgf-injury-${hero.id}`}>
              Injury (optional)
            </label>
            <input
              id={`pgf-injury-${hero.id}`}
              className={styles.input}
              type="text"
              value={draft.injuryEntry}
              onChange={(e) =>
                setHeroDrafts((d) => ({
                  ...d,
                  [hero.id]: { ...d[hero.id], injuryEntry: e.target.value },
                }))
              }
              placeholder="e.g. Old Battle Wound"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor={`pgf-skill-${hero.id}`}>
              New skill (optional)
            </label>
            <input
              id={`pgf-skill-${hero.id}`}
              className={styles.input}
              type="text"
              value={draft.skillEntry}
              onChange={(e) =>
                setHeroDrafts((d) => ({
                  ...d,
                  [hero.id]: { ...d[hero.id], skillEntry: e.target.value },
                }))
              }
              placeholder="e.g. Sprint"
            />
          </div>
        </div>
      );
    }

    // Group step
    const group = warband.henchmanGroups.find((g) => g.id === step.id);
    if (!group) return null;
    const draft = groupDrafts[group.id] ?? { ...EMPTY_GROUP_DRAFT };
    const xpDeltaNum = Math.max(0, parseInt(draft.xpDelta, 10) || 0);
    const advancementCount =
      draft.xpDelta !== '' && xpDeltaNum > 0
        ? countThresholdsCrossed(group.xp, xpDeltaNum, HENCHMAN_ADVANCEMENT_THRESHOLDS)
        : 0;

    return (
      <div className={styles.stepContent}>
        <h2 className={styles.stepTitle}>{group.name || '(Unnamed Group)'}</h2>
        <p className={styles.stepMeta}>
          Henchman Group · XP: {group.xp}
        </p>
        {advancementCount > 0 && (
          <div className={styles.advancementCallout} role="status">
            {advancementCount === 1
              ? 'Advancement! Roll on the Henchman Advancement table.'
              : `${advancementCount} Advancements! Roll ${advancementCount} times on the Henchman Advancement table.`}
          </div>
        )}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor={`pgf-xp-${group.id}`}>
            XP earned
          </label>
          <input
            id={`pgf-xp-${group.id}`}
            className={styles.input}
            type="number"
            min={0}
            value={draft.xpDelta}
            onChange={(e) =>
              setGroupDrafts((d) => ({
                ...d,
                [group.id]: { ...d[group.id], xpDelta: e.target.value },
              }))
            }
            placeholder="0"
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor={`pgf-injury-${group.id}`}>
            Injury (optional)
          </label>
          <input
            id={`pgf-injury-${group.id}`}
            className={styles.input}
            type="text"
            value={draft.injuryEntry}
            onChange={(e) =>
              setGroupDrafts((d) => ({
                ...d,
                [group.id]: { ...d[group.id], injuryEntry: e.target.value },
              }))
            }
            placeholder="e.g. Chest Wound"
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor={`pgf-note-${group.id}`}>
            Advancement note (optional)
          </label>
          <input
            id={`pgf-note-${group.id}`}
            className={styles.input}
            type="text"
            value={draft.advancementNote}
            onChange={(e) =>
              setGroupDrafts((d) => ({
                ...d,
                [group.id]: { ...d[group.id], advancementNote: e.target.value },
              }))
            }
            placeholder="e.g. +1 WS"
          />
        </div>
      </div>
    );
  }

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Post-Game Bulk Flow"
    >
      <div className={styles.dialog}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.headerTitle}>
            Post-Game ({currentStep + 1}/{steps.length})
          </span>
          <button
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="Close post-game flow"
          >
            ×
          </button>
        </div>

        {/* Step content */}
        {renderStepContent()}

        {/* Footer navigation */}
        <div className={styles.footer}>
          <button
            className={styles.prevBtn}
            disabled={isFirstStep}
            onClick={() => setCurrentStep((s) => s - 1)}
          >
            ← Prev
          </button>
          {!isLastStep && (
            <button
              className={styles.nextBtn}
              onClick={() => setCurrentStep((s) => s + 1)}
            >
              Next →
            </button>
          )}
          {isLastStep && (
            <button className={styles.confirmBtn} onClick={handleConfirm}>
              Confirm &amp; Save
            </button>
          )}
        </div>
      </div>

      {/* Discard guard — bottom sheet */}
      {showDiscardGuard && (
        <div
          className={styles.guardOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pgf-discard-title"
        >
          <div className={styles.sheet}>
            <h2 id="pgf-discard-title" className={styles.sheetTitle}>
              Discard changes?
            </h2>
            <p className={styles.sheetBody}>All post-game entries will be lost.</p>
            <div className={styles.sheetActions}>
              <button
                className={styles.sheetCancelBtn}
                onClick={() => setShowDiscardGuard(false)}
              >
                Keep editing
              </button>
              <button className={styles.sheetDiscardBtn} onClick={onClose}>
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
