export type SectionKey = "hero" | "about" | "services" | "contact";

export const SECTION_KEYS: SectionKey[] = ["hero", "about", "services", "contact"];

export interface HeroSectionData {
  headline: string;
}

export interface AboutSectionData {
  heading: string;
  caption: string;
  body: string;
}

export interface ServiceStep {
  title: string;
  description: string;
}

export interface ServicesSectionData {
  steps: ServiceStep[];
}

export interface ContactSectionData {
  heading: string;
  reassurance: string;
}

export type SectionData =
  | HeroSectionData
  | AboutSectionData
  | ServicesSectionData
  | ContactSectionData;

export interface SectionShapeConfig {
  defaults: Record<string, unknown>;
  labels: Record<string, string>;
}

export const SECTION_SHAPES: Record<SectionKey, SectionShapeConfig> = {
  hero: {
    defaults: { headline: "See your site before you build it." },
    labels: { headline: "Headline" },
  },
  about: {
    defaults: {
      heading: "Một xưởng, hai mươi bản thiết kế.",
      caption: "Est. cho 20 mẫu website",
      body: "",
    },
    labels: {
      heading: "Heading",
      caption: "Caption",
      body: "Body",
    },
  },
  services: {
    defaults: {
      steps: [
        { title: "Xem trước trong 3D", description: "" },
        { title: "Chọn & tuỳ biến nội dung", description: "" },
        { title: "Ra mắt trên subdomain của bạn", description: "" },
      ],
    },
    labels: {
      title: "Title",
      description: "Description",
      step1Title: "Step 1 Title",
      step1Description: "Step 1 Description",
      step2Title: "Step 2 Title",
      step2Description: "Step 2 Description",
      step3Title: "Step 3 Title",
      step3Description: "Step 3 Description",
    },
  },
  contact: {
    defaults: {
      heading: "Liên hệ",
      reassurance: "",
    },
    labels: {
      heading: "Heading",
      reassurance: "Reassurance",
    },
  },
};

export const SECTION_FIELD_LABELS: Record<SectionKey, Record<string, string>> = {
  hero: { headline: "Headline" },
  about: { heading: "Heading", caption: "Caption", body: "Body" },
  services: {
    title: "Title",
    description: "Description",
    step1Title: "Step 1 Title",
    step1Description: "Step 1 Description",
    step2Title: "Step 2 Title",
    step2Description: "Step 2 Description",
    step3Title: "Step 3 Title",
    step3Description: "Step 3 Description",
  },
  contact: { heading: "Heading", reassurance: "Reassurance" },
};

export const SECTION_TITLES: Record<SectionKey, string> = {
  hero: "Hero",
  about: "About",
  services: "Services",
  contact: "Contact",
};

export function parseSectionData(key: SectionKey, dataJson: string): Record<string, unknown> {
  const shape = SECTION_SHAPES[key];
  if (!shape) {
    return {};
  }
  try {
    const parsed = typeof dataJson === "string" ? JSON.parse(dataJson) : dataJson;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ...shape.defaults };
    }
    if (key === "services") {
      const defaultSteps = shape.defaults.steps as ServiceStep[];
      const steps = defaultSteps.map((def, idx) => {
        const step = Array.isArray(parsed.steps) ? parsed.steps[idx] : undefined;
        if (step && typeof step === "object") {
          return {
            title: typeof step.title === "string" ? step.title : def.title,
            description:
              typeof step.description === "string" ? step.description : def.description,
          };
        }
        return { ...def };
      });
      return { ...shape.defaults, ...parsed, steps };
    }
    return { ...shape.defaults, ...parsed };
  } catch {
    return { ...shape.defaults };
  }
}
