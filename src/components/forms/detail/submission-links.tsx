"use client";

import { useState } from "react";

import { TagPicker } from "@/components/marketing-hub/campaign/shared";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { APP_ROUTES } from "@/constants/app";
import { OWNERS, TAG_NAMES, ownerName } from "@/lib/customer-fixtures";
import {
  addSubmissionTags,
  assignLead,
  linkContact,
  linkLead,
  type ResolvedContact,
  type ResolvedLead,
} from "@/lib/form-store";

/**
 * The CRM actions a submission offers, in one place.
 *
 * The table's row menu and the submission drawer both call these, so "Create
 * contact" means the same thing from both: match first, create only when
 * nothing matches, and say which happened.
 */

/** Where a contact opens in Customers. The list is searched by email or phone. */
export const contactHref = (contact: ResolvedContact) =>
  `${APP_ROUTES.contacts}?q=${encodeURIComponent(contact.email ?? contact.phone ?? contact.name)}`;

/** Where a lead opens on the pipeline board, found by its title. */
export const leadHref = (lead: ResolvedLead) =>
  `${APP_ROUTES.leads}?q=${encodeURIComponent(lead.title)}`;

export function useSubmissionActions() {
  const toast = useToast();

  return {
    createContact(submissionId: string, name: string) {
      const result = linkContact(submissionId);
      if (result.outcome === "missing-identity") {
        toast("This submission has no email or phone to match or create a contact from.", "error");
      } else if (result.outcome === "matched") {
        toast(
          result.session
            ? `Linked to the contact already created for ${name} - no duplicate made`
            : `${name} is already in Customers - linked to the existing contact`,
          "success",
        );
      } else {
        toast(`Contact created for ${name}`, "success");
      }
    },
    createLead(submissionId: string) {
      const result = linkLead(submissionId);
      if (result.outcome === "no-contact") {
        toast("Link a contact first - a lead always belongs to a contact.", "error");
      } else if (result.outcome === "existing") {
        toast("This contact already has an open lead - linked to it instead", "success");
      } else {
        toast("Lead created", "success");
      }
    },
  };
}

export function AddTagDialog({
  submissionId,
  existing,
  onClose,
}: {
  submissionId: string | null;
  existing: string[];
  onClose: () => void;
}) {
  const toast = useToast();
  const [picked, setPicked] = useState<string[]>([]);

  const close = () => {
    setPicked([]);
    onClose();
  };

  return (
    <Dialog
      open={Boolean(submissionId)}
      onClose={close}
      title="Add tags"
      description="From Customers → Tags. Applied to the contact this submission is linked to."
      footer={
        <>
          <Button variant="cancel" size="compact" onClick={close}>
            Cancel
          </Button>
          <Button
            size="compact"
            disabled={picked.length === 0}
            onClick={() => {
              if (!submissionId) return;
              addSubmissionTags(submissionId, picked);
              toast(`${picked.join(", ")} added`, "success");
              close();
            }}
          >
            Add {picked.length || ""} tag{picked.length === 1 ? "" : "s"}
          </Button>
        </>
      }
    >
      <TagPicker
        options={TAG_NAMES.filter((name) => !existing.includes(name))}
        selected={picked}
        onChange={setPicked}
      />
    </Dialog>
  );
}

export function AssignLeadDialog({
  lead,
  onClose,
}: {
  lead: ResolvedLead | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const [owner, setOwner] = useState<string | null>(null);
  const value = owner ?? lead?.ownerId ?? OWNERS[0]?.id ?? "";

  const close = () => {
    setOwner(null);
    onClose();
  };

  return (
    <Dialog
      open={Boolean(lead)}
      onClose={close}
      title="Assign lead"
      description={lead?.title}
      footer={
        <>
          <Button variant="cancel" size="compact" onClick={close}>
            Cancel
          </Button>
          <Button
            size="compact"
            onClick={() => {
              if (!lead) return;
              assignLead(lead.id, value);
              toast(`${lead.title} assigned to ${ownerName(value)}`, "success");
              close();
            }}
          >
            Assign
          </Button>
        </>
      }
    >
      <Field
        label="Owner"
        htmlFor="assign-owner"
        hint={lead?.ownerId ? `Currently ${ownerName(lead.ownerId)}.` : "Currently unassigned."}
      >
        <Select
          id="assign-owner"
          label="Owner"
          hideLabel={false}
          value={value}
          onChange={setOwner}
          options={OWNERS.map((item) => ({ value: item.id, label: item.name }))}
        />
      </Field>
    </Dialog>
  );
}
