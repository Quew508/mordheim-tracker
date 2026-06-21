import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import '@testing-library/jest-dom';
import AppShell from './AppShell';
import WarbandListPage from '../WarbandList/WarbandList';
import WarbandDetailPage from '../WarbandDetail/WarbandDetail';
import { WarbandProvider } from '../../context/WarbandContext';
import * as portabilityService from '../../services/portabilityService';

function renderAtRoute(path: string) {
  return render(
    <WarbandProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<WarbandListPage />} />
            <Route path="/warband/:id" element={<WarbandDetailPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </WarbandProvider>
  );
}

describe('AppShell', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  describe('home route (/)', () => {
    it('shows the app title', () => {
      renderAtRoute('/');
      expect(screen.getByText('Mordheim')).toBeInTheDocument();
    });

    it('shows the overflow ⋮ button', () => {
      renderAtRoute('/');
      expect(screen.getByLabelText('More options')).toBeInTheDocument();
    });

    it('does NOT show a back button', () => {
      renderAtRoute('/');
      expect(screen.queryByLabelText(/go back/i)).not.toBeInTheDocument();
    });

    it('renders the home page content via Outlet', () => {
      renderAtRoute('/');
      expect(screen.getByText(/no warbands yet/i)).toBeInTheDocument();
    });
  });

  describe('warband detail route (/warband/:id)', () => {
    beforeEach(() => {
      // Seed a warband so WarbandDetailPage doesn't redirect
      localStorage.setItem('mordheim_data', JSON.stringify({
        schemaVersion: 1,
        warbands: [{
          id: 'abc', name: 'Test Warband', faction: '', notes: '',
          rating: 0, heroes: [], henchmanGroups: [], inventory: [],
          customEquipmentLibrary: [], goldCrowns: 0, wyrdstoneFragments: 0,
          transactionLog: [], achievements: [], lootLog: [],
        }],
      }));
    });

    it('shows the back button labeled ◀ Warbands', () => {
      renderAtRoute('/warband/abc');
      expect(screen.getByText('◀ Warbands')).toBeInTheDocument();
    });

    it('shows the overflow ⋮ button', () => {
      renderAtRoute('/warband/abc');
      expect(screen.getByLabelText('More options')).toBeInTheDocument();
    });

    it('does NOT show the home title on sub-routes', () => {
      renderAtRoute('/warband/abc');
      expect(screen.queryByText('Mordheim')).not.toBeInTheDocument();
    });

    it('back button navigates to home when clicked', async () => {
      const user = userEvent.setup();
      renderAtRoute('/warband/abc');
      await user.click(screen.getByText('◀ Warbands'));
      // Back on home — WarbandListPage is visible
      expect(screen.getByRole('button', { name: '+ New Warband' })).toBeInTheDocument();
    });
  });

  describe('theme toggle via ⋮ menu', () => {
    it('⋮ menu shows "Switch to light mode" in dark mode (default)', async () => {
      const user = userEvent.setup();
      renderAtRoute('/');
      await user.click(screen.getByLabelText('More options'));
      expect(screen.getByRole('menuitem', { name: 'Switch to light mode' })).toBeInTheDocument();
    });

    it('⋮ menu shows "Switch to dark mode" when light mode is stored', async () => {
      localStorage.setItem('mordheim_theme', 'light');
      const user = userEvent.setup();
      renderAtRoute('/');
      await user.click(screen.getByLabelText('More options'));
      expect(screen.getByRole('menuitem', { name: 'Switch to dark mode' })).toBeInTheDocument();
    });

    it('clicking "Switch to light mode" sets data-theme="light" on root', async () => {
      const user = userEvent.setup();
      renderAtRoute('/');
      await user.click(screen.getByLabelText('More options'));
      await user.click(screen.getByRole('menuitem', { name: 'Switch to light mode' }));
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('clicking theme option closes the menu', async () => {
      const user = userEvent.setup();
      renderAtRoute('/');
      await user.click(screen.getByLabelText('More options'));
      await user.click(screen.getByRole('menuitem', { name: 'Switch to light mode' }));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('⋮ button has aria-expanded=false when menu is closed', () => {
      renderAtRoute('/');
      expect(screen.getByLabelText('More options')).toHaveAttribute('aria-expanded', 'false');
    });

    it('⋮ button has aria-expanded=true when menu is open', async () => {
      const user = userEvent.setup();
      renderAtRoute('/');
      await user.click(screen.getByLabelText('More options'));
      expect(screen.getByLabelText('More options')).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Export menu item', () => {
    const originalCreateObjectURL = global.URL.createObjectURL;
    const originalRevokeObjectURL = global.URL.revokeObjectURL;

    beforeEach(() => {
      localStorage.setItem('mordheim_data', JSON.stringify({
        schemaVersion: 1,
        warbands: [{
          id: 'abc', name: 'Test Warband', faction: '', notes: '',
          rating: 0, heroes: [], henchmanGroups: [], inventory: [],
          customEquipmentLibrary: [], goldCrowns: 0, wyrdstoneFragments: 0,
          transactionLog: [], achievements: [], lootLog: [],
        }],
      }));
      global.URL.createObjectURL = vi.fn(() => 'blob:mock');
      global.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      global.URL.createObjectURL = originalCreateObjectURL;
      global.URL.revokeObjectURL = originalRevokeObjectURL;
    });

    it('"Export" appears in ⋮ menu on home route', async () => {
      const user = userEvent.setup();
      renderAtRoute('/');
      await user.click(screen.getByLabelText('More options'));
      expect(screen.getByRole('menuitem', { name: 'Export' })).toBeInTheDocument();
    });

    it('"Export" does NOT appear in ⋮ menu on non-home route', async () => {
      const user = userEvent.setup();
      renderAtRoute('/warband/abc');
      await user.click(screen.getByLabelText('More options'));
      expect(screen.queryByRole('menuitem', { name: 'Export' })).not.toBeInTheDocument();
    });

    it('clicking "Export" shows "Exported 1 warband." confirmation (singular)', async () => {
      const user = userEvent.setup();
      renderAtRoute('/');
      await user.click(screen.getByLabelText('More options'));
      await user.click(screen.getByRole('menuitem', { name: 'Export' }));
      expect(screen.getByText('Exported 1 warband.')).toBeInTheDocument();
    });

    it('clicking "Export" closes the menu', async () => {
      const user = userEvent.setup();
      renderAtRoute('/');
      await user.click(screen.getByLabelText('More options'));
      await user.click(screen.getByRole('menuitem', { name: 'Export' }));
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('Import menu item', () => {
    const seededData = JSON.stringify({
      schemaVersion: 1,
      warbands: [{
        id: 'abc', name: 'Test Warband', faction: '', notes: '',
        rating: 0, heroes: [], henchmanGroups: [], inventory: [],
        customEquipmentLibrary: [], goldCrowns: 0, wyrdstoneFragments: 0,
        transactionLog: [], achievements: [], lootLog: [],
      }],
    });

    beforeEach(() => {
      localStorage.setItem('mordheim_data', seededData);
    });

    it('"Import" appears in ⋮ menu on home route', async () => {
      const user = userEvent.setup();
      renderAtRoute('/');
      await user.click(screen.getByLabelText('More options'));
      expect(screen.getByRole('menuitem', { name: 'Import' })).toBeInTheDocument();
    });

    it('"Import" does NOT appear in ⋮ menu on non-home route', async () => {
      const user = userEvent.setup();
      renderAtRoute('/warband/abc');
      await user.click(screen.getByLabelText('More options'));
      expect(screen.queryByRole('menuitem', { name: 'Import' })).not.toBeInTheDocument();
    });

    it('shows "Imported 0 warbands." after a valid import resolving empty array', async () => {
      vi.spyOn(portabilityService, 'parseImportFile').mockResolvedValue([]);
      const user = userEvent.setup();
      renderAtRoute('/');
      await user.click(screen.getByLabelText('More options'));
      await user.click(screen.getByRole('menuitem', { name: 'Import' }));
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['{}'], 'test.json', { type: 'application/json' });
      Object.defineProperty(fileInput, 'files', { value: [mockFile], configurable: true });
      fireEvent.change(fileInput);
      expect(await screen.findByText('Imported 0 warbands.')).toBeInTheDocument();
      vi.restoreAllMocks();
    });

    it('shows "Invalid file." when parseImportFile rejects', async () => {
      vi.spyOn(portabilityService, 'parseImportFile').mockRejectedValue(new Error('Invalid JSON'));
      const user = userEvent.setup();
      renderAtRoute('/');
      await user.click(screen.getByLabelText('More options'));
      await user.click(screen.getByRole('menuitem', { name: 'Import' }));
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['bad'], 'test.json', { type: 'application/json' });
      Object.defineProperty(fileInput, 'files', { value: [mockFile], configurable: true });
      fireEvent.change(fileInput);
      expect(await screen.findByText('Invalid file.')).toBeInTheDocument();
      vi.restoreAllMocks();
    });
  });
});
