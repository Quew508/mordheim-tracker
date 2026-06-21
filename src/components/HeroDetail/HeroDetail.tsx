import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, Navigate, useNavigate, useLocation } from 'react-router';
import { useWarband } from '../../hooks/useWarband';
import type { ModelStatus, Hero } from '../../types/warband';
import type { StatLine } from '../../types/reference';
import StatRow from './StatRow';
import CollapsibleSection from '../CollapsibleSection/CollapsibleSection';
import FreeTextList from '../FreeTextList/FreeTextList';
import EquipmentList from '../EquipmentList/EquipmentList';
import EquipmentPicker from '../EquipmentPicker/EquipmentPicker';
import styles from './HeroDetail.module.scss';

const STATUS_OPTIONS: ModelStatus[] = ['Active', 'Dead', 'Retired'];

export default function HeroDetailPage() {
  const { id, heroId } = useParams<{ id: string; heroId: string }>();
  const { state, dispatch } = useWarband();
  const navigate = useNavigate();
  const location = useLocation();

  const warband = state.warbands.find((w) => w.id === id);
  const hero = warband?.heroes.find((h) => h.id === heroId);

  const creationDraft: Hero | null = location.state?.isNew ? (location.state.draft as Hero) : null;
  const [draftHero, setDraftHero] = useState<Hero>(() => creationDraft ?? hero!);

  // Local draft state for text fields — dispatched on blur
  const [name, setName] = useState(() => (creationDraft ?? hero)?.name ?? '');
  const [role, setRole] = useState(() => (creationDraft ?? hero)?.role ?? '');
  // Panel open state (local — no need to persist per hero)
  const [xpOpen, setXpOpen] = useState(false);
  const [injuriesOpen, setInjuriesOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const saveHero = useCallback(
    (patch: Partial<Hero>) => {
      if (creationDraft) {
        setDraftHero((prev) => ({ ...prev, ...patch }));
        return;
      }
      if (!warband || !hero) return;
      dispatch({
        type: 'UPDATE_HERO',
        payload: { warbandId: warband.id, hero: { ...hero, ...patch } },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [warband?.id, hero?.id]
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

  if (!warband || (!hero && !creationDraft)) {
    return <Navigate to={`/warband/${id ?? ''}`} replace />;
  }

  const model = creationDraft ? draftHero : hero!;

  function handleStatChange(updated: StatLine) {
    saveHero({ stats: updated });
  }

  function handleAddToRoster() {
    if (!warband) return;
    const finalHero = { ...draftHero, name: name.trim(), role: role.trim() };
    const totalGold =
      (finalHero.recruitmentCost ?? 0) +
      finalHero.equipment.reduce((s, i) => s + (i.cost ?? 0), 0);
    if (totalGold > 0) {
      dispatch({ type: 'UPDATE_WARBAND', payload: { ...warband, goldCrowns: warband.goldCrowns - totalGold } });
    }
    dispatch({ type: 'ADD_HERO', payload: { warbandId: warband.id, hero: finalHero } });
    navigate(`/warband/${id}`);
  }

  return (
    <div className={styles.page}>
      {!creationDraft && (
      <div className={styles.menuContainer} ref={menuRef}>
        <button
          className={styles.menuBtn}
          aria-label="Hero actions"
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
                const newId = crypto.randomUUID();
                dispatch({ type: 'DUPLICATE_HERO', payload: { warbandId: id!, heroId: hero!.id, newId } });
                navigate(`/warband/${id}/hero/${newId}`);
              }}
            >
              Duplicate Hero
            </button>
          </div>
        )}
      </div>
      )}
      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor="hero-name" className={styles.label}>Name</label>
          <input
            id="hero-name"
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => saveHero({ name: name.trim() })}
            placeholder="Hero name"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="hero-role" className={styles.label}>Role / Type</label>
          <input
            id="hero-role"
            type="text"
            className={styles.input}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onBlur={() => saveHero({ role: role.trim() })}
            placeholder="e.g. Captain"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="hero-status" className={styles.label}>Status</label>
          <select
            id="hero-status"
            className={styles.select}
            value={model.status}
            onChange={(e) => saveHero({ status: e.target.value as ModelStatus })}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="hero-recruitment-cost" className={styles.label}>Recruitment Cost (gc)</label>
          <input
            id="hero-recruitment-cost"
            type="number"
            className={styles.input}
            value={model.recruitmentCost ?? ''}
            min={0}
            placeholder="e.g. 60"
            onChange={(e) => {
              const raw = e.target.value;
              const v = raw === '' ? null : Math.max(0, parseInt(raw, 10));
              const isFirstSet = model.recruitmentCost === null && v !== null;
              saveHero({ recruitmentCost: v });
              if (!creationDraft && isFirstSet && v !== null && warband) {
                dispatch({
                  type: 'UPDATE_WARBAND',
                  payload: { ...warband, goldCrowns: warband.goldCrowns - v },
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
        return (
          <p className={styles.totalCost}>
            Total cost: <strong>{total} gc</strong>
            {model.recruitmentCost !== null && eqCost > 0 && (
              <span className={styles.totalCostBreakdown}> ({model.recruitmentCost} recruitment + {eqCost} equipment)</span>
            )}
          </p>
        );
      })()}

      <div className={styles.statSection}>
        <h2 className={styles.statHeading}>Stats</h2>
        <StatRow stats={model.stats} onChange={handleStatChange} />
      </div>

      <div className={styles.panels}>
        <CollapsibleSection
          title="XP & Skills"
          isOpen={xpOpen}
          onToggle={() => setXpOpen((v) => !v)}
        >
          <div className={styles.panelContent}>
            <div className={styles.xpRow}>
              <label htmlFor="hero-xp" className={styles.panelLabel}>XP Total</label>
              <input
                id="hero-xp"
                type="number"
                className={styles.xpInput}
                value={model.xp}
                min={0}
                onChange={(e) =>
                  saveHero({ xp: Math.max(0, Number(e.target.value)) })
                }
              />
            </div>
            <p className={styles.panelLabel}>XP Log</p>
            <FreeTextList
              items={model.xpLog}
              onChange={(xpLog) => saveHero({ xpLog })}
              placeholder="e.g. Won scenario vs Skaven +1 XP"
            />
            <p className={styles.panelLabel}>Skills</p>
            <FreeTextList
              items={model.skills}
              onChange={(skills) => saveHero({ skills })}
              placeholder="e.g. Sprint"
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Injuries"
          isOpen={injuriesOpen}
          onToggle={() => setInjuriesOpen((v) => !v)}
        >
          <div className={styles.panelContent}>
            <FreeTextList
              items={model.injuryLog}
              onChange={(injuryLog) => saveHero({ injuryLog })}
              placeholder="e.g. Old Battle Wound"
            />
          </div>
        </CollapsibleSection>

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
                saveHero({ equipment: newEquipment });
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
              setDraftHero((prev) => ({ ...prev, equipment: [...prev.equipment, item] }));
            } else {
              saveHero({ equipment: [...model.equipment, item] });
            }
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
      {creationDraft && (
        <button className={styles.addToRosterBtn} onClick={handleAddToRoster}>
          Add to Roster
        </button>
      )}
    </div>
  );
}

