"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Upload, X, RefreshCw } from "lucide-react";

const KNOWN_CONTEXTS = [
  { value: "gallery", label: "Gallery" },
  { value: "hero", label: "Homepage hero" },
  { value: "stitch", label: "Homepage sections" },
  { value: "poster", label: "Video poster" },
  { value: "brand", label: "Brand / logos" },
  { value: "video", label: "Videos" },
  { value: "audio", label: "Audio" },
  { value: "documents", label: "Documents" },
] as const;

const CONSENT_QUICK_FILLS = [
  "No identifiable individuals — wide/crowd shot",
  "Public worship service — congregation photography",
  "Church event with public photography notice",
  "Member — no objection on record",
  "Under review — objection received",
] as const;

type DetectedKind = "image" | "video" | "audio" | "document";

function detectKind(file: File): DetectedKind {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (type.startsWith("image/") || /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(name)) return "image";
  if (type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/.test(name)) return "video";
  if (type.startsWith("audio/") || /\.(mp3|m4a|wav|ogg)$/.test(name)) return "audio";
  return "document";
}

export function CmsMediaUploadDrawer({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const posterFileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [altText, setAltText] = useState("");
  const [filename, setFilename] = useState("");
  const [contexts, setContexts] = useState<string[]>(["gallery"]);
  const [customContext, setCustomContext] = useState("");
  const [tags, setTags] = useState("");
  const [publishNow, setPublishNow] = useState(false);
  const [consentNotes, setConsentNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingPoster, setGeneratingPoster] = useState(false);
  const [posterBlobUrl, setPosterBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (posterBlobUrl) {
        URL.revokeObjectURL(posterBlobUrl);
      }
    };
  }, [posterBlobUrl]);

  const detectedKind: DetectedKind | null = useMemo(
    () => (file ? detectKind(file) : null),
    [file],
  );

  const isImage = detectedKind === "image";
  const requiresConsent = isImage && publishNow && !consentNotes.trim();

  function pickFile(nextFile: File | null) {
    setFile(nextFile);
    setError(null);
    if (nextFile) {
      const base = nextFile.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      setTitle((prev) => prev || base);
      const extension = nextFile.name.split(".").pop()?.toLowerCase() || "";
      const kind = detectKind(nextFile);
      
      // Auto-generate filename
      generateFilename(kind, extension);
      
      // For videos, auto-generate poster
      if (kind === "video") {
        generatePosterFromFile(nextFile);
      }
    } else {
      setPosterBlobUrl(null);
    }
  }

  function toggleContext(value: string) {
    setContexts((prev) =>
      prev.includes(value) ? prev.filter((entry) => entry !== value) : [...prev, value],
    );
  }

  function addCustomContext() {
    const trimmed = customContext.trim();
    if (!trimmed || contexts.includes(trimmed)) {
      setCustomContext("");
      return;
    }
    setContexts((prev) => [...prev, trimmed]);
    setCustomContext("");
  }

  function generateFilename(kind: string, extension: string) {
    const patterns: Record<string, RegExp> = {
      image: /^photo(\d+)\.\w+$/,
      video: /^[Vv]ideo(\d+)\.\w+$/,
      audio: /^audio(\d+)\.\w+$/,
      document: /^doc(\d+)\.\w+$/,
    };
    const baseNames: Record<string, string> = {
      image: "photo",
      video: "video",
      audio: "audio",
      document: "doc",
    };
    
    // For now, use a simple incrementing number
    // We'll fetch the next number from the API if we have a file
    async function fetchNextNumber() {
      try {
        const response = await fetch(`/api/cms/media/next-number?kind=${kind}`);
        if (response.ok) {
          const data = await response.json();
          if (data?.ok && typeof data.nextNumber === "number") {
            const base = baseNames[kind] ?? "file";
            setFilename(`${base}${data.nextNumber}.${extension}`);
            return;
          }
        }
      } catch {
        // Fallback to default
      }
      // Fallback: use a simple default
      const base = baseNames[kind] ?? "file";
      setFilename(`${base}1.${extension}`);
    }
    
    void fetchNextNumber();
  }

  async function generatePosterFromFile(videoFile: File) {
    setGeneratingPoster(true);
    setError(null);
    
    try {
      const posterBlob = await captureVideoPoster(videoFile);
      if (posterBlob) {
        const blobUrl = URL.createObjectURL(posterBlob);
        setPosterBlobUrl(blobUrl);
      }
    } catch (err) {
      console.error("[upload-drawer] Could not generate video poster.", err);
      setError("Could not generate video thumbnail.");
    } finally {
      setGeneratingPoster(false);
    }
  }

  function captureVideoPoster(file: File): Promise<Blob | null> {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    video.muted = true;
    video.preload = "auto";
    video.src = objectUrl;

    return new Promise((resolve) => {
      let cleanedUp = false;
      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        video.pause();
        video.removeAttribute("src");
        video.load();
        URL.revokeObjectURL(objectUrl);
      };

      video.onloadedmetadata = async () => {
        try {
          const captureTime = Number.isFinite(video.duration) && video.duration > 1
            ? Math.min(1, video.duration / 2)
            : 0;
          if (captureTime > 0) {
            await new Promise<void>((innerResolve, innerReject) => {
              video.onseeked = () => innerResolve();
              video.onerror = () => innerReject(new Error("Seek failed"));
              video.currentTime = captureTime;
            });
          }

          if (!video.videoWidth || !video.videoHeight) {
            cleanup();
            resolve(null);
            return;
          }

          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext("2d");
          if (!context) {
            cleanup();
            resolve(null);
            return;
          }
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          canvas.toBlob((blob) => {
            cleanup();
            resolve(blob);
          }, "image/jpeg", 0.82);
        } catch {
          cleanup();
          resolve(null);
        }
      };

      video.onerror = () => {
        cleanup();
        resolve(null);
      };

      video.load();
      
      // Timeout after 10 seconds
      setTimeout(() => {
        cleanup();
        resolve(null);
      }, 10000);
    });
  }

  async function handleUpload() {
    setError(null);
    if (!file) return setError("Choose a file to upload.");
    if (!contexts.length) return setError("Select at least one place for this media to appear.");
    if (requiresConsent) {
      return setError("Kenya DPA: record the basis for publishing this image, or save it as a draft.");
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const filePath = `${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // Handle poster for videos
      let posterSrc: string | null = null;
      const detected = detectedKind ?? detectKind(file);
      
      if (detected === "video" && posterBlobUrl) {
        // Upload the poster
        const posterBlob = await fetch(posterBlobUrl).then((r) => r.blob());
        const posterPath = `posters/${crypto.randomUUID()}.jpg`;
        const { error: posterUploadError } = await supabase.storage
          .from("media")
          .upload(posterPath, posterBlob, { contentType: "image/jpeg", upsert: false });
        if (posterUploadError) {
          console.error("[upload-drawer] Poster upload failed.", posterUploadError);
        } else {
          const { data: posterUrlData } = supabase.storage.from("media").getPublicUrl(posterPath);
          posterSrc = posterUrlData.publicUrl;
        }
      }

      // Use the custom filename if provided, otherwise use the original file name
      const finalTitle = title.trim() || (filename ? filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") : file.name);
      
      const res = await fetch("/api/cms/media/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          src: publicUrl,
          kind: detected,
          source: "supabase-storage",
          title: finalTitle,
          alt_text: isImage ? altText.trim() || finalTitle : null,
          context: contexts,
          tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
          poster_src: posterSrc,
          published: publishNow,
          consent_notes: isImage ? consentNotes.trim() || null : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Saving media record failed");

      // Clean up poster blob URL
      if (posterBlobUrl) {
        URL.revokeObjectURL(posterBlobUrl);
        setPosterBlobUrl(null);
      }

      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upload media"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-border bg-card p-6 sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Upload media</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a photo, video, audio file, or document to the library.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 hover:bg-muted"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground">
              File
              <input
                ref={fileInputRef}
                type="file"
                onChange={(event) => pickFile(event.currentTarget.files?.[0] ?? null)}
                className="mt-2 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:font-semibold file:text-secondary-foreground"
              />
            </label>
            {file ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB · detected type:{" "}
                <strong className="text-foreground">{detectedKind}</strong>
              </p>
            ) : null}
          </div>

          <label className="block text-sm font-medium text-foreground">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="block text-sm font-medium text-foreground">
            Filename (optional - leave to auto-generate)
            <input
              value={filename}
              onChange={(event) => setFilename(event.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          {isImage ? (
            <label className="block text-sm font-medium text-foreground">
              Alt text (helps screen readers and search engines)
              <input
                value={altText}
                onChange={(event) => setAltText(event.target.value)}
                placeholder="e.g. Congregation singing during Sunday service"
                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          ) : null}

          {detectedKind === "video" ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Thumbnail preview
                {posterBlobUrl ? (
                  <div className="mt-2">
                    <img
                      src={posterBlobUrl}
                      alt="Video thumbnail preview"
                      className="h-32 w-full rounded-xl border border-border object-cover"
                    />
                  </div>
                ) : (
                  <div className="mt-2 flex h-32 w-full items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted text-muted-foreground">
                    No thumbnail generated
                  </div>
                )}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (file) {
                      generatePosterFromFile(file);
                    } else {
                      setError("Please select a video file first");
                    }
                  }}
                  disabled={generatingPoster || !file}
                  className="btn btn-secondary disabled:opacity-60"
                >
                  <RefreshCw size={14} className={generatingPoster ? "animate-spin" : ""} />
                  {generatingPoster ? "Generating..." : "Generate thumbnail"}
                </button>
                <button
                  type="button"
                  onClick={() => posterFileInputRef.current?.click()}
                  className="btn btn-secondary"
                >
                  Choose custom thumbnail
                </button>
                <input
                  ref={posterFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const customPoster = event.currentTarget.files?.[0];
                    if (!customPoster) return;
                    event.currentTarget.value = "";
                    
                    try {
                      const supabase = createClient();
                      const safeName = customPoster.name.replace(/[^a-zA-Z0-9._-]/g, "-");
                      const posterPath = `posters/${crypto.randomUUID()}-${safeName}`;
                      
                      const { error: uploadError } = await supabase.storage
                        .from("media")
                        .upload(posterPath, customPoster, { contentType: customPoster.type, upsert: false });
                      
                      if (uploadError) {
                        throw new Error(`Upload failed: ${uploadError.message}`);
                      }
                      
                      const { data: urlData } = supabase.storage.from("media").getPublicUrl(posterPath);
                      setPosterBlobUrl(urlData.publicUrl);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Failed to upload custom thumbnail");
                    }
                  }}
                  style={{ display: "none" }}
                />
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-sm font-medium text-foreground">Where should it appear?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {KNOWN_CONTEXTS.map((entry) => (
                <button
                  key={entry.value}
                  type="button"
                  onClick={() => toggleContext(entry.value)}
                  aria-pressed={contexts.includes(entry.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                    contexts.includes(entry.value)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                value={customContext}
                onChange={(event) => setCustomContext(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCustomContext();
                  }
                }}
                placeholder="Add a custom context (e.g. sermons)"
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button type="button" onClick={addCustomContext} className="btn btn-secondary">
                Add
              </button>
            </div>
            {contexts.filter((c) => !KNOWN_CONTEXTS.some((k) => k.value === c)).length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {contexts
                  .filter((c) => !KNOWN_CONTEXTS.some((k) => k.value === c))
                  .map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-primary bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                    >
                      {c}
                      <button
                        type="button"
                        onClick={() => toggleContext(c)}
                        className="ml-1 hover:text-destructive"
                        aria-label={`Remove ${c}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            ) : null}
          </div>

          <label className="block text-sm font-medium text-foreground">
            Tags (comma-separated, optional)
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="e.g. worship, youth, christmas"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="flex items-center gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(event) => setPublishNow(event.target.checked)}
              className="size-5 accent-primary"
            />
            Publish immediately (otherwise saved as a draft)
          </label>

          {isImage && publishNow ? (
            <div className="space-y-2 rounded-xl border border-amber-300/60 bg-amber-50/60 p-3 dark:bg-amber-950/20">
              <p className="text-xs text-amber-900 dark:text-amber-200">
                Kenya DPA: to publish an image, record the basis for publishing it. This is
                advisory — nothing is blocked unless you toggle Publish immediately.
              </p>
              <textarea
                value={consentNotes}
                onChange={(event) => setConsentNotes(event.target.value)}
                rows={2}
                placeholder="e.g. Public worship service — congregation photography"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-1.5">
                {CONSENT_QUICK_FILLS.map((note) => (
                  <button
                    key={note}
                    type="button"
                    onClick={() => setConsentNotes(note)}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted"
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={busy}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={busy || !file}
              className="btn btn-primary disabled:opacity-60"
            >
              <Upload size={14} className="mr-1" />
              {busy ? "Uploading…" : publishNow ? "Upload and publish" : "Upload as draft"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
