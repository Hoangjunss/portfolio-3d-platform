export function isWebGLAvailable(canvas?: HTMLCanvasElement | null): boolean {
  if (typeof window === "undefined" && !canvas) {
    return false;
  }
  try {
    const target =
      canvas ??
      (typeof document !== "undefined" ? document.createElement("canvas") : null);
    if (!target || typeof target.getContext !== "function") {
      return false;
    }
    const gl =
      target.getContext("webgl") ||
      target.getContext("experimental-webgl");
    return Boolean(gl);
  } catch {
    return false;
  }
}
