import { assertValidTheme, type TemplateTheme } from '@portfolio/template-kit';

/**
 * Construction demo site — token contract for template-kit.
 * (The firm's name comes from the spec's seed data in Task 2, not from here.)
 *
 * The starting family is high-contrast neutral plus one bold accent with a condensed sans, and the
 * spec names fitness and automotive as sharing it. Fitness already took that family in the light
 * direction with a signal orange and a heavy grotesque, and event holds the dark direction with a
 * condensed face, so a third pass at it would have produced a re-skin.
 *
 * The spec's other suggestion is a blueprint / technical-drawing accent system, and that is the one
 * that survives contact with the content: this is a firm selling precision, and a drawing is how a
 * builder proves it. So the display face is a monospace -- the register of dimensions, annotations
 * and revision stamps -- on a cool concrete ground with a blueprint blue.
 *
 * Mono as a display face is a real commitment, not a flourish: it sets the whole page's rhythm, and
 * it is the one axis value none of the six sites built so far uses.
 *
 * These literals mirror --color-accent / --font-display / --font-body in app/globals.css. Change
 * one, change both.
 */
export const constructionTheme: TemplateTheme = assertValidTheme({
  accentHue: 'oklch(55% 0.130 245)',
  displayFont: '"JetBrains Mono"',
  bodyFont: 'Lexend',
});

export default constructionTheme;
