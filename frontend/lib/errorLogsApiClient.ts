import { adminFetch, unwrapPage } from "./adminApiClient";

export type SystemErrorLog = {
  id: number;
  endpoint: string;
  httpStatus: number;
  exceptionClass: string;
  message: string | null;
  stacktrace: string | null;
  requestId: string | null;
  createdAt: string;
};

export type ErrorLogRow = SystemErrorLog;
export type SystemErrorLogDto = SystemErrorLog;

export type ErrorLogPage = {
  content: SystemErrorLog[];
  totalPages: number;
  number: number;
};

export async function fetchErrorLogs(
  page: number = 0,
  size: number = 20
): Promise<ErrorLogPage> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  const res = await adminFetch(`/api/admin/error-logs?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }
  const body = await res.json();
  const content = unwrapPage<SystemErrorLog>(body);
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

export const listErrorLogs = fetchErrorLogs;
