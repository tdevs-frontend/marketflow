"use client";

import { useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { API_SCOPES } from "@/constants/integrations";
import { createApiKey } from "@/lib/integration-fixtures";
import type { ApiEnvironment, ApiKey } from "@/types/integration";
import { OneTimeSecret } from "../credential-field";

/**
 * Creating an API key.
 *
 * Two rules shape this dialog.
 *
 * Nothing is granted by default. A key that arrives pre-authorised for
 * everything is how a reporting script ends up with permission to delete
 * contacts, so the scope list starts empty and the create button stays disabled
 * until the merchant has said what this key is for. Write scopes are marked,
 * because "Contacts Write" and "Contacts Read" are one word apart on screen and
 * very far apart in consequence.
 *
 * The secret is shown once. It is generated on create and returned exactly
 * once — so the dialog does not close on save; it switches to a panel the
 * merchant has to copy from and dismiss deliberately.
 *
 * All of that state is mount-scoped: the parent renders this only while it is
 * open, so closing the dialog is what discards the plaintext key. Resetting it
 * field by field in an effect would leave the secret in state for a render.
 */

const ENVIRONMENTS: { value: ApiEnvironment; label: string }[] = [
  { value: "production", label: "Production" },
  { value: "development", label: "Development" },
];

/** Grouped in the order `API_SCOPES` declares, so read sits above its write. */
function groupScopes() {
  const groups = new Map<string, typeof API_SCOPES>();
  for (const scope of API_SCOPES) {
    groups.set(scope.group, [...(groups.get(scope.group) ?? []), scope]);
  }
  return [...groups];
}

export function CreateApiKeyDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (key: ApiKey) => void;
}) {
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState<ApiEnvironment>("development");
  const [scopes, setScopes] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const [created, setCreated] = useState<{ key: ApiKey; secret: string } | null>(null);

  const groups = useMemo(() => groupScopes(), []);

  const nameError = touched && !name.trim() ? "Name the key after what will use it." : undefined;
  const scopeError =
    touched && scopes.length === 0
      ? "Grant at least one scope — a key with none can call nothing."
      : undefined;

  const valid = Boolean(name.trim()) && scopes.length > 0;
  const writes = scopes.some(
    (key) => API_SCOPES.find((scope) => scope.key === key)?.write,
  );

  function toggle(key: string, on: boolean) {
    setScopes((current) =>
      on ? [...current, key] : current.filter((item) => item !== key),
    );
  }

  function submit() {
    setTouched(true);
    if (!valid) return;

    const result = createApiKey({ name: name.trim(), environment, scopes });
    onCreate(result.key);
    setCreated(result);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={created ? "API key created" : "Create API Key"}
      description={
        created
          ? "Copy the key now. It will not be shown again."
          : "Connect an external application to MarketFlow with a scoped key."
      }
      footer={
        created ? (
          <Button size="compact" onClick={onClose}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="outline" size="compact" onClick={onClose}>
              Cancel
            </Button>
            <Button size="compact" onClick={submit}>
              Create key
            </Button>
          </>
        )
      }
    >
      {created ? (
        <div className="space-y-4">
          <OneTimeSecret secret={created.secret} label={created.key.name} />

          <dl className="space-y-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-sm text-text-muted">Environment</dt>
              <dd className="text-sm font-medium text-text-primary capitalize">
                {created.key.environment}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="shrink-0 text-sm text-text-muted">Scopes</dt>
              <dd className="flex min-w-0 flex-wrap justify-end gap-1.5">
                {created.key.scopes.map((scope) => (
                  <Badge key={scope} size="sm" className="normal-case">
                    {scope}
                  </Badge>
                ))}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="space-y-5">
          <Field
            label="Name"
            htmlFor="api-key-name"
            hint="Shown in the key list and on every request in the log."
            error={nameError}
          >
            <Input
              id="api-key-name"
              value={name}
              error={Boolean(nameError)}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>

          <div>
            <p className="text-sm font-medium text-text-primary">Environment</p>
            <p className="mt-0.5 mb-2 text-sm text-text-muted">
              Development keys are rate limited lower and cannot touch live
              billing data.
            </p>
            <SegmentedControl
              label="Environment"
              value={environment}
              onChange={setEnvironment}
              options={ENVIRONMENTS}
            />
          </div>

          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-text-primary">Permissions</p>
              <p className="text-meta text-text-muted tabular-nums">
                {scopes.length} of {API_SCOPES.length} granted
              </p>
            </div>
            {scopeError ? (
              <p className="mt-1.5 text-sm text-error">{scopeError}</p>
            ) : (
              <p className="mt-1.5 text-sm text-text-muted">
                Grant only what this application needs. Scopes can be narrowed
                later, but widening one means issuing a new key.
              </p>
            )}

            <div className="mt-3 space-y-2.5">
              {groups.map(([group, items]) => (
                <fieldset key={group} className="rounded-panel border border-border p-3.5">
                  <legend className="sr-only">{group} permissions</legend>
                  <p className="text-sm font-semibold text-text-primary">{group}</p>

                  <div className="mt-3 space-y-2.5 border-t border-border pt-3">
                    {items.map((scope) => (
                      <CheckboxField
                        key={scope.key}
                        id={`scope-${scope.key}`}
                        checked={scopes.includes(scope.key)}
                        onCheckedChange={(on) => toggle(scope.key, on)}
                        label={scope.label}
                        hint={scope.description}
                      />
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </div>

          {writes ? (
            <p className="flex items-start gap-2.5 rounded-panel border border-warning-soft bg-warning-soft px-3.5 py-3 text-sm text-warning-text">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              This key can create, change and delete records. Keep it on a server
              — never in a browser, a mobile app or a public repository.
            </p>
          ) : null}
        </div>
      )}
    </Dialog>
  );
}
