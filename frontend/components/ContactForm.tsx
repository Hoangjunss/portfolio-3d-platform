"use client";

import { useState } from "react";
import { submitLead } from "@/lib/leadClient";

type Status = "idle" | "loading" | "success" | "error";

const ERROR_COPY: Record<string, string> = {
  "rate-limited": "Không gửi được yêu cầu. Bạn vừa gửi quá nhiều lần. Thử lại sau vài phút.",
  "server-error": "Không gửi được yêu cầu. Máy chủ không phản hồi. Thử lại sau ít phút hoặc gọi trực tiếp.",
  validation: "Không gửi được yêu cầu. Vài trường chưa hợp lệ. Kiểm tra lại email và nội dung.",
  network: "Không gửi được yêu cầu. Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.",
};

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorReason(null);
    const result = await submitLead({ name, email, phone: phone || undefined, message });
    if (result.ok) {
      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      return;
    }
    setStatus("error");
    setErrorReason(result.reason);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--space-md)]" style={{ maxWidth: "480px" }}>
      <label className="flex flex-col gap-[var(--space-2xs)]">
        <span style={{ fontFamily: "var(--font-body)", color: "var(--color-ink)" }}>Họ tên</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={status === "loading"}
          required
          className="min-h-[44px] px-[var(--space-sm)]"
          style={{ border: "1px solid var(--color-rule)", background: "var(--color-paper)", color: "var(--color-ink)" }}
        />
      </label>
      <label className="flex flex-col gap-[var(--space-2xs)]">
        <span style={{ fontFamily: "var(--font-body)", color: "var(--color-ink)" }}>Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
          required
          className="min-h-[44px] px-[var(--space-sm)]"
          style={{ border: "1px solid var(--color-rule)", background: "var(--color-paper)", color: "var(--color-ink)" }}
        />
      </label>
      <label className="flex flex-col gap-[var(--space-2xs)]">
        <span style={{ fontFamily: "var(--font-body)", color: "var(--color-ink)" }}>Số điện thoại</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={status === "loading"}
          className="min-h-[44px] px-[var(--space-sm)]"
          style={{ border: "1px solid var(--color-rule)", background: "var(--color-paper)", color: "var(--color-ink)" }}
        />
      </label>
      <label className="flex flex-col gap-[var(--space-2xs)]">
        <span style={{ fontFamily: "var(--font-body)", color: "var(--color-ink)" }}>Nội dung</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={status === "loading"}
          required
          rows={4}
          className="px-[var(--space-sm)] py-[var(--space-xs)]"
          style={{ border: "1px solid var(--color-rule)", background: "var(--color-paper)", color: "var(--color-ink)" }}
        />
      </label>

      {status === "error" && errorReason && (
        <p role="alert" style={{ color: "var(--color-accent)" }}>
          {ERROR_COPY[errorReason]}
        </p>
      )}
      {status === "success" && (
        <p style={{ color: "var(--color-muted)" }}>Đã gửi yêu cầu tư vấn. Chúng tôi sẽ liên hệ lại sớm.</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="min-h-[44px]"
        style={{
          fontFamily: "var(--font-body)",
          border: "1px solid var(--color-accent)",
          color: "var(--color-ink)",
          background: "var(--color-paper)",
        }}
      >
        {status === "loading" ? "Đang gửi…" : "Gửi yêu cầu tư vấn"}
      </button>
    </form>
  );
}
