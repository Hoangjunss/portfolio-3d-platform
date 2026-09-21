import { describe, it, expect } from 'vitest';
import { computeCountdown } from './computeCountdown';

const TARGET = '2026-12-20T17:00:00+07:00';

describe('computeCountdown', () => {
  it('returns hasPassed:false and the correct breakdown well before the target', () => {
    // exactly 2 days, 3 hours, 4 minutes, 5 seconds before TARGET
    const now = new Date('2026-12-18T13:55:55+07:00');
    const result = computeCountdown(TARGET, now);
    expect(result).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5, hasPassed: false });
  });

  it('returns hasPassed:false and 1 second remaining one second before the target', () => {
    const now = new Date('2026-12-20T16:59:59+07:00');
    const result = computeCountdown(TARGET, now);
    expect(result).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 1, hasPassed: false });
  });

  it('returns hasPassed:false with all-zero remainder less than one second before the target', () => {
    const now = new Date('2026-12-20T16:59:59.500+07:00');
    const result = computeCountdown(TARGET, now);
    expect(result).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, hasPassed: false });
  });

  it('returns hasPassed:true with all-zero fields exactly at the target', () => {
    const now = new Date(TARGET);
    const result = computeCountdown(TARGET, now);
    expect(result).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, hasPassed: true });
  });

  it('returns hasPassed:true with all-zero fields well after the target', () => {
    const now = new Date('2027-01-01T00:00:00+07:00');
    const result = computeCountdown(TARGET, now);
    expect(result).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, hasPassed: true });
  });
});
