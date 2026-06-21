import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import '@testing-library/jest-dom';
import type { ReactNode } from 'react';
import HeroDetailPage from './HeroDetail';
import StatRow from './StatRow';
import WarbandDetailPage from '../WarbandDetail/WarbandDetail';
import { WarbandProvider } from '../../context/WarbandContext';
import { ReferenceDataProvider } from '../../context/ReferenceDataContext';
import type { AppData } from '../../types/storage';
import type { Hero } from '../../types/warband';

// ── StatRow unit tests ────────────────────────────────────────────────────

const ZERO_STATS = { M: 0, WS: 0, BS: 0, S: 0, T: 0, W: 0, I: 0, A: 0, Ld: 0 };
const FILLED_STATS = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 8 };

describe('StatRow', () => {
  it('renders all 9 stat labels', () => {
    render(<StatRow stats={ZERO_STATS} onChange={() => {}} />);
    for (const label of ['M', 'WS', 'BS', 'S', 'T', 'W', 'I', 'A', 'Ld']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('renders stat values as buttons', () => {
    render(<StatRow stats={FILLED_STATS} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /edit M/i })).toHaveTextContent('4');
    expect(screen.getByRole('button', { name: /edit Ld/i })).toHaveTextContent('8');
  });

  it('clicking a stat value shows a number input', async () => {
    const user = userEvent.setup();
    render(<StatRow stats={ZERO_STATS} onChange={() => {}} />);
    await user.click(screen.getByRole('button', { name: /edit M/i }));
    expect(screen.getByRole('spinbutton', { name: /M value/i })).toBeInTheDocument();
  });

  it('blurring the input calls onChange with updated stat', async () => {
    const user = userEvent.setup();
    let result = ZERO_STATS;
    render(<StatRow stats={ZERO_STATS} onChange={(s) => { result = s; }} />);
    await user.click(screen.getByRole('button', { name: /edit WS/i }));
    const input = screen.getByRole('spinbutton', { name: /WS value/i });
    await user.clear(input);
    await user.type(input, '4');
    await user.tab(); // blur
    expect(result.WS).toBe(4);
  });

  it('pressing Enter in the input commits the value', async () => {
    const user = userEvent.setup();
    let result = ZERO_STATS;
    render(<StatRow stats={ZERO_STATS} onChange={(s) => { result = s; }} />);
    await user.click(screen.getByRole('button', { name: /edit S/i }));
    const input = screen.getByRole('spinbutton', { name: /S value/i });
    await user.clear(input);
    await user.type(input, '3');
    await user.keyboard('{Enter}');
    expect(result.S).toBe(3);
  });

  it('pressing Escape cancels without calling onChange', async () => {
    const user = userEvent.setup();
    let callCount = 0;
    render(<StatRow stats={ZERO_STATS} onChange={() => { callCount++; }} />);
    await user.click(screen.getByRole('button', { name: /edit T/i }));
    await user.keyboard('{Escape}');
    expect(callCount).toBe(0);
    // Button is back
    expect(screen.getByRole('button', { name: /edit T/i })).toBeInTheDocument();
  });
});

// ── HeroDetailPage integration tests ─────────────────────────────────────

const HERO: Hero = {
  id: 'h-1',
  name: 'Aldric',
  role: 'Captain',
  status: 'Active',
  stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
  xp: 0,
  xpLog: [],
  skills: [],
  injuryLog: [],
  equipment: [],
  ooa: 0,
  recruitmentCost: null,
};

const WARBAND_WITH_HERO = {
  id: 'w-hero-1',
  name: 'Steel Fist',
  faction: '',
  notes: '',
  rating: 0,
  heroes: [HERO],
  henchmanGroups: [],
  inventory: [],
  customEquipmentLibrary: [],
  goldCrowns: 0,
  wyrdstoneFragments: 0,
  transactionLog: [],
  achievements: [],
  lootLog: [],
};

function seedWithHero() {
  const data: AppData = { schemaVersion: 1, warbands: [WARBAND_WITH_HERO] };
  localStorage.setItem('mordheim_data', JSON.stringify(data));
}

function HeroWrapper({ children }: { children: ReactNode }) {
  return (
    <ReferenceDataProvider>
      <WarbandProvider>
        <MemoryRouter initialEntries={['/warband/w-hero-1/hero/h-1']}>
          <Routes>
            <Route path="/warband/:id/hero/:heroId" element={<>{children}</>} />
            <Route path="/warband/:id" element={<WarbandDetailPage />} />
          </Routes>
        </MemoryRouter>
      </WarbandProvider>
    </ReferenceDataProvider>
  );
}

describe('HeroDetailPage', () => {
  beforeEach(() => {
    localStorage.clear();
    seedWithHero();
  });

  it('shows name, role, and status fields', () => {
    render(<HeroDetailPage />, { wrapper: HeroWrapper });
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
  });

  it('pre-fills fields from the hero record', () => {
    render(<HeroDetailPage />, { wrapper: HeroWrapper });
    expect((screen.getByLabelText(/name/i) as HTMLInputElement).value).toBe('Aldric');
    expect((screen.getByLabelText(/role/i) as HTMLInputElement).value).toBe('Captain');
    expect((screen.getByLabelText(/status/i) as HTMLSelectElement).value).toBe('Active');
  });

  it('renders the stat row with all 9 stats', () => {
    render(<HeroDetailPage />, { wrapper: HeroWrapper });
    for (const label of ['M', 'WS', 'BS', 'S', 'T', 'W', 'I', 'A', 'Ld']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('blurring name field dispatches UPDATE_HERO', async () => {
    const user = userEvent.setup();
    render(<HeroDetailPage />, { wrapper: HeroWrapper });
    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Rengar');
    await user.tab();
    const raw = localStorage.getItem('mordheim_data');
    const saved = JSON.parse(raw!).warbands[0].heroes[0];
    expect(saved.name).toBe('Rengar');
  });

  it('changing status select dispatches UPDATE_HERO immediately', async () => {
    const user = userEvent.setup();
    render(<HeroDetailPage />, { wrapper: HeroWrapper });
    await user.selectOptions(screen.getByLabelText(/status/i), 'Dead');
    const raw = localStorage.getItem('mordheim_data');
    expect(JSON.parse(raw!).warbands[0].heroes[0].status).toBe('Dead');
  });

  it('redirects to /warband/:id when hero id is unknown', () => {
    render(
      <WarbandProvider>
        <MemoryRouter initialEntries={['/warband/w-hero-1/hero/unknown']}>
          <Routes>
            <Route path="/warband/:id/hero/:heroId" element={<HeroDetailPage />} />
            <Route path="/warband/:id" element={<p>Warband page</p>} />
          </Routes>
        </MemoryRouter>
      </WarbandProvider>
    );
    expect(screen.getByText('Warband page')).toBeInTheDocument();
  });
});

// ── Roster section — Add Hero ─────────────────────────────────────────────

function WarbandWrapper({ children }: { children: ReactNode }) {
  return (
    <ReferenceDataProvider>
      <WarbandProvider>
        <MemoryRouter initialEntries={['/warband/w-hero-1']}>
          <Routes>
            <Route path="/warband/:id" element={<>{children}</>} />
            <Route path="/warband/:id/hero/:heroId" element={<HeroDetailPage />} />
            <Route path="/" element={<p>Home</p>} />
          </Routes>
        </MemoryRouter>
      </WarbandProvider>
    </ReferenceDataProvider>
  );
}

describe('RosterSection', () => {
  beforeEach(() => {
    const data: AppData = {
      schemaVersion: 1,
      warbands: [{
        id: 'w-hero-1',
        name: 'Steel Fist',
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
      }],
    };
    localStorage.setItem('mordheim_data', JSON.stringify(data));
    // Open Roster section
    localStorage.setItem('mordheim_sections', JSON.stringify({
      'w-hero-1': { roster: true, treasury: false, 'post-game': false },
    }));
  });

  it('shows + Add Hero button in open Roster section', () => {
    render(<WarbandDetailPage />, { wrapper: WarbandWrapper });
    expect(screen.getByRole('button', { name: /\+ add hero/i })).toBeInTheDocument();
  });

  it('clicking + Add Hero creates a hero and navigates to HeroDetailPage', async () => {
    const user = userEvent.setup();
    render(<WarbandDetailPage />, { wrapper: WarbandWrapper });
    await user.click(screen.getByRole('button', { name: /\+ add hero/i }));
    // HeroDetailPage is now rendered (shows name/role/status fields)
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    // Hero was saved to localStorage
    const raw = localStorage.getItem('mordheim_data');
    const heroes = JSON.parse(raw!).warbands[0].heroes;
    expect(heroes).toHaveLength(1);
    expect(heroes[0].status).toBe('Active');
    expect(heroes[0].id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
