import { assertValidTheme, type TemplateTheme } from '@portfolio/template-kit';

/**
 * Sông Hồng Academy — token contract for template-kit.
 *
 * Why these three values and not the parent spec's old 4-cluster enum: master spec §5 overrides
 * that enum and requires a real per-site Hallmark session. This site landed on a cool anchor and a
 * humanist-sans display, which is the session's convergence on reference direction #3 (editorial /
 * publication-adjacent education brands) — the curriculum modules and course descriptions here are
 * read as prose, not scanned like a pricing table, so the body face is a serif and the display face
 * carries the approachability instead.
 *
 * Be Vietnam Pro is not a neutral pick: it is a humanist sans drawn for Vietnamese diacritics, so
 * "Sông Hồng" sets with the same care as Latin text rather than borrowing marks from a fallback.
 *
 * The literal values are mirrored by --color-accent / --font-display / --font-body in
 * app/globals.css. If you change one, change both.
 */
export const educationTheme: TemplateTheme = assertValidTheme({
  accentHue: 'oklch(52% 0.085 208)',
  displayFont: '"Be Vietnam Pro"',
  bodyFont: '"Source Serif 4"',
});

export default educationTheme;
