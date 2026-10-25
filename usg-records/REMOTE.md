# REMOTE.md — Prompt Specification for USG Remote Control Mobile App

> **How to use this file:**
> Copy and paste the prompt below into an AI coding assistant (e.g. Claude, Cursor, Antigravity) in a new, empty repository directory (or mobile workspace `usg-remote/`) to generate the complete React Native Expo mobile remote application from scratch.

---

```markdown
# Role & Project Goal
You are a senior mobile engineer specializing in **React Native** and **Expo**. Build a production-grade, tactile, low-latency mobile remote control application for doctors and nurses in ultrasound (USG) examination rooms.

The mobile app (`usg-remote`) connects to a local laptop kiosk (`usg-record`) over local Wi-Fi or Windows Mobile Hotspot via **Single-Scan QR Code Pairing**, allowing the doctor/nurse to:
1. Scan a single QR code displayed on the laptop to **automatically join the laptop's Wi-Fi hotspot AND pair the app simultaneously** in under 3 seconds—without ever opening phone Wi-Fi settings or entering passwords.
2. Type the Patient ID on a big, tactile on-screen keypad.
3. Start ultrasound recording remotely from the patient bedside.
4. View live synchronized recording duration in real time (<1s polling sync).
5. Stop recording with haptic safety confirmation.

---

## 1. Architecture & Network Rationale

### Why Single-Scan Wi-Fi Hotspot Instead of Bluetooth or Hospital LAN?
- **Hospital LAN Limitations:**
  - In clinical environments, the laptop is frequently plugged into a wall Ethernet cable on a restricted VLAN (e.g., `10.20.x.x`).
  - Hospital staff Wi-Fi (e.g., `172.16.x.x`) enforces **Client / AP Isolation**, preventing smartphones from reaching the laptop directly.
  - Doctor cellular data (4G/5G) has no route to local hospital subnets.
- **Why Bluetooth BLE was Evaluated and Rejected:**
  - High pairing friction (scanning, OS pin confirmation dialogs).
  - High connection latency (1–3 second wake delay after idle).
  - Apple iOS blocks Classical Bluetooth (SPP/RFCOMM) without MFi hardware licensing.
  - Windows BLE GATT peripheral stack is brittle in desktop environments.
- **The Solution: Windows Mobile Hotspot + Single-Scan QR (<3ms latency):**
  - The laptop runs a local Next.js server on port 3000 (`http://192.168.137.1:3000`).
  - Windows Mobile Hotspot is automatically activated on boot and kept alive 24/7.
  - The laptop kiosk displays an all-in-one pairing QR code encoding both hotspot Wi-Fi credentials and the HTTP server URL.
  - The mobile app scans the QR code once: the OS prompts to join the hotspot, connects automatically, verifies server reachability, and lands directly on the remote control screen!

---

## 2. Tech Stack & Dependencies

- **Framework:** React Native with **Expo SDK 51+** (TypeScript).
- **Navigation:** Expo Router or React Navigation (`@react-navigation/native`, `@react-navigation/native-stack`).
- **Camera & QR Scanning:** `expo-camera` (using modern `CameraView` with `onBarcodeScanned`).
- **Automated Wi-Fi Joining:** `react-native-wifi-reborn` (enables single-scan Wi-Fi connection on Android and iOS).
- **Haptic Feedback:** `expo-haptics` (tactile vibrations on keypad touch, start, and stop).
- **Storage:** `@react-native-async-storage/async-storage` (persists paired server URL and Wi-Fi credentials).
- **HTTP Client:** `axios` (with 2.5s request timeout for snappy offline/reconnection detection).
- **Icons:** `lucide-react-native` or `@expo/vector-icons`.
- **Styling:** React Native `StyleSheet` with sleek dark mode aesthetics designed for dim ultrasound examination rooms.

---

## 3. Communication Protocol with Laptop Kiosk (`usg-record`)

### A. Pairing QR Code Payload Specification
The laptop endpoint `GET /api/system/network` generates a QR code with the following JSON schema.

> **How credentials are obtained (Option B — Live Query):**
> The server calls `enable-hotspot.ps1 -QueryOnly` to read the live SSID and password
> directly from Windows Mobile Hotspot settings — **no `.env` configuration is required**.
> `HOTSPOT_SSID` / `HOTSPOT_PASSWORD` in `.env.local` are optional overrides (e.g. to
> rename the network during installation).

#### 1. Single-Scan Hotspot Mode (Standard Clinic Setup):
```json
{
  "v": 1,
  "app": "usg-remote",
  "serverUrl": "http://192.168.137.1:3000",
  "wifi": {
    "ssid": "USG-DARMAYU-01",
    "password": "darmayu123",
    "security": "WPA2"
  }
}
```

#### 2. Hospital LAN / Hotspot Unavailable Fallback:

```json
{
  "v": 1,
  "app": "usg-remote",
  "serverUrl": "http://10.20.1.45:3000"
}
```

> **Note for Parser:** The mobile scanner must gracefully accept:
>
> 1. JSON payload with `wifi` object → Connect to Wi-Fi first, then test `serverUrl`.
> 2. JSON payload without `wifi` → Directly test `serverUrl` (LAN or manual setup).
> 3. Legacy / plain URL string (e.g. `http://192.168.1.50:3000`) → Directly test `serverUrl`.

---

### B. Health & Status Polling

- **Endpoint:** `GET /api/record/status`
- **Interval:** Poll every 1,000 ms while connected.
- **Response Format:**
  ```json
  {
    "state": "ready" | "starting" | "recording" | "uploading",
    "patientId": "12345678",
    "isRecording": true,
    "startedAt": 1791465495000,
    "durationSeconds": 45
  }
  ```
- **State Synchronization:**
  - If the laptop state changes to `recording`, the phone immediately switches to the live recording screen.
  - If the timer ticks on the laptop, the phone displays the exact synchronized elapsed time.

### C. Start Recording

- **Endpoint:** `POST /api/record/start`
- **Request Body:**
  ```json
  {
    "patientId": "12345678"
  }
  ```
- **Response Format (Success):**
  ```json
  {
    "success": true,
    "filename": "12345678-a8f3b2c1d4e5.mp4"
  }
  ```
- **Response Format (Diagnostic Error):**
  ```json
  {
    "success": false,
    "error": "USB capture card belum terpasang. Pastikan kabel USB capture card sudah menancap ke laptop.",
    "code": "USB_DISCONNECTED",
    "details": "Device \"USB Video\" was not found among DirectShow sources."
  }
  ```

### D. Stop Recording

- **Endpoint:** `POST /api/record/stop`
- **Request Body:** `{}`
- **Response Format:**
  ```json
  {
    "success": true,
    "message": "Perekaman selesai"
  }
  ```

---

## 4. UI / UX Design & Screen Flow

### Aesthetic Guidelines (Dim Ultrasound Clinic Dark Mode)

- **Background:** Deep dark slate (`#0B0F19` / `#0F172A`).
- **Cards & Keypad Buttons:** High-contrast slate navy (`#1E293B`) with active press states (`#334155`).
- **Accent Primary (Start):** Vibrant emerald green (`#10B981` / `#059669`).
- **Accent Danger (Stop):** Bold crimson red (`#EF4444` / `#DC2626`).
- **Typography:** Large, bold monospace font for Patient ID and Timer to ensure readability from 1.5 meters away.

---

### Screen 1: Single-Scan QR Code Pairing Screen (`PairingScreen`)

1. **Camera Scanner Viewfinder:**
   - Full-screen or large centered camera viewfinder with glowing target boundary box.
   - Real-time QR barcode listener (`barcodeScannerSettings={{ barcodeTypes: ["qr"] }}`).
   - Automatically parses scanned payload:
     - If `wifi` credentials are present:
       - Displays toast/overlay: *"Menyambungkan ke Hotspot USG..."*
       - Calls Wi-Fi join function (`WifiManager.connectToProtectedSSID`).
       - Waits for connection confirmation (~1.5s).
     - Displays overlay: *"Menghubungkan ke USG Recorder..."*
     - Pings `GET ${serverUrl}/api/record/status` (up to 3 retries, 1s apart).
     - On successful response: Triggers success haptic (`ImpactFeedbackStyle.Medium`), saves `serverUrl` to storage, and navigates to Controller Screen.
2. **Manual IP Fallback Input:**
   - Text input for IP address (e.g. `192.168.137.1:3000` or `192.168.1.50:3000`).
   - "Hubungkan Manual" button in case camera permission is denied or QR cannot be focused.
3. **Help & Setup Hint:**
   - Informative card: *"Buka aplikasi USG Recorder di laptop, klik 'Hubungkan HP' di pojok kanan atas, lalu arahkan kamera ke kode QR."*

---

### Screen 2: Remote Controller Screen (`ControllerScreen`)

#### Top Status Bar

- **Pill Badge:**
  - 🟢 **Terhubung** (`192.168.137.1` / Hotspot)
  - 🟡 **Menghubungkan kembali...** (saat request timeout)
  - 🔴 **Terputus**
- **Action Buttons:**
  - 🔄 **Refresh / Sync**
  - ⚙️ **Putus Koneksi** (clears saved server URL with confirmation dialog and returns to Pairing Screen).

---

#### State A: ID Input & Idle (`appState === "ready"`)

1. **Patient ID Display Box:**
   - Large centered number display with blinking cursor.
   - Max 20 digits.
   - Clear placeholder *"Ketik ID Pasien..."* if empty.
2. **Tactile 3x4 Numeric Keypad:**
   - Buttons: `[1] [2] [3]`, `[4] [5] [6]`, `[7] [8] [9]`, `[Hapus Semua] [0] [ ⌫ ]`.
   - Big touch targets (at least 72x72 dp).
   - Instant light haptic feedback on every tap (`Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`).
3. **Huge Start Recording Button:**
   - Full-width, prominent green button at the bottom: **`▶ MULAI REKAM`**.
   - Disabled and faded (`opacity: 0.4`) if `patientId` is empty.
   - When tapped: Triggers medium haptic, displays loading state, and sends `POST /api/record/start`.
   - If error returned (e.g. `USB_DISCONNECTED`): Displays clear alert with error message and IT diagnostic code.

---

#### State B: Active Recording (`appState === "recording"`)

1. **Patient ID Badge:**
   - Top banner displaying current active patient: `Pasien: #12345678`.
2. **Live Recording Status & Timer:**
   - Pulsing red dot with label **"SEDANG MEREKAM USG"**.
   - Massive digital timer display: `00:03:45` (HH:MM:SS) updated every second.
3. **Safety Stop Recording Button:**
   - Large, prominent red circular/rectangular button: **`⬛ STOP REKAMAN`**.
   - **Accidental Tap Safety:** Triggers haptic feedback (`NotificationFeedbackType.Warning`).
   - Confirmation modal: *"Hentikan perekaman untuk pasien 12345678?"* to prevent bumping the phone in the doctor's pocket.
   - When confirmed: Sends `POST /api/record/stop`.

---

#### State C: Starting & Uploading (`appState === "starting" | "uploading"`)

- Animated loading spinner with clear Indonesian status text:
  - *"Menyiapkan perekaman video USG..."* (when starting).
  - *"Mengunggah rekaman video ke Cloud..."* (when uploading).
- Buttons disabled during transition states to prevent duplicate commands.

---

## 5. Single-Scan Wi-Fi & Pairing Reference Implementation

```typescript
// src/services/pairingService.ts
import WifiManager from "react-native-wifi-reborn";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export interface QrPayload {
  v?: number;
  app?: string;
  serverUrl: string;
  wifi?: {
    ssid: string;
    password: string;
    security?: string;
  };
}

export function parseQrData(data: string): QrPayload | null {
  try {
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed.serverUrl === "string") {
      return parsed;
    }
  } catch {
    // Fallback: raw URL string
    if (data.startsWith("http://") || data.startsWith("https://")) {
      return { serverUrl: data.trim() };
    }
  }
  return null;
}

export async function pairWithKiosk(
  payload: QrPayload,
  onStatusUpdate?: (status: string) => void
): Promise<boolean> {
  // 1. Join Wi-Fi Hotspot if credentials are included in the QR
  if (payload.wifi?.ssid) {
    onStatusUpdate?.(`Menyambungkan ke Wi-Fi ${payload.wifi.ssid}...`);
    try {
      if (Platform.OS === "android") {
        await WifiManager.connectToProtectedSSID(
          payload.wifi.ssid,
          payload.wifi.password,
          false, // isWEP
          false  // isHidden
        );
      } else {
        // iOS NEHotspotConfiguration
        await WifiManager.connectToProtectedSSID(
          payload.wifi.ssid,
          payload.wifi.password,
          false,
          false
        );
      }
      // Brief pause to allow DHCP negotiation
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.warn("Wi-Fi auto-connect warning (device may already be connected):", err);
    }
  }

  // 2. Health check / reachability test with retry
  onStatusUpdate?.("Menghubungi USG Recorder...");
  let isHealthy = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await axios.get(`${payload.serverUrl}/api/record/status`, {
        timeout: 2500,
      });
      if (res.status === 200) {
        isHealthy = true;
        break;
      }
    } catch (err) {
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  if (!isHealthy) {
    throw new Error("Gagal terhubung ke laptop USG Recorder. Pastikan laptop menyala dan QR aktif.");
  }

  // 3. Persist paired server URL
  await AsyncStorage.setItem("usg_server_url", payload.serverUrl);
  return true;
}
```

---

## 6. Directory Structure

```text
usg-remote/
├── app/ (or src/)
│   ├── api/
│   │   ├── client.ts             # Axios instance with baseURL dynamic configuration
│   │   └── recorderApi.ts        # getStatus(), startRecording(), stopRecording()
│   ├── components/
│   │   ├── ConnectionBadge.tsx   # Top connectivity status pill
│   │   ├── Keypad.tsx            # 3x4 numeric keypad with haptic feedback
│   │   ├── IdDisplay.tsx         # Large patient ID LCD-style display
│   │   ├── BigButton.tsx         # Tactile Start / Stop huge buttons
│   │   └── RecordingTimer.tsx    # Pulsing timer display
│   ├── hooks/
│   │   ├── useRecorderStatus.ts  # Polling hook (1s interval) for live state sync
│   │   └── useHaptics.ts         # Haptic feedback helper
│   ├── screens/
│   │   ├── PairingScreen.tsx     # Single-Scan Camera QR Scanner & manual IP input
│   │   └── ControllerScreen.tsx  # Main remote control interface
│   ├── services/
│   │   └── pairingService.ts     # Wi-Fi auto-connect + server health check
│   ├── storage/
│   │   └── connectionStorage.ts  # AsyncStorage wrapper for paired server URL
│   └── App.tsx                   # Main app entry point with navigation
├── assets/                       # App icons and splash screen
├── app.json                      # Expo configuration (camera & wifi permissions)
├── package.json
└── tsconfig.json
```

---

## 7. Key Configuration Files

### `package.json`

```json
{
  "name": "usg-remote",
  "version": "1.0.0",
  "main": "expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios"
  },
  "dependencies": {
    "@react-native-async-storage/async-storage": "1.23.1",
    "axios": "^1.7.9",
    "expo": "~51.0.0",
    "expo-camera": "~15.0.13",
    "expo-haptics": "~13.0.1",
    "expo-status-bar": "~1.12.1",
    "lucide-react-native": "^0.453.0",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "react-native-safe-area-context": "4.10.5",
    "react-native-svg": "15.2.0",
    "react-native-wifi-reborn": "^4.11.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.45",
    "typescript": "~5.3.3"
  },
  "private": true
}
```

### `app.json` Permissions Snippet

```json
{
  "expo": {
    "name": "USG Remote",
    "slug": "usg-remote",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Izinkan USG Remote menggunakan kamera untuk memindai kode QR laptop."
        }
      ]
    ],
    "android": {
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.CHANGE_WIFI_STATE",
        "android.permission.ACCESS_WIFI_STATE"
      ]
    },
    "ios": {
      "entitlements": {
        "com.apple.developer.networking.HotspotConfiguration": true
      }
    }
  }
}
```

---

## 8. Setup & Run Instructions

1. **Install Dependencies:**
   ```bash
   npx create-expo-app -t blank-typescript usg-remote
   cd usg-remote
   npx expo install expo-camera expo-haptics @react-native-async-storage/async-storage lucide-react-native react-native-safe-area-context react-native-svg axios
   npm install react-native-wifi-reborn
   ```
2. **Build and Run (Native Wi-Fi requires development build or prebuild):**
   ```bash
   npx expo run:android
   # or
   npx expo run:ios
   ```
3. **Bedside Pairing Workflow:**
   - Tap **"Hubungkan HP"** on the laptop kiosk header to display the QR code.
   - Open the **USG Remote** app on the smartphone and point the camera at the laptop screen.
   - When prompted by iOS / Android to connect to the hotspot, tap **Join** / **Connect**.
   - The app verifies connectivity in ~1.5s and displays the large numeric keypad ready for Patient ID entry!

```

```
