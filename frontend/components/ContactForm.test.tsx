// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { ContactForm } from "./ContactForm";
import * as leadClient from "@/lib/leadClient";

describe("ContactForm", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

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

  it("re-enables submit button with default text and shows an alert when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    render(<ContactForm />);
    fireEvent.change(screen.getByLabelText("Họ tên"), { target: { value: "An" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "an@example.com" } });
    fireEvent.change(screen.getByLabelText("Nội dung"), { target: { value: "Xin chào" } });
    fireEvent.click(screen.getByRole("button", { name: "Gửi yêu cầu tư vấn" }));

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert.textContent?.trim().length).toBeGreaterThan(0);
    });
    const submitButton = screen.getByRole("button", { name: "Gửi yêu cầu tư vấn" });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();
  });
});
