"use client";

import { useAdminResource } from "./useAdminResource";

type Summary = {
  totalViews: number;
  totalClicks: number;
  topTemplates: { templateId: number; clickCount: number }[];
};

const parseSummary = (body: unknown) => body as Summary;

export default function AdminDashboardPage() {
  const { data, error } = useAdminResource<Summary>("/api/admin/analytics/summary", parseSummary);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p>Loading…</p>;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="border rounded p-4">
        <div className="text-sm text-gray-500">Total views</div>
        <div className="text-2xl">{data.totalViews}</div>
      </div>
      <div className="border rounded p-4">
        <div className="text-sm text-gray-500">Total clicks</div>
        <div className="text-2xl">{data.totalClicks}</div>
      </div>
      <div className="border rounded p-4 col-span-3">
        <div className="text-sm text-gray-500 mb-2">Top templates</div>
        <ul>
          {data.topTemplates.map((t) => (
            <li key={t.templateId}>
              Template #{t.templateId}: {t.clickCount} clicks
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
