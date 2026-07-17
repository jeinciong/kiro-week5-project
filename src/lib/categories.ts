export const CATEGORY_SLUGS = [
  "web-development",
  "ai-ml",
  "cloud-devops",
  "cybersecurity",
  "mobile-development",
  "data-science-analytics",
  "design-ux",
  "career-networking",
] as const;

export function formatDateTime(iso: string, timezone?: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(iso));
}
