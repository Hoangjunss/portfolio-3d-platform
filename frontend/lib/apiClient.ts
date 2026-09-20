export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export type Template = {
  id: number;
  name: string;
  slug: string;
  subdomain: string;
  thumbnailMediaId: number | null;
  thumbnailUrl: string | null;
  description: string | null;
  category: string | null;
  techTags: string | null;
  displayOrder: number;
  active: boolean;
  viewCount: number;
  clickCount: number;
};

export type TrackEventPayload = {
  eventType: "PAGE_VIEW" | "TEMPLATE_CLICK" | "DEMO_OPEN";
  templateId?: number | null;
  sessionId: string;
};

export async function getTemplates(): Promise<Template[]> {
  const res = await fetch(`${API_BASE}/api/public/templates`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    throw new Error(`Failed to load templates: ${res.status}`);
  }
  return res.json();
}

export async function trackEvent(payload: TrackEventPayload): Promise<void> {
  try {
    const body: Record<string, unknown> = {
      eventType: payload.eventType,
      sessionId: payload.sessionId,
    };
    if (payload.templateId !== undefined) {
      body.templateId = payload.templateId;
    }

    await fetch(`${API_BASE}/api/analytics/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    // Analytics is best-effort: network failures must never break the page or user experience.
  }
}
