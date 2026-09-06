const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** WhatsApp and SMS providers require E.164 (e.g. +8801712345678). */
export function isValidPhone(value: string): boolean {
  return E164_PATTERN.test(value.replace(/[\s()-]/g, ""));
}

export function passwordIssues(value: string): string[] {
  const issues: string[] = [];
  if (value.length < 8) issues.push("Must be at least 8 characters.");
  if (!/[A-Z]/.test(value)) issues.push("Must include an uppercase letter.");
  if (!/[0-9]/.test(value)) issues.push("Must include a number.");
  return issues;
}

/** Extracts `{{variable}}` placeholders used by campaign and message templates. */
export function extractTemplateVariables(body: string): string[] {
  const matches = body.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g);
  return [...new Set([...matches].map((m) => m[1]))];
}
