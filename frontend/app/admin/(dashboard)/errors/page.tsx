"use client";

import { Fragment, useEffect, useState } from "react";
import { fetchErrorLogs, type SystemErrorLog } from "@/lib/errorLogsApiClient";

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 0) return date.toLocaleString();
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

export default function AdminErrorLogsPage() {
  const [logs, setLogs] = useState<SystemErrorLog[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      setLoading(true);
      try {
        const data = await fetchErrorLogs(page, 20);
        if (!cancelled) {
          setLogs(data.content);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message || "Cannot reach the server.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  const toggleRow = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">System Error Logs</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Recent 5xx errors with stack traces recorded by the server.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-[var(--color-accent)] text-sm">
          {error}
        </p>
      )}

      {loading && logs.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">Loading error logs…</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">No error logs recorded.</p>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-rule)] text-sm text-[var(--color-muted)]">
              <th className="p-3">Endpoint</th>
              <th className="p-3">Status</th>
              <th className="p-3">Exception class</th>
              <th className="p-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const isExpanded = expandedIds.has(log.id);
              return (
                <Fragment key={log.id}>
                  <tr
                    onClick={() => toggleRow(log.id)}
                    className="cursor-pointer hover:bg-[var(--color-paper-2)] border-b border-[var(--color-rule)] transition-colors"
                  >
                    <td className="p-3 font-mono text-sm">{log.endpoint}</td>
                    <td className="p-3">
                      <span
                        className={
                          log.httpStatus >= 500
                            ? "text-[var(--color-accent)] font-semibold"
                            : "text-[var(--color-muted)] font-medium"
                        }
                      >
                        {log.httpStatus}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{log.exceptionClass}</td>
                    <td
                      className="p-3 text-sm text-[var(--color-muted)]"
                      title={new Date(log.createdAt).toLocaleString()}
                    >
                      {formatRelativeTime(log.createdAt)}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-[var(--color-paper-2)] border-b border-[var(--color-rule)]">
                      <td
                        colSpan={4}
                        className="p-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <details open className="space-y-2">
                          <summary className="cursor-pointer font-medium text-sm text-[var(--color-ink)]">
                            {log.message || "(No error message)"}
                          </summary>
                          {log.requestId && (
                            <p className="text-xs text-[var(--color-muted)] font-mono">
                              Request ID: {log.requestId}
                            </p>
                          )}
                          <pre className="p-3 font-mono text-xs overflow-x-auto whitespace-pre-wrap bg-[var(--color-paper)] border border-[var(--color-rule)] rounded">
                            {log.stacktrace || "(No stack trace available)"}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={page === 0 || loading}
          onClick={() => setPage((p) => p - 1)}
          className="border border-[var(--color-rule)] px-3 py-1 rounded text-sm disabled:opacity-50 hover:bg-[var(--color-paper-2)] transition-colors"
        >
          Previous
        </button>
        <span className="text-sm text-[var(--color-muted)]">
          Page {page + 1} of {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          disabled={page + 1 >= totalPages || loading}
          onClick={() => setPage((p) => p + 1)}
          className="border border-[var(--color-rule)] px-3 py-1 rounded text-sm disabled:opacity-50 hover:bg-[var(--color-paper-2)] transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
