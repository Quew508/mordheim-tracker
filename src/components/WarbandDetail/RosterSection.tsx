import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useWarband } from '../../hooks/useWarband';
import { useReferenceData } from '../../hooks/useReferenceData';
import { createId } from '../../utils/ids';
import { seedHeroFromTemplate, seedHenchmanFromTemplate } from '../../services/seedEngine';
import type { Hero, HenchmanGroup, Warband } from '../../types/warband';
import type { ModelTypeTemplate } from '../../types/reference';
import TemplatePicker from '../TemplatePicker/TemplatePicker';
import styles from './RosterSection.module.scss';

interface RosterSectionProps {
  warband: Warband;
}

function createBlankHero(): Hero {
  return {
    id: createId(),
    name: '',
    role: '',
    status: 'Active',
    stats: { M: 0, WS: 0, BS: 0, S: 0, T: 0, W: 0, I: 0, A: 0, Ld: 0 },
    xp: 0,
    xpLog: [],
    skills: [],
    injuryLog: [],
    equipment: [],
    ooa: 0,
    recruitmentCost: null,
  };
}

function createBlankGroup(): HenchmanGroup {
  return {
    id: createId(),
    name: '',
    role: '',
    status: 'Active',
    stats: { M: 0, WS: 0, BS: 0, S: 0, T: 0, W: 0, I: 0, A: 0, Ld: 0 },
    xp: 0,
    advancementNotes: [],
    injuryLog: [],
    equipment: [],
    models: [],
    modelCountOverride: null,
    recruitmentCost: null,
  };
}

function activeModelCount(group: HenchmanGroup): number {
  if (group.modelCountOverride !== null) return group.modelCountOverride;
  return group.models.filter((m) => m.status === 'Active').length;
}

export default function RosterSection({ warband }: RosterSectionProps) {
  const { dispatch } = useWarband();
  const { factions } = useReferenceData();
  const navigate = useNavigate();
  const resolvedFaction = warband.faction
    ? (factions.find((f) => f.id === warband.faction || f.name === warband.faction) ?? null)
    : null;
  const [pendingDelete, setPendingDelete] = useState<{
    type: 'hero' | 'group'; id: string; name: string;
  } | null>(null);
  const [templatePickerMode, setTemplatePickerMode] = useState<'hero' | 'henchman' | null>(null);

  function handleAddHero() {
    const hero = createBlankHero();
    navigate(`/warband/${warband.id}/hero/${hero.id}`, { state: { isNew: true, draft: hero } });
  }

  function handleAddGroup() {
    const group = createBlankGroup();
    navigate(`/warband/${warband.id}/henchman/${group.id}`, { state: { isNew: true, draft: group } });
  }

  function handleTemplateSelect(template: ModelTypeTemplate) {
    if (templatePickerMode === 'hero') {
      const hero = seedHeroFromTemplate(template);
      setTemplatePickerMode(null);
      navigate(`/warband/${warband.id}/hero/${hero.id}`, { state: { isNew: true, draft: hero } });
    } else if (templatePickerMode === 'henchman') {
      const group = seedHenchmanFromTemplate(template);
      setTemplatePickerMode(null);
      navigate(`/warband/${warband.id}/henchman/${group.id}`, { state: { isNew: true, draft: group } });
    }
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.type === 'hero') {
      dispatch({ type: 'DELETE_HERO', payload: { warbandId: warband.id, heroId: pendingDelete.id } });
    } else {
      dispatch({ type: 'DELETE_HENCHMAN_GROUP', payload: { warbandId: warband.id, groupId: pendingDelete.id } });
    }
    setPendingDelete(null);
  }

  return (
    <div className={styles.roster}>
      {warband.heroes.length === 0 && warband.henchmanGroups.length === 0 ? (
        <p className={styles.empty}>No roster members yet.</p>
      ) : (
        <ul className={styles.list}>
          {warband.heroes.map((hero) => {
            const heroCost = (hero.recruitmentCost ?? 0) + hero.equipment.reduce((s, i) => s + (i.cost ?? 0), 0);
            return (
            <li key={hero.id} className={styles.row}>
              <button
                className={styles.heroBtn}
                onClick={() => navigate(`/warband/${warband.id}/hero/${hero.id}`)}
              >
                <span className={styles.heroName}>{hero.name || '(Unnamed Hero)'}</span>
                {hero.role && <span className={styles.heroRole}>{hero.role}</span>}
                {heroCost > 0 && <span className={styles.heroCost}>{heroCost} gc</span>}
                <span className={`${styles.heroStatus} ${styles[`status${hero.status}`]}`}>
                  {hero.status}
                </span>
              </button>
              {hero.status === 'Active' && (
                <div className={styles.ooa}>
                  <button
                    className={styles.ooaBtn}
                    disabled={hero.ooa === 0}
                    onClick={() => dispatch({ type: 'INCREMENT_OOA', payload: { warbandId: warband.id, heroId: hero.id, delta: -1 } })}
                    aria-label={`Decrease OOA for ${hero.name || 'hero'}`}
                  >−</button>
                  <span className={styles.ooaValue} aria-label={`OOA: ${hero.ooa}`}>{hero.ooa}</span>
                  <button
                    className={styles.ooaBtn}
                    onClick={() => dispatch({ type: 'INCREMENT_OOA', payload: { warbandId: warband.id, heroId: hero.id, delta: 1 } })}
                    aria-label={`Increase OOA for ${hero.name || 'hero'}`}
                  >+</button>
                  {hero.ooa > 0 && (
                    <button
                      className={styles.ooaClear}
                      onClick={() => dispatch({ type: 'CLEAR_OOA', payload: { warbandId: warband.id, heroId: hero.id } })}
                      aria-label={`Clear OOA for ${hero.name || 'hero'}`}
                    >Clear</button>
                  )}
                </div>
              )}
              <button
                className={styles.deleteBtn}
                aria-label={`Delete ${hero.name || 'hero'}`}
                onClick={() => setPendingDelete({ type: 'hero', id: hero.id, name: hero.name || 'Unnamed Hero' })}
              >
                ×
              </button>
            </li>
            );
          })}
          {warband.henchmanGroups.map((group) => {
            const count = activeModelCount(group);
            const allGone = group.models.length > 0 && count === 0;
            const groupCost = (group.recruitmentCost ?? 0) + group.equipment.reduce((s, i) => s + (i.cost ?? 0), 0);
            return (
              <li key={group.id} className={styles.row}>
                <button
                  className={styles.heroBtn}
                  onClick={() => navigate(`/warband/${warband.id}/henchman/${group.id}`)}
                >
                  <span className={styles.heroName}>{group.name || '(Unnamed Group)'}</span>
                  {group.role && <span className={styles.heroRole}>{group.role}</span>}
                  {group.models.length > 0 && (
                    <span className={styles.modelCount}>
                      {allGone ? 'All Dead/Retired' : `×${count}`}
                    </span>
                  )}
                  {groupCost > 0 && <span className={styles.heroCost}>{groupCost} gc</span>}
                  <span className={`${styles.heroStatus} ${styles[`status${group.status}`]}`}>
                    {group.status}
                  </span>
                </button>
                <button
                  className={styles.deleteBtn}
                  aria-label={`Delete ${group.name || 'group'}`}
                  onClick={() => setPendingDelete({ type: 'group', id: group.id, name: group.name || 'Unnamed Group' })}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className={styles.addBtns}>
        <div className={styles.addGroup}>
          <button
            className={styles.addBtn}
            onClick={resolvedFaction ? () => setTemplatePickerMode('hero') : handleAddHero}
          >
            + Add Hero
          </button>
          {!resolvedFaction && (
            <button className={styles.templateBtn} onClick={() => setTemplatePickerMode('hero')}>From template</button>
          )}
        </div>
        <div className={styles.addGroup}>
          <button
            className={styles.addBtn}
            onClick={resolvedFaction ? () => setTemplatePickerMode('henchman') : handleAddGroup}
          >
            + Add Henchman Group
          </button>
          {!resolvedFaction && (
            <button className={styles.templateBtn} onClick={() => setTemplatePickerMode('henchman')}>From template</button>
          )}
        </div>
        <div className={styles.addGroup}>
          <button className={styles.addBtn} onClick={handleAddHero}>+ Add Mercenary</button>
        </div>
      </div>

      {templatePickerMode !== null && (
        <TemplatePicker
          mode={templatePickerMode}
          factionId={warband.faction}
          onSelect={handleTemplateSelect}
          onClose={() => setTemplatePickerMode(null)}
        />
      )}

      {pendingDelete && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="delete-member-title">
          <div className={styles.dialog}>
            <p id="delete-member-title" className={styles.dialogTitle}>
              Delete &ldquo;{pendingDelete.name}&rdquo;?
            </p>
            <p className={styles.dialogBody}>This cannot be undone.</p>
            <div className={styles.dialogActions}>
              <button className={styles.cancelBtn} onClick={() => setPendingDelete(null)}>Cancel</button>
              <button className={styles.confirmDeleteBtn} onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
