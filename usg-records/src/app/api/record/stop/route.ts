import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { recorder, isRecording } from "@/lib/recorder";
import { updateRecordingFinished, updateRecordingStatus } from "@/lib/db";
import { uploadToR2 } from "@/lib/r2";
import { VIDEOS_DIR, STORAGE_DIR } from "@/lib/storage";

export async function POST() {
  try {
    if (!isRecording()) {
      return NextResponse.json(
        { success: false, error: "No active recording." },
        { status: 409 }
      );
    }

    const {
      process: ffmpegProcess,
      recordingId,
      localPath,
      filename,
      startedAt,
      isMock,
    } = recorder;

    const durationSeconds = startedAt
      ? Math.floor((Date.now() - startedAt) / 1000)
      : 0;

    // Gracefully stop the process
    await new Promise<void>((resolve) => {
      if (!ffmpegProcess || ffmpegProcess.exitCode !== null) return resolve();

      if (isMock) {
        // Mock process: just kill it
        ffmpegProcess.kill("SIGTERM");
      } else {
        // FFmpeg: send 'q' to gracefully finalize the MP4
        ffmpegProcess.stdin?.write("q");
        ffmpegProcess.stdin?.end();
      }

      const timeout = setTimeout(() => {
        console.warn("[Recorder] Process did not exit cleanly, force killing...");
        ffmpegProcess.kill("SIGKILL");
        resolve();
      }, 10_000);

      ffmpegProcess.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    // Clear global recorder state
    recorder.process = null;
    recorder.patientId = null;
    recorder.draftPatientId = "";
    recorder.recordingId = null;
    recorder.filename = null;
    recorder.localPath = null;
    recorder.startedAt = null;
    recorder.isMock = false;

    if (!recordingId || !localPath || !filename) {
      return NextResponse.json(
        { success: false, error: "Recorder state lost." },
        { status: 500 }
      );
    }

    // Mock: create a dummy MP4 placeholder file so the rest of the flow works
    if (isMock && !fs.existsSync(localPath)) {
      fs.mkdirSync(VIDEOS_DIR, { recursive: true });
      const candidate1 = path.join(STORAGE_DIR, "dummy_usg.mp4");
      const candidate2 = path.join(process.cwd(), "storage", "dummy_usg.mp4");
      const dummyFile = fs.existsSync(candidate1) ? candidate1 : candidate2;
      if (fs.existsSync(dummyFile)) {
        fs.copyFileSync(dummyFile, localPath);
        console.log("[MOCK] Copied dummy video to:", localPath);
      } else {
        fs.writeFileSync(localPath, Buffer.from("MOCK_MP4_PLACEHOLDER"));
        console.log("[MOCK] Created placeholder text file:", localPath);
      }
    }

    // Mark as uploading in DB
    updateRecordingStatus(recordingId, "uploading");

    // Upload to Cloudflare R2
    // IMPORTANT: Do NOT delete local file until upload is confirmed.
    let r2Url = "";
    try {
      const r2Key = `recordings/${filename}`;
      r2Url = await uploadToR2(localPath, r2Key);

      // Update DB with final info
      updateRecordingFinished(recordingId, durationSeconds, r2Key, r2Url);

      // Only delete local file AFTER successful upload
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        console.log("[Recorder] Local file deleted after successful upload:", localPath);
      }
    } catch (uploadError) {
      console.error("[R2 Upload] Failed:", uploadError);
      // Keep local file — it remains retryable
      updateRecordingStatus(recordingId, "error");
      return NextResponse.json(
        {
          success: false,
          error: "Recording saved locally but R2 upload failed. File is retained for retry.",
          recordingId,
          localPath,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Recording stopped and uploaded successfully.",
      recordingId,
      durationSeconds,
      r2Url,
    });
  } catch (error) {
    console.error("[/api/record/stop]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
