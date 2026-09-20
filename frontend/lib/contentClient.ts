import { API_BASE } from "./apiClient";

export async function getContentSection<T>(key: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}/api/public/content-sections/${key}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.dataJson as T;
  } catch {
    return null;
  }
}
