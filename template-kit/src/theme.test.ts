import { describe, it, expect } from 'vitest';
import { assertValidTheme } from './theme';

describe('assertValidTheme', () => {
  it('returns the theme unchanged when all fields are non-empty strings', () => {
    const theme = { accentHue: '#2563eb', displayFont: 'Fraunces', bodyFont: 'Inter Tight' };
    expect(assertValidTheme(theme)).toEqual(theme);
  });

  it('throws naming the missing field when accentHue is empty', () => {
    expect(() => assertValidTheme({ accentHue: '', displayFont: 'A', bodyFont: 'B' }))
      .toThrow(/accentHue/);
  });

  it('throws naming the missing field when displayFont is missing', () => {
    expect(() => assertValidTheme({ accentHue: '#000', bodyFont: 'B' }))
      .toThrow(/displayFont/);
  });

  it('throws when given a non-object', () => {
    expect(() => assertValidTheme(null)).toThrow(/theme/i);
  });
});
