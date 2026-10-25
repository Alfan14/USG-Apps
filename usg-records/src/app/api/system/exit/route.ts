import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { isRecording } from "@/lib/recorder";

export async function POST() {
  try {
    if (isRecording()) {
      return NextResponse.json(
        {
          success: false,
          error: "Perekaman masih berjalan. Hentikan perekaman terlebih dahulu sebelum menutup aplikasi.",
        },
        { status: 409 }
      );
    }

    console.log("[System] Exit request received. Terminating kiosk browser and server...");

    // On Windows, terminate the kiosk browser process (Edge or Chrome)
    if (process.platform === "win32") {
      spawn(
        "cmd.exe",
        ["/c", "taskkill /F /IM msedge.exe /T 2>nul & taskkill /F /IM chrome.exe /T 2>nul"],
        {
          detached: true,
          stdio: "ignore",
        }
      ).unref();
    }

    // Terminate this Node.js server process after giving time for the response to send
    setTimeout(() => {
      console.log("[System] Exiting Node.js server process.");
      process.exit(0);
    }, 600);

    return NextResponse.json({
      success: true,
      message: "Aplikasi sedang ditutup...",
    });
  } catch (error) {
    console.error("[/api/system/exit]", error);
    return NextResponse.json(
      { success: false, error: "Gagal menutup aplikasi." },
      { status: 500 }
    );
  }
}
