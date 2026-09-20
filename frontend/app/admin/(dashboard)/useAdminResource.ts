"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/adminApiClient";

type State<T> = { data: T | null; error: string | null };

// Decision (c): a non-OK body must never reach state. Feeding an ApiErrorDto into a list and
// then calling .map on it is how a routine expired session turns into a blank page.
export function useAdminResource<T>(path: string, parse: (body: unknown) => T): State<T> {
  const router = useRouter();
  const [state, setState] = useState<State<T>>({ data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    adminFetch(path)
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setState({ data: null, error: `Request failed (${res.status})` });
          return;
        }
        const parsed = parse(await res.json());
        if (!cancelled) setState({ data: parsed, error: null });
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, error: "Cannot reach the server." });
      });
    return () => {
      cancelled = true;
    };
  }, [path, parse, router]);

  return state;
}
