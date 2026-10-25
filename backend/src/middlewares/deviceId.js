import { env } from "../config/env.js";
import { DEVICE_ID_REGEX, hashDeviceId } from "../utils/security.js";

/**
 * Membaca header `X-Device-Id` (ID instalasi yang dibuat otomatis oleh aplikasi mobile,
 * pengguna tidak perlu mengisi apa pun) dan menaruh hash-nya di `req.deviceHash`.
 * Mengembalikan true jika valid.
 */
export function attachDeviceHash(req) {
  const raw = req.headers["x-device-id"];
  if (typeof raw !== "string" || !DEVICE_ID_REGEX.test(raw)) return false;
  req.deviceHash = hashDeviceId(raw, env.JWT_SECRET);
  return true;
}

export function requireDeviceId(req, res, next) {
  if (!attachDeviceHash(req)) {
    return res.status(400).json({
      success: false,
      error: "Bad Request",
      code: "DEVICE_ID_REQUIRED",
      message: "Header X-Device-Id tidak ada atau formatnya tidak valid.",
    });
  }
  return next();
}