import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useTheme } from './useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to dark mode when no preference is stored', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
  });

  it('does not set data-theme attribute in dark mode', () => {
    renderHook(() => useTheme());
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('reads stored light preference from localStorage', () => {
    localStorage.setItem('mordheim_theme', 'light');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });

  it('sets data-theme="light" on the root element when theme is light', () => {
    localStorage.setItem('mordheim_theme', 'light');
    renderHook(() => useTheme());
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('toggles dark → light and sets data-theme="light"', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('toggles light → dark and removes data-theme', () => {
    localStorage.setItem('mordheim_theme', 'light');
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('persists theme preference to localStorage on toggle', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(localStorage.getItem('mordheim_theme')).toBe('light');
    act(() => result.current.toggleTheme());
    expect(localStorage.getItem('mordheim_theme')).toBe('dark');
  });
});
