const SESSION_STORAGE_KEY = "portfolio_session_id";

export function getSessionId(): string | null {
  if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") {
    return null;
  }
  try {
    const existingId = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existingId) {
      return existingId;
    }
    const newId = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, newId);
    return newId;
  } catch {
    return null;
  }
}
