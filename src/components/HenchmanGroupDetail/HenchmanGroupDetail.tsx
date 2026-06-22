import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, Navigate, useNavigate, useLocation } from 'react-router';
import { useWarband } from '../../hooks/useWarband';
import type { ModelStatus, HenchmanGroup, IndividualModel } from '../../types/warband';
import type { StatLine } from '../../types/reference';
import { createId } from '../../utils/ids';
import StatRow from '../HeroDetail/StatRow';
import CollapsibleSection from '../CollapsibleSection/CollapsibleSection';
import FreeTextList from '../FreeTextList/FreeTextList';
import EquipmentList from '../EquipmentList/EquipmentList';
import EquipmentPicker from '../EquipmentPicker/EquipmentPicker';
import styles from './HenchmanGroupDetail.module.scss';

const STATUS_OPTIONS: ModelStatus[] = ['Active', 'Dead', 'Retired'];
const DEVIATION_KEYS: (keyof StatLine)[] = ['M', 'WS', 'BS', 'S', 'T', 'W', 'I', 'A', 'Ld'];

export default function HenchmanGroupDetailPage() {
  const { id, groupId } = useParams<{ id: string; groupId: string }>();
  const { state, dispatch } = useWarband();
  const navigate = useNavigate();
  const location = useLocation();

  const warband = state.warbands.find((w) => w.id === id);
  const group = warband?.henchmanGroups.find((g) => g.id === groupId);

  const creationDraft: HenchmanGroup | null = location.state?.isNew ? (location.state.draft as HenchmanGroup) : null;
  const [draftGroup, setDraftGroup] = useState<HenchmanGroup>(() => creationDraft ?? group!);

  const [name, setName] = useState(() => (creationDraft ?? group)?.name ?? '');
  const [role, setRole] = useState(() => (creationDraft ?? group)?.role ?? '');

  // Panel open state
  const [xpOpen, setXpOpen] = useState(false);
  const [injuriesOpen, setInjuriesOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [modelsOpen, setModelsOpen] = useState(false);

  // Expanded individual model row
  const [expandedModelId, setExpandedModelId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const saveGroup = useCallback(
    (patch: Partial<HenchmanGroup>) => {
      if (creationDraft) {
        setDraftGroup((prev) => ({ ...prev, ...patch }));
        return;
      }
      if (!warband || !group) return;
      const wId = warband.id;
      const g = group;
      dispatch({
        type: 'UPDATE_HENCHMAN_GROUP',
        payload: { warbandId: wId, group: { ...g, ...patch } },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [warband?.id, group?.id]
  );

  const saveModel = useCallback(
    (updatedModel: IndividualModel) => {
      if (creationDraft) {
        setDraftGroup((prev) => ({
          ...prev,
          models: prev.models.map((m) => (m.id === updatedModel.id ? updatedModel : m)),
        }));
        return;
      }
      if (!warband || !group) return;
      const wId = warband.id;
      const gId = group.id;
      dispatch({
        type: 'UPDATE_INDIVIDUAL_MODEL',
        payload: { warbandId: wId, groupId: gId, model: updatedModel },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [warband?.id, group?.id]
  );

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  if (!warband || (!group && !creationDraft)) {
    return <Navigate to={`/warband/${id ?? ''}`} replace />;
  }

  const model = creationDraft ? draftGroup : group!;

  function handleStatChange(updated: StatLine) {
    saveGroup({ stats: updated });
  }

  function handleAddToRoster() {
    if (!warband) return;
    const finalGroup = { ...draftGroup, name: name.trim(), role: role.trim() };
    const finalModelCount = finalGroup.models.length;
    const totalGold =
      (finalGroup.recruitmentCost ?? 0) * finalModelCount +
      finalGroup.equipment.reduce((s, i) => s + (i.cost ?? 0), 0);
    if (totalGold > 0) {
      dispatch({ type: 'UPDATE_WARBAND', payload: { ...warband, goldCrowns: warband.goldCrowns - totalGold } });
    }
    dispatch({ type: 'ADD_HENCHMAN_GROUP', payload: { warbandId: warband.id, group: finalGroup } });
    navigate(`/warband/${id}`);
  }

  function handleAddModel() {
    const newModel: IndividualModel = {
      id: createId(),
      name: '',
      status: 'Active',
      statDeviations: { M: 0, WS: 0, BS: 0, S: 0, T: 0, W: 0, I: 0, A: 0, Ld: 0 },
      injuryLog: [],
      ooa: 0,
    };
    if (creationDraft) {
      setDraftGroup((prev) => ({ ...prev, models: [...prev.models, newModel] }));
    } else {
      if (group?.recruitmentCost && warband) {
        dispatch({
          type: 'UPDATE_WARBAND',
          payload: { ...warband, goldCrowns: warband.goldCrowns - group.recruitmentCost },
        });
      }
      dispatch({
        type: 'ADD_INDIVIDUAL_MODEL',
        payload: { warbandId: warband!.id, groupId: group!.id, model: newModel },
      });
    }
    setExpandedModelId(newModel.id);
    setModelsOpen(true);
  }

  function handleDeleteModel(modelId: string) {
    if (creationDraft) {
      setDraftGroup((prev) => ({ ...prev, models: prev.models.filter((m) => m.id !== modelId) }));
    } else {
      if (group?.recruitmentCost && warband) {
        dispatch({
          type: 'UPDATE_WARBAND',
          payload: { ...warband, goldCrowns: warband.goldCrowns + group.recruitmentCost },
        });
      }
      dispatch({
        type: 'REMOVE_INDIVIDUAL_MODEL',
        payload: { warbandId: warband!.id, groupId: group!.id, modelId },
      });
    }
    if (expandedModelId === modelId) setExpandedModelId(null);
  }

  const activeCount = model.models.filter((m) => m.status === 'Active').length;

  const modelCount = model.models.length;
  const canAddModel = model.modelCountOverride === null || model.models.length < model.modelCountOverride;
  const modelsOverflow = model.modelCountOverride !== null && model.models.length > model.modelCountOverride
    ? model.models.length - model.modelCountOverride
    : 0;

  return (
    <div className={styles.page}>
      {!creationDraft && modelsOverflow > 0 && (
        <div className={styles.errorBanner} role="alert">
          Models exceed the override ({model.models.length} models, override is {model.modelCountOverride}).
          Remove {modelsOverflow} model{modelsOverflow > 1 ? 's' : ''} or increase the Model Count Override before leaving this page.
        </div>
      )}
      {!creationDraft && (
      <div className={styles.menuContainer} ref={menuRef}>
        <button
          className={styles.menuBtn}
          aria-label="Group actions"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          ⋮
        </button>
        {menuOpen && (
          <div className={styles.menu} role="menu">
            <button
              role="menuitem"
              className={styles.menuItem}
              onClick={() => {
                setMenuOpen(false);
                const newGroupId = crypto.randomUUID();
                dispatch({ type: 'DUPLICATE_HENCHMAN_GROUP', payload: { warbandId: id!, groupId: group!.id, newGroupId } });
                navigate(`/warband/${id}/henchman/${newGroupId}`);
              }}
            >
              Duplicate Group
            </button>
          </div>
        )}
      </div>
      )}
      {/* Fields */}
      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor="group-name" className={styles.label}>Group Name</label>
          <input
            id="group-name"
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => saveGroup({ name: name.trim() })}
            placeholder="Group name"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="group-role" className={styles.label}>Role / Type</label>
          <input
            id="group-role"
            type="text"
            className={styles.input}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onBlur={() => saveGroup({ role: role.trim() })}
            placeholder="e.g. Warband Warriors"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="group-status" className={styles.label}>Status</label>
          <select
            id="group-status"
            className={styles.select}
            value={model.status}
            onChange={(e) => saveGroup({ status: e.target.value as ModelStatus })}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="group-count-override" className={styles.label}>
            Model Count Override
            <span className={styles.hint}> (leave blank to use active model count: {activeCount})</span>
          </label>
          <input
            id="group-count-override"
            type="number"
            className={styles.input}
            value={model.modelCountOverride ?? ''}
            min={0}
            onChange={(e) =>
              saveGroup({ modelCountOverride: e.target.value === '' ? null : Number(e.target.value) })
            }
            placeholder={`${activeCount}`}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="group-recruitment-cost" className={styles.label}>Recruitment Cost per model (gc)</label>
          <input
            id="group-recruitment-cost"
            type="number"
            className={styles.input}
            value={model.recruitmentCost ?? ''}
            min={0}
            placeholder="e.g. 25"
            onChange={(e) => {
              const raw = e.target.value;
              const v = raw === '' ? null : Math.max(0, parseInt(raw, 10));
              const isFirstSet = (model.recruitmentCost ?? null) === null && v !== null;
              saveGroup({ recruitmentCost: v });
              if (!creationDraft && isFirstSet && v !== null && warband) {
                dispatch({
                  type: 'UPDATE_WARBAND',
                  payload: { ...warband, goldCrowns: warband.goldCrowns - v * model.models.length },
                });
              }
            }}
          />
        </div>
      </div>

      {(() => {
        const eqCost = model.equipment.reduce((sum, i) => sum + (i.cost ?? 0), 0);
        const total = (model.recruitmentCost ?? 0) + eqCost;
        if (total === 0 && model.recruitmentCost === null) return null;
        const recruitTotal = (model.recruitmentCost ?? 0) * modelCount;
        const grandTotal = recruitTotal + eqCost;
        return (
          <p className={styles.totalCost}>
            Total cost: <strong>{grandTotal} gc</strong>
            {model.recruitmentCost !== null && modelCount > 0 && (
              <span className={styles.totalCostBreakdown}>
                {' '}({modelCount} × {model.recruitmentCost} recruitment{eqCost > 0 ? ` + ${eqCost} equipment` : ''})
              </span>
            )}
          </p>
        );
      })()}

      {/* Group stat block */}
      <div className={styles.statSection}>
        <h2 className={styles.statHeading}>Group Stats</h2>
        <StatRow stats={model.stats} onChange={handleStatChange} />
      </div>

      {/* Panels */}
      <div className={styles.panels}>
        {/* Individual Models panel */}
        <div className={modelsOverflow > 0 ? styles.panelError : undefined}>
        <CollapsibleSection
          title={`Models${model.models.length > 0 ? ` (${activeCount} active)` : ''}${modelsOverflow > 0 ? ` — ${modelsOverflow} over override` : ''}`}
          isOpen={modelsOpen}
          onToggle={() => setModelsOpen((v) => !v)}
        >
          <div className={styles.panelContent}>
            {modelsOverflow > 0 && (
              <p className={styles.overflowBanner} role="alert">
                {model.models.length} models tracked but override is set to {model.modelCountOverride}.
                Remove {modelsOverflow} model{modelsOverflow > 1 ? 's' : ''} or increase the Model Count Override.
              </p>
            )}
            <ul className={styles.modelList}>
              {model.models.map((indivModel, index) => {
                const displayName = indivModel.name || `#${index + 1}`;
                const isExpanded = expandedModelId === indivModel.id;
                return (
                  <li key={indivModel.id} className={styles.modelItem}>
                  <div className={styles.modelTopRow}>
                    <button
                      className={styles.modelRow}
                      onClick={() => setExpandedModelId(isExpanded ? null : indivModel.id)}
                    >
                      <span className={styles.modelName}>{displayName}</span>
                      <span className={`${styles.modelStatus} ${styles[`mStatus${indivModel.status}`]}`}>
                        {indivModel.status}
                      </span>
                    </button>
                    {indivModel.status === 'Active' && !creationDraft && (
                      <div className={styles.ooa}>
                        <button
                          className={styles.ooaBtn}
                          disabled={indivModel.ooa === 0}
                          onClick={() => dispatch({ type: 'INCREMENT_OOA', payload: { warbandId: warband.id, groupId: group!.id, modelId: indivModel.id, delta: -1 } })}
                          aria-label={`Decrease OOA for ${displayName}`}
                        >−</button>
                        <span className={styles.ooaValue} aria-label={`OOA: ${indivModel.ooa}`}>{indivModel.ooa}</span>
                        <button
                          className={styles.ooaBtn}
                          onClick={() => dispatch({ type: 'INCREMENT_OOA', payload: { warbandId: warband.id, groupId: group!.id, modelId: indivModel.id, delta: 1 } })}
                          aria-label={`Increase OOA for ${displayName}`}
                        >+</button>
                        {indivModel.ooa > 0 && (
                          <button
                            className={styles.ooaClear}
                            onClick={() => dispatch({ type: 'CLEAR_OOA', payload: { warbandId: warband.id, groupId: group!.id, modelId: indivModel.id } })}
                            aria-label={`Clear OOA for ${displayName}`}
                          >Clear</button>
                        )}
                      </div>
                    )}
                    <button
                      className={styles.deleteModelBtn}
                      onClick={() => handleDeleteModel(indivModel.id)}
                      aria-label={`Delete ${displayName}`}
                    >✕</button>
                  </div>
                    {isExpanded && (
                      <div className={styles.modelDetail}>
                        <div className={styles.field}>
                          <label className={styles.label}>Name (optional)</label>
                          <input
                            type="text"
                            className={styles.input}
                            value={indivModel.name}
                            onChange={(e) => saveModel({ ...indivModel, name: e.target.value })}
                            placeholder={`#${index + 1}`}
                          />
                        </div>
                        <div className={styles.field}>
                          <label className={styles.label}>Status</label>
                          <select
                            className={styles.select}
                            value={indivModel.status}
                            onChange={(e) =>
                              saveModel({ ...indivModel, status: e.target.value as ModelStatus })
                            }
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        {/* Stat deviations */}
                        <div className={styles.field}>
                          <p className={styles.label}>Stat Deviations</p>
                          <div className={styles.deviationRow}>
                            {DEVIATION_KEYS.map((key) => {
                              const base = model.stats[key];
                              const dev = indivModel.statDeviations[key];
                              const effective = base + dev;
                              return (
                                <div key={key} className={styles.devCell}>
                                  <span className={styles.devLabel}>{key}</span>
                                  <input
                                    type="number"
                                    className={styles.devInput}
                                    value={effective}
                                    onChange={(e) =>
                                      saveModel({
                                        ...indivModel,
                                        statDeviations: {
                                          ...indivModel.statDeviations,
                                          [key]: (Number(e.target.value) || 0) - base,
                                        },
                                      })
                                    }
                                    aria-label={`${key} stat`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {/* Individual injury log */}
                        <div className={styles.field}>
                          <p className={styles.label}>Injury Log</p>
                          <FreeTextList
                            items={indivModel.injuryLog}
                            onChange={(injuryLog) => saveModel({ ...indivModel, injuryLog })}
                            placeholder="e.g. Leg Wound"
                          />
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {canAddModel && (
            <button className={styles.addModelBtn} onClick={handleAddModel}>+ Add Model</button>
            )}
          </div>
        </CollapsibleSection>
        </div>

        {/* XP & Advancement */}
        <CollapsibleSection
          title="XP & Advancement"
          isOpen={xpOpen}
          onToggle={() => setXpOpen((v) => !v)}
        >
          <div className={styles.panelContent}>
            <div className={styles.xpRow}>
              <label htmlFor="group-xp" className={styles.label}>XP Total</label>
              <input
                id="group-xp"
                type="number"
                className={styles.xpInput}
                value={model.xp}
                min={0}
                onChange={(e) => saveGroup({ xp: Math.max(0, Number(e.target.value)) })}
              />
            </div>
            <p className={styles.label}>Advancement Notes</p>
            <FreeTextList
              items={model.advancementNotes}
              onChange={(advancementNotes) => saveGroup({ advancementNotes })}
              placeholder="e.g. Gained Sprint after 3rd scenario"
            />
          </div>
        </CollapsibleSection>

        {/* Group Injuries */}
        <CollapsibleSection
          title="Group Injuries"
          isOpen={injuriesOpen}
          onToggle={() => setInjuriesOpen((v) => !v)}
        >
          <div className={styles.panelContent}>
            <FreeTextList
              items={model.injuryLog}
              onChange={(injuryLog) => saveGroup({ injuryLog })}
              placeholder="e.g. Scenario curse — all models -1 Ld"
            />
          </div>
        </CollapsibleSection>

        {/* Equipment */}
        <CollapsibleSection
          title="Equipment"
          isOpen={equipmentOpen}
          onToggle={() => setEquipmentOpen((v) => !v)}
        >
          <div className={styles.panelContent}>
            <EquipmentList
              items={model.equipment}
              onChange={(newEquipment) => {
                if (!creationDraft) {
                  const oldCost = model.equipment.reduce((s, i) => s + (i.cost ?? 0), 0);
                  const newCost = newEquipment.reduce((s, i) => s + (i.cost ?? 0), 0);
                  const delta = newCost - oldCost;
                  if (delta !== 0) {
                    dispatch({ type: 'UPDATE_WARBAND', payload: { ...warband, goldCrowns: warband.goldCrowns - delta } });
                  }
                }
                saveGroup({ equipment: newEquipment });
              }}
              libraryItems={warband.customEquipmentLibrary}
              onOpenCatalogue={() => setPickerOpen(true)}
            />
          </div>
        </CollapsibleSection>
      </div>
      {pickerOpen && (
        <EquipmentPicker
          factionId={warband.faction}
          customLibrary={warband.customEquipmentLibrary}
          onAdd={(item) => {
            if (!creationDraft && item.cost != null && item.cost !== 0) {
              dispatch({ type: 'UPDATE_WARBAND', payload: { ...warband, goldCrowns: warband.goldCrowns - item.cost } });
            }
            if (creationDraft) {
              setDraftGroup((prev) => ({ ...prev, equipment: [...prev.equipment, item] }));
            } else {
              saveGroup({ equipment: [...model.equipment, item] });
            }
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
      {creationDraft && (
        <>
          {modelsOverflow > 0 && (
            <p className={styles.overflowBanner} role="alert">
              {model.models.length} models added but override is set to {model.modelCountOverride}.
              Remove {modelsOverflow} model{modelsOverflow > 1 ? 's' : ''} or increase the Model Count Override before adding to the roster.
            </p>
          )}
          <button
            className={styles.addToRosterBtn}
            onClick={handleAddToRoster}
            disabled={modelsOverflow > 0}
          >
            Add to Roster
          </button>
        </>
      )}
    </div>
  );
}
