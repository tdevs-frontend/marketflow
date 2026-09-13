import { VARIABLE_SOURCES } from "@/constants/automation";
import { EMAIL_TEMPLATES } from "@/lib/email-fixtures";
import { TEMPLATES as WHATSAPP_TEMPLATES } from "@/lib/whatsapp-fixtures";
import type { VariableBinding, WorkflowNode } from "@/types/workflow";

/**
 * Which `{{tokens}}` a node has to fill, and which it actually fills.
 *
 * Kept apart from the inspector because two other things ask the same
 * question: the validator, which blocks publishing on an unmapped token, and
 * the test run, which shows the sample value a token resolves to. A message
 * that goes out reading "Hi {{first_name}}" is the most visible failure this
 * module can produce, and it is entirely preventable before publish.
 */

const TOKEN = /\{\{\s*([a-z0-9_.]+)\s*\}\}/gi;

/** Every token in a string, de-duplicated and in order of first appearance. */
export function tokensIn(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(TOKEN)) found.add(match[1]);
  return [...found];
}

/**
 * The tokens a node's chosen message contains.
 *
 * Read off the message template rather than typed by the author: WhatsApp
 * templates are approved by Meta with their variables baked in, so the list is
 * a fact about the template, not a preference.
 */
export function requiredTokens(node: WorkflowNode): string[] {
  if (node.kind === "send_whatsapp") {
    const name = node.config.template;
    const template = WHATSAPP_TEMPLATES.find((item) => item.name === name);
    return template?.variables ?? [];
  }

  if (node.kind === "send_email") {
    const template = EMAIL_TEMPLATES.find((item) => item.id === node.config.template);
    if (!template) return [];
    const body = [
      template.subject,
      template.previewText ?? "",
      ...template.blocks.map((block) => block.content ?? ""),
    ].join(" ");
    return tokensIn(body);
  }

  if (node.kind === "send_sms") {
    return tokensIn(String(node.config.body ?? ""));
  }

  return [];
}

/** The bindings stored on a node, in the shape the inspector edits them. */
export function bindingsOf(node: WorkflowNode): Record<string, VariableBinding> {
  const raw = node.config.variables;
  return raw && typeof raw === "object"
    ? (raw as Record<string, VariableBinding>)
    : {};
}

/** Tokens the message needs that nothing has been bound to. */
export function missingTokens(node: WorkflowNode): string[] {
  const bound = bindingsOf(node);
  return requiredTokens(node).filter((token) => !bound[token]?.path);
}

/**
 * A sensible first guess for a token.
 *
 * `{{first_name}}` almost always means the contact's first name, and asking
 * somebody to say so by hand for every message is the kind of busywork that
 * makes people skip the mapping step entirely. The guess is a default, not a
 * decision — every row stays editable.
 */
export function guessBinding(token: string): VariableBinding {
  const normalised = token.toLowerCase();

  for (const source of VARIABLE_SOURCES) {
    const match = source.paths.find(
      (path) =>
        path.path === normalised ||
        path.path.endsWith(`.${normalised}`) ||
        normalised.includes(path.path),
    );

    if (match) {
      return {
        token,
        source: source.key,
        path: match.path,
        label: `${source.label} · ${match.label}`,
        sample: match.sample,
      };
    }
  }

  return { token, source: "contact", path: "", label: "Not mapped" };
}
