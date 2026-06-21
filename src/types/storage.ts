import type { Warband } from './warband';

export interface AppData {
  schemaVersion: number;
  warbands: Warband[];
}

export interface ExportFile {
  exportVersion: number;
  exportedAt: string;
  warbands: Warband[];
}
