import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TreasuryPanel from './TreasuryPanel';
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

describe('TreasuryPanel', () => {
  it('displays current goldCrowns value', () => {
    render(<TreasuryPanel warband={BASE_WARBAND} onUpdate={() => {}} />);
    expect(screen.getByRole('button', { name: /gold crowns: 50/i })).toBeInTheDocument();
  });

  it('displays current wyrdstoneFragments value', () => {
    render(<TreasuryPanel warband={BASE_WARBAND} onUpdate={() => {}} />);
    expect(screen.getByRole('button', { name: /wyrdstone fragments: 3/i })).toBeInTheDocument();
  });

  it('clicking gold value opens inline input', async () => {
    const user = userEvent.setup();
    render(<TreasuryPanel warband={BASE_WARBAND} onUpdate={() => {}} />);
    await user.click(screen.getByRole('button', { name: /gold crowns: 50/i }));
    expect(screen.getByRole('spinbutton', { name: /gold crowns/i })).toBeInTheDocument();
  });

  it('editing gold and pressing Enter calls onUpdate with new goldCrowns', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<TreasuryPanel warband={BASE_WARBAND} onUpdate={onUpdate} />);
    await user.click(screen.getByRole('button', { name: /gold crowns: 50/i }));
    const input = screen.getByRole('spinbutton', { name: /gold crowns/i });
    await user.clear(input);
    await user.type(input, '75{Enter}');
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ goldCrowns: 75 }));
  });

  it('editing gold and blurring calls onUpdate with new goldCrowns', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<TreasuryPanel warband={BASE_WARBAND} onUpdate={onUpdate} />);
    await user.click(screen.getByRole('button', { name: /gold crowns: 50/i }));
    const input = screen.getByRole('spinbutton', { name: /gold crowns/i });
    await user.clear(input);
    await user.type(input, '100');
    await user.tab();
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ goldCrowns: 100 }));
  });

  it('editing wyrdstone and pressing Enter calls onUpdate with new wyrdstoneFragments', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<TreasuryPanel warband={BASE_WARBAND} onUpdate={onUpdate} />);
    await user.click(screen.getByRole('button', { name: /wyrdstone fragments: 3/i }));
    const input = screen.getByRole('spinbutton', { name: /wyrdstone fragments/i });
    await user.clear(input);
    await user.type(input, '7{Enter}');
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ wyrdstoneFragments: 7 }));
  });

  it('transaction log is hidden by default', () => {
    render(<TreasuryPanel warband={BASE_WARBAND} onUpdate={() => {}} />);
    expect(screen.queryByRole('spinbutton', { name: /transaction amount/i })).not.toBeInTheDocument();
  });

  it('clicking transaction log toggle expands it', async () => {
    const user = userEvent.setup();
    render(<TreasuryPanel warband={BASE_WARBAND} onUpdate={() => {}} />);
    await user.click(screen.getByRole('button', { name: /transaction log/i }));
    expect(screen.getByRole('textbox', { name: /transaction description/i })).toBeInTheDocument();
  });

  it('toggle button shows entry count badge when entries exist', () => {
    const warband: Warband = {
      ...BASE_WARBAND,
      transactionLog: [{ id: 'tx-1', description: 'Sold loot', amount: 20 }],
    };
    render(<TreasuryPanel warband={warband} onUpdate={() => {}} />);
    const toggle = screen.getByRole('button', { name: /transaction log/i });
    expect(within(toggle).getByText('1')).toBeInTheDocument();
  });

  it('adds a transaction entry', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<TreasuryPanel warband={BASE_WARBAND} onUpdate={onUpdate} />);
    await user.click(screen.getByRole('button', { name: /transaction log/i }));
    await user.type(screen.getByRole('textbox', { name: /transaction description/i }), 'Post-game income');
    await user.type(screen.getByRole('spinbutton', { name: /transaction amount/i }), '30');
    await user.click(screen.getByRole('button', { name: /\+ add/i }));
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionLog: expect.arrayContaining([
          expect.objectContaining({ description: 'Post-game income', amount: 30 }),
        ]),
      })
    );
  });

  it('shows existing transaction entries when log is open', async () => {
    const user = userEvent.setup();
    const warband: Warband = {
      ...BASE_WARBAND,
      transactionLog: [{ id: 'tx-1', description: 'Bought sword', amount: -10 }],
    };
    render(<TreasuryPanel warband={warband} onUpdate={() => {}} />);
    await user.click(screen.getByRole('button', { name: /transaction log/i }));
    expect(screen.getByText('Bought sword')).toBeInTheDocument();
    expect(screen.getByText('-10')).toBeInTheDocument();
  });

  it('shows + prefix on positive transaction amounts', async () => {
    const user = userEvent.setup();
    const warband: Warband = {
      ...BASE_WARBAND,
      transactionLog: [{ id: 'tx-2', description: 'Income', amount: 25 }],
    };
    render(<TreasuryPanel warband={warband} onUpdate={() => {}} />);
    await user.click(screen.getByRole('button', { name: /transaction log/i }));
    expect(screen.getByText('+25')).toBeInTheDocument();
  });

  it('clicking delete on transaction entry shows confirmation sheet', async () => {
    const user = userEvent.setup();
    const warband: Warband = {
      ...BASE_WARBAND,
      transactionLog: [{ id: 'tx-1', description: 'Sold loot', amount: 20 }],
    };
    render(<TreasuryPanel warband={warband} onUpdate={() => {}} />);
    await user.click(screen.getByRole('button', { name: /transaction log/i }));
    await user.click(screen.getByRole('button', { name: /delete transaction: sold loot/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /delete transaction/i })).toBeInTheDocument();
  });

  it('confirming delete calls onUpdate with entry removed', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    const warband: Warband = {
      ...BASE_WARBAND,
      transactionLog: [{ id: 'tx-1', description: 'Sold loot', amount: 20 }],
    };
    render(<TreasuryPanel warband={warband} onUpdate={onUpdate} />);
    await user.click(screen.getByRole('button', { name: /transaction log/i }));
    await user.click(screen.getByRole('button', { name: /delete transaction: sold loot/i }));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ transactionLog: [] })
    );
  });

  it('cancelling delete does not call onUpdate', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    const warband: Warband = {
      ...BASE_WARBAND,
      transactionLog: [{ id: 'tx-1', description: 'Sold loot', amount: 20 }],
    };
    render(<TreasuryPanel warband={warband} onUpdate={onUpdate} />);
    await user.click(screen.getByRole('button', { name: /transaction log/i }));
    await user.click(screen.getByRole('button', { name: /delete transaction: sold loot/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
