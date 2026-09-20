import { adminFetch } from "./adminApiClient";

export type SettingDto = {
  key: string;
  valueJson: string;
  updatedAt: string;
};

export type SettingRow = SettingDto;

export const SETTING_KEYS = ["site_title", "seo_meta", "social_links", "contact_email"] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

export class ApiError extends Error {
  status: number;
  code?: string;
  requestId?: string | null;

  constructor(status: number, message: string, code?: string, requestId?: string | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    const message = body.message ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message, body.code, body.requestId);
  }
  return res.json();
}

export async function fetchSettings(): Promise<SettingDto[]> {
  const res = await adminFetch("/api/admin/settings");
  return handleResponse<SettingDto[]>(res);
}

export async function saveSetting(key: SettingKey | string, valueJson: string): Promise<void> {
  const res = await adminFetch(`/api/admin/settings/${key}`, {
    method: "PUT",
    body: JSON.stringify({ valueJson }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    const message = body.message ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message, body.code, body.requestId);
  }
}
