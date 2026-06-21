import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WarbandProvider, WarbandContext } from './WarbandContext';
import { useContext } from 'react';
import * as storageService from '../services/storageService';

// Helper component to read context value
function ContextReader({ onValue }: { onValue: (v: unknown) => void }) {
  const ctx = useContext(WarbandContext);
  onValue(ctx);
  return null;
}

describe('WarbandContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('initialises state by calling loadData()', () => {
    const loadSpy = vi.spyOn(storageService, 'loadData');
    render(
      <WarbandProvider>
        <div />
      </WarbandProvider>
    );
    expect(loadSpy).toHaveBeenCalledOnce();
  });

  it('initial state defaults to schemaVersion 1 and empty warbands', () => {
    let captured: unknown;
    render(
      <WarbandProvider>
        <ContextReader onValue={(v) => { captured = v; }} />
      </WarbandProvider>
    );
    expect((captured as { state: { schemaVersion: number; warbands: [] } }).state).toEqual({
      schemaVersion: 1,
      warbands: [],
    });
  });

  it('calls saveData after every dispatch', async () => {
    const saveSpy = vi.spyOn(storageService, 'saveData');
    let capturedDispatch: ((a: unknown) => void) | undefined;

    function DispatchCapture() {
      const ctx = useContext(WarbandContext);
      capturedDispatch = ctx?.dispatch as (a: unknown) => void;
      return null;
    }

    render(
      <WarbandProvider>
        <DispatchCapture />
      </WarbandProvider>
    );

    await act(async () => {
      capturedDispatch?.({
        type: 'ADD_WARBAND',
        payload: {
          id: 'w1',
          name: 'Test',
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
        },
      });
    });

    expect(saveSpy).toHaveBeenCalled();
    const savedArg = saveSpy.mock.calls[saveSpy.mock.calls.length - 1][0];
    expect(savedArg.warbands).toHaveLength(1);
  });

  it('exposes a dispatch function', () => {
    let captured: unknown;
    render(
      <WarbandProvider>
        <ContextReader onValue={(v) => { captured = v; }} />
      </WarbandProvider>
    );
    expect(typeof (captured as { dispatch: unknown }).dispatch).toBe('function');
  });
});
