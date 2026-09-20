"use client";

import React, { useState, useEffect } from "react";
import {
  SectionKey,
  SECTION_SHAPES,
  parseSectionData,
  ServiceStep,
} from "@/lib/contentSectionShapes";

export interface ContentSectionFormProps {
  sectionKey: SectionKey;
  dataJson: string;
  onSave: (sectionKey: SectionKey, dataJson: string) => Promise<void> | void;
}

export function ContentSectionForm({
  sectionKey,
  dataJson,
  onSave,
}: ContentSectionFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(() =>
    parseSectionData(sectionKey, dataJson)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormData(parseSectionData(sectionKey, dataJson));
  }, [sectionKey, dataJson]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (saveStatus !== "idle") setSaveStatus("idle");
  };

  const handleStepChange = (
    index: number,
    field: "title" | "description",
    value: string
  ) => {
    setFormData((prev) => {
      const currentSteps = Array.isArray(prev.steps)
        ? [...(prev.steps as ServiceStep[])]
        : [...((SECTION_SHAPES.services.defaults.steps as ServiceStep[]) || [])];
      currentSteps[index] = { ...currentSteps[index], [field]: value };
      return { ...prev, steps: currentSteps };
    });
    if (saveStatus !== "idle") setSaveStatus("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus("idle");
    setErrorMessage(null);

    const serialized = JSON.stringify(formData);
    try {
      const res = onSave(sectionKey, serialized);
      if (res instanceof Promise) {
        await res;
      }
      setSaveStatus("saved");
    } catch (err: unknown) {
      setSaveStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Không thể lưu thay đổi.");
    } finally {
      setIsSaving(false);
    }
  };

  const steps = (
    Array.isArray(formData.steps)
      ? formData.steps
      : SECTION_SHAPES.services.defaults.steps
  ) as ServiceStep[];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {sectionKey === "hero" && (
        <div>
          <label
            htmlFor="hero-headline"
            className="block text-sm font-medium mb-1"
          >
            Headline
          </label>
          <input
            id="hero-headline"
            name="headline"
            type="text"
            value={(formData.headline as string) ?? ""}
            onChange={(e) => handleFieldChange("headline", e.target.value)}
            className="w-full border rounded p-2 text-sm"
          />
        </div>
      )}

      {sectionKey === "about" && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="about-heading"
              className="block text-sm font-medium mb-1"
            >
              Heading
            </label>
            <input
              id="about-heading"
              name="heading"
              type="text"
              value={(formData.heading as string) ?? ""}
              onChange={(e) => handleFieldChange("heading", e.target.value)}
              className="w-full border rounded p-2 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="about-caption"
              className="block text-sm font-medium mb-1"
            >
              Caption
            </label>
            <input
              id="about-caption"
              name="caption"
              type="text"
              value={(formData.caption as string) ?? ""}
              onChange={(e) => handleFieldChange("caption", e.target.value)}
              className="w-full border rounded p-2 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="about-body"
              className="block text-sm font-medium mb-1"
            >
              Body
            </label>
            <textarea
              id="about-body"
              name="body"
              rows={4}
              value={(formData.body as string) ?? ""}
              onChange={(e) => handleFieldChange("body", e.target.value)}
              className="w-full border rounded p-2 text-sm"
            />
          </div>
        </div>
      )}

      {sectionKey === "services" && (
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="border rounded p-3 space-y-2 bg-neutral-50/50"
            >
              <div className="font-semibold text-xs uppercase tracking-wider text-neutral-500">
                Bước {idx + 1}
              </div>
              <div>
                <label
                  htmlFor={`services-step-${idx}-title`}
                  className="block text-sm font-medium mb-1"
                >
                  Step {idx + 1} Title
                </label>
                <input
                  id={`services-step-${idx}-title`}
                  type="text"
                  value={step?.title ?? ""}
                  onChange={(e) =>
                    handleStepChange(idx, "title", e.target.value)
                  }
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor={`services-step-${idx}-description`}
                  className="block text-sm font-medium mb-1"
                >
                  Step {idx + 1} Description
                </label>
                <textarea
                  id={`services-step-${idx}-description`}
                  rows={2}
                  value={step?.description ?? ""}
                  onChange={(e) =>
                    handleStepChange(idx, "description", e.target.value)
                  }
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {sectionKey === "contact" && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="contact-heading"
              className="block text-sm font-medium mb-1"
            >
              Heading
            </label>
            <input
              id="contact-heading"
              name="heading"
              type="text"
              value={(formData.heading as string) ?? ""}
              onChange={(e) => handleFieldChange("heading", e.target.value)}
              className="w-full border rounded p-2 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="contact-reassurance"
              className="block text-sm font-medium mb-1"
            >
              Reassurance
            </label>
            <textarea
              id="contact-reassurance"
              name="reassurance"
              rows={2}
              value={(formData.reassurance as string) ?? ""}
              onChange={(e) =>
                handleFieldChange("reassurance", e.target.value)
              }
              className="w-full border rounded p-2 text-sm"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-neutral-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors"
        >
          Lưu thay đổi
        </button>
        {saveStatus === "saved" && (
          <span role="status" className="text-sm text-green-700 font-medium">
            Đã lưu.
          </span>
        )}
        {saveStatus === "error" && (
          <span role="alert" className="text-sm text-red-600">
            {errorMessage || "Không thể lưu thay đổi."}
          </span>
        )}
      </div>
    </form>
  );
}

export default ContentSectionForm;
