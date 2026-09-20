# Admin User Management UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/admin/users` screen — list existing admin/editor accounts, create a new account
with a role, deactivate an account with a confirm dialog — using the `AdminUserController` API that
already exists in full (`POST` create, `GET` list, `DELETE /{id}` deactivate). No backend changes in
this plan.

**Architecture:** `adminFetch` (from plan 14) authenticates every call. `app/admin/users/page.tsx` is
a client component that fetches the paginated user list on mount and re-fetches after create/deactivate.

**Tech Stack:** Next.js App Router client components, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-19-portfolio-3d-platform-design.md` (§4 "User management:
create/deactivate admin & editor accounts, role assignment"; §5 "only ADMIN may manage users and settings").

**Depends on:** `2026-09-19-13-admin-auth-middleware.md` (JWT cookie), `2026-09-19-14-admin-dashboard-crud.md`
(`adminApiClient.ts`, `app/admin/layout.tsx` nav).

## Global Constraints

- Backend must run within `-Xmx350m` (spec section 7 RAM budget) — no unbounded in-memory collections, use pagination on list endpoints.
- All admin-mutating endpoints (`POST`/`PUT`/`DELETE` under `/api/admin/**`) require a valid JWT with role `ADMIN` or `EDITOR`; only `ADMIN` may manage users and settings.
- Every admin CREATE/UPDATE/DELETE must write an `audit_logs` row (spec section 6); every 5xx response must write a `system_error_logs` row (spec section 8).
- Public GET endpoints (`templates`, `content-sections`) are Redis-cached with cache-aside invalidation on write (spec section 5).
- Public POST endpoints (`leads`, `analytics/events`, `auth/login`) are rate-limited via Bucket4j (spec section 5).
- `analytics_events.ip_hash` stores a hash of the IP, never the raw IP (spec section 6).
- Templates are static-exported Next.js sites served by Nginx on `<slug>.portfolio.com`, no per-template runtime process (spec sections 4, 7).
- No comments restating what code does; only comments explaining non-obvious "why".
- **Package layout follows spec section 5.1 (layered), not feature packages.** Read 5.1 before creating any class.
- **Controllers never touch a Repository or a Converter.** `LayerDependencyTest` enforces this and will fail the build.
- Request bodies are `form/*Form`, response bodies and inter-layer data are `dto/*Dto` (spec 5.1). Entities live in `model/` with no suffix.
- **All CSS colour/font values reference tokens from `frontend/tokens.css` (Hallmark design, 2026-09-20) — never hard-coded hex/OKLCH/font-family in a component.**

## Confirmed backend surface (audited, not assumed)

- `POST /api/admin/users` — `UserCreateForm` in, `UserDto` out (201), throws `InvalidRequestException`
  (400) on duplicate username/email.
- `GET /api/admin/users?page=&size=` — `Page<UserDto>`.
- `DELETE /api/admin/users/{id}` — 204, deactivates (soft-delete). Guarded server-side: rejects
  deactivating yourself (`InvalidRequestException` "Cannot deactivate your own account") and rejects
  deactivating the last active `ADMIN` ("Cannot deactivate the last active admin") — **do not
  reimplement these guards client-side**, only surface the server's error message.
- `UserDto` fields: `id, username, email, role (ADMIN|EDITOR), active, lastLoginAt, createdAt, updatedAt`.
- **No backend change needed for this plan.**

---

### Task: Admin dashboard — user management screen

**Files:**
- Create: `frontend/app/admin/users/page.tsx`
- Create: `frontend/lib/userApiClient.ts`
- Test: `frontend/lib/userApiClient.test.ts`
- Modify: `frontend/app/admin/layout.tsx` — add a "Users" nav link (only `AdminUserController` is
  ADMIN-only server-side; the link is shown to everyone, the server 403s EDITOR — do not hide the
  link based on client-decoded JWT claims, that's a spoofable client check, not a security boundary).

**Interfaces:**
- Consumes: `GET/POST/DELETE /api/admin/users` (existing, this plan).
- Produces: `listUsers(page)`, `createUser(form)`, `deactivateUser(id)` — thin wrappers over `adminFetch`
  used only by this screen (not reused elsewhere, so they live in their own file rather than growing
  `adminApiClient.ts` into a god-module).

- [ ] **Step 1: Write the failing `userApiClient` test**

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { listUsers, createUser, deactivateUser } from "./userApiClient";

describe("userApiClient", () => {
  beforeEach(() => {
    vi.stubGlobal("document", { cookie: "portfolio_access_token=abc.def.ghi" });
  });

  it("listUsers calls GET /api/admin/users with the page param", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ content: [], totalPages: 0 }) })));
    await listUsers(0);
    const [url] = (fetch as any).mock.calls[0];
    expect(url).toContain("/api/admin/users?page=0");
  });

  it("createUser posts the form and returns the created UserDto", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ id: 1, username: "ed", role: "EDITOR", active: true }) })));
    const result = await createUser({ username: "ed", email: "ed@x.com", password: "pw123456", role: "EDITOR" });
    expect(result.id).toBe(1);
  });

  it("deactivateUser surfaces the server's error message on 400", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 400, json: async () => ({ message: "Cannot deactivate the last active admin" }) })));
    await expect(deactivateUser(1)).rejects.toThrow("Cannot deactivate the last active admin");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/userApiClient.test.ts`
Expected: FAIL — `userApiClient.ts` does not exist.

- [ ] **Step 3: Create `userApiClient.ts`**

```ts
import { adminFetch } from "./adminApiClient";

export type Role = "ADMIN" | "EDITOR";

export type User = {
  id: number;
  username: string;
  email: string;
  role: Role;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type UserPage = { content: User[]; totalPages: number; number: number };

export type CreateUserInput = { username: string; email: string; password: string; role: Role };

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(body.message ?? "Request failed");
  }
  return res.json();
}

export async function listUsers(page: number): Promise<UserPage> {
  const res = await adminFetch(`/api/admin/users?page=${page}`);
  return unwrap<UserPage>(res);
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const res = await adminFetch("/api/admin/users", { method: "POST", body: JSON.stringify(input) });
  return unwrap<User>(res);
}

export async function deactivateUser(id: number): Promise<void> {
  const res = await adminFetch(`/api/admin/users/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(body.message ?? "Request failed");
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/userApiClient.test.ts`
Expected: PASS

- [ ] **Step 5: Build the `/admin/users` screen**

```tsx
"use client";

import { useEffect, useState } from "react";
import { listUsers, createUser, deactivateUser, type User, type Role } from "@/lib/userApiClient";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "EDITOR" as Role });
  const [error, setError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<User | null>(null);

  async function refresh() {
    const data = await listUsers(page);
    setUsers(data.content);
    setTotalPages(data.totalPages);
  }

  useEffect(() => { refresh(); }, [page]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createUser(form);
      setForm({ username: "", email: "", password: "", role: "EDITOR" });
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDeactivate(user: User) {
    setError(null);
    try {
      await deactivateUser(user.id);
      setConfirmTarget(null);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label htmlFor="username" className="text-sm">Username</label>
          <input id="username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="border p-2" />
        </div>
        <div className="flex flex-col">
          <label htmlFor="email" className="text-sm">Email</label>
          <input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border p-2" />
        </div>
        <div className="flex flex-col">
          <label htmlFor="password" className="text-sm">Mật khẩu tạm thời</label>
          <input id="password" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="border p-2" />
        </div>
        <div className="flex flex-col">
          <label htmlFor="role" className="text-sm">Vai trò</label>
          <select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className="border p-2">
            <option value="EDITOR">EDITOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <button type="submit" className="bg-[var(--color-accent)] text-[var(--color-paper)] p-2 rounded">Tạo tài khoản</button>
      </form>
      {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}

      <table className="w-full text-left">
        <thead><tr><th>Username</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Đăng nhập gần nhất</th><th></th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.active ? "Đang hoạt động" : "Đã vô hiệu hoá"}</td>
              <td>{u.lastLoginAt ?? "—"}</td>
              <td>
                {u.active && (
                  <button type="button" onClick={() => setConfirmTarget(u)} className="text-red-700 underline">Vô hiệu hoá</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-2">
        <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Trước</button>
        <span>Trang {page + 1}/{Math.max(totalPages, 1)}</span>
        <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Sau</button>
      </div>

      {confirmTarget && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-[var(--color-paper)] p-6 rounded flex flex-col gap-4 max-w-sm">
            <p>Vô hiệu hoá tài khoản <strong>{confirmTarget.username}</strong>? Người này sẽ không thể đăng nhập nữa.</p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setConfirmTarget(null)}>Huỷ</button>
              <button type="button" onClick={() => handleDeactivate(confirmTarget)} className="bg-red-700 text-white px-3 py-1 rounded">Vô hiệu hoá</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

Note the label is **"Vô hiệu hoá"** (deactivate), never "Xoá" (delete) — the account is soft-deleted,
not removed (STATUS.md finding U-03: the backend audit action string is literally `"DELETE"` even
though this is a soft-delete; the UI must not repeat that mislabel to the admin operating it).

- [ ] **Step 6: Manually verify in a browser**

Run: `cd frontend && npm run dev`, log in as ADMIN, visit `/admin/users`. Create an EDITOR account,
confirm it appears in the list. Attempt to deactivate your own logged-in account and confirm the
server's "Cannot deactivate your own account" message surfaces in the error banner, not a generic
failure. Attempt to deactivate the only remaining active ADMIN and confirm the "last active admin"
message surfaces.

- [ ] **Step 7: Run the full test suites**

Run: `mvn -f backend/pom.xml test` — expect the existing 126 backend tests still PASS (no backend
files touched by this plan; this is a regression check).
Run: `cd frontend && npx vitest run` — expect all frontend tests, including the new
`userApiClient.test.ts`, PASS.

- [ ] **Step 8: Commit**

```bash
git add frontend/app/admin/users frontend/lib/userApiClient.ts frontend/lib/userApiClient.test.ts frontend/app/admin/layout.tsx
git commit -m "feat: add admin user management screen (create, list, deactivate)"
```

## Self-Review Notes

- **Spec coverage:** implements spec §4's "User management: create/deactivate admin & editor accounts,
  role assignment" in full. No backend gap — `AdminUserController` already covered every operation
  the spec asks for.
- **Security boundary:** the "Users" nav link is visible to any authenticated admin-area user
  (ADMIN or EDITOR); access control is enforced server-side by `AdminUserController`'s role check,
  not by hiding the link — hiding a link is UX, not a security boundary, and this plan does not
  pretend otherwise.
- **Guard reuse:** self-deactivation and last-admin guards are NOT reimplemented client-side; the
  screen only relays the server's `InvalidRequestException` message, so the single source of truth
  for that business rule stays in `UserManagementServiceImpl` (plan 10).
- **Type consistency:** `User`/`Role` local TypeScript types mirror `UserDto`/`enums.Role` exactly.
- **Next plan:** `2026-09-20-25-admin-audit-log-viewer.md`.
