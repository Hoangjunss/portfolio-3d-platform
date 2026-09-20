// Extracted from TemplateCarousel3D so the branch has a test: jsdom has no WebGL, so the R3F
// component never renders under Vitest and this decision was previously unverifiable (W-01).
export function shouldRenderTexture(thumbnailUrl: string | null): thumbnailUrl is string {
  return Boolean(thumbnailUrl);
}
