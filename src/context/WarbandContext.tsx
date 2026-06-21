import { createContext, useReducer, useEffect, useState, type ReactNode } from 'react';
import type { AppData } from '../types/storage';
import { loadData, saveData } from '../services/storageService';
import { warbandReducer, type WarbandAction } from './warbandReducer';

export interface WarbandContextValue {
  state: AppData;
  dispatch: React.Dispatch<WarbandAction>;
  storageError: string | null;
}

export const WarbandContext = createContext<WarbandContextValue | null>(null);

export function WarbandProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(warbandReducer, undefined, loadData);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Persist full state to localStorage after every state change (ARCH-09)
  useEffect(() => {
    try {
      saveData(state);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        setStorageError('Could not save — storage is full. Export your data now.');
      }
    }
  }, [state]);

  return (
    <WarbandContext.Provider value={{ state, dispatch, storageError }}>
      {children}
    </WarbandContext.Provider>
  );
}
