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
      <div className="py-16 text-center text-slate-400">
        <p className="text-lg">No templates available at the moment.</p>
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
                className="group relative flex flex-col h-full rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden cursor-pointer"
              >
                <div className="relative aspect-[16/10] w-full bg-slate-800 overflow-hidden">
                  {/* Decision (i): Null thumbnailUrl renders coloured fallback box with template name */}
                  {template.thumbnailUrl ? (
                    <img
                      src={template.thumbnailUrl}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 p-4 text-center">
                      <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold mb-1">
                        {template.category || "Template"}
                      </span>
                      <span className="text-sm font-medium text-slate-300">
                        {template.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col flex-1 p-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {template.name}
                    </h3>
                    {template.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        {template.category}
                      </span>
                    )}
                  </div>

                  {template.description && (
                    <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                      {template.description}
                    </p>
                  )}

                  {template.techTags && (
                    <div className="mt-auto pt-3 flex flex-wrap gap-1 border-t border-slate-800/80">
                      {template.techTags.split(",").map((tag) => (
                        <span
                          key={tag.trim()}
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/50 text-slate-400"
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
            aria-label="Previous template"
            className="p-2.5 rounded-full bg-slate-900 border border-slate-700 hover:border-indigo-500 hover:bg-slate-800 text-slate-300 hover:text-white transition-all shadow-md"
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
            aria-label="Next template"
            className="p-2.5 rounded-full bg-slate-900 border border-slate-700 hover:border-indigo-500 hover:bg-slate-800 text-slate-300 hover:text-white transition-all shadow-md"
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
