import { describe, it, expect, beforeEach } from 'vitest';
import { loadData, saveData, clearData } from './storageService';

describe('storageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadData', () => {
    it('returns default state when localStorage is empty', () => {
      const data = loadData();
      expect(data).toEqual({ schemaVersion: 1, warbands: [] });
    });

    it('returns the saved data when it exists', () => {
      const stored = { schemaVersion: 1, warbands: [] };
      localStorage.setItem('mordheim_data', JSON.stringify(stored));
      const data = loadData();
      expect(data).toEqual(stored);
    });

    it('returns default state when localStorage contains invalid JSON', () => {
      localStorage.setItem('mordheim_data', 'not-json{{');
      const data = loadData();
      expect(data).toEqual({ schemaVersion: 1, warbands: [] });
    });

    it('reads from the single key mordheim_data', () => {
      const stored = { schemaVersion: 1, warbands: [] };
      localStorage.setItem('mordheim_data', JSON.stringify(stored));
      // Only that key should be read
      expect(localStorage.getItem('mordheim_data')).not.toBeNull();
    });
  });

  describe('saveData', () => {
    it('serialises the full state under mordheim_data', () => {
      const data = { schemaVersion: 1, warbands: [] };
      saveData(data);
      const raw = localStorage.getItem('mordheim_data');
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw!)).toEqual(data);
    });

    it('overwrites the previous value on subsequent saves', () => {
      saveData({ schemaVersion: 1, warbands: [] });
      const updated = { schemaVersion: 1, warbands: [{ id: 'abc' } as never] };
      saveData(updated);
      const raw = localStorage.getItem('mordheim_data');
      expect(JSON.parse(raw!)).toEqual(updated);
    });
  });

  describe('clearData', () => {
    it('removes the mordheim_data key', () => {
      saveData({ schemaVersion: 1, warbands: [] });
      clearData();
      expect(localStorage.getItem('mordheim_data')).toBeNull();
    });
  });
});
