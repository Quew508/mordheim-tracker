import { describe, it, expect } from 'vitest';
import { buildExportData, parseImportFile } from './portabilityService';
import type { AppData } from '../types/storage';
import type { Warband } from '../types/warband';

function makeWarband(id: string): Warband {
  return {
    id,
    name: `Warband ${id}`,
    faction: '',
    notes: '',
    rating: 0,
    heroes: [],
    henchmanGroups: [],
    inventory: [],
    customEquipmentLibrary: [],
    goldCrowns: 0,
    wyrdstoneFragments: 0,
    transactionLog: [],
    achievements: [],
    lootLog: [],
  };
}

function makeAppData(overrides?: Partial<AppData>): AppData {
  return { schemaVersion: 1, warbands: [], ...overrides };
}

describe('buildExportData', () => {
  it('sets exportVersion to schemaVersion', () => {
    const data = makeAppData({ schemaVersion: 2 });
    const result = buildExportData(data);
    expect(result.exportVersion).toBe(2);
  });

  it('sets exportedAt to a valid ISO date string', () => {
    const result = buildExportData(makeAppData());
    expect(result.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('exportedAt date prefix matches YYYY-MM-DD format', () => {
    const result = buildExportData(makeAppData());
    const datePrefix = result.exportedAt.slice(0, 10);
    expect(datePrefix).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('includes all warbands from AppData', () => {
    const warbands = [makeWarband('w-1'), makeWarband('w-2')];
    const result = buildExportData(makeAppData({ warbands }));
    expect(result.warbands).toHaveLength(2);
    expect(result.warbands[0].id).toBe('w-1');
    expect(result.warbands[1].id).toBe('w-2');
  });

  it('produces empty warbands array when state has no warbands', () => {
    const result = buildExportData(makeAppData({ warbands: [] }));
    expect(result.warbands).toHaveLength(0);
  });

  it('warbands in result are the same references as input', () => {
    const warbands = [makeWarband('w-1')];
    const result = buildExportData(makeAppData({ warbands }));
    expect(result.warbands).toBe(warbands);
  });
});

describe('parseImportFile', () => {
  function makeExportJson(overrides?: object): string {
    return JSON.stringify({
      exportVersion: 1,
      exportedAt: '2026-06-20T00:00:00.000Z',
      warbands: [],
      ...overrides,
    });
  }

  function makeFile(content: string): File {
    return new File([content], 'export.json', { type: 'application/json' });
  }

  it('returns the warbands array from a valid export file', async () => {
    const warbands = [makeWarband('w-1')];
    const file = makeFile(makeExportJson({ warbands }));
    const result = await parseImportFile(file, 1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('w-1');
  });

  it('returns empty array when warbands is empty', async () => {
    const file = makeFile(makeExportJson({ warbands: [] }));
    const result = await parseImportFile(file, 1);
    expect(result).toHaveLength(0);
  });

  it('throws on malformed JSON', async () => {
    const file = makeFile('not-json');
    await expect(parseImportFile(file, 1)).rejects.toThrow('Invalid JSON');
  });

  it('throws when warbands field is missing', async () => {
    const file = makeFile(JSON.stringify({ exportVersion: 1, exportedAt: '2026-06-20T00:00:00.000Z' }));
    await expect(parseImportFile(file, 1)).rejects.toThrow('Invalid file format');
  });

  it('throws when exportVersion is missing', async () => {
    const file = makeFile(JSON.stringify({ exportedAt: '2026-06-20T00:00:00.000Z', warbands: [] }));
    await expect(parseImportFile(file, 1)).rejects.toThrow('Invalid file format');
  });

  it('throws when top-level value is not an object', async () => {
    const file = makeFile('"just a string"');
    await expect(parseImportFile(file, 1)).rejects.toThrow('Invalid file format');
  });
});
