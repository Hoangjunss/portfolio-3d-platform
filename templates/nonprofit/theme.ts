import { assertValidTheme, type TemplateTheme } from '@portfolio/template-kit';

/**
 * Nonprofit demo site — token contract for template-kit.
 * (The organisation's name comes from the spec's seed data in Task 2, not from here.)
 *
 * The starting family for this category is a soft cool or green anchor with a humanist sans, and
 * the spec notes in the same breath that several other sites start there too. Education already
 * holds cool teal with a humanist sans and wedding holds garden green, so following the default
 * would have produced a third site in that neighbourhood.
 *
 * This takes a deep indigo instead: still cool, but far enough from teal to read as a different
 * institution, and it carries trust without the corporate chill of a blue-grey. The display face is
 * a sturdy roman serif rather than a sans, because the brief's hardest requirement is "never
 * transactional" — a serif reads as an organisation that writes to you, a sans reads as one that
 * sells to you.
 *
 * These literals mirror --color-accent / --font-display / --font-body in app/globals.css. Change
 * one, change both.
 */
export const nonprofitTheme: TemplateTheme = assertValidTheme({
  accentHue: 'oklch(45% 0.105 275)',
  displayFont: 'Bitter',
  bodyFont: '"Source Sans 3"',
});

export default nonprofitTheme;
