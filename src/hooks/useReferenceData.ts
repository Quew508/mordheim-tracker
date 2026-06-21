import { useContext } from 'react';
import { ReferenceDataContext, type ReferenceDataContextValue } from '../context/ReferenceDataContext';

export function useReferenceData(): ReferenceDataContextValue {
  const ctx = useContext(ReferenceDataContext);
  if (!ctx) throw new Error('useReferenceData must be used within a ReferenceDataProvider');
  return ctx;
}
