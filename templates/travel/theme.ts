import { assertValidTheme, type TemplateTheme } from '@portfolio/template-kit';

/**
 * Vịnh Ngọc Resort & Spa — token contract for template-kit.
 *
 * The brief asks for relaxed, premium and coastal "without tipping into a generic stock-photo beach
 * vacation template", and offers a deep teal/sand duotone or a sun-bleached warm neutral with coral.
 * Teal is already education's anchor and coral sits next to fitness's signal orange, so both
 * defaults were taken.
 *
 * The way out was to change the hour rather than the palette family: this is the resort at dusk, on
 * a deep ink-blue ground with warm sand as the only accent. Bright midday sand-and-sky is exactly
 * the stock-beach look the brief rules out, so the site avoids it by not being set at midday.
 *
 * A high-contrast serif on a dark ground is where "premium hospitality" actually lives, and it
 * keeps this site clear of the four sans-led demo sites built so far.
 *
 * These literals mirror --color-accent / --font-display / --font-body in app/globals.css. Change
 * one, change both.
 */
export const travelTheme: TemplateTheme = assertValidTheme({
  accentHue: 'oklch(75% 0.105 78)',
  displayFont: '"Playfair Display"',
  bodyFont: 'Manrope',
});

export default travelTheme;
