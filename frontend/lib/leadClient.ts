import { API_BASE } from "./apiClient";

export type LeadInput = { name: string; email: string; phone?: string; message: string };
export type SubmitLeadResult =
  | { ok: true }
  | { ok: false; reason: "rate-limited" | "server-error" | "validation" | "network" };

export async function submitLead(input: LeadInput): Promise<SubmitLeadResult> {
  try {
    const res = await fetch(`${API_BASE}/api/public/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) return { ok: true };
    if (res.status === 429) return { ok: false, reason: "rate-limited" };
    if (res.status === 400) return { ok: false, reason: "validation" };
    return { ok: false, reason: "server-error" };
  } catch {
    return { ok: false, reason: "network" };
  }
}
