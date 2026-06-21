import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useContext } from 'react';
import { ReferenceDataProvider, ReferenceDataContext } from './ReferenceDataContext';
import type { FactionTemplate, EquipmentCatalogueItem } from '../types/reference';

function ContextReader({ onValue }: { onValue: (v: unknown) => void }) {
  const ctx = useContext(ReferenceDataContext);
  onValue(ctx);
  return null;
}

type CtxValue = { factions: FactionTemplate[]; commonEquipment: EquipmentCatalogueItem[] };

describe('ReferenceDataContext', () => {
  it('provides factions as an array', () => {
    let captured: unknown;
    render(
      <ReferenceDataProvider>
        <ContextReader onValue={(v) => { captured = v; }} />
      </ReferenceDataProvider>
    );
    expect(Array.isArray((captured as CtxValue).factions)).toBe(true);
  });

  it('provides commonEquipment as an array', () => {
    let captured: unknown;
    render(
      <ReferenceDataProvider>
        <ContextReader onValue={(v) => { captured = v; }} />
      </ReferenceDataProvider>
    );
    expect(Array.isArray((captured as CtxValue).commonEquipment)).toBe(true);
  });

  it('does not expose a dispatch function (read-only)', () => {
    let captured: unknown;
    render(
      <ReferenceDataProvider>
        <ContextReader onValue={(v) => { captured = v; }} />
      </ReferenceDataProvider>
    );
    expect((captured as Record<string, unknown>).dispatch).toBeUndefined();
  });

  it('factions contains exactly 17 entries', () => {
    let captured: unknown;
    render(
      <ReferenceDataProvider>
        <ContextReader onValue={(v) => { captured = v; }} />
      </ReferenceDataProvider>
    );
    expect((captured as CtxValue).factions).toHaveLength(17);
  });

  it('every faction has id, name, and non-empty modelTypes', () => {
    let captured: unknown;
    render(
      <ReferenceDataProvider>
        <ContextReader onValue={(v) => { captured = v; }} />
      </ReferenceDataProvider>
    );
    const { factions } = captured as CtxValue;
    for (const faction of factions) {
      expect(typeof faction.id).toBe('string');
      expect(typeof faction.name).toBe('string');
      expect(faction.modelTypes.length).toBeGreaterThan(0);
    }
  });

  it('every modelType has all 9 stat keys', () => {
    let captured: unknown;
    render(
      <ReferenceDataProvider>
        <ContextReader onValue={(v) => { captured = v; }} />
      </ReferenceDataProvider>
    );
    const { factions } = captured as CtxValue;
    const statKeys = ['M', 'WS', 'BS', 'S', 'T', 'W', 'I', 'A', 'Ld'] as const;
    for (const faction of factions) {
      for (const model of faction.modelTypes) {
        for (const key of statKeys) {
          expect(typeof model.statLine[key]).toBe('number');
        }
      }
    }
  });

  it('commonEquipment contains exactly 21 items with required fields', () => {
    let captured: unknown;
    render(
      <ReferenceDataProvider>
        <ContextReader onValue={(v) => { captured = v; }} />
      </ReferenceDataProvider>
    );
    const { commonEquipment } = captured as CtxValue;
    expect(commonEquipment).toHaveLength(21);
    for (const item of commonEquipment) {
      expect(typeof item.id).toBe('string');
      expect(typeof item.name).toBe('string');
      expect(typeof item.source).toBe('string');
    }
  });
});
