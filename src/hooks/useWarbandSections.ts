import { useState, useCallback } from 'react';

const STORAGE_KEY = 'mordheim_sections';

type SectionId = 'roster' | 'treasury' | 'post-game' | 'inventory';

type SectionState = Record<SectionId, boolean>;

const DEFAULT_STATE: SectionState = {
  roster: false,
  treasury: false,
  'post-game': false,
  inventory: false,
};

function readAll(): Record<string, SectionState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SectionState>) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, SectionState>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Returns per-warband section open state, persisted to localStorage.
 * Sections are all collapsed by default.
 */
export function useWarbandSections(warbandId: string) {
  const [sections, setSections] = useState<SectionState>(() => {
    const all = readAll();
    return all[warbandId] ?? { ...DEFAULT_STATE };
  });

  const toggle = useCallback(
    (sectionId: SectionId) => {
      setSections((prev) => {
        const next = { ...prev, [sectionId]: !prev[sectionId] };
        const all = readAll();
        writeAll({ ...all, [warbandId]: next });
        return next;
      });
    },
    [warbandId]
  );

  return { sections, toggle };
}
