"use client";

import { useMemo, useState } from "react";
import { Archive, Pause, Play, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import type { SortDirection } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { FilterBar } from "@/components/commerce/filter-bar";
import {
  CAMPAIGNS,
  CAMPAIGN_STATUS_OPTIONS,
  CHANNELS,
  rateOf,
} from "@/lib/marketing-fixtures";
import type { CampaignStatus, MarketingChannel } from "@/types/marketing";
import { CampaignTable, type CampaignSortField } from "./campaign-table";

const ALL = "all";
const PER_PAGE = 8;

const SORT_OPTIONS: { value: CampaignSortField; label: string }[] = [
  { value: "createdAt", label: "Newest first" },
  { value: "name", label: "Name A–Z" },
  { value: "sent", label: "Most sent" },
  { value: "openRate", label: "Best open rate" },
];

export function CampaignsWorkspace() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<MarketingChannel | typeof ALL>(ALL);
  const [status, setStatus] = useState<CampaignStatus | typeof ALL>(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [sortField, setSortField] = useState<CampaignSortField>("createdAt");
  const [direction, setDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const activeFilters =
    (channel === ALL ? 0 : 1) +
    (status === ALL ? 0 : 1) +
    (from ? 1 : 0) +
    (to ? 1 : 0);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = CAMPAIGNS.filter((campaign) => {
      if (term && !campaign.name.toLowerCase().includes(term)) return false;
      if (channel !== ALL && campaign.channel !== channel) return false;
      if (status !== ALL && campaign.status !== status) return false;
      if (from && new Date(campaign.createdAt) < new Date(from)) return false;
      if (to && new Date(campaign.createdAt) > new Date(`${to}T23:59:59`)) return false;
      return true;
    });

    const factor = direction === "asc" ? 1 : -1;
    return rows.sort((a, b) => {
      if (sortField === "name") return a.name.localeCompare(b.name) * factor;
      if (sortField === "sent") return (a.sent - b.sent) * factor;
      if (sortField === "openRate") {
        return (
          (rateOf(a.opened, a.delivered) - rateOf(b.opened, b.delivered)) * factor
        );
      }
      return (
        (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * factor
      );
    });
  }, [search, channel, status, from, to, sortField, direction]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const pageIds = rows.map((item) => item.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const someOnPage = pageIds.some((id) => selected.includes(id));

  function resetFilters() {
    setChannel(ALL);
    setStatus(ALL);
    setFrom("");
    setTo("");
    setPage(1);
  }

  /* Bulk actions report through a toast and clear the selection, so the row
     count in the bar can never describe a selection that no longer exists. */
  function runBulk(message: string) {
    toast(message);
    setSelected([]);
  }

  return (
    <>
      <Card className="p-5">
        <FilterBar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search campaigns…"
          activeCount={activeFilters}
          onReset={resetFilters}
        >
          <Select
            label="Filter by channel"
            size="sm"
            value={channel}
            onChange={(next) => {
              setChannel(next as MarketingChannel | typeof ALL);
              setPage(1);
            }}
            options={[{ value: ALL, label: "All channels" }, ...CHANNELS]}
            className="lg:w-40"
          />

          <Select
            label="Filter by status"
            size="sm"
            value={status}
            onChange={(next) => {
              setStatus(next as CampaignStatus | typeof ALL);
              setPage(1);
            }}
            options={[{ value: ALL, label: "All statuses" }, ...CAMPAIGN_STATUS_OPTIONS]}
            className="lg:w-40"
          />

          <Select
            label="Sort campaigns"
            size="sm"
            value={sortField}
            onChange={(next) => {
              setSortField(next as CampaignSortField);
              setDirection(next === "name" ? "asc" : "desc");
            }}
            options={SORT_OPTIONS}
            className="lg:w-44"
          />

          <Input
            type="date"
            aria-label="Created from"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
            className="h-10 w-full lg:w-36"
          />
          <Input
            type="date"
            aria-label="Created to"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(1);
            }}
            className="h-10 w-full lg:w-36"
          />
        </FilterBar>

        {selected.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-panel border border-primary-border bg-primary-soft px-3.5 py-2.5">
            <p className="text-sm font-medium text-primary-dark">
              {selected.length} selected
            </p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runBulk(`${selected.length} campaigns paused`)}
              >
                <Pause aria-hidden />
                Pause
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runBulk(`${selected.length} campaigns resumed`)}
              >
                <Play aria-hidden />
                Resume
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runBulk(`${selected.length} campaigns archived`)}
              >
                <Archive aria-hidden />
                Archive
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 aria-hidden />
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
                Clear
              </Button>
            </div>
          </div>
        ) : null}

        {rows.length === 0 ? (
          <EmptyState
            title="No campaigns match those filters"
            description="Try a different search term, or clear the filters to see everything."
            action={
              <Button size="sm" variant="outline" onClick={resetFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="mt-4">
              <CampaignTable
                campaigns={rows}
                selection={{
                  selected,
                  allOnPage,
                  someOnPage,
                  onToggle: (id) =>
                    setSelected((prev) =>
                      prev.includes(id)
                        ? prev.filter((value) => value !== id)
                        : [...prev, id],
                    ),
                  onToggleAll: () =>
                    setSelected((prev) =>
                      allOnPage
                        ? prev.filter((id) => !pageIds.includes(id))
                        : [...new Set([...prev, ...pageIds])],
                    ),
                }}
                sort={{
                  field: sortField,
                  direction,
                  onSort: (field) => {
                    if (field === sortField) {
                      setDirection((value) => (value === "asc" ? "desc" : "asc"));
                    } else {
                      setSortField(field);
                      setDirection(field === "name" ? "asc" : "desc");
                    }
                  },
                }}
              />
            </div>

            <div className="mt-4">
              <Pagination
                page={current}
                totalPages={totalPages}
                total={filtered.length}
                perPage={PER_PAGE}
                onChange={setPage}
                noun="campaigns"
              />
            </div>
          </>
        )}
      </Card>

      {/* Destructive actions confirm before they run. */}
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Delete ${selected.length} campaigns?`}
        description="Their reports and history go too. This cannot be undone."
        footer={
          <>
            <Button
              variant="outline"
              size="compact"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="compact"
              onClick={() => {
                const count = selected.length;
                setConfirmDelete(false);
                runBulk(`${count} campaigns deleted`);
              }}
            >
              Delete campaigns
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Running campaigns stop immediately. Messages already sent are not
          recalled.
        </p>
      </Dialog>
    </>
  );
}
