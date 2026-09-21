import { assertValidTheme, type TemplateTheme } from '@portfolio/template-kit';

const theme: TemplateTheme = assertValidTheme({
  accentHue: 'oklch(62% 0.15 205)',
  displayFont: 'Arial Narrow',
  bodyFont: 'system-ui',
});

export default theme;
