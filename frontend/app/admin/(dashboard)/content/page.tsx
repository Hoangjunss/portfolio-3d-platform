"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch, unwrapPage } from "@/lib/adminApiClient";
import {
  SectionKey,
  SECTION_KEYS,
  SECTION_TITLES,
} from "@/lib/contentSectionShapes";
import { ContentSectionForm } from "@/components/admin/ContentSectionForm";

interface ContentSectionDto {
  sectionKey: string;
  dataJson: string;
  version?: number;
  updatedAt?: string;
}

export default function AdminContentPage() {
  const router = useRouter();
  const [sectionsMap, setSectionsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSections() {
      try {
        const res = await adminFetch("/api/admin/content-sections");
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
        const items = unwrapPage<ContentSectionDto>(body);
        if (!cancelled) {
          const map: Record<string, string> = {};
          for (const item of items) {
            map[item.sectionKey] = item.dataJson;
          }
          setSectionsMap(map);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Cannot reach the server.");
          setLoading(false);
        }
      }
    }

    loadSections();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSave = async (key: SectionKey, dataJson: string) => {
    const res = await adminFetch(`/api/admin/content-sections/${key}`, {
      method: "PUT",
      body: JSON.stringify({ dataJson }),
    });

    if (res.status === 401) {
      router.push("/admin/login");
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      throw new Error(`Request failed (${res.status})`);
    }

    setSectionsMap((prev) => ({ ...prev, [key]: dataJson }));
  };

  if (error) return <p className="text-red-600">{error}</p>;
  if (loading) return <p>Loading…</p>;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Quản lý nội dung</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Chỉnh sửa nội dung hiển thị trên trang chủ cho từng phần.
        </p>
      </div>

      <div className="space-y-6">
        {SECTION_KEYS.map((key) => (
          <section
            key={key}
            className="border rounded-lg p-6 bg-white shadow-sm space-y-4"
          >
            <h2 className="text-lg font-semibold text-neutral-800 border-b pb-2">
              {SECTION_TITLES[key]}
            </h2>
            <ContentSectionForm
              sectionKey={key}
              dataJson={sectionsMap[key] ?? ""}
              onSave={handleSave}
            />
          </section>
        ))}
      </div>
    </div>
  );
}
