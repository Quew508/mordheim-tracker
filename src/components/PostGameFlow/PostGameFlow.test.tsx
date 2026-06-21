import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import type { ReactNode } from 'react';
import { WarbandProvider } from '../../context/WarbandContext';
import PostGameFlow from './PostGameFlow';
import type { Warband } from '../../types/warband';
import type { AppData } from '../../types/storage';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------
const ACTIVE_HERO: Warband['heroes'][0] = {
  id: 'h-1',
  name: 'Geralt',
  role: 'Captain',
  status: 'Active',
  stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
  xp: 5,
  xpLog: [],
  skills: [],
  injuryLog: [],
  equipment: [],
  ooa: 2,
  recruitmentCost: null,
};

const DEAD_HERO: Warband['heroes'][0] = {
  ...ACTIVE_HERO,
  id: 'h-2',
  name: 'Dead Guy',
  status: 'Dead',
  ooa: 0,
};

const ACTIVE_GROUP: Warband['henchmanGroups'][0] = {
  id: 'g-1',
  name: 'Swordsmen',
  role: 'Warriors',
  status: 'Active',
  stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
  xp: 0,
  advancementNotes: [],
  injuryLog: [],
  equipment: [],
  models: [
    {
      id: 'm-1',
      name: '',
      status: 'Active',
      statDeviations: { M: 0, WS: 0, BS: 0, S: 0, T: 0, W: 0, I: 0, A: 0, Ld: 0 },
      injuryLog: [],
      ooa: 3,
    },
  ],
  modelCountOverride: null,
  recruitmentCost: null,
};

const WARBAND: Warband = {
  id: 'w-1',
  name: 'Test Warband',
  faction: '',
  notes: '',
  rating: 0,
  heroes: [ACTIVE_HERO, DEAD_HERO],
  henchmanGroups: [ACTIVE_GROUP],
  inventory: [],
  customEquipmentLibrary: [],
  goldCrowns: 100,
  wyrdstoneFragments: 5,
  transactionLog: [],
  achievements: [],
  lootLog: [],
};

function seed(warband = WARBAND) {
  const data: AppData = { schemaVersion: 1, warbands: [warband] };
  localStorage.setItem('mordheim_data', JSON.stringify(data));
}

function Wrapper({ children }: { children: ReactNode }) {
  return <WarbandProvider>{children}</WarbandProvider>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('PostGameFlow', () => {
  beforeEach(() => {
    localStorage.clear();
    seed();
  });

  it('renders the first active hero step', () => {
    render(<PostGameFlow warband={WARBAND} onClose={vi.fn()} />, { wrapper: Wrapper });
    expect(screen.getByRole('heading', { name: 'Geralt' })).toBeInTheDocument();
    expect(screen.getByLabelText(/xp earned/i)).toBeInTheDocument();
  });

  it('skips Dead heroes — step count only includes active entities', () => {
    // 1 active hero + 1 active group + treasury = 3 steps
    render(<PostGameFlow warband={WARBAND} onClose={vi.fn()} />, { wrapper: Wrapper });
    expect(screen.getByText(/\(1\/3\)/)).toBeInTheDocument();
  });

  it('shows advancement callout when XP delta crosses threshold', async () => {
    const user = userEvent.setup();
    render(<PostGameFlow warband={WARBAND} onClose={vi.fn()} />, { wrapper: Wrapper });
    // ACTIVE_HERO has xp=5; threshold array includes 6; entering delta=1 crosses it
    const xpInput = screen.getByLabelText(/xp earned/i);
    await user.clear(xpInput);
    await user.type(xpInput, '1');
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/advancement!/i)).toBeInTheDocument();
  });

  it('dispatches RECORD_POST_GAME on confirm, resetting all OOA counters', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PostGameFlow warband={WARBAND} onClose={onClose} />, { wrapper: Wrapper });

    // Hero step: enter XP
    await user.type(screen.getByLabelText(/xp earned/i), '3');
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Group step: just advance
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Treasury step: confirm
    expect(screen.getByText(/treasury/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    // Verify localStorage: hero xp incremented, OOA reset
    const saved: AppData = JSON.parse(localStorage.getItem('mordheim_data')!);
    const warband = saved.warbands[0];
    const hero = warband.heroes.find((h) => h.id === 'h-1')!;
    expect(hero.xp).toBe(8); // 5 + 3
    expect(hero.ooa).toBe(0);
    expect(warband.henchmanGroups[0].models[0].ooa).toBe(0);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows discard guard sheet when close tapped with dirty state', async () => {
    const user = userEvent.setup();
    render(<PostGameFlow warband={WARBAND} onClose={vi.fn()} />, { wrapper: Wrapper });
    // Dirty the form
    await user.type(screen.getByLabelText(/xp earned/i), '1');
    await user.click(screen.getByRole('button', { name: /close post-game flow/i }));
    expect(screen.getByRole('heading', { name: /discard changes/i })).toBeInTheDocument();
  });

  it('"Keep editing" dismisses the discard guard without closing', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PostGameFlow warband={WARBAND} onClose={onClose} />, { wrapper: Wrapper });
    await user.type(screen.getByLabelText(/xp earned/i), '1');
    await user.click(screen.getByRole('button', { name: /close post-game flow/i }));
    await user.click(screen.getByRole('button', { name: /keep editing/i }));
    expect(screen.queryByRole('heading', { name: /discard changes/i })).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose immediately when no changes have been made', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PostGameFlow warband={WARBAND} onClose={onClose} />, { wrapper: Wrapper });
    await user.click(screen.getByRole('button', { name: /close post-game flow/i }));
    expect(onClose).toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: /discard changes/i })).not.toBeInTheDocument();
  });
});
