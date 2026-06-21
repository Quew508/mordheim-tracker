import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import '@testing-library/jest-dom';
import WarbandForm from './WarbandForm';
import { WarbandProvider } from '../../context/WarbandContext';
import { ReferenceDataProvider } from '../../context/ReferenceDataContext';
import WarbandDetailPage from '../WarbandDetail/WarbandDetail';
import type { ReactNode } from 'react';

function Wrapper({ children, initialPath = '/warband/new' }: { children: ReactNode; initialPath?: string }) {
  return (
    <ReferenceDataProvider>
      <WarbandProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/warband/new" element={<>{children}</>} />
            <Route path="/warband/:id" element={<WarbandDetailPage />} />
            <Route path="/" element={<p>Home</p>} />
          </Routes>
        </MemoryRouter>
      </WarbandProvider>
    </ReferenceDataProvider>
  );
}

describe('WarbandForm', () => {
  beforeEach(() => localStorage.clear());

  it('renders name, faction, and notes fields', () => {
    render(<WarbandForm />, { wrapper: Wrapper });
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/faction/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  it('shows validation error when submitting with empty name', async () => {
    const user = userEvent.setup();
    render(<WarbandForm />, { wrapper: Wrapper });
    await user.click(screen.getByRole('button', { name: /create warband/i }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('dispatches ADD_WARBAND and navigates to /warband/:id on valid submit', async () => {
    const user = userEvent.setup();
    render(<WarbandForm />, { wrapper: Wrapper });
    await user.type(screen.getByLabelText(/name/i), 'My Warband');
    await user.selectOptions(screen.getByLabelText(/faction/i), 'Witch Hunters');
    await user.click(screen.getByRole('button', { name: /create warband/i }));
    // Navigated away — WarbandDetailPage renders with the new warband name
    expect(screen.getByRole('heading', { name: 'My Warband' })).toBeInTheDocument();
  });

  it('persists new warband to localStorage', async () => {
    const user = userEvent.setup();
    render(<WarbandForm />, { wrapper: Wrapper });
    await user.type(screen.getByLabelText(/name/i), 'Stored Warband');
    await user.click(screen.getByRole('button', { name: /create warband/i }));
    const raw = localStorage.getItem('mordheim_data');
    const data = JSON.parse(raw!);
    expect(data.warbands).toHaveLength(1);
    expect(data.warbands[0].name).toBe('Stored Warband');
    expect(data.warbands[0].id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('cancel navigates back to /', async () => {
    const user = userEvent.setup();
    render(<WarbandForm />, { wrapper: Wrapper });
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});

// WarbandCard tests
import WarbandCard from '../WarbandCard/WarbandCard';
import type { Warband } from '../../types/warband';

const mockWarband: Warband = {
  id: 'w-test-1',
  name: 'Iron Brotherhood',
  faction: 'Reiklanders',
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

function CardWrapper({ children }: { children: ReactNode }) {
  return (
    <ReferenceDataProvider>
      <WarbandProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<>{children}</>} />
            <Route path="/warband/:id" element={<WarbandDetailPage />} />
          </Routes>
        </MemoryRouter>
      </WarbandProvider>
    </ReferenceDataProvider>
  );
}

describe('WarbandCard', () => {
  beforeEach(() => {
    localStorage.setItem('mordheim_data', JSON.stringify({
      schemaVersion: 1,
      warbands: [mockWarband],
    }));
  });

  it('displays warband name', () => {
    render(<WarbandCard warband={mockWarband} />, { wrapper: CardWrapper });
    expect(screen.getByText('Iron Brotherhood')).toBeInTheDocument();
  });

  it('displays faction', () => {
    render(<WarbandCard warband={mockWarband} />, { wrapper: CardWrapper });
    expect(screen.getByText('Reiklanders')).toBeInTheDocument();
  });

  it('navigates to /warband/:id when clicked', async () => {
    const user = userEvent.setup();
    render(<WarbandCard warband={mockWarband} />, { wrapper: CardWrapper });
    await user.click(screen.getByRole('button', { name: /iron brotherhood/i }));
    // WarbandDetailPage renders the warband name as heading
    expect(screen.getByRole('heading', { name: 'Iron Brotherhood' })).toBeInTheDocument();
  });
});

// WarbandList with warbands
import WarbandListPage from '../WarbandList/WarbandList';

describe('WarbandListPage with warbands', () => {
  beforeEach(() => {
    const data = {
      schemaVersion: 1,
      warbands: [mockWarband],
    };
    localStorage.setItem('mordheim_data', JSON.stringify(data));
  });

  function ListWrapper({ children }: { children: ReactNode }) {
    return (
      <ReferenceDataProvider>
        <WarbandProvider>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route path="/" element={<>{children}</>} />
              <Route path="/warband/:id" element={<WarbandDetailPage />} />
              <Route path="/warband/new" element={<WarbandForm />} />
            </Routes>
          </MemoryRouter>
        </WarbandProvider>
      </ReferenceDataProvider>
    );
  }

  it('renders a WarbandCard for each warband', () => {
    render(<WarbandListPage />, { wrapper: ListWrapper });
    expect(screen.getByText('Iron Brotherhood')).toBeInTheDocument();
  });

  it('still shows + New Warband button when warbands exist', () => {
    render(<WarbandListPage />, { wrapper: ListWrapper });
    expect(screen.getByRole('button', { name: /\+ new warband/i })).toBeInTheDocument();
  });
});
