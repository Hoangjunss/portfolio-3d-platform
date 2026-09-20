// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MediaGrid } from "./MediaGrid";

describe("MediaGrid", () => {
  const items = [
    {
      id: 1,
      fileName: "thumb.webp",
      url: "/media/abc.webp",
      mimeType: "image/webp",
      sizeBytes: 2048,
    },
  ];

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("copies the item's URL to the clipboard on click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<MediaGrid items={items} onDelete={vi.fn()} />);

    fireEvent.click(screen.getByAltText("thumb.webp"));

    expect(writeText).toHaveBeenCalledWith("/media/abc.webp");
  });

  it("requires a second click on the delete button to confirm", () => {
    const onDelete = vi.fn();
    render(<MediaGrid items={items} onDelete={onDelete} />);

    const deleteButton = screen.getByRole("button", { name: "Xoá ảnh" });
    fireEvent.click(deleteButton);
    expect(onDelete).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Nhấn lần nữa để xoá" })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Nhấn lần nữa để xoá" })
    );
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("shows an inline error message when deletion fails", async () => {
    const onDelete = vi.fn().mockRejectedValue(new Error("Server error"));
    render(<MediaGrid items={items} onDelete={onDelete} />);

    const deleteButton = screen.getByRole("button", { name: "Xoá ảnh" });
    fireEvent.click(deleteButton);
    const confirmButton = screen.getByRole("button", {
      name: "Nhấn lần nữa để xoá",
    });
    fireEvent.click(confirmButton);

    expect(
      await screen.findByText(
        "Không xoá được ảnh. Máy chủ từ chối yêu cầu. Thử lại."
      )
    ).toBeInTheDocument();
  });

  it("shows inline confirmation after copying URL", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<MediaGrid items={items} onDelete={vi.fn()} />);

    fireEvent.click(screen.getByAltText("thumb.webp"));

    expect(await screen.findByText("Đã sao chép")).toBeInTheDocument();
  });

  it("displays file name and formatted size", () => {
    render(<MediaGrid items={items} onDelete={vi.fn()} />);
    expect(screen.getByText("thumb.webp")).toBeInTheDocument();
    expect(screen.getByText("2 KB")).toBeInTheDocument();
  });

  it("renders empty state message when there are no items", () => {
    render(<MediaGrid items={[]} onDelete={vi.fn()} />);
    expect(
      screen.getByText("Chưa có tệp phương tiện nào.")
    ).toBeInTheDocument();
  });
});
