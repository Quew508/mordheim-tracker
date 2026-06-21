import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import FreeTextList from './FreeTextList';
import EquipmentList from '../EquipmentList/EquipmentList';
import type { EquipmentItem } from '../../types/equipment';

// ── FreeTextList ──────────────────────────────────────────────────────────

describe('FreeTextList', () => {
  it('renders existing items', () => {
    render(<FreeTextList items={['Sprint', 'Dodge']} onChange={() => {}} />);
    expect(screen.getByText('Sprint')).toBeInTheDocument();
    expect(screen.getByText('Dodge')).toBeInTheDocument();
  });

  it('adds an entry on button click', async () => {
    const user = userEvent.setup();
    let result: string[] = [];
    render(<FreeTextList items={[]} onChange={(v) => { result = v; }} />);
    await user.type(screen.getByRole('textbox'), 'Resilient');
    await user.click(screen.getByRole('button', { name: /\+ add/i }));
    expect(result).toEqual(['Resilient']);
  });

  it('adds an entry on Enter key', async () => {
    const user = userEvent.setup();
    let result: string[] = [];
    render(<FreeTextList items={[]} onChange={(v) => { result = v; }} />);
    await user.type(screen.getByRole('textbox'), 'Quick Draw{Enter}');
    expect(result).toEqual(['Quick Draw']);
  });

  it('clears input after adding', async () => {
    const user = userEvent.setup();
    render(<FreeTextList items={[]} onChange={() => {}} />);
    await user.type(screen.getByRole('textbox'), 'Test{Enter}');
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('');
  });

  it('removes an item when × is clicked', async () => {
    const user = userEvent.setup();
    let result = ['Sprint', 'Dodge'];
    render(<FreeTextList items={result} onChange={(v) => { result = v; }} />);
    await user.click(screen.getByRole('button', { name: 'Remove Sprint' }));
    expect(result).toEqual(['Dodge']);
  });

  it('add button is disabled when input is empty', () => {
    render(<FreeTextList items={[]} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /\+ add/i })).toBeDisabled();
  });
});

// ── EquipmentList ─────────────────────────────────────────────────────────

const ITEM: EquipmentItem = { id: 'e-1', name: 'Sword', cost: 10, source: 'custom' };

describe('EquipmentList', () => {
  it('renders existing items', () => {
    render(<EquipmentList items={[ITEM]} onChange={() => {}} />);
    expect(screen.getByText('Sword')).toBeInTheDocument();
    expect(screen.getByText('10 gc')).toBeInTheDocument();
  });

  it('adds an item', async () => {
    const user = userEvent.setup();
    let result: EquipmentItem[] = [];
    render(<EquipmentList items={[]} onChange={(v) => { result = v; }} />);
    await user.type(screen.getByRole('textbox', { name: /new item name/i }), 'Axe');
    await user.click(screen.getByRole('button', { name: /\+ add/i }));
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Axe');
    expect(result[0].source).toBe('custom');
    expect(result[0].id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('clicking item opens inline edit', async () => {
    const user = userEvent.setup();
    render(<EquipmentList items={[ITEM]} onChange={() => {}} />);
    // Button accessible name includes both name and cost text
    await user.click(screen.getByRole('button', { name: /sword/i }));
    expect(screen.getByRole('textbox', { name: /^item name$/i })).toBeInTheDocument();
  });

  it('removes an item', async () => {
    const user = userEvent.setup();
    let result = [ITEM];
    render(<EquipmentList items={result} onChange={(v) => { result = v; }} />);
    await user.click(screen.getByRole('button', { name: /sword/i }));
    await user.click(screen.getByRole('button', { name: /remove sword/i }));
    expect(result).toHaveLength(0);
  });

  it('shows Add from Library button when library items provided', () => {
    render(
      <EquipmentList
        items={[]}
        onChange={() => {}}
        libraryItems={[{ id: 'lib-1', name: 'Shield', cost: 5 }]}
      />
    );
    expect(screen.getByRole('button', { name: /add from library/i })).toBeInTheDocument();
  });

  it('adds a copy from library without mutating library', async () => {
    const user = userEvent.setup();
    let result: EquipmentItem[] = [];
    const library = [{ id: 'lib-1', name: 'Shield', cost: 5 }];
    render(
      <EquipmentList
        items={[]}
        onChange={(v) => { result = v; }}
        libraryItems={library}
      />
    );
    await user.click(screen.getByRole('button', { name: /add from library/i }));
    await user.click(screen.getByRole('button', { name: /shield/i }));
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Shield');
    expect(result[0].id).not.toBe('lib-1'); // independent copy
    expect(library[0].id).toBe('lib-1'); // original untouched
  });
});
