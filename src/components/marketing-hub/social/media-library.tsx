"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Download,
  Film,
  FolderOpen,
  HardDrive,
  Image as ImageIcon,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/input";
import { FilterBar } from "@/components/ui/filter-bar";
import { Menu } from "@/components/ui/menu";
import { MiniStat } from "@/components/ui/stats-card";
import { ProgressBar } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { TagList } from "@/components/ui/tag";
import { useToast } from "@/components/ui/toast";
import { MEDIA_ASSETS, MEDIA_FOLDERS, MEDIA_USAGE } from "@/lib/social-fixtures";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MediaAsset, MediaType } from "@/types/social";

/**
 * The media library.
 *
 * A grid of square tiles regardless of the asset's own aspect ratio, because
 * the grid's job is *finding* a file — a wall of mixed-ratio cards is harder to
 * scan than a uniform one, and the real dimensions are on the card and in the
 * detail panel where they matter.
 *
 * Drag-and-drop is offered as a drop zone at the top rather than over the
 * whole grid: a full-surface drop target swallows clicks meant for tiles, and
 * an explicit zone is also reachable by keyboard.
 */

const ALL = "all";

/** Bytes as the unit a person would say out loud. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Total quota is fixed here; the real number comes from the plan. */
const QUOTA_BYTES = 5 * 1024 * 1024 * 1024;

export function MediaLibrary() {
  const toast = useToast();

  const [folder, setFolder] = useState("all");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<MediaType | typeof ALL>(ALL);
  const [sort, setSort] = useState<"recent" | "name" | "size" | "usage">("recent");

  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<MediaAsset | null>(null);
  const [renaming, setRenaming] = useState<MediaAsset | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MediaAsset[] | null>(null);
  const [dragging, setDragging] = useState(false);
  /* The upload destination is separate from `folder`, which is the browse
     filter — picking a destination should not navigate the library. */
  const [uploadFolder, setUploadFolder] = useState(MEDIA_FOLDERS[1].id);

  const activeFilters = type === ALL ? 0 : 1;

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return MEDIA_ASSETS.filter((asset) => {
      if (folder !== "all" && asset.folderId !== folder) return false;
      if (
        term &&
        !asset.name.toLowerCase().includes(term) &&
        !asset.tags.some((tag) => tag.toLowerCase().includes(term))
      ) {
        return false;
      }
      if (type !== ALL && asset.type !== type) return false;
      return true;
    }).sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "size") return b.size - a.size;
      if (sort === "usage") return MEDIA_USAGE[b.id] - MEDIA_USAGE[a.id];
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });
  }, [folder, search, sort, type]);

  const used = MEDIA_ASSETS.reduce((sum, asset) => sum + asset.size, 0);
  const images = MEDIA_ASSETS.filter((asset) => asset.type === "image").length;
  const videos = MEDIA_ASSETS.filter((asset) => asset.type === "video").length;

  /** Files in a folder, for the sidebar counts. */
  const folderCount = (id: string) =>
    id === "all"
      ? MEDIA_ASSETS.length
      : MEDIA_ASSETS.filter((asset) => asset.folderId === id).length;

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );

  /** Defaults the destination to the folder being browsed, where there is one. */
  function openUpload() {
    setUploadFolder(folder === "all" ? MEDIA_FOLDERS[1].id : folder);
    setUploadOpen(true);
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)]">
        {/* ------------------------------------------------------- Folders */}
        <Card className="h-max p-4 lg:sticky lg:top-22">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
              Folders
            </p>
            <button
              type="button"
              onClick={() => toast("Folder created")}
              aria-label="New folder"
              className="grid size-5 place-items-center rounded text-text-muted transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
            >
              <Plus className="size-3.5" aria-hidden />
            </button>
          </div>

          <ul className="mt-2.5 space-y-0.5">
            {MEDIA_FOLDERS.map((item) => {
              const active = item.id === folder;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setFolder(item.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-btn px-2 py-1.5 text-left text-[13px] font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                      active
                        ? "bg-primary-soft text-primary-dark"
                        : "text-text-secondary hover:bg-surface-secondary",
                    )}
                  >
                    <FolderOpen className="size-3.5 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    <span className="shrink-0 text-[11px] text-text-muted tabular-nums">
                      {folderCount(item.id)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Storage. Worth showing: a library is the first thing to fill a
              plan's quota, and the warning arrives too late otherwise. */}
          <div className="mt-4 border-t border-border pt-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
              <HardDrive className="size-3" aria-hidden />
              Storage
            </p>
            <p className="mt-2 text-[13px] font-bold text-text-primary">
              {formatBytes(used)}{" "}
              <span className="font-normal text-text-muted">
                of {formatBytes(QUOTA_BYTES)}
              </span>
            </p>
            <ProgressBar
              value={(used / QUOTA_BYTES) * 100}
              label="Storage used"
              className="mt-2"
            />

            <div className="mt-3 grid grid-cols-2 gap-2">
              <MiniStat label="Images" value={formatNumber(images)} />
              <MiniStat label="Videos" value={formatNumber(videos)} />
            </div>
          </div>
        </Card>

        {/* --------------------------------------------------------- Grid */}
        <Card className="p-5">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search name or tag…"
            activeCount={activeFilters}
            onReset={() => setType(ALL)}
            trailing={
              <Button size="compact" onClick={openUpload}>
                <Upload aria-hidden />
                Upload
              </Button>
            }
          >
            <Select
              label="Filter by type"
              size="sm"
              value={type}
              onChange={(next) => setType(next as MediaType | typeof ALL)}
              options={[
                { value: ALL, label: "All types" },
                { value: "image", label: "Images" },
                { value: "video", label: "Videos" },
              ]}
              className="lg:w-36"
            />
            <Select
              label="Sort media"
              size="sm"
              value={sort}
              onChange={setSort}
              options={[
                { value: "recent", label: "Recently added" },
                { value: "name", label: "Name A–Z" },
                { value: "size", label: "Largest first" },
                { value: "usage", label: "Most used" },
              ]}
              className="lg:w-40"
            />
          </FilterBar>

          {/* Drop zone. Its own target rather than the whole grid, so tile
              clicks are never swallowed. */}
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              toast("Upload started");
            }}
            className={cn(
              "mt-4 flex flex-wrap items-center justify-center gap-2 rounded-panel border border-dashed px-4 py-3 text-center transition-colors",
              dragging
                ? "border-primary bg-primary-soft"
                : "border-border-strong bg-surface-secondary/50",
            )}
          >
            <Upload className="size-4 text-text-muted" aria-hidden />
            <p className="text-xs text-text-secondary">
              Drop files here, or{" "}
              <button
                type="button"
                onClick={openUpload}
                className="link font-medium focus-visible:shadow-focus focus-visible:outline-none"
              >
                browse
              </button>
              . JPG, PNG, WebP and MP4 up to 100 MB.
            </p>
          </div>

          {selected.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-panel border border-primary-border bg-primary-soft px-3.5 py-2.5">
              <p className="text-sm font-medium text-primary-dark">
                {selected.length} selected
              </p>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast(`${selected.length} files downloaded`);
                    setSelected([]);
                  }}
                >
                  <Download aria-hidden />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast(`${selected.length} files moved`);
                    setSelected([]);
                  }}
                >
                  <FolderOpen aria-hidden />
                  Move
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    setPendingDelete(
                      MEDIA_ASSETS.filter((asset) => selected.includes(asset.id)),
                    )
                  }
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
              title={
                search || activeFilters
                  ? "No media matches those filters"
                  : "This folder is empty"
              }
              description={
                search || activeFilters
                  ? "Try a different search term, or clear the filters."
                  : "Upload images and video here once, then reuse them across every post and platform."
              }
              action={
                search || activeFilters ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setType(ALL);
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button size="sm" onClick={openUpload}>
                    <Upload aria-hidden />
                    Upload media
                  </Button>
                )
              }
            />
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {rows.map((asset) => {
                const active = selected.includes(asset.id);

                return (
                  <li key={asset.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => setDetail(asset)}
                      className="w-full text-left focus-visible:outline-none"
                    >
                      <span
                        className={cn(
                          "relative block aspect-square overflow-hidden rounded-panel border transition-all",
                          active
                            ? "border-primary shadow-focus"
                            : "border-border group-hover:border-border-strong group-hover:shadow-card",
                          asset.tone,
                        )}
                      >
                        {asset.type === "video" ? (
                          <span
                            aria-hidden
                            className="absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface/80"
                          >
                            <span className="ml-0.5 block size-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-text-primary" />
                          </span>
                        ) : null}

                        {asset.type === "video" && asset.duration ? (
                          <span className="absolute bottom-1.5 left-1.5 rounded bg-text-primary/70 px-1 py-0.5 text-[9px] font-medium text-white tabular-nums">
                            {asset.duration}s
                          </span>
                        ) : null}

                        {MEDIA_USAGE[asset.id] > 0 ? (
                          <span className="absolute bottom-1.5 right-1.5 rounded bg-surface/90 px-1 py-0.5 text-[9px] font-medium text-text-secondary tabular-nums">
                            {MEDIA_USAGE[asset.id]} uses
                          </span>
                        ) : null}
                      </span>

                      <span className="mt-1.5 block truncate text-[12px] font-medium text-text-primary">
                        {asset.name}
                      </span>
                      <span className="block text-[10px] text-text-muted">
                        {asset.width} × {asset.height} · {formatBytes(asset.size)}
                      </span>
                    </button>

                    {/* Select and actions sit over the tile, revealed on hover
                        and always present for keyboard users. */}
                    <button
                      type="button"
                      onClick={() => toggle(asset.id)}
                      aria-label={`Select ${asset.name}`}
                      aria-pressed={active}
                      className={cn(
                        "absolute top-1.5 left-1.5 grid size-5 place-items-center rounded-full border transition-all focus-visible:opacity-100 focus-visible:shadow-focus focus-visible:outline-none",
                        active
                          ? "border-primary bg-primary text-white opacity-100"
                          : "border-border-strong bg-surface/90 text-transparent opacity-0 group-hover:opacity-100",
                      )}
                    >
                      <Check className="size-3" strokeWidth={3} aria-hidden />
                    </button>

                    <div className="absolute top-1 right-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                      <Menu
                        label={`Actions for ${asset.name}`}
                        items={[
                          {
                            label: "Rename",
                            icon: <Pencil className="size-4" />,
                            onSelect: () => {
                              setRenaming(asset);
                              setRenameDraft(asset.name);
                            },
                          },
                          {
                            label: "Download",
                            icon: <Download className="size-4" />,
                            onSelect: () => toast(`${asset.name} downloaded`),
                          },
                          {
                            label: "Delete",
                            icon: <Trash2 className="size-4" />,
                            onSelect: () => setPendingDelete([asset]),
                            destructive: true,
                          },
                        ]}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* ------------------------------------------------------- Detail */}
      <Dialog
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.name ?? "Media"}
        description={
          detail
            ? `${detail.width} × ${detail.height} · ${formatBytes(detail.size)}`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" size="compact" onClick={() => setDetail(null)}>
              Close
            </Button>
            <Button
              size="compact"
              onClick={() => {
                if (detail) toast(`${detail.name} added to a new post`);
                setDetail(null);
              }}
            >
              <Plus aria-hidden />
              Use in a post
            </Button>
          </>
        }
      >
        {detail ? (
          <div className="space-y-4">
            <div
              aria-hidden
              className={cn(
                "grid aspect-video place-items-center rounded-panel",
                detail.tone,
              )}
            >
              {detail.type === "video" ? (
                <Film className="size-8 text-text-muted" />
              ) : (
                <ImageIcon className="size-8 text-text-muted" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={detail.type === "video" ? "info" : "brand"}>
                {detail.type}
              </Badge>
              <Badge tone="neutral">
                {MEDIA_FOLDERS.find((item) => item.id === detail.folderId)?.name ??
                  "Uncategorised"}
              </Badge>
              {MEDIA_USAGE[detail.id] === 0 ? (
                <Badge tone="warning">Unused</Badge>
              ) : (
                <Badge tone="success">{MEDIA_USAGE[detail.id]} posts</Badge>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Dimensions", value: `${detail.width} × ${detail.height}` },
                { label: "File size", value: formatBytes(detail.size) },
                {
                  label: "Duration",
                  value: detail.duration ? `${detail.duration}s` : "—",
                },
                { label: "Uploaded", value: formatRelativeTime(detail.uploadedAt) },
              ].map((row) => (
                <div key={row.label}>
                  <dt className="text-xs text-text-muted">{row.label}</dt>
                  <dd className="font-medium text-text-primary">{row.value}</dd>
                </div>
              ))}
            </dl>

            <section>
              <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
                Tags
              </h3>
              <div className="mt-2">
                <TagList tags={detail.tags} max={8} />
              </div>
            </section>
          </div>
        ) : null}
      </Dialog>

      {/* ------------------------------------------------------- Rename */}
      <Dialog
        open={Boolean(renaming)}
        onClose={() => setRenaming(null)}
        title="Rename file"
        footer={
          <>
            <Button variant="outline" size="compact" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button
              size="compact"
              onClick={() => {
                setRenaming(null);
                toast(`Renamed to ${renameDraft}`);
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <Field
          label="File name"
          htmlFor="media-name"
          hint="Posts already using this file are not affected."
        >
          <Input
            id="media-name"
            value={renameDraft}
            onChange={(event) => setRenameDraft(event.target.value)}
          />
        </Field>
      </Dialog>

      {/* ------------------------------------------------------- Upload */}
      <Dialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload media"
        description="Images and video, up to 100 MB per file."
        footer={
          <>
            <Button
              variant="outline"
              size="compact"
              onClick={() => setUploadOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="compact"
              onClick={() => {
                setUploadOpen(false);
                toast("Upload started");
              }}
            >
              <Upload aria-hidden />
              Start upload
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-panel border border-dashed border-border-strong px-4 py-8 text-center">
            <Upload className="mx-auto size-6 text-text-muted" aria-hidden />
            <p className="mt-2 text-sm font-medium text-text-primary">
              Drop files here
            </p>
            <p className="mt-1 text-xs text-text-muted">
              JPG, PNG, WebP, GIF and MP4. Multiple files are fine.
            </p>
            <Button variant="outline" size="sm" className="mt-3">
              Choose files
            </Button>
          </div>

          <Field label="Folder" htmlFor="upload-folder">
            <Select
              id="upload-folder"
              hideLabel={false}
              label="Folder"
              value={uploadFolder}
              onChange={setUploadFolder}
              options={MEDIA_FOLDERS.filter((item) => item.id !== "all").map(
                (item) => ({ value: item.id, label: item.name }),
              )}
            />
          </Field>
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          const count = pendingDelete?.length ?? 0;
          toast(`${count} file${count === 1 ? "" : "s"} deleted`);
          setSelected([]);
        }}
        title={`Delete ${pendingDelete?.length ?? 0} file${(pendingDelete?.length ?? 0) === 1 ? "" : "s"}?`}
        confirmLabel="Delete permanently"
      >
        {(() => {
          const inUse = (pendingDelete ?? []).filter(
            (asset) => MEDIA_USAGE[asset.id] > 0,
          );

          return (
            <p className="text-sm text-text-secondary">
              {inUse.length > 0 ? (
                <>
                  {inUse.length === 1 ? "One of these files is" : `${inUse.length} of these files are`}{" "}
                  used by published and scheduled posts. Published posts keep the
                  image the platform already has; scheduled posts will publish
                  without it.
                </>
              ) : (
                <>
                  None of these files are used by a post, so nothing else is
                  affected. Deleting is permanent.
                </>
              )}
            </p>
          );
        })()}
      </ConfirmDialog>
    </>
  );
}
