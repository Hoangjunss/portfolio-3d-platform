import { assertValidTheme, type TemplateTheme } from '@portfolio/template-kit';

/**
 * Đồng Vọng Tech Summit — token contract for template-kit.
 *
 * Why this landed where it did: the spec's field call is bold-energetic, and it names two clusters
 * to stay clear of — the cool-corporate register (Corporate, SaaS, Legal, the CRM variants) and the
 * warm bold cluster (Fitness, Automotive, Construction). That rules out both of the obvious
 * conference accents, electric blue and orange-red, so the anchor is a saturated magenta on a
 * near-black neutral. On a ten-entry agenda the accent has to earn its place: it marks times,
 * prices and the add-control, and nothing else.
 *
 * Archivo is a grotesque with a condensed axis, which is the conference-poster voice the brief
 * asks for and is not the humanist sans the education site already uses. A third face, IBM Plex
 * Mono, is declared in globals.css for the agenda's <time> cells only — tabular figures make a
 * dense schedule scannable, which is function rather than decoration.
 *
 * These literals mirror --color-accent / --font-display / --font-body in app/globals.css. Change
 * one, change both.
 */
export const eventTheme: TemplateTheme = assertValidTheme({
  accentHue: 'oklch(64% 0.240 350)',
  displayFont: 'Archivo',
  bodyFont: '"IBM Plex Sans"',
});

export default eventTheme;
