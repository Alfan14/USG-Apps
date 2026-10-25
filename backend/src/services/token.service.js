import crypto from "crypto";
import jwt from "jsonwebtoken";
import { and, eq, isNull, or } from "drizzle-orm";
import { env } from "../config/env.js";
import { db } from "../db/index.js";
import { patients, patientSessions } from "../db/schema.js";
import { generateRefreshToken, hashToken, safeEqualHex } from "../utils/security.js";
import { audit } from "./audit.service.js";

export const JWT_ISSUER = "usg-backend";
export const JWT_AUDIENCE = "usg-mobile";

export function signAccessToken(patientId, sessionId) {
  return jwt.sign({ sid: sessionId }, env.JWT_SECRET, {
    algorithm: "HS256",
    subject: patientId,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn: `${env.ACCESS_TOKEN_TTL_MIN}m`,
  });
}

const tokenPayload = (patientId, sessionId, refreshToken) => ({
  access_token: signAccessToken(patientId, sessionId),
  refresh_token: refreshToken,
  token_type: "Bearer",
  expires_in: env.ACCESS_TOKEN_TTL_MIN * 60,
});

/** Cabut semua sesi aktif milik pasien. */
export async function revokeAllSessions(patientId) {
  await db
    .update(patientSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(patientSessions.patientId, patientId), isNull(patientSessions.revokedAt)));
}

/**
 * Buat sesi baru. Kebijakan ketat: hanya 1 sesi aktif per pasien (sesi lama dicabut).
 */
export async function createSession(patient, req) {
  await revokeAllSessions(patient.id);

  const sessionId = crypto.randomUUID();
  const refreshToken = generateRefreshToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(patientSessions).values({
    id: sessionId,
    patientId: patient.id,
    refreshTokenHash: hashToken(refreshToken),
    deviceHash: req.deviceHash,
    ip: req.ip ? String(req.ip).slice(0, 64) : null,
    userAgent: (req.headers["user-agent"] || "").slice(0, 255) || null,
    lastUsedAt: now,
    expiresAt,
  });

  return tokenPayload(patient.id, sessionId, refreshToken);
}

/**
 * Tukar refresh token dengan pasangan token baru (rotasi).
 * Mengembalikan { ok: true, patient, tokens } atau { ok: false, reason }.
 */
export async function rotateSession(refreshToken, req) {
  const hash = hashToken(refreshToken);

  const rows = await db
    .select()
    .from(patientSessions)
    .where(or(eq(patientSessions.refreshTokenHash, hash), eq(patientSessions.prevRefreshTokenHash, hash)))
    .limit(1);
  const session = rows[0];
  if (!session) return { ok: false, reason: "unknown_token" };

  const now = new Date();
  if (session.revokedAt || session.expiresAt <= now) return { ok: false, reason: "session_inactive" };

  // Token lama dipakai lagi = kemungkinan token dicuri. Cabut sesi.
  if (session.refreshTokenHash !== hash) {
    await db.update(patientSessions).set({ revokedAt: now }).where(eq(patientSessions.id, session.id));
    await audit("refresh_reuse_detected", { patientId: session.patientId, req });
    return { ok: false, reason: "token_reuse" };
  }

  if (!safeEqualHex(session.deviceHash, req.deviceHash)) {
    await db.update(patientSessions).set({ revokedAt: now }).where(eq(patientSessions.id, session.id));
    await audit("refresh_device_mismatch", { patientId: session.patientId, req });
    return { ok: false, reason: "device_mismatch" };
  }

  const patientRows = await db.select().from(patients).where(eq(patients.id, session.patientId)).limit(1);
  const patient = patientRows[0];
  if (!patient || patient.status !== "active" || !safeEqualHex(patient.boundDeviceHash, req.deviceHash)) {
    await db.update(patientSessions).set({ revokedAt: now }).where(eq(patientSessions.id, session.id));
    return { ok: false, reason: "account_inactive" };
  }

  const newRefresh = generateRefreshToken();
  const [result] = await db
    .update(patientSessions)
    .set({
      prevRefreshTokenHash: hash,
      refreshTokenHash: hashToken(newRefresh),
      lastUsedAt: now,
    })
    .where(
      and(
        eq(patientSessions.id, session.id),
        eq(patientSessions.refreshTokenHash, hash),
        isNull(patientSessions.revokedAt)
      )
    );

  // Dua refresh bersamaan: hanya satu yang menang.
  if (!result || result.affectedRows !== 1) return { ok: false, reason: "race" };

  return { ok: true, patient, tokens: tokenPayload(patient.id, session.id, newRefresh) };
}

export async function revokeSession(sessionId) {
  await db.update(patientSessions).set({ revokedAt: new Date() }).where(eq(patientSessions.id, sessionId));
}