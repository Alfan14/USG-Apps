# Build Progress — USG Recorder

## Phase 1 — App Foundations ✅ COMPLETE
- [x] Move UI route from `/` to `/recorder` (`src/app/recorder/page.tsx`)
- [x] Root `/` redirects to `/recorder`
- [x] `output: "standalone"` added to `next.config.ts`
- [x] FFmpeg path resolver (`src/lib/ffmpeg.ts`) — checks `./ffmpeg/ffmpeg.exe` first, then `$PATH`
- [x] Mock recording mode (`MOCK_RECORDING=true` in `.env.local`)
- [x] `isMock` flag propagated through recorder global state and API routes
- [x] Stop route preserves local file on failed upload
- [x] `.env.local.example` updated with `MOCK_RECORDING` documented
- [x] **Build verification** — `npm run build` ✅ passed

## Phase 2 — Asset Bundling ✅ COMPLETE
- [x] FFmpeg Windows static build placed at `ffmpeg/ffmpeg.exe`
- [x] Node.js Windows runtime placed at `runtime/node.exe`

## Phase 3 — Startup & Kiosk Automation (Option A) ✅ COMPLETE
- [x] `src/lib/storage.ts` — Centralized storage resolver directing mutable data (SQLite DB, videos, logs) to `%ProgramData%\USG Recorder\storage` with full write permissions.
- [x] `scripts/run-kiosk.ps1` — Unified launcher: starts background server if not running, redirects stdout/stderr to `logs/server.log`, polls port 3000 until healthy, launches Edge/Chrome in fullscreen kiosk mode.
- [x] `scripts/run-kiosk.vbs` — Silent launcher wrapper running `run-kiosk.ps1` with window style 0 (zero console window flicker).
- [x] `scripts/start-server.ps1` & `scripts/launch-browser.ps1` — Updated with file logging and storage path awareness.

## Phase 4 — Windows Autorun (Option A Native Startup) ✅ COMPLETE
- [x] Uses native Windows `{commonstartup}` shortcut (`USG Recorder.lnk`) pointing to `run-kiosk.vbs`.
- [x] Solves Session 0 isolation: Launches seamlessly in the interactive user desktop session whenever the machine boots and logs in.
- [x] Removes fragile Task Scheduler multi-principal dependency.

## Phase 5 — Windows Installer (Inno Setup) ✅ COMPLETE
- [x] `installer/setup.iss` updated:
  - Creates `{commonappdata}\{#AppName}\storage` (and `videos/`, `logs/`) with `Permissions: users-modify`.
  - Injects `STORAGE_DIR` into `config\.env`.
  - Installs `{commonstartup}` and Desktop shortcuts using silent VBScript launcher.
  - Cleans up any legacy Task Scheduler entries from earlier revisions.
  - Kills running node processes upon uninstall.
- [x] Compiled installer output: `installer\dist\USGRecorder-Setup-1.0.0.exe`

## Phase 6 — Single-Scan Mobile Hotspot & Remote Control Pairing ✅ COMPLETE
- [x] **WinRT Mobile Hotspot Activation Script** (`scripts/enable-hotspot.ps1`):
  - Uses native Windows 10/11 `NetworkOperatorTetheringManager` WinRT API.
  - Auto-selects active network adapter to tether, applies SSID/Password, and starts tethering.
- [x] **Kiosk Boot Integration** (`scripts/run-kiosk.ps1`):
  - Automatically invokes hotspot activation on machine startup before launching server & browser.
- [x] **24/7 Hotspot Persistence** (`installer/setup.iss`):
  - Configures Windows Registry (`PeerlessTimeoutEnabled = 0`, `PeerlessTimeout = 0`) to prevent 5-minute inactivity auto-off.
  - Adds Hotspot SSID and Password setup wizard pages to Inno Setup.
- [x] **Self-Healing Network API** (`src/app/api/system/network/route.ts`):
  - Detects if hotspot is active; auto-invokes `enable-hotspot.ps1` in the background if turned off.
  - Generates all-in-one Single-Scan QR code containing both Wi-Fi hotspot credentials and HTTP server URL.
  - Fallback support for hospital LAN / Wi-Fi IP if hotspot is unconfigured.
- [x] **Header UI & Modal** (`src/components/Header.tsx`):
  - "Hubungkan HP" button positioned cleanly to the left of the live clock.
  - Shows QR code, active SSID / LAN status badge, and server URL.
- [x] **Hardware Diagnostic Error Codes** (`src/lib/deviceDiagnostics.ts`):
  - Granular error classification: `USB_DISCONNECTED`, `NO_HDMI_SIGNAL`, `DEVICE_HARDWARE_ERROR`, `USG_OUTPUT_ERROR`.
  - Formatted user-friendly Indonesian toast messages + collapsable IT support diagnostic badge.
- [x] **Mobile App Prompt Specification** (`REMOTE.md`):
  - Complete prompt specification for `usg-remote` Expo React Native application.
  - Detailed single-scan Wi-Fi auto-connect and server pairing flow using `react-native-wifi-reborn` and Axios status polling.

## Phase 7 — Bidirectional Kiosk & Remote Synchronization ✅ COMPLETE
- [x] **Draft State Management** (`src/lib/recorder.ts`):
  - Added `draftPatientId` in global singleton to store patient ID entered before recording starts.
- [x] **Draft Sync API Endpoint** (`src/app/api/record/draft/route.ts`):
  - Handles `POST` (update draft ID) and `GET` with CORS support for mobile remote.
- [x] **Status Route Update** (`src/app/api/record/status/route.ts`):
  - Returns `draftPatientId` and sets `patientId` to draft ID when not recording.
- [x] **Active Kiosk Screen Polling** (`src/app/recorder/page.tsx`):
  - 500ms status poll switches screen to "Sedang merekam" and syncs timer when remote triggers recording.
  - Bidirectional draft sync reflects remote keypad input onto the laptop display with typing debounce race-condition protection.
- [x] **Physical Keyboard / Touch Keypad Broadcast** (`src/app/recorder/page.tsx`):
  - Typing on the laptop automatically broadcasts draft ID to the server so mobile keypad mirrors it.
- [x] **Start Transition Sync (`isStarting`)** (`src/lib/recorder.ts`, `status/route.ts`):
  - Laptop button switches to "MENYIAPKAN..." during capture initialization even when triggered from mobile.
- [x] **Diagnostic Error Toast Sync (`lastError`)** (`src/app/recorder/page.tsx`, `start/route.ts`):
  - When capture card is disconnected (`USB_DISCONNECTED`) or errors occur, the server broadcasts `lastError` with a timestamp so the laptop kiosk immediately renders the floating red diagnostic toast.

## 📋 Testing & Verification Steps
1. Install `installer\dist\USGRecorder-Setup-1.0.0.exe` to `C:\Program Files\USG Recorder`.
2. Verify SQLite and video storage are placed in `C:\ProgramData\USG Recorder\storage`.
3. Verify `C:\ProgramData\USG Recorder\storage\logs\server.log` has clean server startup logs.
4. Reboot Windows to verify:
   - Mobile Hotspot activates automatically with configured SSID.
   - Kiosk browser opens automatically in fullscreen on the desktop.
5. In the kiosk header, click **"Hubungkan HP"** to verify the Single-Scan QR code.
6. In `usg-remote`, scan the QR code to connect and remote-control recording.

## Notes for Next AI
- All app source code in `src/`
- Recorder global state: `src/lib/recorder.ts`
- Device diagnostics: `src/lib/deviceDiagnostics.ts`
- DB module: `src/lib/db.ts` (SQLite, `storage/usg_records.db`)
- R2 upload: `src/lib/r2.ts`
- FFmpeg resolver: `src/lib/ffmpeg.ts`
- API routes:
  - `src/app/api/record/start/route.ts`
  - `src/app/api/record/stop/route.ts`
  - `src/app/api/record/status/route.ts`
  - `src/app/api/system/network/route.ts`
- UI: `src/app/recorder/page.tsx` & `src/components/Header.tsx`
- Startup scripts: `scripts/run-kiosk.ps1`, `scripts/enable-hotspot.ps1`, `scripts/run-kiosk.vbs`
- Mobile Remote App Prompt: `REMOTE.md`
- Env vars: see `.env.local.example`
