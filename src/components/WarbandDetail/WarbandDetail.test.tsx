import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import '@testing-library/jest-dom';
import type { ReactNode } from 'react';
import WarbandDetailPage from './WarbandDetail';
import WarbandEditPage from './WarbandEditPage';
import { WarbandProvider } from '../../context/WarbandContext';
import { ReferenceDataProvider } from '../../context/ReferenceDataContext';
import type { AppData } from '../../types/storage';

const WARBAND = {
  id: 'w-detail-1',
  name: 'Red Brigade',
  faction: 'Witch Hunters',
  notes: 'Bold fighters.',
  rating: 42,
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

function seed() {
  const data: AppData = { schemaVersion: 1, warbands: [WARBAND] };
  localStorage.setItem('mordheim_data', JSON.stringify(data));
}

function Wrapper({ children, path = '/warband/w-detail-1' }: { children: ReactNode; path?: string }) {
  return (
    <ReferenceDataProvider>
      <WarbandProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/warband/:id" element={<>{children}</>} />
            <Route path="/warband/:id/edit" element={<WarbandEditPage />} />
            <Route path="/" element={<p>Home</p>} />
          </Routes>
        </MemoryRouter>
      </WarbandProvider>
    </ReferenceDataProvider>
  );
}

describe('WarbandDetailPage', () => {
  beforeEach(() => { localStorage.clear(); seed(); });

  it('renders the warband name', () => {
    render(<WarbandDetailPage />, { wrapper: Wrapper });
    expect(screen.getByText('Red Brigade')).toBeInTheDocument();
  });

  it('renders faction', () => {
    render(<WarbandDetailPage />, { wrapper: Wrapper });
    expect(screen.getByText('Witch Hunters')).toBeInTheDocument();
  });

  it('renders notes', () => {
    render(<WarbandDetailPage />, { wrapper: Wrapper });
    expect(screen.getByText('Bold fighters.')).toBeInTheDocument();
  });

  it('shows ⋮ menu with Edit and Delete options when button clicked', async () => {
    const user = userEvent.setup();
    render(<WarbandDetailPage />, { wrapper: Wrapper });
    await user.click(screen.getByRole('button', { name: /warband actions/i }));
    expect(screen.getByRole('menuitem', { name: /edit warband/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /delete warband/i })).toBeInTheDocument();
  });

  it('navigates to /warband/:id/edit when Edit Warband clicked', async () => {
    const user = userEvent.setup();
    render(<WarbandDetailPage />, { wrapper: Wrapper });
    await user.click(screen.getByRole('button', { name: /warband actions/i }));
    await user.click(screen.getByRole('menuitem', { name: /edit warband/i }));
    // WarbandEditPage renders WarbandForm in edit mode
    expect(screen.getByText('Edit Warband')).toBeInTheDocument();
  });

  it('shows confirmation sheet with warband name when Delete Warband clicked', async () => {
    const user = userEvent.setup();
    render(<WarbandDetailPage />, { wrapper: Wrapper });
    await user.click(screen.getByRole('button', { name: /warband actions/i }));
    await user.click(screen.getByRole('menuitem', { name: /delete warband/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Name appears in both the page heading and the sheet body — use getAllByText
    expect(screen.getAllByText('Red Brigade').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('Cancel button in confirmation sheet closes the sheet', async () => {
    const user = userEvent.setup();
    render(<WarbandDetailPage />, { wrapper: Wrapper });
    await user.click(screen.getByRole('button', { name: /warband actions/i }));
    await user.click(screen.getByRole('menuitem', { name: /delete warband/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('confirming deletion dispatches DELETE_WARBAND and navigates to /', async () => {
    const user = userEvent.setup();
    render(<WarbandDetailPage />, { wrapper: Wrapper });
    await user.click(screen.getByRole('button', { name: /warband actions/i }));
    await user.click(screen.getByRole('menuitem', { name: /delete warband/i }));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(screen.getByText('Home')).toBeInTheDocument();
    const raw = localStorage.getItem('mordheim_data');
    expect(JSON.parse(raw!).warbands).toHaveLength(0);
  });

  it('redirects to / when warband id is unknown', () => {
    render(
      <WarbandProvider>
        <MemoryRouter initialEntries={['/warband/unknown-id']}>
          <Routes>
            <Route path="/warband/:id" element={<WarbandDetailPage />} />
            <Route path="/" element={<p>Home</p>} />
          </Routes>
        </MemoryRouter>
      </WarbandProvider>
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});

// WarbandEditPage: pre-fills form and dispatches UPDATE_WARBAND
describe('WarbandEditPage', () => {
  beforeEach(() => { localStorage.clear(); seed(); });

  function EditWrapper({ children }: { children: ReactNode }) {
    return (
      <ReferenceDataProvider>
        <WarbandProvider>
          <MemoryRouter initialEntries={['/warband/w-detail-1/edit']}>
            <Routes>
              <Route path="/warband/:id/edit" element={<>{children}</>} />
              <Route path="/warband/:id" element={<WarbandDetailPage />} />
            </Routes>
          </MemoryRouter>
        </WarbandProvider>
      </ReferenceDataProvider>
    );
  }

  it('pre-fills name, faction, rating, notes', () => {
    render(<WarbandEditPage />, { wrapper: EditWrapper });
    expect((screen.getByLabelText(/name/i) as HTMLInputElement).value).toBe('Red Brigade');
    expect((screen.getByLabelText(/faction/i) as HTMLSelectElement).value).toBe('Witch Hunters');
    expect((screen.getByLabelText(/rating/i) as HTMLInputElement).value).toBe('42');
    expect((screen.getByLabelText(/notes/i) as HTMLTextAreaElement).value).toBe('Bold fighters.');
  });

  it('dispatches UPDATE_WARBAND and navigates back on save', async () => {
    const user = userEvent.setup();
    render(<WarbandEditPage />, { wrapper: EditWrapper });
    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Brigade');
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    const raw = localStorage.getItem('mordheim_data');
    expect(JSON.parse(raw!).warbands[0].name).toBe('Updated Brigade');
    // Navigated back to WarbandDetailPage
    expect(screen.getByText('Updated Brigade')).toBeInTheDocument();
  });
});

// WarbandCard rating display
import WarbandCard from '../WarbandCard/WarbandCard';

describe('WarbandCard rating', () => {
  it('shows Rating label and value', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<WarbandCard warband={WARBAND} />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
