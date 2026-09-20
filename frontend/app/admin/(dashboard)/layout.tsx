import Link from "next/link";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <nav className="w-48 border-r p-4 flex flex-col gap-2">
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/templates">Templates</Link>
        <Link href="/admin/leads">Leads</Link>
        <Link href="/admin/content">Content</Link>
        <Link href="/admin/media">Media</Link>
        <Link href="/admin/users">Users</Link>
        <Link href="/admin/audit-log">Audit log</Link>
        <Link href="/admin/errors">Error logs</Link>
      </nav>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
