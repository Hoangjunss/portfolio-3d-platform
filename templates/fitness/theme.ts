import { assertValidTheme, type TemplateTheme } from '@portfolio/template-kit';

/**
 * Fitness demo site — token contract for template-kit.
 *
 * (The studio name comes from the spec's seed data in Task 2, not from here. Naming it in this
 * comment would have been invented content, which the spec's authenticity rule forbids.)
 *
 * The spec's starting direction for fitness is a high-contrast neutral base, one bold accent and a
 * condensed-sans display. That is almost exactly where the event site already landed
 * (near-black / condensed / saturated magenta), and master spec §8 criterion #10 asks for
 * distinctiveness against the other 28 sites, so following the brief literally would have produced
 * a re-skin of a site built two days ago.
 *
 * The brief offers "near-black / near-white base", so this takes the other half of it: a bone
 * near-white ground with near-black ink. Weight replaces width as the physical signal -- Barlow at
 * 800/900 rather than a condensed face -- which keeps the register energetic while leaving the
 * condensed axis to event. Barlow's lineage is signage and transit, which is the right voice for a
 * timetable and a programming board.
 *
 * The accent is a signal orange, rationed to stage numbers, the booking control and prices. On a
 * near-white ground it has to carry the whole energy budget, so spending it anywhere else would
 * flatten the page.
 *
 * These literals mirror --color-accent / --font-display / --font-body in app/globals.css. Change
 * one, change both.
 */
export const fitnessTheme: TemplateTheme = assertValidTheme({
  accentHue: 'oklch(63% 0.185 45)',
  displayFont: 'Barlow',
  bodyFont: '"Work Sans"',
});

export default fitnessTheme;
