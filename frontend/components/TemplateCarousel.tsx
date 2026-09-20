"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Template } from "@/lib/apiClient";
import { trackEvent } from "@/lib/apiClient";
import { isWebGLAvailable } from "@/lib/webgl";
import { getSessionId } from "@/lib/session";
import { TemplateCarousel2D } from "./TemplateCarousel2D";
import { TemplatePreviewModal } from "./TemplatePreviewModal";

const TemplateCarousel3D = dynamic(
  () => import("./TemplateCarousel3D").then((mod) => mod.TemplateCarousel3D),
  { ssr: false }
);

export interface TemplateCarouselProps {
  templates: Template[];
}

export function TemplateCarousel({ templates }: TemplateCarouselProps) {
  // Decision (h): 2D carousel is rendered on server as default floor;
  // 3D is a client upgrade when WebGL probe succeeds.
  const [is3D, setIs3D] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const hasFiredPageView = useRef(false);

  useEffect(() => {
    // Decision (f) & (g): Get client-persisted sessionId and fire exactly one PAGE_VIEW per session mount
    if (!hasFiredPageView.current) {
      hasFiredPageView.current = true;
      const sessionId = getSessionId();
      if (sessionId) {
        trackEvent({
          eventType: "PAGE_VIEW",
          sessionId,
        });
      }
    }

    if (isWebGLAvailable()) {
      setIs3D(true);
    }
  }, []);

  function handleSelect(template: Template) {
    const sessionId = getSessionId();
    if (sessionId) {
      trackEvent({
        eventType: "TEMPLATE_CLICK",
        templateId: template.id,
        sessionId,
      });
    }
    setSelectedTemplate(template);
  }

  return (
    <>
      {is3D ? (
        <TemplateCarousel3D templates={templates} onSelect={handleSelect} />
      ) : (
        <TemplateCarousel2D templates={templates} onSelect={handleSelect} />
      )}
      {selectedTemplate && (
        <TemplatePreviewModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </>
  );
}
