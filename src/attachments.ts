import { MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES } from "./types";
import type { FileAttachment } from "./types";

export interface AttachResult {
  accepted: FileAttachment[];
  error: string | null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Reads dropped/selected files client-side and enforces the same limits the
 * server enforces (see debug_agent/interface/schemas.py) so a rejection is
 * instant instead of a round trip. Flat files only — a dragged folder's
 * nested structure isn't walked, just whatever File objects the browser
 * hands back directly.
 */
export async function readAttachments(
  incoming: FileList | File[],
  existing: FileAttachment[],
): Promise<AttachResult> {
  const files = Array.from(incoming);

  if (existing.length + files.length > MAX_FILES) {
    return { accepted: [], error: `Attach at most ${MAX_FILES} files at a time.` };
  }

  let runningBytes = existing.reduce((sum, f) => sum + new Blob([f.content]).size, 0);
  const accepted: FileAttachment[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      return {
        accepted: [],
        error: `"${file.name}" is ${formatBytes(file.size)} — the limit is ${formatBytes(MAX_FILE_BYTES)} per file.`,
      };
    }
    runningBytes += file.size;
    if (runningBytes > MAX_TOTAL_BYTES) {
      return {
        accepted: [],
        error: `Attachments would total over ${formatBytes(MAX_TOTAL_BYTES)}.`,
      };
    }
    accepted.push({ path: file.name, content: await file.text() });
  }

  return { accepted, error: null };
}
