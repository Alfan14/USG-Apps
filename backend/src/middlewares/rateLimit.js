import rateLimit from "express-rate-limit";

/**
 * Batas request per IP (disimpan di memori proses; jika backend dijalankan lebih dari
 * satu instance, pindahkan store ke Redis). Pastikan TRUST_PROXY benar di belakang proxy.
 */
const tooMany = (message) => (req, res) =>
  res.status(429).json({
    success: false,
    error: "Too Many Requests",
    code: "RATE_LIMITED",
    message,
  });

const base = { standardHeaders: "draft-7", legacyHeaders: false };

// login & refresh
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  handler: tooMany("Terlalu banyak percobaan. Coba lagi beberapa menit lagi."),
});

// registrasi (lebih ketat karena menebak RM + nama)
export const registerLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 10,
  handler: tooMany("Terlalu banyak percobaan pendaftaran. Coba lagi nanti atau hubungi bagian pendaftaran RS."),
});

// endpoint perangkat recorder / admin
export const deviceLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 120,
  handler: tooMany("Terlalu banyak request dari perangkat ini."),
});