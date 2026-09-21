"use client";

import React, { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { Template } from "@/lib/apiClient";

export interface TemplateCarousel2DProps {
  templates: Template[];
  onSelect: (template: Template) => void;
}

export function TemplateCarousel2D({
  templates,
  onSelect,
}: TemplateCarousel2DProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: templates.length > 1,
    align: "center",
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (!templates || templates.length === 0) {
    return (
      <div className="py-16 text-center">
        <p
          className="text-lg"
          style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)" }}
        >
          Chưa có mẫu nào để hiển thị.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-6xl mx-auto px-4 py-8">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex-none w-full sm:w-1/2 lg:w-1/3 pl-4"
            >
              <div
                onClick={() => onSelect(template)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(template);
                  }
                }}
                className="group relative flex flex-col h-full rounded-[var(--radius-md)] border border-[var(--color-rule)] hover:border-[var(--color-accent)] bg-[var(--color-paper-2)] overflow-hidden cursor-pointer transition-[border-color,box-shadow] duration-[var(--dur-short)] ease-[var(--ease-out)]"
              >
                <div
                  className="relative aspect-[16/10] w-full overflow-hidden"
                  style={{ backgroundColor: "var(--color-paper)" }}
                >
                  {/* Decision (i): Null thumbnailUrl renders coloured fallback box with template name */}
                  {template.thumbnailUrl ? (
                    <img
                      src={template.thumbnailUrl}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center p-4 text-center"
                      style={{
                        background:
                          "linear-gradient(to bottom right, var(--color-paper), var(--color-paper-2))",
                      }}
                    >
                      <span
                        className="text-xs uppercase tracking-wider font-semibold mb-1"
                        style={{ fontFamily: "var(--font-wordmark)", color: "var(--color-accent)" }}
                      >
                        {template.category || "Template"}
                      </span>
                      <span
                        className="text-sm font-medium"
                        style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)" }}
                      >
                        {template.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-1 p-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3
                      className="text-lg font-semibold transition-colors group-hover:text-[var(--color-accent)]"
                      style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}
                    >
                      {template.name}
                    </h3>
                    {template.category && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full border"
                        style={{
                          fontFamily: "var(--font-wordmark)",
                          color: "var(--color-muted)",
                          borderColor: "var(--color-rule)",
                        }}
                      >
                        {template.category}
                      </span>
                    )}
                  </div>

                  {template.description && (
                    <p
                      className="text-sm line-clamp-2 mb-4"
                      style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)" }}
                    >
                      {template.description}
                    </p>
                  )}

                  {template.techTags && (
                    <div
                      className="mt-auto pt-3 flex flex-wrap gap-1 border-t"
                      style={{ borderColor: "var(--color-rule)" }}
                    >
                      {template.techTags.split(",").map((tag) => (
                        <span
                          key={tag.trim()}
                          className="text-[11px] px-2 py-0.5 rounded"
                          style={{
                            fontFamily: "var(--font-wordmark)",
                            color: "var(--color-muted)",
                            backgroundColor: "var(--color-paper)",
                          }}
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {templates.length > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Mẫu trước"
            className="p-2.5 rounded-full border border-[var(--color-rule)] hover:border-[var(--color-accent)] bg-[var(--color-paper-2)] text-[var(--color-ink)] transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)]"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Mẫu tiếp theo"
            className="p-2.5 rounded-full border border-[var(--color-rule)] hover:border-[var(--color-accent)] bg-[var(--color-paper-2)] text-[var(--color-ink)] transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)]"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
