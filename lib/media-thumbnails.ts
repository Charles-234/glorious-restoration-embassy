/**
 * Video thumbnail generation utilities
 * Reuses the captureVideoPoster function from cms-workspace.tsx
 */

/**
 * Capture a frame from a video file and return it as a JPEG blob.
 * Captures at ~1 second into the video, or 25% if shorter.
 * @param file - The video file to capture a poster from
 * @returns Promise resolving to a JPEG blob at quality 0.82, or null if capture failed
 */
export async function captureVideoPoster(file: File): Promise<Blob | null> {
  const video = document.createElement("video");
  const objectUrl = URL.createObjectURL(file);
  video.muted = true;
  video.preload = "auto";
  video.src = objectUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("The video could not be decoded for its thumbnail."));
      video.load();
    });

    const captureTime = Number.isFinite(video.duration) && video.duration > 1
      ? Math.min(1, video.duration / 2)
      : 0;
    if (captureTime > 0) {
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve();
        video.onerror = () => reject(new Error("The video thumbnail frame could not be selected."));
        video.currentTime = captureTime;
      });
    }

    if (!video.videoWidth || !video.videoHeight) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Generate a filename for the auto-numbered media based on kind and extension.
 * @param kind - The media kind (image, video, audio, document)
 * @param nextNumber - The next number to use
 * @param extension - The file extension (default: based on kind)
 * @returns The formatted filename
 */
export function generateAutoFilename(kind: string, nextNumber: number, extension: string = ""): string {
  const ext = extension || getDefaultExtension(kind);
  const baseNames: Record<string, string> = {
    image: "photo",
    video: "video",
    audio: "audio",
    document: "doc",
  };
  const base = baseNames[kind] ?? "file";
  return `${base}${nextNumber}.${ext.replace(/^\./, "")}`;
}

function getDefaultExtension(kind: string): string {
  const defaults: Record<string, string> = {
    image: "jpg",
    video: "mp4",
    audio: "mp3",
    document: "pdf",
  };
  return defaults[kind] ?? "bin";
}
