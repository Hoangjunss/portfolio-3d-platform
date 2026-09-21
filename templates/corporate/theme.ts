import { assertValidTheme, type TemplateTheme } from '@portfolio/template-kit';

/**
 * Thăng Long Consulting Group — token contract for template-kit.
 *
 * Hallmark design convergence:
 * Macrostructure: Structured Grid / Editorial Ledger.
 * Theme axes: light / crisp-grotesque / corporate-lapis with warm brass accent.
 *
 * Typography:
 * - Display: "Plus Jakarta Sans" — authoritative geometric-grotesque display with tight tracking.
 * - Body: "Be Vietnam Pro" — high-legibility humanist sans crafted for Vietnamese diacritics
 *   and precision B2B editorial prose.
 *
 * Colors:
 * - Primary Accent: oklch(42% 0.11 254) — deep corporate lapis / slate indigo.
 * - Supporting Brass: oklch(68% 0.11 78) — warm executive gold/brass for highlights and borders.
 *
 * These values are mirrored in app/globals.css (--color-accent, --font-display, --font-body).
 */
export const corporateTheme: TemplateTheme = assertValidTheme({
  accentHue: 'oklch(42% 0.11 254)',
  displayFont: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  bodyFont: '"Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
});

export default corporateTheme;
