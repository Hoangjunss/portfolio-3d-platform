// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { ContentSectionForm } from "./ContentSectionForm";
import { parseSectionData, SECTION_SHAPES } from "@/lib/contentSectionShapes";

describe("ContentSectionForm", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("submits the edited headline as dataJson to onSave", () => {
    const onSave = vi.fn();
    render(<ContentSectionForm sectionKey="hero" dataJson='{"headline":"Old"}' onSave={onSave} />);

    fireEvent.change(screen.getByLabelText("Headline"), { target: { value: "New headline" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect(onSave).toHaveBeenCalledWith("hero", JSON.stringify({ headline: "New headline" }));
  });

  it("submits edited about fields to onSave", () => {
    const onSave = vi.fn();
    render(
      <ContentSectionForm
        sectionKey="about"
        dataJson='{"heading":"Old heading","caption":"Old caption","body":"Old body"}'
        onSave={onSave}
      />
    );

    fireEvent.change(screen.getByLabelText("Heading"), { target: { value: "New heading" } });
    fireEvent.change(screen.getByLabelText("Caption"), { target: { value: "New caption" } });
    fireEvent.change(screen.getByLabelText("Body"), { target: { value: "New body" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect(onSave).toHaveBeenCalledWith(
      "about",
      JSON.stringify({ heading: "New heading", caption: "New caption", body: "New body" })
    );
  });

  it("submits edited services step fields to onSave", () => {
    const onSave = vi.fn();
    render(
      <ContentSectionForm
        sectionKey="services"
        dataJson='{"steps":[{"title":"T1","description":"D1"},{"title":"T2","description":"D2"},{"title":"T3","description":"D3"}]}'
        onSave={onSave}
      />
    );

    fireEvent.change(screen.getByLabelText("Step 1 Title"), { target: { value: "Step 1 Updated" } });
    fireEvent.change(screen.getByLabelText("Step 1 Description"), { target: { value: "Desc 1 Updated" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect(onSave).toHaveBeenCalledWith(
      "services",
      JSON.stringify({
        steps: [
          { title: "Step 1 Updated", description: "Desc 1 Updated" },
          { title: "T2", description: "D2" },
          { title: "T3", description: "D3" },
        ],
      })
    );
  });

  it("submits edited contact fields to onSave", () => {
    const onSave = vi.fn();
    render(
      <ContentSectionForm
        sectionKey="contact"
        dataJson='{"heading":"Old contact","reassurance":"Old reassurance"}'
        onSave={onSave}
      />
    );

    fireEvent.change(screen.getByLabelText("Heading"), { target: { value: "New contact" } });
    fireEvent.change(screen.getByLabelText("Reassurance"), { target: { value: "New reassurance" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect(onSave).toHaveBeenCalledWith(
      "contact",
      JSON.stringify({ heading: "New contact", reassurance: "New reassurance" })
    );
  });

  it("shows inline confirmation after successful save", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ContentSectionForm sectionKey="hero" dataJson='{"headline":"Old"}' onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Đã lưu.");
    });
  });

  it("shows alert error when onSave throws an error", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("Lỗi lưu"));
    render(<ContentSectionForm sectionKey="hero" dataJson='{"headline":"Old"}' onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Lỗi lưu");
    });
  });

  it("populates fallback defaults when dataJson is empty string or invalid JSON", () => {
    const onSave = vi.fn();
    render(<ContentSectionForm sectionKey="hero" dataJson="" onSave={onSave} />);
    expect((screen.getByLabelText("Headline") as HTMLInputElement).value).toBe(
      SECTION_SHAPES.hero.defaults.headline
    );
  });
});

describe("parseSectionData", () => {
  it("parses a hero dataJson string into its typed shape", () => {
    const parsed = parseSectionData("hero", '{"headline":"See your site before you build it."}');
    expect(parsed).toEqual({ headline: "See your site before you build it." });
  });

  it("falls back to the shape's default when dataJson is missing a field", () => {
    const parsed = parseSectionData("about", "{}");
    expect(parsed).toEqual(SECTION_SHAPES.about.defaults);
  });
});
