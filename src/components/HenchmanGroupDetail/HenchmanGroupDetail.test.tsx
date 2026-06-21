import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import '@testing-library/jest-dom';
import type { ReactNode } from 'react';
import HenchmanGroupDetailPage from './HenchmanGroupDetail';
import WarbandDetailPage from '../WarbandDetail/WarbandDetail';
import HeroDetailPage from '../HeroDetail/HeroDetail';
import { WarbandProvider } from '../../context/WarbandContext';
import { ReferenceDataProvider } from '../../context/ReferenceDataContext';
import type { AppData } from '../../types/storage';
import type { HenchmanGroup } from '../../types/warband';

const GROUP: HenchmanGroup = {
  id: 'g-1',
  name: 'Swordsmen',
  role: 'Warriors',
  status: 'Active',
  stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
  xp: 5,
  advancementNotes: ['Improved WS after 2nd scenario'],
  injuryLog: [],
  equipment: [],
  models: [],
  modelCountOverride: null,
  recruitmentCost: null,
};

const WARBAND_DATA = {
  id: 'w-g-1',
  name: 'Iron Fist',
  faction: '',
  notes: '',
  rating: 0,
  heroes: [],
  henchmanGroups: [GROUP],
  inventory: [],
  customEquipmentLibrary: [],
  goldCrowns: 0,
  wyrdstoneFragments: 0,
  transactionLog: [],
  achievements: [],
  lootLog: [],
};

function seed(data = WARBAND_DATA) {
  const appData: AppData = { schemaVersion: 1, warbands: [data] };
  localStorage.setItem('mordheim_data', JSON.stringify(appData));
}

function GroupWrapper({ children }: { children: ReactNode }) {
  return (
    <ReferenceDataProvider>
      <WarbandProvider>
        <MemoryRouter initialEntries={['/warband/w-g-1/henchman/g-1']}>
          <Routes>
            <Route path="/warband/:id/henchman/:groupId" element={<>{children}</>} />
            <Route path="/warband/:id" element={<WarbandDetailPage />} />
          </Routes>
        </MemoryRouter>
      </WarbandProvider>
    </ReferenceDataProvider>
  );
}

describe('HenchmanGroupDetailPage', () => {
  beforeEach(() => { localStorage.clear(); seed(); });

  it('shows name, role, and status fields', () => {
    render(<HenchmanGroupDetailPage />, { wrapper: GroupWrapper });
    expect(screen.getByLabelText(/group name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
  });

  it('pre-fills fields from group record', () => {
    render(<HenchmanGroupDetailPage />, { wrapper: GroupWrapper });
    expect((screen.getByLabelText(/group name/i) as HTMLInputElement).value).toBe('Swordsmen');
    expect((screen.getByLabelText(/role/i) as HTMLInputElement).value).toBe('Warriors');
    expect((screen.getByLabelText(/status/i) as HTMLSelectElement).value).toBe('Active');
  });

  it('renders the 9-cell stat row', () => {
    render(<HenchmanGroupDetailPage />, { wrapper: GroupWrapper });
    for (const label of ['M', 'WS', 'BS', 'S', 'T', 'W', 'I', 'A', 'Ld']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('dispatches UPDATE_HENCHMAN_GROUP when name blurred', async () => {
    const user = userEvent.setup();
    render(<HenchmanGroupDetailPage />, { wrapper: GroupWrapper });
    const nameInput = screen.getByLabelText(/group name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Bowmen');
    await user.tab();
    const saved = JSON.parse(localStorage.getItem('mordheim_data')!);
    expect(saved.warbands[0].henchmanGroups[0].name).toBe('Bowmen');
  });

  it('opens XP & Advancement panel', async () => {
    const user = userEvent.setup();
    render(<HenchmanGroupDetailPage />, { wrapper: GroupWrapper });
    await user.click(screen.getByRole('button', { name: /xp & advancement/i }));
    expect(screen.getByLabelText(/xp total/i)).toBeInTheDocument();
  });

  it('can add an advancement note', async () => {
    const user = userEvent.setup();
    render(<HenchmanGroupDetailPage />, { wrapper: GroupWrapper });
    await user.click(screen.getByRole('button', { name: /xp & advancement/i }));
    await user.type(screen.getByPlaceholderText(/scenario/i), 'Gained Resilient{Enter}');
    const saved = JSON.parse(localStorage.getItem('mordheim_data')!);
    expect(saved.warbands[0].henchmanGroups[0].advancementNotes).toContain('Gained Resilient');
  });

  it('adds a model and creates an IndividualModel record', async () => {
    const user = userEvent.setup();
    render(<HenchmanGroupDetailPage />, { wrapper: GroupWrapper });
    await user.click(screen.getByRole('button', { name: /models/i }));
    await user.click(screen.getByRole('button', { name: /\+ add model/i }));
    const saved = JSON.parse(localStorage.getItem('mordheim_data')!);
    const models = saved.warbands[0].henchmanGroups[0].models;
    expect(models).toHaveLength(1);
    expect(models[0].status).toBe('Active');
    expect(models[0].id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('shows stat deviation with effective value when non-zero', async () => {
    const user = userEvent.setup();
    // Seed with a model that has WS deviation +1
    const dataWithModel = {
      ...WARBAND_DATA,
      henchmanGroups: [{
        ...GROUP,
        models: [{
          id: 'm-1',
          name: 'Grunther',
          status: 'Active' as const,
          statDeviations: { M: 0, WS: 1, BS: 0, S: 0, T: 0, W: 0, I: 0, A: 0, Ld: 0 },
          injuryLog: [],
          ooa: 0,
        }],
      }],
    };
    localStorage.clear();
    seed(dataWithModel);
    render(<HenchmanGroupDetailPage />, { wrapper: GroupWrapper });
    await user.click(screen.getByRole('button', { name: /models/i }));
    await user.click(screen.getByRole('button', { name: /^grunther/i }));
    // WS base is 3, deviation is +1 → effective 4, shown as "3 (▲4)"
    expect(screen.getByText('3 (▲4)')).toBeInTheDocument();
  });

  it('redirects to /warband/:id when group not found', () => {
    render(
      <WarbandProvider>
        <MemoryRouter initialEntries={['/warband/w-g-1/henchman/unknown']}>
          <Routes>
            <Route path="/warband/:id/henchman/:groupId" element={<HenchmanGroupDetailPage />} />
            <Route path="/warband/:id" element={<p>Warband page</p>} />
          </Routes>
        </MemoryRouter>
      </WarbandProvider>
    );
    expect(screen.getByText('Warband page')).toBeInTheDocument();
  });
});

// ── Add Henchman Group from RosterSection ─────────────────────────────────

describe('RosterSection — Add Henchman Group', () => {
  beforeEach(() => {
    const data: AppData = {
      schemaVersion: 1,
      warbands: [{
        id: 'w-g-1',
        name: 'Iron Fist',
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
    localStorage.setItem('mordheim_sections', JSON.stringify({
      'w-g-1': { roster: true, treasury: false, 'post-game': false, inventory: false },
    }));
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ReferenceDataProvider>
        <WarbandProvider>
          <MemoryRouter initialEntries={['/warband/w-g-1']}>
            <Routes>
              <Route path="/warband/:id" element={<>{children}</>} />
              <Route path="/warband/:id/henchman/:groupId" element={<HenchmanGroupDetailPage />} />
            </Routes>
          </MemoryRouter>
        </WarbandProvider>
      </ReferenceDataProvider>
    );
  }

  it('shows + Add Henchman Group button', () => {
    render(<WarbandDetailPage />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /\+ add henchman group/i })).toBeInTheDocument();
  });

  it('creates a group and navigates to HenchmanGroupDetailPage', async () => {
    const user = userEvent.setup();
    render(<WarbandDetailPage />, { wrapper: Wrapper });
    await user.click(screen.getByRole('button', { name: /\+ add henchman group/i }));
    // Navigated to group detail page
    expect(screen.getByLabelText(/group name/i)).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem('mordheim_data')!);
    expect(saved.warbands[0].henchmanGroups).toHaveLength(1);
    expect(saved.warbands[0].henchmanGroups[0].status).toBe('Active');
  });
});

// ── Story 2.5: Hero Progression Panels ───────────────────────────────────

describe('HeroDetailPage — progression panels', () => {
  const HERO_DATA = {
    id: 'h-prog-1',
    name: 'Aldric',
    role: 'Captain',
    status: 'Active' as const,
    stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
    xp: 3,
    xpLog: ['Won scenario +1'],
    skills: ['Sprint'],
    injuryLog: [],
    equipment: [],
    ooa: 0,
    recruitmentCost: null,
  };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('mordheim_data', JSON.stringify({
      schemaVersion: 1,
      warbands: [{
        id: 'w-prog-1',
        name: 'Vanguard',
        faction: '',
        notes: '',
        rating: 0,
        heroes: [HERO_DATA],
        henchmanGroups: [],
        inventory: [],
        customEquipmentLibrary: [],
        goldCrowns: 0,
        wyrdstoneFragments: 0,
        transactionLog: [],
        achievements: [],
        lootLog: [],
      }],
    }));
  });

  function HeroWrapper({ children }: { children: ReactNode }) {
    return (
      <ReferenceDataProvider>
        <WarbandProvider>
          <MemoryRouter initialEntries={['/warband/w-prog-1/hero/h-prog-1']}>
            <Routes>
              <Route path="/warband/:id/hero/:heroId" element={<>{children}</>} />
            </Routes>
          </MemoryRouter>
        </WarbandProvider>
      </ReferenceDataProvider>
    );
  }

  it('shows XP & Skills and Injuries collapsible headers', () => {
    render(<HeroDetailPage />, { wrapper: HeroWrapper });
    expect(screen.getByRole('button', { name: /xp & skills/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /injuries/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /equipment/i })).toBeInTheDocument();
  });

  it('XP & Skills panel shows XP total and existing entries when open', async () => {
    const user = userEvent.setup();
    render(<HeroDetailPage />, { wrapper: HeroWrapper });
    await user.click(screen.getByRole('button', { name: /xp & skills/i }));
    expect((screen.getByLabelText(/xp total/i) as HTMLInputElement).value).toBe('3');
    expect(screen.getByText('Won scenario +1')).toBeInTheDocument();
    expect(screen.getByText('Sprint')).toBeInTheDocument();
  });

  it('adding a skill dispatches UPDATE_HERO', async () => {
    const user = userEvent.setup();
    render(<HeroDetailPage />, { wrapper: HeroWrapper });
    await user.click(screen.getByRole('button', { name: /xp & skills/i }));
    // Last textbox before addBtn in skills section — use placeholder
    const skillInput = screen.getByPlaceholderText(/e.g. sprint/i);
    await user.type(skillInput, 'Dodge{Enter}');
    const saved = JSON.parse(localStorage.getItem('mordheim_data')!);
    expect(saved.warbands[0].heroes[0].skills).toContain('Dodge');
  });

  it('adding an XP log entry dispatches UPDATE_HERO', async () => {
    const user = userEvent.setup();
    render(<HeroDetailPage />, { wrapper: HeroWrapper });
    await user.click(screen.getByRole('button', { name: /xp & skills/i }));
    const xpLogInput = screen.getByPlaceholderText(/won scenario/i);
    await user.type(xpLogInput, 'Killed Boss +2 XP{Enter}');
    const saved = JSON.parse(localStorage.getItem('mordheim_data')!);
    expect(saved.warbands[0].heroes[0].xpLog).toContain('Killed Boss +2 XP');
  });

  it('adding an injury dispatches UPDATE_HERO', async () => {
    const user = userEvent.setup();
    render(<HeroDetailPage />, { wrapper: HeroWrapper });
    await user.click(screen.getByRole('button', { name: /injuries/i }));
    await user.type(screen.getByPlaceholderText(/old battle wound/i), 'Leg Wound{Enter}');
    const saved = JSON.parse(localStorage.getItem('mordheim_data')!);
    expect(saved.warbands[0].heroes[0].injuryLog).toContain('Leg Wound');
  });
});

// ── Story 2.12: Warband Inventory & Custom Equipment Library ──────────────

describe('WarbandDetailPage — Inventory & Custom Equipment section', () => {
  const WARBAND_12 = {
    id: 'w-12',
    name: 'Collectors',
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
  };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('mordheim_data', JSON.stringify({ schemaVersion: 1, warbands: [WARBAND_12] }));
    localStorage.setItem('mordheim_sections', JSON.stringify({
      'w-12': { roster: false, treasury: false, 'post-game': false, inventory: true },
    }));
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ReferenceDataProvider>
        <WarbandProvider>
          <MemoryRouter initialEntries={['/warband/w-12']}>
            <Routes>
              <Route path="/warband/:id" element={<>{children}</>} />
            </Routes>
          </MemoryRouter>
        </WarbandProvider>
      </ReferenceDataProvider>
    );
  }

  it('shows Inventory & Custom Equipment section', () => {
    render(<WarbandDetailPage />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /inventory & custom equipment/i })).toBeInTheDocument();
  });

  it('can add an item to warband inventory', async () => {
    const user = userEvent.setup();
    render(<WarbandDetailPage />, { wrapper: Wrapper });
    await user.type(screen.getByLabelText(/new item name/i), 'Rope');
    // First + Add button belongs to the inventory EquipmentList
    const addBtns = screen.getAllByRole('button', { name: /^\+ add$/i });
    await user.click(addBtns[0]);
    const saved = JSON.parse(localStorage.getItem('mordheim_data')!);
    expect(saved.warbands[0].inventory).toHaveLength(1);
    expect(saved.warbands[0].inventory[0].name).toBe('Rope');
  });

  it('can add a custom equipment library item', async () => {
    const user = userEvent.setup();
    render(<WarbandDetailPage />, { wrapper: Wrapper });
    await user.type(screen.getByLabelText(/library item name/i), 'Custom Blade');
    // Last + Add button belongs to the library form
    const addBtns = screen.getAllByRole('button', { name: /^\+ add$/i });
    await user.click(addBtns[addBtns.length - 1]);
    const saved = JSON.parse(localStorage.getItem('mordheim_data')!);
    expect(saved.warbands[0].customEquipmentLibrary).toHaveLength(1);
    expect(saved.warbands[0].customEquipmentLibrary[0].name).toBe('Custom Blade');
  });
});
