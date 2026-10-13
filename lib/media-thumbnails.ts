/**
 * Video thumbnail generation utilities
 */

/**
 * Accepted video MIME types for thumbnail generation.
 */
const ACCEPTED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/ogg"]);

/**
 * Accepted video file extensions for thumbnail generation.
 */
const ACCEPTED_VIDEO_EXTENSIONS = new Set(["mp4", "webm", "ogv", "ogg"]);

/**
 * Validate video file type and extension.
 * Returns true if the file can be decoded for thumbnail capture.
 */
function isVideoTypeSupported(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  const extension = name.split(".").pop() || "";
  return ACCEPTED_VIDEO_TYPES.has(type) || ACCEPTED_VIDEO_EXTENSIONS.has(extension);
}

/**
 * Capture a frame from a video file and return it as a JPEG blob.
 * Captures at ~1 second into the video, or 25% if shorter.
 * @param file - The video file to capture a poster from
 * @returns Promise resolving to a JPEG blob at quality 0.82, or null if capture failed
 */
export async function captureVideoPoster(file: File): Promise<Blob | null> {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  const extension = name.split(".").pop() || "";

  // [A1] Validate file type before attempting capture
  if (!isVideoTypeSupported(file)) {
    console.warn(`[media-thumbnails] Unsupported video type for thumbnail: ${type} (${name})`);
    return null;
  }

  const video = document.createElement("video");
  const objectUrl = URL.createObjectURL(file);
  video.muted = true;
  video.preload = "auto";
  video.src = objectUrl;
  video.crossOrigin = "anonymous";

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  };

  try {
    // [A2] Wait for loadeddata instead of loadedmetadata, with 8s timeout
    await new Promise<void>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        console.warn("[media-thumbnails] Video loadeddata timeout (8s) exceeded.");
        reject(new Error("loadeddata timeout"));
      }, 8000);

      video.onloadeddata = () => {
        window.clearTimeout(timeoutId);
        resolve();
      };
      video.onerror = () => {
        window.clearTimeout(timeoutId);
        console.error("[media-thumbnails] Video decoding failed for thumbnail capture.");
        reject(new Error("The video could not be decoded for its thumbnail."));
      };
      video.load();
    });

    // [A3] Handle short videos safely
    const captureTime = Number.isFinite(video.duration) && video.duration > 1
      ? Math.min(1, video.duration / 2)
      : 0;

    if (captureTime > 0) {
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve();
        video.onerror = () => {
          console.error("[media-thumbnails] Video seek failed for thumbnail capture.");
          reject(new Error("The video thumbnail frame could not be selected."));
        };
        video.currentTime = captureTime;
      });
    } else {
      // Short video (<= 1s): use currentTime = 0 but wait for seeked or timeout
      await new Promise<void>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          console.warn("[media-thumbnails] Short video seeked timeout (500ms) exceeded.");
          reject(new Error("short video seeked timeout"));
        }, 500);

        video.onseeked = () => {
          window.clearTimeout(timeoutId);
          resolve();
        };
        video.onerror = () => {
          window.clearTimeout(timeoutId);
          reject(new Error("Short video seek failed"));
        };
        video.currentTime = 0;
      });
    }

    if (!video.videoWidth || !video.videoHeight) {
      console.error("[media-thumbnails] Video has no dimensions after seeking.");
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      console.error("[media-thumbnails] Could not create canvas context for thumbnail.");
      return null;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });
  } catch (error) {
    // [A4] Return null cleanly on any failure. Never throw.
    console.error("[media-thumbnails] captureVideoPoster failed:", error);
    return null;
  } finally {
    cleanup();
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
