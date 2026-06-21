import type { AppData } from '../types/storage';
import { migrate } from '../utils/migrate';

const STORAGE_KEY = 'mordheim_data';

const DEFAULT_DATA: AppData = {
  schemaVersion: 1,
  warbands: [],
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA };
    const parsed = JSON.parse(raw) as AppData;
    return migrate(parsed);
  } catch {
    return { ...DEFAULT_DATA };
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      throw err;
    }
    // Swallow other errors (e.g. SecurityError in restricted private-browsing environments)
  }
}

export function clearData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
