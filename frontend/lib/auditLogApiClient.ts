import { adminFetch, unwrapPage } from "./adminApiClient";

export type AuditLog = {
  id: number;
  userId: number | null;
  action: string;
  entityType: string;
  entityId: number | null;
  oldValueJson: string | null;
  newValueJson: string | null;
  ipAddress: string | null;
  createdAt: string;
};

export type AuditLogPage = {
  content: AuditLog[];
  totalPages: number;
  number: number;
};

export async function listAuditLogs(
  entityType: string,
  entityId?: number,
  page: number = 0
): Promise<AuditLogPage> {
  const params = new URLSearchParams({ entityType, page: String(page) });
  if (entityId !== undefined && entityId !== null) {
    params.set("entityId", String(entityId));
  }
  const res = await adminFetch(`/api/admin/audit-logs?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }
  const body = await res.json();
  const content = unwrapPage<AuditLog>(body);
  const totalPages =
    typeof (body as { totalPages?: unknown })?.totalPages === "number"
      ? (body as { totalPages: number }).totalPages
      : (content.length > 0 ? 1 : 0);
  const pageNumber =
    typeof (body as { number?: unknown })?.number === "number"
      ? (body as { number: number }).number
      : page;

  return {
    content,
    totalPages,
    number: pageNumber,
  };
}
