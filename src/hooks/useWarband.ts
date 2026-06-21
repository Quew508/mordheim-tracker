import { useContext } from 'react';
import { WarbandContext, type WarbandContextValue } from '../context/WarbandContext';

export function useWarband(): WarbandContextValue {
  const ctx = useContext(WarbandContext);
  if (!ctx) throw new Error('useWarband must be used within a WarbandProvider');
  return ctx;
}
