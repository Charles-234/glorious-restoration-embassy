export type CmsKind = "sermon" | "event" | "announcement" | "gallery" | "setting";
export type CmsFieldType = "text" | "textarea" | "date" | "url" | "image" | "checkbox";

export type CmsField = {
  name: string;
  label: string;
  type: CmsFieldType;
  required?: boolean;
};

export type CmsCollection = {
  kind: CmsKind;
  label: string;
  fields: CmsField[];
};

export const settingFields: Record<string, CmsField[]> = {
  hero: [
    { name: "title", label: "Main heading", type: "text", required: true },
    { name: "subtitle", label: "Subtitle", type: "textarea", required: true },
    { name: "ctaPrimary", label: "Primary button", type: "text", required: true },
    { name: "ctaSecondary", label: "Secondary button", type: "text", required: true },
  ],
  pastor: [
    { name: "name", label: "Pastor name", type: "text", required: true },
    { name: "title", label: "Pastor title", type: "text" },
    { name: "bio", label: "Biography", type: "textarea", required: true },
    { name: "image", label: "Portrait image URL", type: "image", required: true },
    { name: "email", label: "Contact email", type: "text" },
  ],
  donation: [
    { name: "title", label: "Giving heading", type: "text", required: true },
    { name: "description", label: "Giving description", type: "textarea", required: true },
    { name: "cta", label: "Button label", type: "text", required: true },
  ],
};

export const cmsCollections: CmsCollection[] = [
  {
    kind: "sermon",
    label: "Sermons",
    fields: [
      { name: "speaker", label: "Speaker", type: "text", required: true },
      { name: "date", label: "Date preached", type: "date", required: true },
      { name: "summary", label: "Summary", type: "textarea", required: true },
      { name: "thumbnail", label: "Thumbnail URL", type: "image" },
      { name: "videoUrl", label: "Video URL", type: "url" },
    ],
  },
  {
    kind: "event",
    label: "Events",
    fields: [
      { name: "date", label: "Event date", type: "date", required: true },
      { name: "venue", label: "Venue", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", required: true },
      { name: "badge", label: "Category label", type: "text", required: true },
      { name: "image", label: "Event image URL", type: "image" },
    ],
  },
  {
    kind: "announcement",
    label: "Announcements",
    fields: [
      { name: "date", label: "Date posted", type: "date", required: true },
      { name: "body", label: "Announcement", type: "textarea", required: true },
      { name: "active", label: "Show announcement", type: "checkbox" },
    ],
  },
  {
    kind: "gallery",
    label: "Gallery",
    fields: [
      { name: "image", label: "Photo", type: "image", required: true },
      { name: "date", label: "Date taken", type: "date" },
    ],
  },
  {
    kind: "setting",
    label: "Site settings",
    fields: [],
  },
];
