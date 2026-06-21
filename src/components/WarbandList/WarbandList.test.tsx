import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import '@testing-library/jest-dom';
import WarbandListPage from './WarbandList';
import WarbandForm from '../WarbandForm/WarbandForm';
import { WarbandProvider } from '../../context/WarbandContext';
import { ReferenceDataProvider } from '../../context/ReferenceDataContext';
import type { ReactNode } from 'react';

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <ReferenceDataProvider>
      <WarbandProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<>{children}</>} />
            <Route path="/warband/new" element={<WarbandForm />} />
          </Routes>
        </MemoryRouter>
      </WarbandProvider>
    </ReferenceDataProvider>
  );
}

describe('WarbandListPage — empty state', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows "No warbands yet." when warbands list is empty', () => {
    render(<WarbandListPage />, { wrapper: Wrapper });
    expect(screen.getByText('No warbands yet.')).toBeInTheDocument();
  });

  it('shows "+ New Warband" button', () => {
    render(<WarbandListPage />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: '+ New Warband' })).toBeInTheDocument();
  });

  it('does not show an error or blank screen', () => {
    render(<WarbandListPage />, { wrapper: Wrapper });
    expect(document.body).not.toBeEmptyDOMElement();
  });

  it('+ New Warband button navigates to /warband/new', async () => {
    const user = userEvent.setup();
    render(<WarbandListPage />, { wrapper: Wrapper });
    await user.click(screen.getByRole('button', { name: '+ New Warband' }));
    expect(screen.getByRole('heading', { name: /new warband/i })).toBeInTheDocument();
  });
});
