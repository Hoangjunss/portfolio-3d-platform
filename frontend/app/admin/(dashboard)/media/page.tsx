"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch, unwrapPage } from "@/lib/adminApiClient";
import { API_BASE } from "@/lib/apiClient";
import { ACCESS_TOKEN_COOKIE, readCookie } from "@/lib/auth";
import { MediaGrid, MediaItem } from "@/components/admin/MediaGrid";

export default function AdminMediaPage() {
  const router = useRouter();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMedia() {
      try {
        const res = await adminFetch("/api/admin/media");
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (!res.ok) {
          if (!cancelled) {
            setError(`Request failed (${res.status})`);
            setLoading(false);
          }
          return;
        }

        const body = await res.json();
        const data = unwrapPage<MediaItem>(body);
        if (!cancelled) {
          setItems(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Cannot reach the server.");
          setLoading(false);
        }
      }
    }

    loadMedia();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = readCookie(ACCESS_TOKEN_COOKIE);
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/api/admin/media`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!res.ok) {
        setUploadError(`Tải lên thất bại (${res.status}).`);
        return;
      }

      const newMedia: MediaItem = await res.json();
      setItems((prev) => [newMedia, ...prev]);
      e.target.value = "";
    } catch {
      setUploadError("Không thể kết nối đến máy chủ.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await adminFetch(`/api/admin/media/${id}`, {
        method: "DELETE",
      });

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (res.status !== 204 && !res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      throw err;
    }
  };

  if (error) return <p className="text-red-600">{error}</p>;
  if (loading) return <p>Loading…</p>;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Thư viện phương tiện</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Quản lý và tải lên hình ảnh cho nền tảng.
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-1">
          <label className="inline-flex items-center gap-2 cursor-pointer bg-neutral-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors">
            <span>{uploading ? "Đang tải lên…" : "Tải lên tệp"}</span>
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={handleUpload}
              className="hidden"
            />
          </label>
          {uploadError && (
            <span role="alert" className="text-xs text-red-600">
              {uploadError}
            </span>
          )}
        </div>
      </div>

      <MediaGrid items={items} onDelete={handleDelete} />
    </div>
  );
}
