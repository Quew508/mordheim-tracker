import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import '@testing-library/jest-dom';
import type { ReactNode } from 'react';
import CollapsibleSection from './CollapsibleSection';
import WarbandDetailPage from '../WarbandDetail/WarbandDetail';
import { WarbandProvider } from '../../context/WarbandContext';
import { ReferenceDataProvider } from '../../context/ReferenceDataContext';
import type { AppData } from '../../types/storage';

// ── CollapsibleSection unit tests ─────────────────────────────────────────

describe('CollapsibleSection', () => {
  it('renders the title', () => {
    render(
      <CollapsibleSection title="Roster" isOpen={false} onToggle={() => {}}>
        <p>Content</p>
      </CollapsibleSection>
    );
    expect(screen.getByText('Roster')).toBeInTheDocument();
  });

  it('does not render children when closed', () => {
    render(
      <CollapsibleSection title="Roster" isOpen={false} onToggle={() => {}}>
        <p>Hidden content</p>
      </CollapsibleSection>
    );
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('renders children when open', () => {
    render(
      <CollapsibleSection title="Roster" isOpen={true} onToggle={() => {}}>
        <p>Visible content</p>
      </CollapsibleSection>
    );
    expect(screen.getByText('Visible content')).toBeInTheDocument();
  });

  it('header button has aria-expanded="false" when closed', () => {
    render(
      <CollapsibleSection title="Roster" isOpen={false} onToggle={() => {}}>
        <p>Content</p>
      </CollapsibleSection>
    );
    expect(screen.getByRole('button', { name: 'Roster' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('header button has aria-expanded="true" when open', () => {
    render(
      <CollapsibleSection title="Roster" isOpen={true} onToggle={() => {}}>
        <p>Content</p>
      </CollapsibleSection>
    );
    expect(screen.getByRole('button', { name: 'Roster' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('calls onToggle when header is clicked', async () => {
    const user = userEvent.setup();
    let toggled = false;
    render(
      <CollapsibleSection title="Roster" isOpen={false} onToggle={() => { toggled = true; }}>
        <p>Content</p>
      </CollapsibleSection>
    );
    await user.click(screen.getByRole('button', { name: 'Roster' }));
    expect(toggled).toBe(true);
  });
});

// ── WarbandDetailPage section integration tests ───────────────────────────

const WARBAND = {
  id: 'w-section-1',
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
};

function seed() {
  const data: AppData = { schemaVersion: 1, warbands: [WARBAND] };
  localStorage.setItem('mordheim_data', JSON.stringify(data));
}

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <ReferenceDataProvider>
      <WarbandProvider>
        <MemoryRouter initialEntries={['/warband/w-section-1']}>
          <Routes>
            <Route path="/warband/:id" element={<>{children}</>} />
            <Route path="/" element={<p>Home</p>} />
          </Routes>
        </MemoryRouter>
      </WarbandProvider>
    </ReferenceDataProvider>
  );
}

describe('WarbandDetailPage — collapsible sections', () => {
  beforeEach(() => {
    localStorage.clear();
    seed();
  });

  it('renders Roster, Treasury, and Post-Game Records section headers', () => {
    render(<WarbandDetailPage />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'Roster' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Treasury' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Post-Game Records' })).toBeInTheDocument();
  });

  it('all sections are collapsed by default', () => {
    render(<WarbandDetailPage />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'Roster' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Treasury' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Post-Game Records' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('tapping Roster opens it', async () => {
    const user = userEvent.setup();
    render(<WarbandDetailPage />, { wrapper: Wrapper });
    await user.click(screen.getByRole('button', { name: 'Roster' }));
    expect(screen.getByRole('button', { name: 'Roster' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('multiple sections can be open simultaneously', async () => {
    const user = userEvent.setup();
    render(<WarbandDetailPage />, { wrapper: Wrapper });
    await user.click(screen.getByRole('button', { name: 'Roster' }));
    await user.click(screen.getByRole('button', { name: 'Treasury' }));
    expect(screen.getByRole('button', { name: 'Roster' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Treasury' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('open state is persisted to localStorage', async () => {
    const user = userEvent.setup();
    render(<WarbandDetailPage />, { wrapper: Wrapper });
    await user.click(screen.getByRole('button', { name: 'Roster' }));
    const raw = localStorage.getItem('mordheim_sections');
    const data = JSON.parse(raw!);
    expect(data['w-section-1'].roster).toBe(true);
  });

  it('open state is restored on remount', async () => {
    // Seed open state in localStorage
    localStorage.setItem('mordheim_sections', JSON.stringify({
      'w-section-1': { roster: true, treasury: false, 'post-game': false },
    }));
    render(<WarbandDetailPage />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: 'Roster' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Treasury' })).toHaveAttribute('aria-expanded', 'false');
  });
});
