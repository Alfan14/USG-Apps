export interface DiagnosticResult {
  code:
    | "USB_DISCONNECTED"
    | "NO_HDMI_SIGNAL"
    | "DEVICE_HARDWARE_ERROR"
    | "USG_OUTPUT_ERROR"
    | "UNKNOWN_ERROR";
  message: string;
  details: string;
}

/**
 * Analyzes FFmpeg stderr output and process status to produce clear,
 * actionable clinical error messages for the recorder kiosk:
 * 1. USB capture belum nancep (USB disconnected)
 * 2. USB capture tidak dapat sinyal HDMI (No HDMI signal from USG)
 * 3. USB capture rusak / in use (Hardware or driver locked)
 * 4. Mesin USG output error (Format or resolution incompatible)
 */
export function diagnoseRecordingError(
  rawStderr: string,
  configuredDevice: string,
  isTimeout: boolean = false
): DiagnosticResult {
  const lowerErr = rawStderr.toLowerCase();

  // 1. USB Capture Card Not Plugged In / Disconnected
  const isDeviceNotFound =
    lowerErr.includes("could not find video device") ||
    lowerErr.includes("cannot find video device") ||
    lowerErr.includes("unable to find video device") ||
    lowerErr.includes("no such device");

  if (isDeviceNotFound) {
    return {
      code: "USB_DISCONNECTED",
      message:
        "USB capture card belum terpasang. Pastikan kabel USB capture card sudah menancap ke laptop.",
      details: `Device "${configuredDevice}" was not found among DirectShow sources.`,
    };
  }

  // 2. USB Capture Card Hardware / Driver Error / In Use
  const isHardwareOrLockError =
    lowerErr.includes("in use by another application") ||
    lowerErr.includes("cannot run the directshow graph") ||
    lowerErr.includes("could not run graph") ||
    lowerErr.includes("0x8007001f") || // A device attached to the system is not functioning
    lowerErr.includes("0x80070005") || // Access denied
    lowerErr.includes("device does not recognize the command") ||
    lowerErr.includes("failed to allocate buffer") ||
    lowerErr.includes("cannot open video device") ||
    lowerErr.includes("i/o error");

  if (isHardwareOrLockError) {
    return {
      code: "DEVICE_HARDWARE_ERROR",
      message:
        "USB capture card mengalami gangguan hardware atau sedang digunakan aplikasi lain. Cabut lalu pasang kembali kabel USB capture card.",
      details: rawStderr.slice(-300).trim(),
    };
  }

  // 3. USG Output Error / Signal Format Incompatible
  const isFormatError =
    lowerErr.includes("device does not support the requested format") ||
    lowerErr.includes("unsupported pixel format") ||
    lowerErr.includes("cannot find a suitable format") ||
    lowerErr.includes("hr = 0x80004005") ||
    lowerErr.includes("could not negotiate stream format") ||
    lowerErr.includes("invalid argument");

  if (isFormatError) {
    return {
      code: "USG_OUTPUT_ERROR",
      message:
        "Format output video mesin USG tidak kompatibel dengan capture card. Periksa pengaturan resolusi atau output video pada mesin USG.",
      details: rawStderr.slice(-300).trim(),
    };
  }

  // 4. USB Capture Not Receiving HDMI Signal from USG Machine (Timeout waiting for frames)
  if (isTimeout || lowerErr.includes("timed out") || lowerErr.includes("too full")) {
    return {
      code: "NO_HDMI_SIGNAL",
      message:
        "USB capture card tidak menerima sinyal HDMI. Pastikan mesin USG menyala dan kabel HDMI terpasang dengan baik.",
      details: `Device opened successfully, but timed out after 8s with 0 video frames captured.`,
    };
  }

  // 5. Fallback for any other unexpected error
  const cleanSnippet = rawStderr
    .split("\n")
    .filter((l) => l.trim() && !l.includes("built with gcc"))
    .slice(-2)
    .join(" ")
    .trim();

  return {
    code: "UNKNOWN_ERROR",
    message: cleanSnippet
      ? `Gagal memulai perekaman: ${cleanSnippet}`
      : "Gagal memulai perekaman. Periksa koneksi hardware USG dan capture card.",
    details: rawStderr.slice(-300).trim(),
  };
}
