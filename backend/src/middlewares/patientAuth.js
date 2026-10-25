import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { env } from "../config/env.js";
import { db } from "../db/index.js";
import { patients, patientSessions } from "../db/schema.js";
import { JWT_AUDIENCE, JWT_ISSUER } from "../services/token.service.js";
import { audit } from "../services/audit.service.js";
import { attachDeviceHash } from "./deviceId.js";
import { safeEqualHex } from "../utils/security.js";

const deny = (res, status, code, message) =>
  res.status(status).json({ success: false, error: status === 403 ? "Forbidden" : "Unauthorized", code, message });

/**
 * Autentikasi pasien. Request lolos hanya jika SEMUA benar:
 *  1. Bearer JWT valid (HS256, issuer, audience, belum kedaluwarsa)
 *  2. Sesi di database masih aktif (belum dicabut / kedaluwarsa)
 *  3. Akun berstatus `active`
 *  4. Header X-Device-Id cocok dengan perangkat yang terkunci pada akun dan sesi
 */
export async function patientAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return deny(res, 401, "TOKEN_MISSING", "Token autentikasi tidak ada.");
  }
  if (!attachDeviceHash(req)) {
    return deny(res, 400, "DEVICE_ID_REQUIRED", "Header X-Device-Id tidak ada atau formatnya tidak valid.");
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.slice(7), env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return deny(res, 401, "TOKEN_EXPIRED", "Token kedaluwarsa.");
    }
    return deny(res, 401, "TOKEN_INVALID", "Token tidak valid.");
  }

  if (!decoded?.sub || !decoded?.sid) {
    return deny(res, 401, "TOKEN_INVALID", "Token tidak valid.");
  }

  try {
    const rows = await db
      .select({ session: patientSessions, patient: patients })
      .from(patientSessions)
      .innerJoin(patients, eq(patients.id, patientSessions.patientId))
      .where(eq(patientSessions.id, decoded.sid))
      .limit(1);

    const row = rows[0];
    const now = new Date();

    if (
      !row ||
      row.session.patientId !== decoded.sub ||
      row.session.revokedAt ||
      row.session.expiresAt <= now
    ) {
      return deny(res, 401, "SESSION_INVALID", "Sesi tidak valid. Silakan masuk kembali.");
    }

    if (row.patient.status !== "active") {
      return deny(res, 403, "ACCOUNT_LOCKED", "Akun dikunci. Hubungi bagian pendaftaran RS.");
    }

    if (
      !safeEqualHex(row.session.deviceHash, req.deviceHash) ||
      !safeEqualHex(row.patient.boundDeviceHash, req.deviceHash)
    ) {
      await audit("device_mismatch", { patientId: row.patient.id, req, detail: { via: "patientAuth" } });
      return deny(res, 403, "DEVICE_NOT_RECOGNIZED", "Perangkat tidak dikenali untuk akun ini.");
    }

    req.patient = row.patient;
    req.authSession = row.session;
    return next();
  } catch (error) {
    return next(error);
  }
}