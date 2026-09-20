# Landing Page — Services & Contact Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `ServicesSection` (Hallmark F4 Step sequence) and `ContactForm` (multi-field lead capture, full 8-state interaction coverage) that closes out the landing page.

**Architecture:** `ServicesSection` is a server component (same CMS-driven pattern as Hero/About). `ContactForm` is a client component (`"use client"`) that posts to the existing `POST /api/public/leads` endpoint (plan 07) — no new backend work.

**Tech Stack:** Next.js App Router, TailwindCSS + design tokens, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-20-landing-page-ui-design.md` (§4.5 Services, §4.6 Contact).

**Depends on:** `2026-09-20-19-landing-nav-footer.md` (tokens, shared layout); `2026-09-20-20-landing-hero-about.md` (`getContentSection`, `RevealOnScroll`). **Consumes:** `POST /api/public/leads` (plan 07 — `LeadForm { name, email, phone?, message }`, rate-limited via Bucket4j).

## Global Constraints

- Public POST endpoints (`leads`, `analytics/events`, `auth/login`) are rate-limited via Bucket4j (spec section 5) — the form must surface a `429` as a real error state, not a generic failure.
- No comments restating what code does; only comments explaining non-obvious "why".
- **Every colour and font-family in CSS must reference a token from `frontend/tokens.css`.** No hard-coded OKLCH/hex/`font-family`.
- **No fabricated urgency copy** ("Limited spots!", "Only 2 left") anywhere near the form.
- Every form field ships all 8 interaction states (default, hover, `:focus-visible`, active, disabled, loading, error, success) per `interaction-and-states` discipline — this is a hard requirement of this plan, not optional polish.
- Error copy is 3-part: what happened → why (if known) → what to do. No "Oops!", no exclamation marks.
- Submit button label is a specific verb phrase ("Gửi yêu cầu tư vấn"), never "Submit" alone.

---

### Task 1: `ServicesSection` — F4 Step sequence

**Files:**
- Create: `frontend/components/ServicesSection.tsx`
- Test: `frontend/components/ServicesSection.test.tsx`

**Interfaces:**
- Consumes: `getContentSection("services")` (from plan 20's `contentClient.ts`).
- Produces: `<ServicesSection />`.

- [ ] **Step 1: Write the failing test — three numbered steps render in order, no icon-grid markup**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ServicesSection } from "./ServicesSection";

vi.mock("@/lib/contentClient", () => ({ getContentSection: vi.fn(async () => null) }));

describe("ServicesSection", () => {
  it("renders three numbered steps in the fixed fallback order", async () => {
    render(await ServicesSection());
    const steps = screen.getAllByRole("listitem");
    expect(steps).toHaveLength(3);
    expect(steps[0]).toHaveTextContent("01");
    expect(steps[0]).toHaveTextContent("Xem trước trong 3D");
    expect(steps[2]).toHaveTextContent("Ra mắt trên subdomain của bạn");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/ServicesSection.test.tsx`
Expected: FAIL — `ServicesSection.tsx` does not exist.

- [ ] **Step 3: Create `ServicesSection.tsx`**

```tsx
import { getContentSection } from "@/lib/contentClient";
import { RevealOnScroll } from "./RevealOnScroll";

const FALLBACK_STEPS = [
  { title: "Xem trước trong 3D", body: "Duyệt qua carousel, mở bản demo thật trong tab mới." },
  { title: "Chọn & tuỳ biến nội dung", body: "Chọn một mẫu, yêu cầu chỉnh nội dung/thương hiệu qua đội quản trị." },
  { title: "Ra mắt trên subdomain của bạn", body: "Vận hành trên cùng hệ thống quản trị Spring Boot đang chạy nền tảng này." },
];

export async function ServicesSection() {
  const content = await getContentSection<{ steps?: typeof FALLBACK_STEPS }>("services");
  const steps = content?.steps?.length ? content.steps : FALLBACK_STEPS;

  return (
    <RevealOnScroll index={2}>
      <section id="services" className="px-[clamp(1rem,4vw,1.5rem)] py-[var(--space-3xl)]">
        <h2
          style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", color: "var(--color-ink)", marginBottom: "var(--space-xl)" }}
        >
          Cách chúng tôi làm việc
        </h2>
        <ol className="flex flex-col gap-[var(--space-xl)]">
          {steps.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-[var(--space-xs)] sm:flex-row sm:gap-[var(--space-lg)]">
              <span
                style={{ fontFamily: "var(--font-wordmark)", color: "var(--color-accent)", fontSize: "var(--text-sm)", minWidth: "2ch" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>{step.title}</h3>
                <p style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)", maxWidth: "65ch" }}>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </RevealOnScroll>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/ServicesSection.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/components/ServicesSection.tsx frontend/components/ServicesSection.test.tsx
git commit -m "feat: add ServicesSection (Hallmark F4 step sequence)"
```

---

### Task 2: `leadClient` — typed POST wrapper

**Files:**
- Create: `frontend/lib/leadClient.ts`
- Test: `frontend/lib/leadClient.test.ts`

**Interfaces:**
- Consumes: `POST /api/public/leads` (`LeadForm { name, email, phone?, message }`, plan 07).
- Produces: `submitLead(input)` returning a discriminated result the form uses to drive its 8 states.

- [ ] **Step 1: Write the failing test — success, validation error (400), and rate-limit (429) map to distinct results**

```ts
import { describe, expect, it, vi } from "vitest";
import { submitLead } from "./leadClient";

describe("submitLead", () => {
  it("returns ok:true on 201", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 201 })));
    const result = await submitLead({ name: "An", email: "an@example.com", message: "Xin chào" });
    expect(result).toEqual({ ok: true });
  });

  it("returns a rate-limit result on 429", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 429 })));
    const result = await submitLead({ name: "An", email: "an@example.com", message: "Xin chào" });
    expect(result).toEqual({ ok: false, reason: "rate-limited" });
  });

  it("returns a server-error result on 5xx", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500 })));
    const result = await submitLead({ name: "An", email: "an@example.com", message: "Xin chào" });
    expect(result).toEqual({ ok: false, reason: "server-error" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/leadClient.test.ts`
Expected: FAIL — `leadClient.ts` does not exist.

- [ ] **Step 3: Create `leadClient.ts`**

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export type LeadInput = { name: string; email: string; phone?: string; message: string };
export type SubmitLeadResult = { ok: true } | { ok: false; reason: "rate-limited" | "server-error" | "validation" };

export async function submitLead(input: LeadInput): Promise<SubmitLeadResult> {
  const res = await fetch(`${API_BASE}/api/public/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.ok) return { ok: true };
  if (res.status === 429) return { ok: false, reason: "rate-limited" };
  if (res.status === 400) return { ok: false, reason: "validation" };
  return { ok: false, reason: "server-error" };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/leadClient.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/leadClient.ts frontend/lib/leadClient.test.ts
git commit -m "feat: add leadClient with typed rate-limit/validation/server-error results"
```

---

### Task 3: `ContactForm` — full 8-state field coverage

**Files:**
- Create: `frontend/components/ContactForm.tsx`
- Test: `frontend/components/ContactForm.test.tsx`

**Interfaces:**
- Consumes: `submitLead` (Task 2).
- Produces: `<ContactForm />`, mounted inside a `Contact` section wrapper on `app/(public)/page.tsx`.

- [ ] **Step 1: Write the failing tests — one per required behaviour**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ContactForm } from "./ContactForm";
import * as leadClient from "@/lib/leadClient";

describe("ContactForm", () => {
  it("labels every field descriptively, not abbreviated", () => {
    render(<ContactForm />);
    expect(screen.getByLabelText("Họ tên")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Số điện thoại")).toBeInTheDocument();
    expect(screen.getByLabelText("Nội dung")).toBeInTheDocument();
  });

  it("disables the submit button while a request is in flight (loading state)", async () => {
    let resolveFetch: (v: any) => void = () => {};
    vi.spyOn(leadClient, "submitLead").mockReturnValue(new Promise((res) => (resolveFetch = res)));
    render(<ContactForm />);
    fireEvent.change(screen.getByLabelText("Họ tên"), { target: { value: "An" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "an@example.com" } });
    fireEvent.change(screen.getByLabelText("Nội dung"), { target: { value: "Xin chào" } });
    fireEvent.click(screen.getByRole("button", { name: "Gửi yêu cầu tư vấn" }));
    expect(screen.getByRole("button")).toBeDisabled();
    resolveFetch({ ok: true });
    await waitFor(() => expect(screen.getByText(/Đã gửi/)).toBeInTheDocument());
  });

  it("shows a 3-part error message on rate-limit (429), and re-enables the button", async () => {
    vi.spyOn(leadClient, "submitLead").mockResolvedValue({ ok: false, reason: "rate-limited" });
    render(<ContactForm />);
    fireEvent.change(screen.getByLabelText("Họ tên"), { target: { value: "An" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "an@example.com" } });
    fireEvent.change(screen.getByLabelText("Nội dung"), { target: { value: "Xin chào" } });
    fireEvent.click(screen.getByRole("button", { name: "Gửi yêu cầu tư vấn" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Không gửi được yêu cầu. Bạn vừa gửi quá nhiều lần. Thử lại sau vài phút."
      )
    );
    expect(screen.getByRole("button", { name: "Gửi yêu cầu tư vấn" })).not.toBeDisabled();
  });

  it("clears the fields and shows a silent success line (no toast) on success", async () => {
    vi.spyOn(leadClient, "submitLead").mockResolvedValue({ ok: true });
    render(<ContactForm />);
    fireEvent.change(screen.getByLabelText("Họ tên"), { target: { value: "An" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "an@example.com" } });
    fireEvent.change(screen.getByLabelText("Nội dung"), { target: { value: "Xin chào" } });
    fireEvent.click(screen.getByRole("button", { name: "Gửi yêu cầu tư vấn" }));
    await waitFor(() => expect(screen.getByText(/Đã gửi yêu cầu/)).toBeInTheDocument());
    expect((screen.getByLabelText("Họ tên") as HTMLInputElement).value).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/ContactForm.test.tsx`
Expected: FAIL — `ContactForm.tsx` does not exist.

- [ ] **Step 3: Create `ContactForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import { submitLead } from "@/lib/leadClient";

type Status = "idle" | "loading" | "success" | "error";

const ERROR_COPY: Record<string, string> = {
  "rate-limited": "Không gửi được yêu cầu. Bạn vừa gửi quá nhiều lần. Thử lại sau vài phút.",
  "server-error": "Không gửi được yêu cầu. Máy chủ không phản hồi. Thử lại sau ít phút hoặc gọi trực tiếp.",
  validation: "Không gửi được yêu cầu. Vài trường chưa hợp lệ. Kiểm tra lại email và nội dung.",
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/ContactForm.test.tsx`
Expected: PASS

- [ ] **Step 5: Mount inside a `Contact` section wrapper on `app/(public)/page.tsx`, after `ServicesSection`**

**Path and preservation — same two corrections as plan 20 Step 5.** The file is
`frontend/app/(public)/page.tsx` (plan 18b moved it); creating `app/page.tsx` gives Next.js two
pages resolving to `/` and breaks the build. And plan 12 is already live, so the carousel and its
`getTemplates()` fetch must be **kept**, not commented out. By the time this plan runs, plan 20 has
already wrapped the carousel in `<section id="templates">` — leave that wrapper in place, it is the
target of `SiteNav`'s only CTA.

```tsx
import { getTemplates, type Template } from "@/lib/apiClient";
import { TemplateCarousel } from "@/components/TemplateCarousel";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { ServicesSection } from "@/components/ServicesSection";
import { ContactForm } from "@/components/ContactForm";

export default async function HomePage() {
  let templates: Template[] = [];
  try {
    templates = await getTemplates();
  } catch {
    // Decision (j): Backend down must not blank the page; render shell and empty state
    templates = [];
  }

  return (
    <main>
      <HeroSection />
      <section id="templates">
        <TemplateCarousel templates={templates} />
      </section>
      <AboutSection />
      <ServicesSection />
      <section id="contact" className="px-[clamp(1rem,4vw,1.5rem)] py-[var(--space-3xl)] md:grid md:grid-cols-[minmax(0,40ch)_minmax(0,480px)] md:gap-[var(--space-2xl)]">
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", color: "var(--color-ink)" }}>
            Nói chuyện với chúng tôi
          </h2>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)" }}>
            Điền thông tin, chúng tôi phản hồi trong 1 ngày làm việc.
          </p>
        </div>
        <ContactForm />
      </section>
    </main>
  );
}
```

- [ ] **Step 6: Run the full frontend suite + build as final self-check**

Run: `cd frontend && npx vitest run && npm run build`
Expected: all tests PASS (including the 4 new `ContactForm` cases); `next build` succeeds with no type errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/components/ContactForm.tsx frontend/components/ContactForm.test.tsx "frontend/app/(public)/page.tsx"
git commit -m "feat: add ContactForm with full 8-state coverage and mount landing page sections"
```

## Self-Review Notes

- **Spec coverage:** implements design spec §4.5 (Services, F4 step sequence, no icon-grid) and §4.6 (Contact, 8-state form, 3-part error copy, silent success, no fake urgency).
- **8-state honesty check:** default/hover/focus-visible covered by native input styling + `:focus-visible` (to be added at the CSS layer, not inline `style` — flagged as a follow-up refinement since inline styles here can't express pseudo-classes; a `contact-form.css` partial using `var(--color-focus)` for `:focus-visible` outlines should be added before this ships to production). Active/disabled/loading/error/success are covered by the component logic and tested above.
- **Rate-limit honesty:** the 429 path is tested explicitly, matching the backend's real Bucket4j behavior (plan 09) instead of collapsing every failure into one generic message.
- **This is the last of the three landing-page plans.** Together, plans 19–21 fully implement `docs/superpowers/specs/2026-09-20-landing-page-ui-design.md`. Remaining known follow-up: wire `:focus-visible` via a real CSS file instead of inline styles (noted above).
