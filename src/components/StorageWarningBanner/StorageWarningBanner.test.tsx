import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as storageService from '../../services/storageService';
import { WarbandProvider } from '../../context/WarbandContext';
import StorageWarningBanner from './StorageWarningBanner';

function renderBanner() {
  return render(
    <WarbandProvider>
      <StorageWarningBanner />
    </WarbandProvider>
  );
}

describe('StorageWarningBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    // Ensure navigator.storage is absent by default
    Object.defineProperty(navigator, 'storage', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when navigator.storage is absent and no error', () => {
    renderBanner();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the warning banner when storage is near full', async () => {
    Object.defineProperty(navigator, 'storage', {
      value: {
        estimate: vi.fn().mockResolvedValue({ usage: 4_500_000, quota: 5_000_000 }),
      },
      configurable: true,
    });
    renderBanner();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/Storage nearly full/)).toBeInTheDocument();
  });

  it('clicking the close button dismisses the warning', async () => {
    Object.defineProperty(navigator, 'storage', {
      value: {
        estimate: vi.fn().mockResolvedValue({ usage: 4_500_000, quota: 5_000_000 }),
      },
      configurable: true,
    });
    renderBanner();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the error banner without a dismiss button when storageError is in context', async () => {
    vi.spyOn(storageService, 'saveData').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });
    renderBanner();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/Could not save/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
  });
});
