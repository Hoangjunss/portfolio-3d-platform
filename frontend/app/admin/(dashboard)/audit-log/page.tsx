"use client";

import { useEffect, useState } from "react";
import { listAuditLogs, type AuditLog } from "@/lib/auditLogApiClient";

const ENTITY_TYPES = ["Template", "ContentSection", "Lead", "User", "Setting", "Media"];

function parseJsonSafe(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : { value: parsed };
  } catch {
    return { value: raw };
  }
}

function diffRows(
  oldJson: string | null,
  newJson: string | null
): { key: string; from: unknown; to: unknown }[] {
  const oldObj = parseJsonSafe(oldJson);
  const newObj = parseJsonSafe(newJson);
  const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  return Array.from(keys)
    .filter((k) => JSON.stringify(oldObj[k]) !== JSON.stringify(newObj[k]))
    .map((k) => ({ key: k, from: oldObj[k], to: newObj[k] }));
}

export default function AdminAuditLogPage() {
  const [entityType, setEntityType] = useState(ENTITY_TYPES[0]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const data = await listAuditLogs(entityType, undefined, page);
        if (!cancelled) {
          setLogs(data.content);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message || "Không thể kết nối đến máy chủ.");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [entityType, page]);

  return (
    <div className="flex flex-col gap-6">
      <select
        value={entityType}
        onChange={(e) => {
          setEntityType(e.target.value);
          setPage(0);
        }}
        className="border p-2 w-fit"
      >
        {ENTITY_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {error && (
        <p role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      )}

      <table className="w-full text-left">
        <thead>
          <tr>
            <th>Người dùng</th>
            <th>Hành động</th>
            <th>Đối tượng</th>
            <th>Thời gian</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              onClick={() => setSelected(log)}
              className="cursor-pointer hover:bg-[var(--color-paper-2)]"
            >
              <td>{log.userId ?? "—"}</td>
              <td>{log.action}</td>
              <td>
                {log.entityType} #{log.entityId}
              </td>
              <td>{new Date(log.createdAt).toLocaleString("vi-VN")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          Trước
        </button>
        <span>
          Trang {page + 1}/{Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          disabled={page + 1 >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Sau
        </button>
      </div>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 flex items-center justify-center bg-black/40"
        >
          <div className="bg-[var(--color-paper)] p-6 rounded flex flex-col gap-4 max-w-lg">
            <h2 className="text-lg">Chi tiết thay đổi #{selected.id}</h2>
            {selected.action === "CREATE" ? (
              <p>Bản ghi mới được tạo. Không có giá trị cũ để so sánh.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th>Trường</th>
                    <th>Giá trị cũ</th>
                    <th>Giá trị mới</th>
                  </tr>
                </thead>
                <tbody>
                  {diffRows(selected.oldValueJson, selected.newValueJson).map((row) => (
                    <tr key={row.key}>
                      <td>{row.key}</td>
                      <td className="text-red-700">
                        {typeof row.from === "object" && row.from !== null
                          ? JSON.stringify(row.from)
                          : String(row.from ?? "—")}
                      </td>
                      <td className="text-green-700">
                        {typeof row.to === "object" && row.to !== null
                          ? JSON.stringify(row.to)
                          : String(row.to ?? "—")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="self-end"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
