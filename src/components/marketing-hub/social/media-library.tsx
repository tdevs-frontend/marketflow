"use client";

import { useMemo, useRef, useState } from "react";
import {
  Check,
  Download,
  AlertCircle,
  FolderOpen,
  Loader2,
  HardDrive,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
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
import { MEDIA_USAGE } from "@/lib/social-fixtures";
import {
  ACCEPTED_MEDIA,
  MAX_UPLOAD_BYTES,
  createMediaFolder,
  defaultUploadFolder,
  removeMedia,
  renameMedia,
  uploadMedia,
  useMediaAssets,
  useMediaFolders,
} from "@/lib/media-store";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MediaAsset, MediaType } from "@/types/social";
import { AssetThumb, VideoOverlay } from "../shared/asset-thumb";

/**
 * Usage count, defaulted.
 *
 * `MEDIA_USAGE` is keyed off the fixture posts, so an asset uploaded this
 * session has no row in it - and `undefined` in a sort comparator sends every
 * uploaded asset to a random position. A file nothing references yet is used
 * zero times, which is a fact rather than a gap.
 */
const usageOf = (id: string) => MEDIA_USAGE[id] ?? 0;

/**
 * The media library.
 *
 * A grid of square tiles regardless of the asset's own aspect ratio, because
 * the grid's job is *finding* a file - a wall of mixed-ratio cards is harder to
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
  /*
   * Upload state, as a count and a list of reasons rather than a boolean.
   *
   * "Uploading 3 files" is the honest label, and a batch where the fourth file
   * was a PDF should still land the other three - so the failures come back as
   * sentences to show rather than as a thrown error that loses the successes.
   */
  const [uploading, setUploading] = useState(0);
  const [failures, setFailures] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  /* The upload destination is separate from `folder`, which is the browse
     filter - picking a destination should not navigate the library. */
  const [uploadFolder, setUploadFolder] = useState(defaultUploadFolder);
  /* The new-folder dialog's own name field, and the reason the last attempt
     was refused. */
  const [folderOpen, setFolderOpen] = useState(false);
  const [folderDraft, setFolderDraft] = useState("");
  const [folderError, setFolderError] = useState<string | null>(null);

  const activeFilters = type === ALL ? 0 : 1;

  /**
   * Create the folder, then browse to it.
   *
   * Landing on the new folder is the point - it is empty, which is the clearest
   * possible invitation to put something in it, and it leaves the upload
   * destination already pointing where the person was going.
   */
  function submitFolder() {
    const created = createMediaFolder(folderDraft);

    if (!created) {
      setFolderError(
        folderDraft.trim()
          ? "A folder with that name already exists."
          : "Give the folder a name.",
      );
      return;
    }

    setFolderOpen(false);
    setFolder(created.id);
    setUploadFolder(created.id);
    toast(`${created.name} created`);
  }

  /**
   * Hand the file to the browser.
   *
   * A real download, not a toast: every asset now has a URL - a path under
   * `/media` or a `blob:` from this session - and an anchor with `download` is
   * all the browser needs. An asset with no file behind it says so instead.
   */
  function download(items: MediaAsset[]) {
    const withFiles = items.filter((asset) => asset.url);

    if (withFiles.length === 0) {
      toast("Nothing to download - these assets have no file yet.");
      return;
    }

    for (const asset of withFiles) {
      const anchor = document.createElement("a");
      anchor.href = asset.url as string;
      anchor.download = asset.name;
      anchor.rel = "noopener";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
    }

    const skipped = items.length - withFiles.length;
    toast(
      `${withFiles.length} file${withFiles.length === 1 ? "" : "s"} downloaded${
        skipped > 0 ? `, ${skipped} skipped` : ""
      }`,
    );
  }

  /* The store, not the fixture array. This page was the last media surface
     still reading the fixture array directly, which meant a file uploaded in the
     campaign wizard or the post composer appeared everywhere except in the
     library it had supposedly been uploaded to. */
  const assets = useMediaAssets();
  const mediaFolders = useMediaFolders();

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return assets.filter((asset) => {
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
      if (sort === "usage") return usageOf(b.id) - usageOf(a.id);
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    });
  }, [assets, folder, search, sort, type]);

  const used = assets.reduce((sum, asset) => sum + asset.size, 0);
  const images = assets.filter((asset) => asset.type === "image").length;
  const videos = assets.filter((asset) => asset.type === "video").length;

  /** Files in a folder, for the sidebar counts. */
  const folderCount = (id: string) =>
    id === "all"
      ? assets.length
      : assets.filter((asset) => asset.folderId === id).length;

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );

  /** Defaults the destination to the folder being browsed, where there is one. */
  function openUpload() {
    setUploadFolder(folder === "all" ? defaultUploadFolder() : folder);
    setFailures([]);
    setUploadOpen(true);
  }

  /**
   * Read the picked files into the shared library.
   *
   * This page had a dialog with a "Choose files" button wired to nothing and a
   * "Start upload" button that raised a toast and closed - the file never
   * existed, and the grid behind it never changed. The uploader it needed was
   * already written: `lib/media-store` validates, decodes real dimensions and
   * duration off the file, and publishes to every surface subscribed to it.
   * The fix is to call it rather than to build a second one.
   *
   * `destination` is passed in because a drop onto the page belongs in the
   * folder being browsed, while a dialog upload belongs in the one its Select
   * is showing.
   */
  async function upload(files: File[], destination: string) {
    if (files.length === 0 || uploading > 0) return;

    setUploading(files.length);
    setFailures([]);

    try {
      const { added, rejected } = await uploadMedia(
        files,
        /* "All media" is a view, not a destination. */
        destination === "all" ? defaultUploadFolder() : destination,
      );

      setFailures(rejected);

      if (added.length > 0) {
        toast(
          `${added.length} file${added.length === 1 ? "" : "s"} added to the Media Library`,
        );
        /* Only close on a clean batch - a dialog that vanishes while holding
           the only explanation of what went wrong is the silent failure this
           page already had. */
        if (rejected.length === 0) setUploadOpen(false);
      } else if (rejected.length === 0) {
        setFailures(["Upload failed. Please try again."]);
      }
    } catch {
      /* Decoding runs in the browser, so a throw is the browser giving up. */
      setFailures(["Upload failed. Please try again."]);
    } finally {
      setUploading(0);
    }
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)]">
        {/* ------------------------------------------------------- Folders */}
        <Card className="h-max p-4 lg:sticky lg:top-22">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium  text-text-muted capitalize">
              Folders
            </p>
            {/* Folders are real records in the shared store now, so this
                creates one rather than announcing that it did. A folder made
                here is immediately a destination in the upload dialog. */}
            <IconButton
              onClick={() => {
              setFolderDraft("");
              setFolderError(null);
              setFolderOpen(true);
              }}
              label="New folder"
              size="xs"
              variant="quiet"
              className="size-5 rounded hover:bg-transparent hover:text-primary"
            >
              <Plus className="size-3.5" aria-hidden />
            </IconButton>
          </div>

          <ul className="mt-2.5 space-y-0.5">
            {mediaFolders.map((item) => {
              const active = item.id === folder;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setFolder(item.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-btn px-2 py-1.5 text-left text-sm font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                      active
                        ? "bg-primary-soft text-primary-dark"
                        : "text-text-secondary hover:bg-surface-secondary",
                    )}
                  >
                    <FolderOpen className="size-3.5 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    <span className="shrink-0 text-sm text-text-muted tabular-nums">
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
            <p className="flex items-center gap-1.5 text-sm font-medium  text-text-muted capitalize">
              <HardDrive className="size-3" aria-hidden />
              Storage
            </p>
            <p className="mt-2 text-sm font-bold text-text-primary">
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
              /* The files were already on the event; the old handler threw
                 them away and announced an upload that never began. */
              void upload(Array.from(event.dataTransfer.files), folder);
            }}
            className={cn(
              "mt-4 flex flex-wrap items-center justify-center gap-2 rounded-panel border border-dashed px-4 py-3 text-center transition-colors",
              dragging
                ? "border-primary bg-primary-soft"
                : "border-border-strong bg-surface-secondary/50",
            )}
          >
            {uploading > 0 ? (
              <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
            ) : (
              <Upload className="size-4 text-text-muted" aria-hidden />
            )}
            <p className="text-sm text-text-secondary" aria-live="polite">
              {uploading > 0 ? (
                <span className="font-medium text-text-primary">
                  Processing {uploading} file{uploading === 1 ? "" : "s"}…
                </span>
              ) : (
                <>
                  Drop files here, or{" "}
                  <button
                    type="button"
                    onClick={openUpload}
                    className="link font-medium focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    browse
                  </button>
                  . JPG, PNG, WebP, GIF and MP4 up to{" "}
                  {Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.
                </>
              )}
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
                    download(assets.filter((asset) => selected.includes(asset.id)));
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
                      assets.filter((asset) => selected.includes(asset.id)),
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
                          /* 5px, not the panel radius: these tiles are
                             pictures rather than panels, and a 12px corner on
                             a 150px thumbnail eats a visible bite out of the
                             image. `overflow-hidden` is what makes the photo
                             take the corner - the radius is on the box, the
                             asset just fills it. */
                          "relative block aspect-square overflow-hidden rounded-[5px] border transition-all",
                          active
                            ? "border-primary shadow-focus"
                            : "border-border group-hover:border-border-strong group-hover:shadow-card",
                          asset.tone,
                        )}
                      >
                        <AssetThumb asset={asset} className="size-full" />

                        {asset.type === "video" ? (
                          <VideoOverlay duration={asset.duration} />
                        ) : null}

                        {usageOf(asset.id) > 0 ? (
                          <span className="absolute right-1.5 bottom-1.5 rounded bg-text-primary/65 px-1.5 py-0.5 text-xs font-medium text-white tabular-nums backdrop-blur-[2px]">
                            {usageOf(asset.id)} uses
                          </span>
                        ) : null}
                      </span>

                      <span className="mt-1.5 block truncate text-sm font-medium text-text-primary">
                        {asset.name}
                      </span>
                      <span className="block text-sm text-text-muted">
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
                            onSelect: () => download([asset]),
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
            {/* The asset itself, not an icon standing for its type - the
                badge below already says which it is, and the one thing this
                panel is for is looking at the thing. */}
            <div
              className={cn(
                "relative grid aspect-video place-items-center overflow-hidden rounded-[5px]",
                detail.tone,
              )}
            >
              <AssetThumb asset={detail} className="size-full" />
              {detail.type === "video" ? (
                <VideoOverlay duration={detail.duration} />
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={detail.type === "video" ? "info" : "primary"}>
                {detail.type}
              </Badge>
              <Badge variant="default">
                {mediaFolders.find((item) => item.id === detail.folderId)?.name ??
                  "Uncategorised"}
              </Badge>
              {usageOf(detail.id) === 0 ? (
                <Badge variant="warning">Unused</Badge>
              ) : (
                <Badge variant="success">{usageOf(detail.id)} posts</Badge>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Dimensions", value: `${detail.width} × ${detail.height}` },
                { label: "File size", value: formatBytes(detail.size) },
                {
                  label: "Duration",
                  value: detail.duration ? `${detail.duration}s` : "-",
                },
                { label: "Uploaded", value: formatRelativeTime(detail.uploadedAt) },
              ].map((row) => (
                <div key={row.label}>
                  <dt className="text-sm text-text-muted">{row.label}</dt>
                  <dd className="font-medium text-text-primary">{row.value}</dd>
                </div>
              ))}
            </dl>

            <section>
              <h3 className="text-sm font-medium  text-text-muted capitalize">
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
            <Button variant="cancel" size="compact" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button
              size="compact"
              onClick={() => {
                setRenaming(null);
                const renamed = renaming
                  ? renameMedia(renaming.id, renameDraft)
                  : null;
                toast(
                  renamed
                    ? `Renamed to ${renamed.name}`
                    : "Could not rename this file. Please try again.",
                );
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

      {/* -------------------------------------------------- New folder */}
      <Dialog
        open={folderOpen}
        onClose={() => setFolderOpen(false)}
        title="New folder"
        description="Somewhere to group a campaign's assets. Files move in as they are uploaded."
        footer={
          <>
            <Button
              variant="cancel"
              size="compact"
              onClick={() => setFolderOpen(false)}
            >
              Cancel
            </Button>
            <Button size="compact" onClick={submitFolder}>
              <Plus aria-hidden />
              Create folder
            </Button>
          </>
        }
      >
        <Field
          label="Folder name"
          htmlFor="folder-name"
          hint="It becomes an upload destination straight away."
        >
          <Input
            id="folder-name"
            value={folderDraft}
            autoFocus
            error={Boolean(folderError)}
            onChange={(event) => {
              setFolderDraft(event.target.value);
              setFolderError(null);
            }}
            /* Enter is how anyone names a folder; making them reach for the
               button would be the only place in the product that does. */
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitFolder();
              }
            }}
          />
        </Field>

        {folderError ? (
          <p
            role="alert"
            className="mt-2 flex items-start gap-2 text-sm text-error-text"
          >
            <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
            {folderError}
          </p>
        ) : null}
      </Dialog>

      {/* ------------------------------------------------------- Upload */}
      <Dialog
        open={uploadOpen}
        onClose={() => {
          if (uploading > 0) return;
          setUploadOpen(false);
        }}
        title="Upload media"
        description={`Images and video, up to ${Math.round(
          MAX_UPLOAD_BYTES / (1024 * 1024),
        )} MB per file.`}
        footer={
          <>
            <Button
              variant="cancel"
              size="compact"
              onClick={() => setUploadOpen(false)}
              disabled={uploading > 0}
            >
              {failures.length > 0 && uploading === 0 ? "Close" : "Cancel"}
            </Button>
            {/* The primary action *is* the file picker. A separate "Start
                upload" was the tell that nothing was wired: there was no file
                for it to start on. A browser only opens the dialog from a
                real input, so the button forwards the click to one. */}
            <Button
              size="compact"
              onClick={() => fileInput.current?.click()}
              disabled={uploading > 0}
            >
              {uploading > 0 ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  Uploading {uploading} file{uploading === 1 ? "" : "s"}…
                </>
              ) : (
                <>
                  <Upload aria-hidden />
                  Choose files
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <input
            ref={fileInput}
            type="file"
            multiple
            accept={ACCEPTED_MEDIA}
            className="sr-only"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              /* Cleared so picking the same file twice still fires a change. */
              event.target.value = "";
              void upload(files, uploadFolder);
            }}
          />

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void upload(Array.from(event.dataTransfer.files), uploadFolder);
            }}
            className={cn(
              "rounded-panel border border-dashed px-4 py-8 text-center transition-colors",
              dragging
                ? "border-primary bg-primary-soft"
                : "border-border-strong",
            )}
          >
            {uploading > 0 ? (
              <>
                <Loader2
                  className="mx-auto size-6 animate-spin text-primary"
                  aria-hidden
                />
                <p
                  className="mt-2 text-sm font-medium text-text-primary"
                  aria-live="polite"
                >
                  Processing {uploading} file{uploading === 1 ? "" : "s"}…
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  Reading dimensions and duration off each file.
                </p>
              </>
            ) : (
              <>
                <Upload className="mx-auto size-6 text-text-muted" aria-hidden />
                <p className="mt-2 text-sm font-medium text-text-primary">
                  Drop files here
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  JPG, PNG, WebP, GIF and MP4. Multiple files are fine.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => fileInput.current?.click()}
                >
                  Choose files
                </Button>
              </>
            )}
          </div>

          {/* One line per file that did not make it, naming the file and the
              reason. A batch is not all-or-nothing, so this sits alongside the
              successes rather than replacing them. */}
          {failures.length > 0 ? (
            <ul
              role="alert"
              className="space-y-1.5 rounded-panel border border-error/25 bg-error-soft px-3.5 py-3"
            >
              {failures.map((reason) => (
                <li
                  key={reason}
                  className="flex items-start gap-2 text-sm text-error-text"
                >
                  <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
                  {reason}
                </li>
              ))}
            </ul>
          ) : null}

          <Field label="Folder" htmlFor="upload-folder">
            <Select
              id="upload-folder"
              hideLabel={false}
              label="Folder"
              value={uploadFolder}
              onChange={setUploadFolder}
              disabled={uploading > 0}
              options={mediaFolders.filter((item) => item.id !== "all").map(
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
          const removed = removeMedia((pendingDelete ?? []).map((a) => a.id));
          toast(
            removed > 0
              ? `${removed} file${removed === 1 ? "" : "s"} deleted`
              : "Could not delete these files. Please try again.",
          );
          setSelected([]);
        }}
        title={`Delete ${pendingDelete?.length ?? 0} file${(pendingDelete?.length ?? 0) === 1 ? "" : "s"}?`}
        confirmLabel="Delete permanently"
      >
        {(() => {
          const inUse = (pendingDelete ?? []).filter(
            (asset) => usageOf(asset.id) > 0,
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
