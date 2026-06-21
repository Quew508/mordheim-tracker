import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useWarband } from './useWarband';
import { useReferenceData } from './useReferenceData';
import { WarbandProvider } from '../context/WarbandContext';
import { ReferenceDataProvider } from '../context/ReferenceDataContext';
import type { ReactNode } from 'react';

describe('useWarband', () => {
  it('throws when used outside WarbandProvider', () => {
    expect(() => renderHook(() => useWarband())).toThrow(
      'useWarband must be used within a WarbandProvider'
    );
  });

  it('returns state and dispatch when inside WarbandProvider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <WarbandProvider>{children}</WarbandProvider>
    );
    const { result } = renderHook(() => useWarband(), { wrapper });
    expect(result.current.state).toBeDefined();
    expect(typeof result.current.dispatch).toBe('function');
  });
});

describe('useReferenceData', () => {
  it('throws when used outside ReferenceDataProvider', () => {
    expect(() => renderHook(() => useReferenceData())).toThrow(
      'useReferenceData must be used within a ReferenceDataProvider'
    );
  });

  it('returns factions and commonEquipment when inside ReferenceDataProvider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ReferenceDataProvider>{children}</ReferenceDataProvider>
    );
    const { result } = renderHook(() => useReferenceData(), { wrapper });
    expect(Array.isArray(result.current.factions)).toBe(true);
    expect(Array.isArray(result.current.commonEquipment)).toBe(true);
  });
});
