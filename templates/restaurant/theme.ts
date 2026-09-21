import { assertValidTheme, type TemplateTheme } from '@portfolio/template-kit';

/**
 * Ember & Sage — token contract for template-kit.
 *
 * Why these three values and not the parent spec's old 4-cluster enum: master spec §5 overrides
 * that enum and requires a real per-site Hallmark session. This site landed on a warm terracotta
 * anchor, a high-contrast serif display face (Fraunces), and a clean humanist sans body face
 * (Plus Jakarta Sans).
 *
 * This design captures an intimate, contemporary bistro with hearth cooking and golden-hour tones,
 * differentiating from generic food-delivery or chain templates.
 *
 * The literal values are mirrored by --color-accent / --font-display / --font-body in
 * app/globals.css. If you change one, change both.
 */
export const restaurantTheme: TemplateTheme = assertValidTheme({
  accentHue: 'oklch(55% 0.14 38)',
  displayFont: '"Fraunces"',
  bodyFont: '"Plus Jakarta Sans"',
});

export const theme = restaurantTheme;
export default restaurantTheme;
