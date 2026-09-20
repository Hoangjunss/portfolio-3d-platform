"use client";

import React, { useState, useRef, useEffect } from "react";

export interface MediaItem {
  id: number;
  fileName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

export interface MediaGridProps {
  items: MediaItem[];
  onDelete: (id: number) => Promise<void> | void;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${Number(kb.toFixed(1))} KB`;
  }
  const mb = kb / 1024;
  return `${Number(mb.toFixed(1))} MB`;
}

export function MediaGrid({ items, onDelete }: MediaGridProps) {
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [errorMap, setErrorMap] = useState<Record<number, string>>({});
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async (url: string, id: number) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
      setCopiedId(id);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedId((curr) => (curr === id ? null : curr));
      }, 1500);
    } catch {
      // Ignore clipboard write failure
    }
  };

  const handleDeleteClick = async (id: number) => {
    if (confirmingId !== id) {
      setConfirmingId(id);
      setErrorMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    setConfirmingId(null);
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch {
      setErrorMap((prev) => ({
        ...prev,
        [id]: "Không xoá được ảnh. Máy chủ từ chối yêu cầu. Thử lại.",
      }));
    } finally {
      setDeletingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <p className="text-sm text-neutral-500 py-4">
        Chưa có tệp phương tiện nào.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => {
        const isConfirming = confirmingId === item.id;
        const isDeleting = deletingId === item.id;
        const isCopied = copiedId === item.id;
        const error = errorMap[item.id];

        return (
          <div
            key={item.id}
            className="border rounded-lg p-3 bg-white shadow-sm flex flex-col justify-between overflow-hidden transition-opacity duration-200"
          >
            <div className="relative aspect-video bg-neutral-100 rounded overflow-hidden flex items-center justify-center mb-2">
              <img
                src={item.url}
                alt={item.fileName}
                onClick={() => handleCopy(item.url, item.id)}
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              />
              {isCopied && (
                <span
                  role="status"
                  className="absolute inset-0 bg-neutral-900/70 text-white text-xs font-medium flex items-center justify-center pointer-events-none"
                >
                  Đã sao chép
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0 mb-2">
              <p
                className="text-sm font-medium text-neutral-800 truncate"
                title={item.fileName}
              >
                {item.fileName}
              </p>
              <p className="text-xs text-neutral-500">{formatBytes(item.sizeBytes)}</p>
              {error && (
                <p role="alert" className="text-xs text-red-600 mt-1">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end pt-1 border-t border-neutral-100">
              {isConfirming ? (
                <button
                  type="button"
                  aria-label="Nhấn lần nữa để xoá"
                  onClick={() => handleDeleteClick(item.id)}
                  className="text-xs px-2.5 py-1 rounded bg-red-600 text-white font-medium hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:scale-95 transition-all"
                >
                  Nhấn lần nữa để xoá
                </button>
              ) : isDeleting ? (
                <button
                  type="button"
                  disabled
                  aria-busy="true"
                  aria-label="Đang xoá..."
                  className="p-1.5 rounded bg-neutral-100 text-neutral-400 cursor-not-allowed flex items-center justify-center"
                >
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Xoá ảnh"
                  title="Xoá ảnh"
                  onClick={() => handleDeleteClick(item.id)}
                  className="text-neutral-500 hover:text-red-600 hover:bg-neutral-100 p-1.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:scale-95 transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MediaGrid;
