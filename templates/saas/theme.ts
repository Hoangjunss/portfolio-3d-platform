import { assertValidTheme, type TemplateTheme } from '@portfolio/template-kit';

const theme: TemplateTheme = assertValidTheme({
  accentHue: 'oklch(61% 0.16 228)',
  displayFont: 'IBM Plex Sans Condensed',
  bodyFont: 'Manrope',
});

export default theme;
