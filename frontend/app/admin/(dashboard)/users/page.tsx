"use client";

import { useEffect, useState } from "react";
import {
  listUsers,
  createUser,
  deactivateUser,
  type User,
  type Role,
} from "@/lib/userApiClient";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "EDITOR" as Role,
  });
  const [error, setError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<User | null>(null);

  async function refresh() {
    try {
      const data = await listUsers(page);
      setUsers(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError((err as Error).message || "Cannot reach the server.");
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await listUsers(page);
        if (!cancelled) {
          setUsers(data.content);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message || "Cannot reach the server.");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createUser(form);
      setForm({ username: "", email: "", password: "", role: "EDITOR" });
      await refresh();
    } catch (err) {
      setError((err as Error).message || "Cannot reach the server.");
    }
  }

  async function handleDeactivate(user: User) {
    setError(null);
    try {
      await deactivateUser(user.id);
      setConfirmTarget(null);
      await refresh();
    } catch (err) {
      setConfirmTarget(null);
      setError((err as Error).message || "Cannot reach the server.");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label htmlFor="username" className="text-sm">
            Username
          </label>
          <input
            id="username"
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="border p-2"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="email" className="text-sm">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border p-2"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="password" className="text-sm">
            Mật khẩu tạm thời
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border p-2"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="role" className="text-sm">
            Vai trò
          </label>
          <select
            id="role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            className="border p-2"
          >
            <option value="EDITOR">EDITOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-[var(--color-accent)] text-[var(--color-paper)] p-2 rounded"
        >
          Tạo tài khoản
        </button>
      </form>
      {error && (
        <p role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      )}

      <table className="w-full text-left">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Đăng nhập gần nhất</th>
            <th></th>
          </tr>
        </thead>
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
                  <button
                    type="button"
                    onClick={() => setConfirmTarget(u)}
                    className="text-red-700 underline"
                  >
                    Vô hiệu hoá
                  </button>
                )}
              </td>
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

      {confirmTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 flex items-center justify-center bg-black/40"
        >
          <div className="bg-[var(--color-paper)] p-6 rounded flex flex-col gap-4 max-w-sm">
            <p>
              Vô hiệu hoá tài khoản <strong>{confirmTarget.username}</strong>? Người
              này sẽ không thể đăng nhập nữa.
            </p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setConfirmTarget(null)}>
                Huỷ
              </button>
              <button
                type="button"
                onClick={() => handleDeactivate(confirmTarget)}
                className="bg-red-700 text-white px-3 py-1 rounded"
              >
                Vô hiệu hoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
