import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PostGameRecordsPanel from './PostGameRecordsPanel';
import type { Warband } from '../../types/warband';

const BASE_WARBAND: Warband = {
  id: 'w-1',
  name: 'Test Warband',
  faction: 'Reiklanders',
  notes: '',
  rating: 0,
  heroes: [],
  henchmanGroups: [],
  inventory: [],
  customEquipmentLibrary: [],
  goldCrowns: 50,
  wyrdstoneFragments: 3,
  transactionLog: [],
  achievements: [],
  lootLog: [],
};

describe('PostGameRecordsPanel', () => {
  it('renders Achievements and Loot Log subheadings', () => {
    render(<PostGameRecordsPanel warband={BASE_WARBAND} onUpdate={() => {}} />);
    expect(screen.getByText('Achievements')).toBeInTheDocument();
    expect(screen.getByText('Loot Log')).toBeInTheDocument();
  });

  it('renders existing achievement entries', () => {
    const warband = { ...BASE_WARBAND, achievements: ['Won first scenario'] };
    render(<PostGameRecordsPanel warband={warband} onUpdate={() => {}} />);
    expect(screen.getByText('Won first scenario')).toBeInTheDocument();
  });

  it('renders existing loot entries', () => {
    const warband = {
      ...BASE_WARBAND,
      lootLog: [{ id: 'l-1', description: 'Sword of Sigmar', goldValue: 30 }],
    };
    render(<PostGameRecordsPanel warband={warband} onUpdate={() => {}} />);
    expect(screen.getByText('Sword of Sigmar')).toBeInTheDocument();
    expect(screen.getByText('30 gc')).toBeInTheDocument();
  });

  it('shows — for null goldValue', () => {
    const warband = {
      ...BASE_WARBAND,
      lootLog: [{ id: 'l-1', description: 'Strange relic', goldValue: null }],
    };
    render(<PostGameRecordsPanel warband={warband} onUpdate={() => {}} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('add achievement button is disabled when input is empty', () => {
    render(<PostGameRecordsPanel warband={BASE_WARBAND} onUpdate={() => {}} />);
    const addBtns = screen.getAllByRole('button', { name: /\+ add/i });
    // first Add button belongs to Achievements
    expect(addBtns[0]).toBeDisabled();
  });

  it('adding an achievement calls onUpdate with new entry appended and clears the input', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<PostGameRecordsPanel warband={BASE_WARBAND} onUpdate={onUpdate} />);
    const input = screen.getByRole('textbox', { name: /achievement text/i });
    await user.type(input, 'Won first scenario');
    const addBtns = screen.getAllByRole('button', { name: /\+ add/i });
    await user.click(addBtns[0]);
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ achievements: ['Won first scenario'] })
    );
    expect(input).toHaveValue('');
  });

  it('adding an achievement via Enter calls onUpdate', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<PostGameRecordsPanel warband={BASE_WARBAND} onUpdate={onUpdate} />);
    await user.type(screen.getByRole('textbox', { name: /achievement text/i }), 'Heroic charge{Enter}');
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ achievements: ['Heroic charge'] })
    );
  });

  it('deleting an achievement shows the confirmation dialog', async () => {
    const user = userEvent.setup();
    const warband = { ...BASE_WARBAND, achievements: ['Won first scenario'] };
    render(<PostGameRecordsPanel warband={warband} onUpdate={() => {}} />);
    await user.click(screen.getByRole('button', { name: /delete achievement: won first scenario/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /delete entry/i })).toBeInTheDocument();
  });

  it('confirming delete achievement calls onUpdate with entry removed', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    const warband = { ...BASE_WARBAND, achievements: ['Won first scenario', 'Slew a troll'] };
    render(<PostGameRecordsPanel warband={warband} onUpdate={onUpdate} />);
    await user.click(screen.getByRole('button', { name: /delete achievement: won first scenario/i }));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ achievements: ['Slew a troll'] })
    );
  });

  it('cancelling delete achievement keeps the list unchanged', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    const warband = { ...BASE_WARBAND, achievements: ['Won first scenario'] };
    render(<PostGameRecordsPanel warband={warband} onUpdate={onUpdate} />);
    await user.click(screen.getByRole('button', { name: /delete achievement: won first scenario/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('adding a loot entry with gold value calls onUpdate correctly', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<PostGameRecordsPanel warband={BASE_WARBAND} onUpdate={onUpdate} />);
    await user.type(screen.getByRole('textbox', { name: /loot description/i }), 'Wyrdstone shard');
    await user.type(screen.getByRole('spinbutton', { name: /loot gold value/i }), '15');
    const addBtns = screen.getAllByRole('button', { name: /\+ add/i });
    await user.click(addBtns[1]);
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        lootLog: expect.arrayContaining([
          expect.objectContaining({ description: 'Wyrdstone shard', goldValue: 15 }),
        ]),
      })
    );
  });

  it('adding a loot entry without gold value sets goldValue to null', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<PostGameRecordsPanel warband={BASE_WARBAND} onUpdate={onUpdate} />);
    await user.type(screen.getByRole('textbox', { name: /loot description/i }), 'Strange relic');
    const addBtns = screen.getAllByRole('button', { name: /\+ add/i });
    await user.click(addBtns[1]);
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        lootLog: expect.arrayContaining([
          expect.objectContaining({ description: 'Strange relic', goldValue: null }),
        ]),
      })
    );
  });

  it('confirming delete loot entry calls onUpdate with entry removed', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    const warband = {
      ...BASE_WARBAND,
      lootLog: [{ id: 'l-1', description: 'Sword of Sigmar', goldValue: 30 }],
    };
    render(<PostGameRecordsPanel warband={warband} onUpdate={onUpdate} />);
    await user.click(screen.getByRole('button', { name: /delete loot entry: sword of sigmar/i }));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ lootLog: [] })
    );
  });

  it('cancelling delete loot keeps the list unchanged', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    const warband = {
      ...BASE_WARBAND,
      lootLog: [{ id: 'l-1', description: 'Sword of Sigmar', goldValue: 30 }],
    };
    render(<PostGameRecordsPanel warband={warband} onUpdate={onUpdate} />);
    await user.click(screen.getByRole('button', { name: /delete loot entry: sword of sigmar/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('handles legacy warband with undefined achievements and lootLog', () => {
    const warband = { ...BASE_WARBAND, achievements: undefined as unknown as string[], lootLog: undefined as unknown as [] };
    expect(() => render(<PostGameRecordsPanel warband={warband} onUpdate={() => {}} />)).not.toThrow();
  });
});
