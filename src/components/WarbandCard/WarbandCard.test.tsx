import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import '@testing-library/jest-dom';
import WarbandCard from './WarbandCard';
import type { Warband } from '../../types/warband';

const WARBAND: Warband = {
  id: 'w-card-1',
  name: 'Iron Wolves',
  faction: 'Reiklanders',
  notes: '',
  rating: 12,
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

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('WarbandCard', () => {
  it('renders warband name', () => {
    render(<WarbandCard warband={WARBAND} />, { wrapper: Wrapper });
    expect(screen.getByText('Iron Wolves')).toBeInTheDocument();
  });

  it('renders faction', () => {
    render(<WarbandCard warband={WARBAND} />, { wrapper: Wrapper });
    expect(screen.getByText('Reiklanders')).toBeInTheDocument();
  });

  it('renders Rating stat cell', () => {
    render(<WarbandCard warband={WARBAND} />, { wrapper: Wrapper });
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders Gold stat cell with goldCrowns value', () => {
    render(<WarbandCard warband={WARBAND} />, { wrapper: Wrapper });
    expect(screen.getByText('Gold')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('renders Wyrdstone stat cell with wyrdstoneFragments value', () => {
    render(<WarbandCard warband={WARBAND} />, { wrapper: Wrapper });
    expect(screen.getByText('Wyrdstone')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders zero gold when goldCrowns is 0', () => {
    const warband = { ...WARBAND, goldCrowns: 0 };
    render(<WarbandCard warband={warband} />, { wrapper: Wrapper });
    // '0' appears for goldCrowns — there should be two 0 values (rating and gold both 0, but rating is 12 here)
    expect(screen.getByText('Gold')).toBeInTheDocument();
    // Value 0 for goldCrowns
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(1);
  });

  it('Gold label has gold color class', () => {
    render(<WarbandCard warband={WARBAND} />, { wrapper: Wrapper });
    const goldLabel = screen.getByText('Gold');
    expect(goldLabel.className).toMatch(/statGold/);
  });

  it('Wyrdstone label has wyrdstone color class', () => {
    render(<WarbandCard warband={WARBAND} />, { wrapper: Wrapper });
    const wyrdstoneLabel = screen.getByText('Wyrdstone');
    expect(wyrdstoneLabel.className).toMatch(/statWyrdstone/);
  });
});
