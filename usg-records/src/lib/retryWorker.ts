import fs from "fs";
import path from "path";
import { getFailedRecordings, updateRecordingFinished, updateRecordingStatus } from "./db";
import { uploadToR2 } from "./r2";
import { VIDEOS_DIR } from "./storage";

const RETRY_INTERVAL_MS = 60 * 1000; // Check every 60 seconds

export function startRetryWorker() {
  const g = globalThis as any;
  if (g.__retryWorkerStarted) return;
  g.__retryWorkerStarted = true;

  console.log("[Retry Worker] Started background upload retry worker.");

  setInterval(async () => {
    try {
      const failed = getFailedRecordings();
      if (failed.length === 0) return;

      console.log(`[Retry Worker] Found ${failed.length} failed uploads. Attempting retry...`);

      for (const rec of failed) {
        const localPath = path.join(VIDEOS_DIR, rec.filename);
        
        if (!fs.existsSync(localPath)) {
          console.warn(`[Retry Worker] Local file missing for ${rec.filename}. Marking as done to ignore.`);
          // If the file is gone, we can't upload it. Mark as done or permanently failed.
          updateRecordingStatus(rec.id, "done");
          continue;
        }

        try {
          console.log(`[Retry Worker] Retrying upload for ${rec.filename}...`);
          const r2Key = `recordings/${rec.filename}`;
          const r2Url = await uploadToR2(localPath, r2Key);

          updateRecordingFinished(rec.id, rec.duration_seconds, r2Key, r2Url);

          // Cleanup local file
          fs.unlinkSync(localPath);
          console.log(`[Retry Worker] Successfully uploaded ${rec.filename} and deleted local file.`);
        } catch (uploadError) {
          console.error(`[Retry Worker] Retry failed for ${rec.filename}:`, (uploadError as Error).message);
          // Leaves status as 'error', will be retried again next tick
        }
      }
    } catch (err) {
      console.error("[Retry Worker] Error in background loop:", err);
    }
  }, RETRY_INTERVAL_MS);
}
