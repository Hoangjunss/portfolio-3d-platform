import { assertValidTheme, type TemplateTheme } from '@portfolio/template-kit';

/**
 * Sông Hồng Real Estate — token contract for template-kit.
 *
 * Why these three values and not the parent spec's old 4-cluster enum: master spec §5 overrides
 * that enum and requires a real per-site Hallmark session. This site landed on an architectural
 * mineral spruce anchor, a structured humanist sans display face (Be Vietnam Pro), and a high-legibility
 * modern sans body face (Plus Jakarta Sans).
 *
 * This design captures a trusted, editorial real-estate brokerage with crisp architectural clarity,
 * structured property metadata hierarchy, and calm cartography aesthetics.
 *
 * The literal values are mirrored by --color-accent / --font-display / --font-body in
 * app/globals.css. If you change one, change both.
 */
export const realestateTheme: TemplateTheme = assertValidTheme({
  accentHue: 'oklch(46% 0.082 172)',
  displayFont: '"Be Vietnam Pro"',
  bodyFont: '"Plus Jakarta Sans"',
});

export const theme = realestateTheme;
export default realestateTheme;
