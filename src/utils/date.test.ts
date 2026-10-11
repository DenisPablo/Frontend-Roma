import { describe, it, expect } from 'vitest';
import {
  getTodayString,
  shiftDateString,
  formatDurationSeconds,
  formatStopwatchTime,
  formatReminderOffset,
  formatDateHeading,
  calculateElapsedSeconds,
} from './date';

describe('Date and Time Utils', () => {
  it('getTodayString returns format YYYY-MM-DD', () => {
    const today = getTodayString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('shiftDateString adds and subtracts days correctly', () => {
    expect(shiftDateString('2026-10-15', 1)).toBe('2026-10-16');
    expect(shiftDateString('2026-10-15', -1)).toBe('2026-10-14');
    expect(shiftDateString('2026-10-31', 1)).toBe('2026-11-01');
  });

  it('formatDurationSeconds formats seconds, minutes and hours', () => {
    expect(formatDurationSeconds(45)).toBe('45s');
    expect(formatDurationSeconds(120)).toBe('2m');
    expect(formatDurationSeconds(3600)).toBe('1h');
    expect(formatDurationSeconds(3665)).toBe('1h 1m');
  });

  it('formatStopwatchTime formats MM:SS and HH:MM:SS', () => {
    expect(formatStopwatchTime(5)).toBe('00:05');
    expect(formatStopwatchTime(65)).toBe('01:05');
    expect(formatStopwatchTime(3665)).toBe('01:01:05');
  });

  it('formatReminderOffset formats negative offsets and zero', () => {
    expect(formatReminderOffset(0)).toBe('Al inicio');
    expect(formatReminderOffset(-1440)).toBe('1d antes');
    expect(formatReminderOffset(-120)).toBe('2h antes');
    expect(formatReminderOffset(-30)).toBe('30m antes');
  });

  it('formatDateHeading returns Hoy for current date', () => {
    const today = getTodayString();
    expect(formatDateHeading(today)).toBe('Hoy');
  });

  it('calculateElapsedSeconds computes elapsed time', () => {
    const past = new Date(Date.now() - 10000).toISOString();
    const elapsed = calculateElapsedSeconds(past);
    expect(elapsed).toBeGreaterThanOrEqual(9);
    expect(elapsed).toBeLessThanOrEqual(12);
  });
});
