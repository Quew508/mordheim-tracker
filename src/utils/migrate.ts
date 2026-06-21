import type { AppData } from '../types/storage';

export function migrate(data: AppData): AppData {
  // v1 → v1: identity — no migration needed
  if (data.schemaVersion === 1) {
    return data;
  }

  // Future versions: add migration steps here
  // e.g. if (data.schemaVersion === 2) { ... return { ...data, schemaVersion: 3 }; }

  return data;
}
