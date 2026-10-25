
# BUILD.md

## Overview

This document describes how to build and package the USG Recorder application for Windows.

The application is a self-hosted Next.js full-stack application designed to run on a dedicated Windows laptop connected to an ultrasound machine through an HDMI capture card.

The final installation should not require the operator to manually install Node.js, npm, FFmpeg, or configure browser startup.

## Application Architecture

```text
Ultrasound HDMI OUT
        ↓
HDMI Capture Card
        ↓
Windows Recorder Laptop
        ↓
Next.js Production Server
        ├── Recorder UI
        ├── API Routes
        ├── FFmpeg
        └── Cloudflare R2
```

The Next.js server runs locally on the recorder laptop.

Example:

```text
http://localhost:3000/recorder
```

## Development Build

Install dependencies:

```bash
npm install
```

Run development mode:

```bash
npm run dev
```

The development server is intended only for development.

Do not use development mode for the production recorder installation.

## Production Build

Use Next.js standalone output.

The project should have:

```ts
const nextConfig = {
  output: "standalone",
};

export default nextConfig;
```

Build:

```bash
npm run build
```

The production application should be runnable without installing the complete project dependencies.

Expected output:

```text
.next/
└── standalone/
    ├── server.js
    ├── node_modules/
    └── ...
```

The production server should be started using the bundled Node.js runtime:

```text
node.exe server.js
```

Do not require the target computer to have Node.js installed separately.

## Node.js Runtime

The Windows installer should bundle a compatible Node.js runtime.

Expected installation structure:

```text
USG Recorder/
├── app/
│   └── server.js
├── runtime/
│   └── node.exe
├── ffmpeg/
│   └── ffmpeg.exe
├── config/
└── scripts/
```

The exact directory structure may change during implementation, but the application must remain self-contained.

## FFmpeg

FFmpeg is required for ultrasound video capture.

The production installer should bundle the required Windows FFmpeg executable.

Do not require the operator to manually install FFmpeg.

The application should reference the bundled executable using a known application-relative path.

Example:

```text
ffmpeg/ffmpeg.exe
```

Do not assume `ffmpeg` is globally available in the Windows PATH.

## Environment Configuration

Production secrets and configuration must not be hardcoded into the source code.

Required R2 configuration may include:

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT=
```

The installer or first-run configuration may provide these values.

Never expose secret R2 credentials to browser/client-side code.

## Windows Installer

The production application should eventually be distributed as a Windows installer.

Recommended installer requirements:

* Install the complete application.
* Bundle Node.js runtime.
* Bundle FFmpeg.
* Create required application directories.
* Configure production environment.
* Detect an installed supported browser.
* Configure automatic application startup.
* Configure browser kiosk startup.
* Create shortcuts only when useful.
* Start the recorder after installation if appropriate.

The target laptop should not require:

```text
Node.js installation
npm installation
FFmpeg installation
manual browser configuration
manual startup-script configuration
```

## Browser Detection

The installer should detect a supported Chromium-based browser.

Preferred order:

```text
1. Microsoft Edge
2. Google Chrome
```

If Edge exists, prefer Edge.

If Edge does not exist but Chrome exists, use Chrome.

If neither is available, the installer should clearly report that a supported browser is required.

Do not download or silently install a browser unless explicitly implemented as a separate requirement.

## Kiosk Mode

The recorder UI should automatically open in fullscreen/kiosk mode.

Microsoft Edge example:

```text
msedge.exe --kiosk http://localhost:3000/recorder --edge-kiosk-type=fullscreen
```

Chrome example:

```text
chrome.exe --kiosk http://localhost:3000/recorder
```

The exact browser executable path must be detected rather than hardcoded to a single machine-specific path.

## Windows Startup

The recorder is intended to start automatically after Windows boot.

The installer should create a Windows Task Scheduler task rather than relying solely on the user's Startup folder.

Startup sequence:

```text
Windows boot
    ↓
Start Next.js production server
    ↓
Wait until localhost:3000 is available
    ↓
Launch selected browser
    ↓
Open /recorder in kiosk mode
```

The startup process must not launch the browser before the Next.js server is ready.

## Process Recovery

The production setup should be able to recover from application crashes where practical.

At minimum:

* Next.js server should be restartable.
* Browser should be reopenable.
* Recording state must not become permanently stuck after an application crash.
* Local recording files must not be deleted before successful upload.

Do not introduce a complex process manager unless necessary.

## Application Port

The recorder should use a predictable local port.

Default:

```text
3000
```

If the project requires another port, update all startup scripts and documentation consistently.

Do not expose the recorder UI publicly unless explicitly required.

## R2 Upload

Production upload flow:

```text
FFmpeg
  ↓
Local MP4
  ↓
Next.js server
  ↓
Cloudflare R2
  ↓
Upload confirmed
  ↓
Mark recording as completed
```

The local MP4 must remain available until R2 confirms a successful upload.

Failed uploads should remain retryable.

## Build Verification

Before creating the installer, verify:

```text
[ ] npm install succeeds
[ ] npm run build succeeds
[ ] standalone server starts
[ ] /recorder loads
[ ] API routes work
[ ] FFmpeg executable is detected
[ ] recording can start
[ ] recording can stop
[ ] MP4 is produced
[ ] R2 upload succeeds
[ ] failed upload does not delete local MP4
[ ] browser kiosk mode works
[ ] Windows startup works
```

## Installer Verification

Test the installer on a clean Windows environment where possible.

Verify that the target machine does not depend on the developer's environment.

Specifically verify:

```text
[ ] Node.js does not need to be installed manually
[ ] FFmpeg does not need to be installed manually
[ ] Browser is detected correctly
[ ] Task Scheduler entry is created
[ ] Next.js starts after reboot
[ ] Browser opens automatically
[ ] Browser opens in kiosk mode
[ ] Recorder page loads
[ ] Recording workflow works
[ ] R2 upload works
```

## Development Without Capture Card

The HDMI capture card may be unavailable during development.

The application should support a mock recording mode while the capture hardware is unavailable.

Mock mode must preserve the same application state flow:

```text
READY
  ↓
RECORDING
  ↓
STOPPING
  ↓
UPLOADING
  ↓
COMPLETED / FAILED
```

When the real capture card becomes available, replace the mock capture implementation with the actual FFmpeg capture implementation.

Do not redesign the recorder UI or API solely because the capture source changes.

## Important Rules

* Keep the application as a single Next.js full-stack project.
* Do not add a separate recorder server.
* Do not require Node.js installation on production machines.
* Do not require global FFmpeg installation.
* Do not hardcode browser paths.
* Do not expose R2 credentials to the client.
* Do not use Vercel/serverless deployment for the recorder laptop.
* Do not add unnecessary infrastructure.
* The `design/` directory remains the authoritative UI reference.
*  | Production packaging should hide technical complexity from the hospital operator. |
  | :---------------------------------------------------------------------------------: |
