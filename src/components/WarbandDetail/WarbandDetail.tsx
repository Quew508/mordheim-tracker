import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router';
import { useWarband } from '../../hooks/useWarband';
import { useWarbandSections } from '../../hooks/useWarbandSections';
import CollapsibleSection from '../CollapsibleSection/CollapsibleSection';
import RosterSection from './RosterSection';
import EquipmentList from '../EquipmentList/EquipmentList';
import TreasuryPanel from '../TreasuryPanel/TreasuryPanel';
import PostGameRecordsPanel from '../PostGameRecordsPanel/PostGameRecordsPanel';
import PostGameFlow from '../PostGameFlow/PostGameFlow';
import { computeWarbandRating } from '../../utils/warband';
import styles from './WarbandDetail.module.scss';

/** Tiny inline form for adding a custom library item */
function AddLibraryItemForm({ onAdd }: { onAdd: (name: string, cost: number | null) => void }) {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  function handle() {
    const n = name.trim();
    if (!n) return;
    const c = cost.trim() === '' ? null : Number(cost);
    onAdd(n, isNaN(c as number) ? null : c);
    setName('');
    setCost('');
  }
  return (
    <div className={styles.libAddRow}>
      <input
        type="text"
        className={styles.libInput}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Item name"
        aria-label="Library item name"
      />
      <input
        type="number"
        className={`${styles.libInput} ${styles.libCostInput}`}
        value={cost}
        onChange={(e) => setCost(e.target.value)}
        placeholder="Cost"
        aria-label="Library item cost"
      />
      <button className={styles.libAddBtn} onClick={handle} disabled={!name.trim()}>
        + Add
      </button>
    </div>
  );
}

export default function WarbandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useWarband();
  const navigate = useNavigate();
  const warband = state.warbands.find((w) => w.id === id);

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPostGame, setShowPostGame] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Section open state — persisted per warband id
  // Hook is always called; it reads from an empty warband id if not found yet
  const { sections, toggle } = useWarbandSections(id ?? '');

  // Close menu on outside click
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

  // Close menu on Escape
  useEffect(() => {
    if (!menuOpen) return;
    function handleKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  if (!warband) {
    return <Navigate to="/" replace />;
  }

  function handleDelete() {
    dispatch({ type: 'DELETE_WARBAND', payload: { id: warband!.id } });
    navigate('/');
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{warband.name}</h1>
          {warband.faction && (
            <p className={styles.faction}>{warband.faction}</p>
          )}
          <p className={styles.rating}>Rating: {computeWarbandRating(warband)}</p>
        </div>

        <div className={styles.menuContainer} ref={menuRef}>
          <button
            className={styles.menuBtn}
            aria-label="Warband actions"
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
                  navigate(`/warband/${warband.id}/print`);
                }}
              >
                Print
              </button>
              <button
                role="menuitem"
                className={styles.menuItem}
                onClick={() => {
                  setMenuOpen(false);
                  navigate(`/warband/${warband.id}/edit`);
                }}
              >
                Edit Warband
              </button>
              <button
                role="menuitem"
                className={`${styles.menuItem} ${styles.menuItemDestructive}`}
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmDelete(true);
                }}
              >
                Delete Warband
              </button>
            </div>
          )}
        </div>
      </div>

      {warband.notes && (
        <p className={styles.notes}>{warband.notes}</p>
      )}

      <button
        className={styles.postGameBtn}
        onClick={() => setShowPostGame(true)}
      >
        Post-Game
      </button>

      <div className={styles.sections}>
        <CollapsibleSection
          title="Roster"
          isOpen={sections.roster}
          onToggle={() => toggle('roster')}
        >
          <RosterSection warband={warband} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Inventory & Custom Equipment"
          isOpen={sections.inventory}
          onToggle={() => toggle('inventory')}
        >
          <div className={styles.inventoryContent}>
            <p className={styles.panelLabel}>Warband Inventory</p>
            <EquipmentList
              items={warband.inventory}
              onChange={(newInventory) => {
                const oldCost = warband.inventory.reduce((s, i) => s + (i.cost ?? 0), 0);
                const newCost = newInventory.reduce((s, i) => s + (i.cost ?? 0), 0);
                const delta = newCost - oldCost;
                dispatch({
                  type: 'UPDATE_WARBAND',
                  payload: { ...warband, inventory: newInventory, goldCrowns: warband.goldCrowns - delta },
                });
              }}
            />
            <p className={styles.panelLabel}>Custom Equipment Library</p>
            <div className={styles.libraryMgmt}>
              {warband.customEquipmentLibrary.map((item) => (
                <div key={item.id} className={styles.libItem}>
                  <span className={styles.libName}>{item.name}</span>
                  {item.cost != null && <span className={styles.libCost}>{item.cost} gc</span>}
                  <button
                    className={styles.libRemove}
                    onClick={() =>
                      dispatch({
                        type: 'UPDATE_WARBAND',
                        payload: {
                          ...warband,
                          customEquipmentLibrary: warband.customEquipmentLibrary.filter(
                            (i) => i.id !== item.id
                          ),
                        },
                      })
                    }
                    aria-label={`Remove ${item.name} from library`}
                  >
                    ×
                  </button>
                </div>
              ))}
              <AddLibraryItemForm
                onAdd={(name, cost) =>
                  dispatch({
                    type: 'UPDATE_WARBAND',
                    payload: {
                      ...warband,
                      customEquipmentLibrary: [
                        ...warband.customEquipmentLibrary,
                        { id: crypto.randomUUID(), name, cost },
                      ],
                    },
                  })
                }
              />
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Treasury"
          isOpen={sections.treasury}
          onToggle={() => toggle('treasury')}
        >
          <TreasuryPanel
            warband={warband}
            onUpdate={(updated) => dispatch({ type: 'UPDATE_WARBAND', payload: updated })}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Post-Game Records"
          isOpen={sections['post-game']}
          onToggle={() => toggle('post-game')}
        >
          <PostGameRecordsPanel
            warband={warband}
            onUpdate={(updated) => dispatch({ type: 'UPDATE_WARBAND', payload: updated })}
          />
        </CollapsibleSection>
      </div>

      {showPostGame && (
        <PostGameFlow warband={warband} onClose={() => setShowPostGame(false)} />
      )}

      {/* Delete confirmation sheet */}
      {confirmDelete && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className={styles.sheet}>
            <h2 id="delete-title" className={styles.sheetTitle}>Delete warband?</h2>
            <p className={styles.sheetBody}>
              <strong>{warband.name}</strong> will be permanently removed.
            </p>
            <div className={styles.sheetActions}>
              <button
                className={styles.sheetCancelBtn}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
              <button
                className={styles.sheetDeleteBtn}
                onClick={handleDelete}
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
