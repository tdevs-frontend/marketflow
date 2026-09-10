"use client";

import {
  CalendarClock,
  CircleCheck,
  CircleX,
  MessageCircle,
  StickyNote,
} from "lucide-react";

import { AvatarLabel } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import {
  PIPELINE_STAGES,
  activityForContact,
  contactById,
  contactName,
  ownerName,
  stageLabel,
  type PipelineLead,
} from "@/lib/customer-fixtures";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/format";
import type { LeadStage } from "@/types/lead";
import { ActivityTimeline, DrawerFact, DrawerSection } from "./activity-timeline";
import { SourceBadge, StageBadge, TagBadge } from "./customer-badges";

/**
 * One lead, opened from its card.
 *
 * The stage selector is in the body rather than the footer because moving a
 * lead is the most common thing done here and it is not a destructive
 * decision — Won and Lost are, so they sit in the footer with the other
 * commitments.
 *
 * The timeline is the contact's, not the lead's. A deal's history is the
 * history of talking to the person, and splitting them means the drawer shows
 * "Proposal sent" but not the WhatsApp reply that prompted it.
 */
export function LeadDrawer({
  lead,
  onClose,
  onStageChange,
  onWon,
  onLost,
}: {
  lead: PipelineLead | null;
  onClose: () => void;
  onStageChange: (lead: PipelineLead, stage: LeadStage) => void;
  onWon: (lead: PipelineLead) => void;
  onLost: (lead: PipelineLead) => void;
}) {
  const contact = lead ? contactById(lead.contactId) : undefined;
  const activity = lead ? activityForContact(lead.contactId) : [];

  return (
    <Drawer
      open={Boolean(lead)}
      onClose={onClose}
      title={lead?.title ?? "Lead"}
      description={contact ? contactName(contact) : undefined}
      footer={
        lead ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => onWon(lead)} disabled={lead.stage === "won"}>
              <CircleCheck className="size-4" />
              Mark won
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                /* TODO: POST /leads/:id/tasks */
              }}
            >
              <CalendarClock className="size-4" />
              Schedule follow-up
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => onLost(lead)}
              disabled={lead.stage === "lost"}
            >
              <CircleX className="size-4" />
              Mark lost
            </Button>
          </div>
        ) : null
      }
    >
      {lead && contact ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <AvatarLabel
              name={contactName(contact)}
              secondary={contact.company ?? contact.email ?? undefined}
              size="lg"
            />
            <div className="shrink-0 text-right">
              <p className="text-xl leading-none font-bold text-text-primary tabular-nums">
                {formatCurrency(lead.value)}
              </p>
              <p className="mt-1 text-[11px] text-text-muted">Deal value</p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-panel bg-surface-secondary p-3.5">
            <DrawerFact
              label="Stage"
              value={<StageBadge stage={lead.stage} label={stageLabel(lead.stage)} />}
            />
            <DrawerFact label="Probability" value={`${lead.probability}%`} strong />
            <DrawerFact label="Lead score" value={String(lead.score)} strong />
            <DrawerFact label="Owner" value={ownerName(lead.ownerId)} />
            <DrawerFact label="Source" value={<SourceBadge source={lead.source} />} />
            <DrawerFact
              label="Expected close"
              value={lead.expectedCloseDate ? formatDate(lead.expectedCloseDate) : "—"}
            />
          </dl>

          <DrawerSection title="Move stage">
            <Select
              label="Move this lead to another stage"
              hideLabel
              value={lead.stage}
              onChange={(next) => onStageChange(lead, next as LeadStage)}
              options={[
                ...PIPELINE_STAGES.map((item) => ({
                  value: item.stage,
                  label: item.label,
                })),
                { value: "lost", label: "Lost" },
              ]}
            />
            {lead.lostReason ? (
              <p className="mt-2 text-xs text-text-secondary">
                Lost reason: {lead.lostReason}
              </p>
            ) : null}
          </DrawerSection>

          {lead.tags.length ? (
            <DrawerSection title="Tags">
              <div className="flex flex-wrap gap-1.5">
                {lead.tags.map((tag) => (
                  <TagBadge key={tag} name={tag} />
                ))}
              </div>
            </DrawerSection>
          ) : null}

          <DrawerSection
            title="Activity"
            action={
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    /* TODO: open the channel composer. */
                  }}
                >
                  <MessageCircle className="size-4" />
                  Message
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    /* TODO: POST /leads/:id/notes */
                  }}
                >
                  <StickyNote className="size-4" />
                  Note
                </Button>
              </div>
            }
          >
            <ActivityTimeline
              entries={activity}
              emptyDescription="Messages, stage changes and notes on this deal will appear here."
            />
          </DrawerSection>

          <DrawerSection title="Timeline">
            <p className="text-xs text-text-muted">
              Created {formatDate(lead.createdAt)} · last activity{" "}
              {formatRelativeTime(lead.lastActivityAt)}
            </p>
          </DrawerSection>
        </div>
      ) : null}
    </Drawer>
  );
}
