import { NextResponse } from "next/server";
import os from "os";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import QRCode from "qrcode";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** Windows Mobile Hotspot always hosts itself on this address. */
const HOTSPOT_IP = "192.168.137.1";

interface HotspotScriptResult {
  ok: boolean;
  state: string;
  ssid: string | null;
  password: string | null;
  message: string;
}

/** Locate enable-hotspot.ps1 in dev (<cwd>/scripts) or prod (<install>/scripts). */
function resolveHotspotScript(): string | null {
  const candidates = [
    path.join(process.cwd(), "scripts", "enable-hotspot.ps1"),
    path.join(process.cwd(), "..", "scripts", "enable-hotspot.ps1"),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

/** Run enable-hotspot.ps1. Pass queryOnly=true to only read state without starting. */
function runHotspotScript(opts: {
  ssid?: string;
  password?: string;
  queryOnly?: boolean;
}): Promise<HotspotScriptResult> {
  return new Promise((resolve) => {
    const script = resolveHotspotScript();
    if (process.platform !== "win32" || !script) {
      return resolve({
        ok: false,
        state: "Unsupported",
        ssid: opts.ssid ?? null,
        password: null,
        message: "Hotspot activation is only available on Windows with enable-hotspot.ps1.",
      });
    }

    const args = ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", script];
    if (opts.queryOnly) args.push("-QueryOnly");
    if (opts.ssid) args.push("-Ssid", opts.ssid);
    if (opts.password) args.push("-Password", opts.password);

    execFile("powershell.exe", args, { timeout: 20_000, windowsHide: true }, (err, stdout) => {
      const lastLine = stdout.trim().split(/\r?\n/).pop() ?? "";
      try {
        resolve(JSON.parse(lastLine));
      } catch {
        resolve({
          ok: false,
          state: "Unknown",
          ssid: opts.ssid ?? null,
          password: null,
          message: err?.message || lastLine || "Unknown hotspot error.",
        });
      }
    });
  });
}

/** Scan adapters: returns hotspot presence plus best LAN/Wi-Fi fallback IP. */
function scanInterfaces() {
  const interfaces = os.networkInterfaces();
  const allIps: { name: string; ip: string }[] = [];
  let hotspotActive = false;
  let lanIp: string | null = null;

  for (const [name, addrs] of Object.entries(interfaces)) {
    for (const addr of addrs ?? []) {
      if (addr.family !== "IPv4" || addr.internal) continue;
      allIps.push({ name, ip: addr.address });
      if (addr.address === HOTSPOT_IP) hotspotActive = true;
      else if (!lanIp && !addr.address.startsWith("169.254.")) lanIp = addr.address;
    }
  }
  return { allIps, hotspotActive, lanIp };
}

export async function GET() {
  try {
    const port = process.env.PORT || "3000";

    // ── Option B: Query live Windows hotspot state first ──────────────────────
    // Env vars are optional overrides; live Windows state is the source of truth.
    const queryResult = await runHotspotScript({ queryOnly: true });

    // Live values from Windows (may be null on non-Windows / script failure)
    const liveState = queryResult.state; // "On" | "Off" | "Unknown" | "Unsupported"
    const liveSsid = queryResult.ssid ?? process.env.HOTSPOT_SSID ?? null;
    const livePassword = queryResult.password ?? process.env.HOTSPOT_PASSWORD ?? null;

    // Determine if the hotspot is currently active by both adapter check AND live state
    let scan = scanInterfaces();
    let hotspotMessage: string | null = null;

    const hotspotIsOn = liveState === "On" && scan.hotspotActive;
    const hotspotConfigured = Boolean(liveSsid); // we know the SSID at minimum

    // ── Self-heal: hotspot is configured but not running → try to start it ───
    if (hotspotConfigured && !hotspotIsOn) {
      console.log("[Network API] Hotspot not active — attempting to enable...");
      // Pass env-var overrides only if they differ from live values (user wants to rename)
      const overrideSsid = process.env.HOTSPOT_SSID && process.env.HOTSPOT_SSID !== liveSsid
        ? process.env.HOTSPOT_SSID
        : undefined;
      const overridePassword = process.env.HOTSPOT_PASSWORD && process.env.HOTSPOT_PASSWORD !== livePassword
        ? process.env.HOTSPOT_PASSWORD
        : undefined;

      const startResult = await runHotspotScript({
        ssid: overrideSsid,
        password: overridePassword,
        queryOnly: false,
      });
      hotspotMessage = startResult.message;
      console.log("[Network API] Hotspot start result:", startResult);

      if (startResult.ok) {
        // Adapter IP can take a moment to appear after tethering starts
        for (let i = 0; i < 10 && !scan.hotspotActive; i++) {
          await new Promise((r) => setTimeout(r, 500));
          scan = scanInterfaces();
        }
      }
    }

    const useHotspot = scan.hotspotActive;
    const ip = useHotspot ? HOTSPOT_IP : scan.lanIp || "127.0.0.1";
    const serverUrl = `http://${ip}:${port}`;
    const mode: "hotspot" | "lan" = useHotspot ? "hotspot" : "lan";

    // ── Single-scan pairing QR payload ───────────────────────────────────────
    // In hotspot mode, embed Wi-Fi credentials so mobile joins the network then
    // connects to the server — all from a single QR scan.
    const payload = {
      v: 1,
      app: "usg-remote",
      serverUrl,
      ...(useHotspot && liveSsid && livePassword
        ? { wifi: { ssid: liveSsid, password: livePassword, security: "WPA2" } }
        : {}),
    };

    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
      margin: 2,
      width: 280,
      errorCorrectionLevel: "M",
      color: { dark: "#0F172A", light: "#FFFFFF" },
    });

    return NextResponse.json(
      {
        mode,
        ip,
        port: Number(port),
        serverUrl,
        hotspot: {
          configured: hotspotConfigured,
          active: useHotspot,
          ssid: liveSsid,
          message: hotspotMessage,
        },
        qrDataUrl,
        allIps: scan.allIps,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("[Network API] Error inspecting network interfaces:", error);
    return NextResponse.json(
      { error: "Failed to determine network configuration" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
