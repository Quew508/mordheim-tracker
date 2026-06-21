import { createContext, type ReactNode } from 'react';
import type { FactionTemplate, EquipmentCatalogueItem } from '../types/reference';
import { factions, commonEquipment } from '../data/index';

export interface ReferenceDataContextValue {
  factions: FactionTemplate[];
  commonEquipment: EquipmentCatalogueItem[];
}

export const ReferenceDataContext = createContext<ReferenceDataContextValue | null>(null);

// Reference data is loaded once at startup from static imports — never written.
const referenceData: ReferenceDataContextValue = { factions, commonEquipment };

export function ReferenceDataProvider({ children }: { children: ReactNode }) {
  return (
    <ReferenceDataContext.Provider value={referenceData}>
      {children}
    </ReferenceDataContext.Provider>
  );
}
