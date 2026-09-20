"use client";

import React, { useEffect } from "react";
import type { Template } from "@/lib/apiClient";
import { trackEvent } from "@/lib/apiClient";
import { getSessionId } from "@/lib/session";

export interface TemplatePreviewModalProps {
  template: Template;
  onClose: () => void;
}

export function TemplatePreviewModal({
  template,
  onClose,
}: TemplatePreviewModalProps) {
  // Decision (k): subdomain must never be interpolated anywhere a scheme could be injected
  const sanitizedSubdomain = encodeURIComponent(template.subdomain.trim());
  const demoUrl = `https://${sanitizedSubdomain}.portfolio.com`;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleOpenFullDemo() {
    const sessionId = getSessionId();
    if (sessionId) {
      trackEvent({
        eventType: "DEMO_OPEN",
        templateId: template.id,
        sessionId,
      });
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${template.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h2 className="text-xl font-bold text-white">{template.name}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {demoUrl}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpenFullDemo}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
            >
              Open full demo
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview modal"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Iframe preview container */}
        <div className="flex-1 w-full bg-slate-950 relative">
          {/*
            Decision (k) Sandbox tokens:
            - allow-scripts: Required for interactive elements and animations within the template demo.
            - allow-same-origin: Allows the embedded template to maintain its document origin context for relative asset fetching.
            Deliberately omitted tokens:
            - allow-top-navigation: Prevents the iframe demo from navigating or redirecting the parent portfolio window.
            - allow-forms / allow-popups / allow-modals: Prevents unauthorized form submissions, popup windows, or modal hijacking escaping the sandbox.
          */}
          <iframe
            src={demoUrl}
            title={`Preview of ${template.name}`}
            sandbox="allow-scripts allow-same-origin"
            referrerPolicy="no-referrer"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
