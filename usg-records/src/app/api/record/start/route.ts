import { NextResponse } from "next/server";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { recorder, isRecording } from "@/lib/recorder";
import { insertRecording, deleteRecording } from "@/lib/db";
import { resolveFfmpegPath } from "@/lib/ffmpeg";
import { VIDEOS_DIR } from "@/lib/storage";
import { diagnoseRecordingError } from "@/lib/deviceDiagnostics";

const IS_MOCK = process.env.MOCK_RECORDING === "true";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function POST(request: Request) {
  let recordingId: number | null = null;
  let errorOutput = "";
  let isTimeoutError = false;
  let ffmpegBin = "";
  const captureDevice = process.env.CAPTURE_DEVICE_NAME ?? "USB Video";

  try {
    if (isRecording()) {
      return NextResponse.json(
        { success: false, error: "Perekaman sedang berlangsung." },
        { status: 409, headers: CORS_HEADERS }
      );
    }

    const { patientId } = await request.json();

    if (!patientId || typeof patientId !== "string") {
      return NextResponse.json(
        { success: false, error: "ID Pasien wajib diisi." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const uuid = crypto.randomUUID();
    const filename = `${patientId}-${uuid}.mp4`;
    const localPath = path.join(VIDEOS_DIR, filename);

    // Ensure the videos directory exists
    if (!fs.existsSync(VIDEOS_DIR)) {
      fs.mkdirSync(VIDEOS_DIR, { recursive: true });
    }

    // Insert a "recording" row into SQLite
    recordingId = insertRecording(patientId, filename);

    // Broadcast starting state across all clients
    recorder.isStarting = true;
    recorder.lastError = null;

    let ffmpegProcess: ChildProcess;

    if (IS_MOCK) {
      // --- MOCK MODE ---
      console.log("[MOCK] Starting simulated recording for patient:", patientId);
      const nodeBin = process.execPath;
      ffmpegProcess = spawn(nodeBin, ["-e", "setInterval(() => {}, 1000)"], {
        stdio: ["pipe", "pipe", "pipe"],
      });
      await new Promise((r) => setTimeout(r, 600));
    } else {
      // --- REAL MODE ---
      ffmpegBin = resolveFfmpegPath();
      console.log(`[FFmpeg] Using binary: ${ffmpegBin}`);
      console.log(`[FFmpeg] Target DirectShow device: "${captureDevice}"`);

      ffmpegProcess = spawn(
        /*turbopackIgnore: true*/ ffmpegBin,
        [
          "-f", "dshow",
          "-i", `video=${captureDevice}`,
          "-c:v", "libx264",
          "-preset", "ultrafast",
          "-crf", "23",
          "-pix_fmt", "yuv420p",
          "-movflags", "+faststart",
          localPath,
        ],
        { stdio: ["pipe", "pipe", "pipe"] }
      );

      // Wait until FFmpeg confirms active video frame encoding or encounters an error
      await new Promise<void>((resolve, reject) => {
        let isConfirmed = false;

        const timeout = setTimeout(() => {
          if (!isConfirmed) {
            isConfirmed = true;
            isTimeoutError = true;
            // Kill the stalled process
            try {
              ffmpegProcess.kill("SIGKILL");
            } catch {}
            reject(
              new Error(
                errorOutput ||
                  "Capture card initialization timed out (no video signal received)."
              )
            );
          }
        }, 8000);

        ffmpegProcess.stderr?.on("data", (data: Buffer) => {
          const text = data.toString();
          console.log("[FFmpeg]", text.trim());
          errorOutput += text;

          // FFmpeg begins encoding: prints frame progress
          if (
            !isConfirmed &&
            (text.includes("frame=") ||
              text.includes("fps=") ||
              text.includes("Press [q] to stop") ||
              text.includes("size="))
          ) {
            isConfirmed = true;
            clearTimeout(timeout);
            resolve();
          }
        });

        ffmpegProcess.once("error", (err: Error) => {
          if (!isConfirmed) {
            isConfirmed = true;
            clearTimeout(timeout);
            reject(err);
          }
        });

        ffmpegProcess.once("exit", (code: number | null) => {
          if (!isConfirmed) {
            isConfirmed = true;
            clearTimeout(timeout);
            reject(
              new Error(
                errorOutput.trim() || `FFmpeg stopped prematurely (exit code ${code}).`
              )
            );
          }
        });
      });
    }

    // Store state in global singleton only once capture is confirmed
    recorder.process = ffmpegProcess;
    recorder.patientId = patientId;
    recorder.draftPatientId = "";
    recorder.isStarting = false;
    recorder.lastError = null;
    recorder.recordingId = recordingId;
    recorder.filename = filename;
    recorder.localPath = localPath;
    recorder.startedAt = Date.now();
    recorder.isMock = IS_MOCK;

    return NextResponse.json(
      {
        success: true,
        message: IS_MOCK ? "Mock recording started." : "Recording started.",
        recordingId,
        patientId,
        filename,
        startedAt: recorder.startedAt,
        mock: IS_MOCK,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("[/api/record/start] Recording startup error:", error);

    // Clean up aborted database entry
    if (recordingId) {
      try {
        deleteRecording(recordingId);
      } catch (dbErr) {
        console.error("[/api/record/start] Failed to delete aborted recording row:", dbErr);
      }
    }

    // Perform clinical diagnosis across hardware failure cases
    const diagnostic = diagnoseRecordingError(
      errorOutput || error?.message || "",
      captureDevice,
      isTimeoutError
    );

    console.warn("[/api/record/start] Hardware diagnosis result:", diagnostic);

    // Broadcast error state to laptop kiosk and remote polling clients
    recorder.isStarting = false;
    recorder.lastError = {
      message: diagnostic.message,
      code: diagnostic.code,
      details: diagnostic.details,
      timestamp: Date.now(),
    };

    return NextResponse.json(
      {
        success: false,
        error: diagnostic.message,
        code: diagnostic.code,
        details: diagnostic.details,
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
