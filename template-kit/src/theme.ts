export interface TemplateTheme {
  accentHue: string;
  displayFont: string;
  bodyFont: string;
}

const REQUIRED_FIELDS: Array<keyof TemplateTheme> = ['accentHue', 'displayFont', 'bodyFont'];

export function assertValidTheme(theme: unknown): TemplateTheme {
  if (typeof theme !== 'object' || theme === null) {
    throw new Error('assertValidTheme: theme must be a non-null object');
  }
  const candidate = theme as Record<string, unknown>;
  for (const field of REQUIRED_FIELDS) {
    const value = candidate[field];
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`assertValidTheme: "${field}" must be a non-empty string`);
    }
  }
  return candidate as unknown as TemplateTheme;
}
