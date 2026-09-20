import { adminFetch, unwrapPage } from "./adminApiClient";

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

export type UserPage = {
  content: User[];
  totalPages: number;
  number: number;
};

export type CreateUserInput = {
  username: string;
  email: string;
  password: string;
  role: Role;
};

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export async function listUsers(page: number = 0): Promise<UserPage> {
  const res = await adminFetch(`/api/admin/users?page=${page}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }
  const body = await res.json();
  const content = unwrapPage<User>(body);
  const totalPages =
    typeof (body as { totalPages?: unknown })?.totalPages === "number"
      ? (body as { totalPages: number }).totalPages
      : (content.length > 0 ? 1 : 0);
  const pageNumber =
    typeof (body as { number?: unknown })?.number === "number"
      ? (body as { number: number }).number
      : page;

  return {
    content,
    totalPages,
    number: pageNumber,
  };
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const res = await adminFetch("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return unwrap<User>(res);
}

export async function deactivateUser(id: number): Promise<void> {
  const res = await adminFetch(`/api/admin/users/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(body.message ?? `Request failed (${res.status})`);
  }
}
