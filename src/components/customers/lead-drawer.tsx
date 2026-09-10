"use client";

import { useState } from "react";
import {
  CalendarClock,
  CircleCheck,
  CircleX,
  MessageCircle,
  Plus,
  Trash2,
} from "lucide-react";

import { Avatar, AvatarLabel } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Drawer } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TabCount, TabPanel, Tabs, type TabItem } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import {
  FIXTURE_NOW,
  PIPELINE_STAGES,
  activityForContact,
  contactById,
  contactName,
  notesForLead,
  ownerName,
  stageLabel,
  tasksForLead,
  type PipelineLead,
} from "@/lib/customer-fixtures";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/format";
import type { LeadStage } from "@/types/lead";
import { cn } from "@/lib/utils";
import {
  ActivityTimeline,
  DrawerFact,
  DrawerSection,
} from "./activity-timeline";
import { SourceBadge, StageBadge, TagBadge } from "./customer-badges";

const ID_BASE = "lead-drawer";

type Tab = "overview" | "activity" | "notes" | "tasks";

interface DrawerNote {
  id: string;
  body: string;
  at: string;
  authorId?: string;
}

/**
 * One lead, opened from its card or its row.
 *
 * The stage selector lives on Overview rather than in the footer because
 * moving a lead is the most common thing done here and it is not a commitment
 * — Won, Lost and Delete are, so they sit in the footer.
 *
 * The Activity tab shows the contact's history, not the deal's. A deal's
 * history is the history of talking to the person, and splitting them means
 * the drawer shows "Proposal sent" but not the WhatsApp reply that prompted
 * it. Notes and Tasks belong to the deal itself, which is why they are
 * separate tabs rather than more rows on the same timeline.
 */
export function LeadDrawer({
  lead,
  onClose,
  onStageChange,
  onWon,
  onLost,
  onDelete,
}: {
  lead: PipelineLead | null;
  onClose: () => void;
  onStageChange: (lead: PipelineLead, stage: LeadStage) => void;
  onWon: (lead: PipelineLead) => void;
  onLost: (lead: PipelineLead) => void;
  onDelete: (lead: PipelineLead) => void;
}) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [confirmDelete, setConfirmDelete] = useState(false);

  /* Notes and task completions added in this session, so both tabs react to
     the user's own actions before there is an API to persist them. */
  const [draft, setDraft] = useState("");
  const [added, setAdded] = useState<DrawerNote[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [newTask, setNewTask] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [addedTasks, setAddedTasks] = useState<
    { id: string; title: string; dueAt: string }[]
  >([]);

  /* Reset per lead, during render rather than in an effect — the house
     convention, so the drawer never paints one deal's notes under another's
     name. */
  const [subject, setSubject] = useState(lead?.id ?? null);
  if ((lead?.id ?? null) !== subject) {
    setSubject(lead?.id ?? null);
    setTab("overview");
    setDraft("");
    setAdded([]);
    setChecked({});
    setNewTask("");
    setNewTaskDue("");
    setAddedTasks([]);
  }

  const contact = lead ? contactById(lead.contactId) : undefined;
  const activity = lead ? activityForContact(lead.contactId) : [];

  const notes: DrawerNote[] = lead ? [...added, ...notesForLead(lead.id)] : [];

  const tasks = lead
    ? [
        ...tasksForLead(lead.id),
        ...addedTasks.map((item) => ({
          id: item.id,
          leadId: lead.id,
          title: item.title,
          dueAt: item.dueAt,
          ownerId: lead.ownerId,
          done: false,
        })),
      ]
    : [];
  const openTasks = tasks.filter((item) => !(checked[item.id] ?? item.done));

  const tabs: TabItem<Tab>[] = [
    { value: "overview", label: "Overview" },
    {
      value: "activity",
      label: "Activity",
      badge: activity.length ? <TabCount value={activity.length} /> : undefined,
    },
    {
      value: "notes",
      label: "Notes",
      badge: notes.length ? <TabCount value={notes.length} /> : undefined,
    },
    {
      value: "tasks",
      label: "Tasks",
      badge: openTasks.length ? (
        <TabCount value={openTasks.length} />
      ) : undefined,
    },
  ];

  function addNote() {
    const body = draft.trim();
    if (!body) return;
    setAdded((prev) => [
      {
        id: `lnote-new-${prev.length + 1}`,
        body,
        at: new Date().toISOString(),
        authorId: lead?.ownerId,
      },
      ...prev,
    ]);
    setDraft("");
    toast("Note added", "success");
  }

  function addTask() {
    const title = newTask.trim();
    if (!title) return;
    setAddedTasks((prev) => [
      ...prev,
      {
        id: `ltask-new-${prev.length + 1}`,
        title,
        dueAt: newTaskDue
          ? `${newTaskDue}T09:00:00Z`
          : new Date().toISOString(),
      },
    ]);
    setNewTask("");
    setNewTaskDue("");
    toast("Task added", "success");
  }

  return (
    <>
      <Drawer
        open={Boolean(lead)}
        onClose={onClose}
        title={lead?.title ?? "Lead"}
        description={contact ? contactName(contact) : undefined}
        footer={
          lead ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => onWon(lead)}
                disabled={lead.stage === "won"}
              >
                <CircleCheck className="size-4" />
                Mark won
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onLost(lead)}
                disabled={lead.stage === "lost"}
              >
                <CircleX className="size-4" />
                Mark lost
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
                className="ml-auto text-error hover:bg-error-soft"
              >
                <Trash2 className="size-4" />
                Delete
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

            <Tabs
              tabs={tabs}
              value={tab}
              onChange={setTab}
              label="Lead details"
              idBase={ID_BASE}
            />

            {tab === "overview" ? (
              <TabPanel idBase={ID_BASE} value="overview" className="space-y-4">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-panel bg-surface-secondary p-3.5">
                  <DrawerFact
                    label="Stage"
                    value={
                      <StageBadge
                        stage={lead.stage}
                        label={stageLabel(lead.stage)}
                      />
                    }
                  />
                  <DrawerFact
                    label="Probability"
                    value={`${lead.probability}%`}
                    strong
                  />
                  <DrawerFact
                    label="Lead score"
                    value={String(lead.score)}
                    strong
                  />
                  <DrawerFact label="Owner" value={ownerName(lead.ownerId)} />
                  <DrawerFact
                    label="Source"
                    value={<SourceBadge source={lead.source} />}
                  />
                  <DrawerFact
                    label="Expected close"
                    value={
                      lead.expectedCloseDate
                        ? formatDate(lead.expectedCloseDate)
                        : "—"
                    }
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

                <DrawerSection title="Next steps">
                  {openTasks.length ? (
                    <ul className="space-y-1.5">
                      {openTasks.slice(0, 3).map((task) => (
                        <li
                          key={task.id}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="truncate text-text-secondary">
                            {task.title}
                          </span>
                          <span className="shrink-0 text-text-muted tabular-nums">
                            {formatDate(task.dueAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-text-muted">
                      No open tasks. Add one on the Tasks tab.
                    </p>
                  )}
                </DrawerSection>

                <DrawerSection title="Timeline">
                  <p className="text-xs text-text-muted">
                    Created {formatDate(lead.createdAt)} · last activity{" "}
                    {formatRelativeTime(lead.lastActivityAt)}
                  </p>
                </DrawerSection>
              </TabPanel>
            ) : null}

            {tab === "activity" ? (
              <TabPanel idBase={ID_BASE} value="activity">
                <DrawerSection
                  title="Activity"
                  action={
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        toast("Composer arrives with the API", "info")
                      }
                    >
                      <MessageCircle className="size-4" />
                      Message
                    </Button>
                  }
                >
                  <ActivityTimeline
                    entries={activity}
                    emptyDescription="Messages, stage changes and notes on this deal will appear here."
                  />
                </DrawerSection>
              </TabPanel>
            ) : null}

            {tab === "notes" ? (
              <TabPanel idBase={ID_BASE} value="notes" className="space-y-4">
                <Field label="Add a note" htmlFor="lead-note">
                  <Textarea
                    id="lead-note"
                    rows={3}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="What was discussed, and what happens next."
                  />
                </Field>
                <Button size="sm" onClick={addNote} disabled={!draft.trim()}>
                  <Plus className="size-4" />
                  Add note
                </Button>

                {notes.length ? (
                  <ul className="space-y-2.5">
                    {notes.map((note) => (
                      <li
                        key={note.id}
                        className="rounded-panel border border-border p-3"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar name={ownerName(note.authorId)} size="xs" />
                          <p className="text-xs font-medium text-text-primary">
                            {ownerName(note.authorId)}
                          </p>
                          <p className="ml-auto text-[11px] text-text-muted">
                            {formatRelativeTime(note.at)}
                          </p>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                          {note.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    title="No notes yet"
                    description="Notes are private to your team and stay with the deal."
                  />
                )}
              </TabPanel>
            ) : null}

            {tab === "tasks" ? (
              <TabPanel idBase={ID_BASE} value="tasks" className="space-y-4">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-40 flex-1">
                    <Field label="Task" htmlFor="lead-task">
                      <Input
                        id="lead-task"
                        value={newTask}
                        onChange={(event) => setNewTask(event.target.value)}
                        placeholder="Send the revised quote"
                      />
                    </Field>
                  </div>
                  <Field label="Due" htmlFor="lead-task-due">
                    <Input
                      id="lead-task-due"
                      type="date"
                      value={newTaskDue}
                      onChange={(event) => setNewTaskDue(event.target.value)}
                    />
                  </Field>
                  <Button
                    size="compact"
                    onClick={addTask}
                    disabled={!newTask.trim()}
                  >
                    <Plus className="size-4" />
                    Add
                  </Button>
                </div>

                {tasks.length ? (
                  <ul className="space-y-1">
                    {tasks.map((task) => {
                      const done = checked[task.id] ?? task.done;
                      const overdue =
                        !done &&
                        new Date(task.dueAt).getTime() <
                          new Date(FIXTURE_NOW).getTime();

                      return (
                        <li
                          key={task.id}
                          className="flex items-start gap-3 rounded-panel px-1 py-2 hover:bg-surface-secondary"
                        >
                          <Checkbox
                            checked={done}
                            onCheckedChange={(next) =>
                              setChecked((prev) => ({
                                ...prev,
                                [task.id]: next,
                              }))
                            }
                            label={`Mark "${task.title}" done`}
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "text-xs font-medium",
                                done
                                  ? "text-text-muted line-through"
                                  : "text-text-primary",
                              )}
                            >
                              {task.title}
                            </p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                              <CalendarClock
                                className={cn(
                                  "size-3.5",
                                  overdue ? "text-error" : "text-text-muted",
                                )}
                                aria-hidden
                              />
                              <span
                                className={
                                  overdue
                                    ? "font-medium text-error"
                                    : "text-text-muted"
                                }
                              >
                                {overdue ? "Overdue · " : ""}
                                {formatDate(task.dueAt)}
                              </span>
                              {task.ownerId ? (
                                <span className="text-text-muted">
                                  · {ownerName(task.ownerId)}
                                </span>
                              ) : null}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <EmptyState
                    title="No tasks yet"
                    description="Add a follow-up so this deal does not go quiet."
                  />
                )}
              </TabPanel>
            ) : null}
          </div>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          if (lead) onDelete(lead);
        }}
        title="Delete this lead?"
        description="The deal and its notes and tasks are removed. The contact and their message history stay."
        confirmLabel="Delete lead"
      />
    </>
  );
}
