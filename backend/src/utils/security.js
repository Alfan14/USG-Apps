import crypto from "crypto";

/**
 * Util keamanan murni (hanya memakai modul `crypto` bawaan Node) agar mudah diuji.
 */

export const RM_REGEX = /^RM-\d{4,12}$/;
export const DEVICE_ID_REGEX = /^[A-Za-z0-9-]{16,64}$/;

export const sha256 = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");

/** "  rm-20418 " -> "RM-20418" */
export const normalizeRm = (input) => String(input ?? "").trim().toUpperCase();
export const isValidRm = (rm) => RM_REGEX.test(rm);

/**
 * Normalisasi nama untuk pencocokan: huruf kecil, tanpa aksen/tanda baca/angka,
 * spasi dirapikan. "  Siti   RAHMA " -> "siti rahma"
 */
export const normalizeName = (input) =>
  String(input ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Bandingkan dua hex string dengan waktu konstan. */
export function safeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length === 0 || ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** Bandingkan dua string biasa dengan waktu konstan (lewat hash agar panjang tidak bocor). */
export const safeEqualString = (a, b) => safeEqualHex(sha256(a), sha256(b));

/** Cocokkan nama input dengan nama di rekam medis. Nama kosong setelah normalisasi = tidak cocok. */
export function namesMatch(input, stored) {
  const a = normalizeName(input);
  const b = normalizeName(stored);
  if (!a || !b) return false;
  return safeEqualString(a, b);
}

/** ID instalasi aplikasi -> hash HMAC (server tidak menyimpan ID mentah). */
export const hashDeviceId = (deviceId, secret) =>
  crypto.createHmac("sha256", secret).update(`device:${deviceId}`).digest("hex");

/** Refresh token acak 384-bit; yang disimpan di DB hanya hash-nya. */
export const generateRefreshToken = () => crypto.randomBytes(48).toString("base64url");
export const hashToken = (token) => sha256(`refresh:${token}`);

export const normalizeEmail = (email) => String(email ?? "").trim().toLowerCase();