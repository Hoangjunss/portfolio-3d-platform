"use client";

import { useAdminResource } from "../useAdminResource";
import { unwrapPage } from "@/lib/adminApiClient";

// Mirrors LeadDto. phone and message exist on the DTO but are attacker-authored free text from
// an unauthenticated public form; decision (d) keeps them off this screen.
type Lead = {
  id: number;
  name: string;
  email: string;
  status: string;
  createdAt: string;
};

const parseLeads = (body: unknown) => unwrapPage<Lead>(body);

export default function AdminLeadsPage() {
  const { data, error } = useAdminResource<Lead[]>("/api/admin/leads", parseLeads);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p>Loading…</p>;
  if (data.length === 0) return <p>No leads yet.</p>;

  return (
    <table className="w-full text-left">
      <thead>
        <tr><th>Name</th><th>Email</th><th>Status</th><th>Created</th></tr>
      </thead>
      <tbody>
        {data.map((l) => (
          <tr key={l.id}>
            {/* Decision (e): these are attacker-authored strings. React escapes text children,
                so this is safe — but never move them into dangerouslySetInnerHTML. */}
            <td>{l.name}</td>
            <td>{l.email}</td>
            <td>{l.status}</td>
            <td>{new Date(l.createdAt).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
