import type { AppData, ExportFile } from '../types/storage';
import type { Warband } from '../types/warband';
import { migrate } from '../utils/migrate';

export function buildExportData(data: AppData): ExportFile {
  return {
    exportVersion: data.schemaVersion,
    exportedAt: new Date().toISOString(),
    warbands: data.warbands,
  };
}

export function exportWarbands(data: AppData): void {
  const exportData = buildExportData(data);
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mordheim-export-${exportData.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function isValidExportFile(data: unknown): data is ExportFile {
  return (
    typeof data === 'object' && data !== null &&
    typeof (data as ExportFile).exportVersion === 'number' &&
    typeof (data as ExportFile).exportedAt === 'string' &&
    Array.isArray((data as ExportFile).warbands)
  );
}

export async function parseImportFile(file: File, currentSchemaVersion: number): Promise<Warband[]> {
  void currentSchemaVersion; // reserved for future version rejection
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON');
  }
  if (!isValidExportFile(parsed)) throw new Error('Invalid file format');
  const migrated = migrate({ schemaVersion: parsed.exportVersion, warbands: parsed.warbands });
  return migrated.warbands;
}
