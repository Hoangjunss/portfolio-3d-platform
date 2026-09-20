"use client";

import { useAdminResource } from "../useAdminResource";
import { unwrapPage } from "@/lib/adminApiClient";
import type { Template } from "@/lib/apiClient";

const parseTemplates = (body: unknown) => unwrapPage<Template>(body);

export default function AdminTemplatesPage() {
  const { data, error } = useAdminResource<Template[]>("/api/admin/templates", parseTemplates);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p>Loading…</p>;

  return (
    <table className="w-full text-left">
      <thead>
        <tr><th>Name</th><th>Slug</th><th>Subdomain</th><th>Order</th><th>Status</th><th>Views</th></tr>
      </thead>
      <tbody>
        {data.map((t) => (
          <tr key={t.id}>
            <td>{t.name}</td>
            <td>{t.slug}</td>
            <td>{t.subdomain}</td>
            <td>{t.displayOrder}</td>
            {/* Decision (f): deactivate writes audit action "DELETE", but the row is soft-deleted,
                not gone. Showing "Deleted" here would misdescribe a reversible state. */}
            <td>{t.active ? "Active" : "Inactive"}</td>
            <td>{t.viewCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
