import { useLocation, useNavigate, Outlet } from 'react-router';
import { useState, useRef, useEffect } from 'react';
import styles from './AppShell.module.scss';
import { useTheme } from '../../hooks/useTheme';
import { useWarband } from '../../hooks/useWarband';
import { exportWarbands, parseImportFile } from '../../services/portabilityService';

function parentPath(pathname: string): string {
  const segs = pathname.split('/').filter(Boolean);
  if (segs.length <= 2) return '/';            // /warband/:id or /warband/new → home
  return '/' + segs.slice(0, 2).join('/');     // deeper → /warband/:id
}

function backLabel(pathname: string): string {
  const segs = pathname.split('/').filter(Boolean);
  return segs.length <= 2 ? '◀ Warbands' : '◀ Warband';
}

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const { theme, toggleTheme } = useTheme();
  const { state, dispatch } = useWarband();
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;

    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  // Clear export feedback after 3 seconds
  useEffect(() => {
    if (!exportFeedback) return;
    const timer = setTimeout(() => setExportFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [exportFeedback]);

  // Clear import feedback after 3 seconds
  useEffect(() => {
    if (!importFeedback) return;
    const timer = setTimeout(() => setImportFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [importFeedback]);

  async function handleImportFile(file: File) {
    try {
      const warbands = await parseImportFile(file, state.schemaVersion);
      dispatch({ type: 'MERGE_WARBANDS', payload: { warbands } });
      const n = warbands.length;
      setImportFeedback(`Imported ${n} warband${n !== 1 ? 's' : ''}.`);
    } catch {
      setImportFeedback('Invalid file.');
    }
  }

  return (
    <div className={styles.shell}>
      <header className={`${styles.topBar} app-top-bar`} role="banner">
        <div className={styles.topBarLeft}>
          {!isHome && (
            <button
              className={styles.backBtn}
              onClick={() => navigate(parentPath(location.pathname))}
              aria-label="Go back"
            >
              {backLabel(location.pathname)}
            </button>
          )}
        </div>

        {isHome && (
          <span className={styles.title}>Mordheim</span>
        )}

        <div className={styles.topBarRight} ref={menuRef}>
          {(exportFeedback ?? importFeedback) && (
            <span className={styles.exportFeedback}>{exportFeedback ?? importFeedback}</span>
          )}
          <button
            className={styles.overflowBtn}
            aria-label="More options"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            ⋮
          </button>

          {menuOpen && (
            <div className={styles.overflowMenu} role="menu">
              {isHome && (
                <button
                  role="menuitem"
                  className={styles.menuItem}
                  onClick={() => {
                    setMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                >
                  Import
                </button>
              )}
              {isHome && (
                <button
                  role="menuitem"
                  className={styles.menuItem}
                  onClick={() => {
                    const n = state.warbands.length;
                    exportWarbands(state);
                    setMenuOpen(false);
                    setExportFeedback(`Exported ${n} warband${n !== 1 ? 's' : ''}.`);
                  }}
                >
                  Export
                </button>
              )}
              <button
                role="menuitem"
                className={styles.menuItem}
                onClick={() => { toggleTheme(); setMenuOpen(false); }}
              >
                {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
