import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ReferenceDataProvider } from '../../context/ReferenceDataContext';
import EquipmentPicker from './EquipmentPicker';
import type { CustomEquipmentItem, EquipmentItem } from '../../types/equipment';

function renderPicker(
  props: {
    factionId?: string;
    customLibrary?: CustomEquipmentItem[];
    onAdd?: (item: EquipmentItem) => void;
    onClose?: () => void;
  } = {},
) {
  const onAdd = props.onAdd ?? vi.fn();
  const onClose = props.onClose ?? vi.fn();
  render(
    <ReferenceDataProvider>
      <EquipmentPicker
        factionId={props.factionId ?? 'unknown-faction'}
        customLibrary={props.customLibrary ?? []}
        onAdd={onAdd}
        onClose={onClose}
      />
    </ReferenceDataProvider>,
  );
  return { onAdd, onClose };
}

describe('EquipmentPicker', () => {
  describe('rendering', () => {
    it('renders the dialog with title and close button', () => {
      renderPicker();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Add from catalogue')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close catalogue/i })).toBeInTheDocument();
    });

    it('renders the search input', () => {
      renderPicker();
      expect(screen.getByRole('textbox', { name: /search equipment/i })).toBeInTheDocument();
    });

    it('renders "Common Catalogue" section header', () => {
      renderPicker();
      expect(screen.getByText('Common Catalogue')).toBeInTheDocument();
    });

    it('renders all 21 common equipment items by default', () => {
      renderPicker();
      // spot-check a few items across different categories
      expect(screen.getByRole('button', { name: /^dagger/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^crossbow/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^halberd/i })).toBeInTheDocument();
    });

    it('shows costs on catalogue items', () => {
      renderPicker();
      // Dagger costs 2gc — unambiguous button name
      const daggerBtn = screen.getByRole('button', { name: /^dagger/i });
      expect(daggerBtn).toHaveTextContent('2 gc');
    });

    it('does not render "Faction Catalogue" section when factionId is unknown', () => {
      renderPicker({ factionId: 'no-such-faction' });
      expect(screen.queryByText('Faction Catalogue')).not.toBeInTheDocument();
    });

    it('does not render "Custom Library" section when customLibrary is empty', () => {
      renderPicker({ customLibrary: [] });
      expect(screen.queryByText('Custom Library')).not.toBeInTheDocument();
    });

    it('renders "Custom Library" section when customLibrary has items', () => {
      const lib: CustomEquipmentItem[] = [{ id: 'lib-1', name: 'Magic Sword', cost: 50 }];
      renderPicker({ customLibrary: lib });
      expect(screen.getByText('Custom Library')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /magic sword/i })).toBeInTheDocument();
    });
  });

  describe('search filtering', () => {
    it('filters common catalogue items by query (case-insensitive)', async () => {
      const user = userEvent.setup();
      renderPicker();
      await user.type(screen.getByRole('textbox', { name: /search equipment/i }), 'sword');
      expect(screen.getByRole('button', { name: /^sword/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /two-handed sword/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^dagger/i })).not.toBeInTheDocument();
    });

    it('shows "No matches." when search has no results in common catalogue', async () => {
      const user = userEvent.setup();
      renderPicker();
      await user.type(
        screen.getByRole('textbox', { name: /search equipment/i }),
        'zzznomatches',
      );
      expect(screen.getByText('No matches.')).toBeInTheDocument();
    });

    it('filters custom library items by query', async () => {
      const user = userEvent.setup();
      const lib: CustomEquipmentItem[] = [
        { id: 'lib-1', name: 'Magic Sword', cost: 50 },
        { id: 'lib-2', name: 'Iron Shield', cost: 20 },
      ];
      renderPicker({ customLibrary: lib });
      await user.type(screen.getByRole('textbox', { name: /search equipment/i }), 'magic');
      expect(screen.getByRole('button', { name: /magic sword/i })).toBeInTheDocument();
      // Iron Shield filtered out — custom library section also hidden
      expect(screen.queryByRole('button', { name: /iron shield/i })).not.toBeInTheDocument();
    });

    it('clearing search restores all items', async () => {
      const user = userEvent.setup();
      renderPicker();
      const input = screen.getByRole('textbox', { name: /search equipment/i });
      await user.type(input, 'sword');
      await user.clear(input);
      expect(screen.getByRole('button', { name: /^dagger/i })).toBeInTheDocument();
    });
  });

  describe('adding items', () => {
    it('calls onAdd with source=bundled and catalogueId when a common item is clicked', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      renderPicker({ onAdd });
      await user.click(screen.getByRole('button', { name: /^sword/i }));
      expect(onAdd).toHaveBeenCalledOnce();
      const added: EquipmentItem = onAdd.mock.calls[0][0];
      expect(added.name).toBe('Sword');
      expect(added.cost).toBe(10);
      expect(added.source).toBe('bundled');
      expect(added.catalogueId).toBe('sword');
      expect(typeof added.id).toBe('string');
      expect(added.id.length).toBeGreaterThan(0);
    });

    it('calls onAdd with source=custom and catalogueId when a library item is clicked', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      const lib: CustomEquipmentItem[] = [{ id: 'lib-1', name: 'Magic Sword', cost: 50 }];
      renderPicker({ customLibrary: lib, onAdd });
      await user.click(screen.getByRole('button', { name: /magic sword/i }));
      expect(onAdd).toHaveBeenCalledOnce();
      const added: EquipmentItem = onAdd.mock.calls[0][0];
      expect(added.name).toBe('Magic Sword');
      expect(added.cost).toBe(50);
      expect(added.source).toBe('custom');
      expect(added.catalogueId).toBe('lib-1');
    });

    it('each addition produces a unique id', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      renderPicker({ onAdd });
      const btn = screen.getByRole('button', { name: /^dagger/i });
      await user.click(btn);
      await user.click(btn);
      expect(onAdd).toHaveBeenCalledTimes(2);
      const ids = onAdd.mock.calls.map((c) => (c as [EquipmentItem])[0].id);
      expect(ids[0]).not.toBe(ids[1]);
    });

    it('does not call onClose after adding an item (picker stays open)', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderPicker({ onClose });
      await user.click(screen.getByRole('button', { name: /^sword/i }));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('closing', () => {
    it('calls onClose when the × button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderPicker({ onClose });
      await user.click(screen.getByRole('button', { name: /close catalogue/i }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderPicker({ onClose });
      // Click the overlay element (role=dialog) directly
      await user.click(screen.getByRole('dialog'));
      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
