import { assertValidTheme, type TemplateTheme } from '@portfolio/template-kit';

/**
 * Nguyễn Hoàng Minh & Đặng Thanh Hà — token contract for template-kit.
 *
 * The spec's starting family for this category is a warm terracotta/rose anchor with a serif
 * display, and it also warns that restaurant, beauty and photography start from that same family,
 * so wedding must not read as a re-skin of any of them. Rose-gold is additionally the one palette
 * every wedding-template generator already ships.
 *
 * The way out came from the content rather than from taste: the venue is Ngọc Lan Garden Hall, so
 * the anchor is a deep garden green and terracotta drops to a secondary, used only for the RSVP
 * call to action and the countdown figures. Warm and celebratory survive; the cliché does not.
 *
 * Cormorant Garamond is a classical serif, which is a different register from the portfolio site's
 * high-contrast Fraunces and from the two sans faces the education and event sites use. At the
 * display sizes a Letter macrostructure asks for, its low x-height is what makes an invitation
 * read as an invitation.
 *
 * These literals mirror --color-accent / --font-display / --font-body in app/globals.css. Change
 * one, change both.
 */
export const weddingTheme: TemplateTheme = assertValidTheme({
  accentHue: 'oklch(48% 0.090 150)',
  displayFont: '"Cormorant Garamond"',
  bodyFont: 'Mulish',
});

export default weddingTheme;
