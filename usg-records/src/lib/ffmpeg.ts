import path from "path";
import fs from "fs";

/**
 * Resolves the FFmpeg executable path.
 *
 * Resolution order:
 *  1. Bundled binary: <cwd>/ffmpeg/ffmpeg.exe  (production installation)
 *  2. System PATH: "ffmpeg"                     (developer convenience)
 *
 * Returns the path string to pass to spawn().
 */
export function resolveFfmpegPath(): string {
  const bundled = path.join(process.cwd(), "ffmpeg", "ffmpeg.exe");
  if (fs.existsSync(bundled)) {
    return bundled;
  }
  // Fall back to system PATH — useful for local development
  return "ffmpeg";
}
