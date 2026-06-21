import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import '@testing-library/jest-dom';
import { WarbandProvider } from '../../context/WarbandContext';
import PrintViewPage from './PrintView';

const seedData = JSON.stringify({
  schemaVersion: 1,
  warbands: [{
    id: 'w-1',
    name: 'Iron Fists',
    faction: 'Reiklanders',
    notes: '',
    rating: 50,
    heroes: [{
      id: 'h-1',
      name: 'Klaus',
      role: 'Captain',
      status: 'Active',
      stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
      xp: 5,
      xpLog: [],
      skills: ['Sprint'],
      injuryLog: [],
      equipment: [{ id: 'e-1', name: 'Sword', cost: 10 }],
      ooa: 0,
      recruitmentCost: null,
    }],
    henchmanGroups: [],
    inventory: [],
    customEquipmentLibrary: [],
    goldCrowns: 50,
    wyrdstoneFragments: 2,
    transactionLog: [],
    achievements: [],
    lootLog: [],
  }],
});

function renderAtPrintRoute(warbandId: string) {
  return render(
    <WarbandProvider>
      <MemoryRouter initialEntries={[`/warband/${warbandId}/print`]}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/warband/:id/print" element={<PrintViewPage />} />
        </Routes>
      </MemoryRouter>
    </WarbandProvider>
  );
}

describe('PrintViewPage', () => {
  beforeEach(() => {
    localStorage.setItem('mordheim_data', seedData);
    vi.spyOn(window, 'print').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the warband name', () => {
    renderAtPrintRoute('w-1');
    expect(screen.getByRole('heading', { name: 'Iron Fists' })).toBeInTheDocument();
  });

  it('renders the faction', () => {
    renderAtPrintRoute('w-1');
    expect(screen.getByText('Reiklanders')).toBeInTheDocument();
  });

  it('calls window.print() on mount', () => {
    renderAtPrintRoute('w-1');
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('renders the hero name under the Heroes heading', () => {
    renderAtPrintRoute('w-1');
    expect(screen.getByRole('heading', { name: 'Heroes' })).toBeInTheDocument();
    expect(screen.getByText(/Klaus/)).toBeInTheDocument();
  });

  it('renders the Treasury section with gold value', () => {
    renderAtPrintRoute('w-1');
    expect(screen.getByRole('heading', { name: 'Treasury' })).toBeInTheDocument();
    expect(screen.getByText(/50 gc/)).toBeInTheDocument();
  });

  it('redirects to home when warband id is not found', () => {
    renderAtPrintRoute('no-such-id');
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(window.print).not.toHaveBeenCalled();
  });
});
