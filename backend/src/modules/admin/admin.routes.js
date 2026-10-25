import { Router } from "express";
import crypto from "crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { env } from "../../config/env.js";
import { db } from "../../db/index.js";
import { patients } from "../../db/schema.js";
import { deviceAuth } from "../../middlewares/deviceAuth.js";
import { deviceLimiter } from "../../middlewares/rateLimit.js";
import { validate } from "../../middlewares/validate.js";
import { audit } from "../../services/audit.service.js";
import { revokeAllSessions } from "../../services/token.service.js";
import { isValidRm, normalizeRm } from "../../utils/security.js";

/**
 * Endpoint petugas RS (dipakai aplikasi admin/recorder). Dilindungi kunci perangkat.
 * Pasien TIDAK bisa memanggil endpoint ini.
 */
const router = Router();
router.use(deviceLimiter, deviceAuth);

const rmParam = z.object({
  rm: z.string().trim().transform(normalizeRm).refine(isValidRm, "No. RM harus berformat RM-angka"),
});

const createPatientSchema = z.object({
  patient_identifier: z.string().trim().transform(normalizeRm).refine(isValidRm, "No. RM harus berformat RM-angka"),
  name: z.string().trim().min(3).max(150),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  phone: z.string().trim().max(30).optional(),
  gestational_age_weeks: z.coerce.number().int().min(0).max(45).optional(),
});

const summary = (p) => ({
  id: p.id,
  patient_identifier: p.patientIdentifier,
  name: p.name,
  status: p.status,
  claim_expires_at: p.claimExpiresAt,
  claimed_at: p.claimedAt,
  device_bound: Boolean(p.boundDeviceHash),
});

async function findByRm(rm) {
  const rows = await db.select().from(patients).where(eq(patients.patientIdentifier, rm)).limit(1);
  return rows[0] || null;
}

const notFound = (res) =>
  res.status(404).json({ success: false, error: "Not Found", message: "Pasien tidak ditemukan." });

/**
 * @openapi
 * /api/v1/device/patients:
 *   post:
 *     summary: Daftarkan pasien baru (pendaftaran offline) atau perbarui data pasien yang belum diklaim
 *     tags:
 *       - Admin
 *     security:
 *       - DeviceAuth: []
 *     responses:
 *       201:
 *         description: Pasien terdaftar (status unclaimed)
 *       409:
 *         description: Pasien sudah mengklaim akun, data tidak bisa ditimpa
 */
router.post("/patients", validate({ body: createPatientSchema }), async (req, res, next) => {
  try {
    const { patient_identifier, name, birth_date, phone, gestational_age_weeks } = req.body;
    const existing = await findByRm(patient_identifier);

    if (existing) {
      if (existing.status !== "unclaimed") {
        return res.status(409).json({
          success: false,
          error: "Conflict",
          code: "PATIENT_ALREADY_CLAIMED",
          message: "Pasien sudah memiliki akun. Nama dan data identitas dikunci.",
        });
      }
      await db
        .update(patients)
        .set({
          name,
          birthDate: birth_date ?? existing.birthDate,
          phone: phone ?? existing.phone,
          gestationalAgeWeeks: gestational_age_weeks ?? existing.gestationalAgeWeeks,
        })
        .where(eq(patients.id, existing.id));
      await audit("patient_updated_by_admin", { patientId: existing.id, req });
      return res.status(200).json({ success: true, patient: summary({ ...existing, name }) });
    }

    const created = {
      id: crypto.randomUUID(),
      patientIdentifier: patient_identifier,
      name,
      birthDate: birth_date ?? null,
      phone: phone ?? null,
      gestationalAgeWeeks: gestational_age_weeks ?? 0,
      status: "unclaimed",
    };
    await db.insert(patients).values(created);
    await audit("patient_created_by_admin", { patientId: created.id, req });
    return res.status(201).json({ success: true, patient: summary({ ...created, claimExpiresAt: null }) });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/device/patients/{rm}/open-claim:
 *   post:
 *     summary: Buka kembali jendela registrasi untuk pasien yang belum mendaftar
 *     tags:
 *       - Admin
 *     security:
 *       - DeviceAuth: []
 */
router.post("/patients/:rm/open-claim", validate({ params: rmParam }), async (req, res, next) => {
  try {
    const patient = await findByRm(req.params.rm);
    if (!patient) return notFound(res);
    if (patient.status !== "unclaimed") {
      return res.status(409).json({ success: false, error: "Conflict", message: "Pasien sudah memiliki akun." });
    }
    const until = new Date(Date.now() + env.CLAIM_WINDOW_HOURS * 60 * 60 * 1000);
    await db
      .update(patients)
      .set({ claimExpiresAt: until, failedAttempts: 0, lockedUntil: null })
      .where(eq(patients.id, patient.id));
    await audit("claim_window_opened", { patientId: patient.id, req, detail: { by: "admin" } });
    return res.status(200).json({ success: true, claim_open_until: until });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/device/patients/{rm}/lock:
 *   post:
 *     summary: Kunci akun pasien (semua sesi dicabut)
 *     tags:
 *       - Admin
 *     security:
 *       - DeviceAuth: []
 */
router.post("/patients/:rm/lock", validate({ params: rmParam }), async (req, res, next) => {
  try {
    const patient = await findByRm(req.params.rm);
    if (!patient) return notFound(res);
    await db.update(patients).set({ status: "locked" }).where(eq(patients.id, patient.id));
    await revokeAllSessions(patient.id);
    await audit("patient_locked", { patientId: patient.id, req });
    return res.status(200).json({ success: true, status: "locked" });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/device/patients/{rm}/unlock:
 *   post:
 *     summary: Buka kunci akun pasien
 *     tags:
 *       - Admin
 *     security:
 *       - DeviceAuth: []
 */
router.post("/patients/:rm/unlock", validate({ params: rmParam }), async (req, res, next) => {
  try {
    const patient = await findByRm(req.params.rm);
    if (!patient) return notFound(res);
    const status = patient.passwordHash ? "active" : "unclaimed";
    await db
      .update(patients)
      .set({ status, failedAttempts: 0, lockedUntil: null })
      .where(eq(patients.id, patient.id));
    await audit("patient_unlocked", { patientId: patient.id, req, detail: { status } });
    return res.status(200).json({ success: true, status });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/device/patients/{rm}/reset-device:
 *   post:
 *     summary: Lepas kunci perangkat (pasien ganti HP). Perangkat berikutnya yang login berhasil akan terkunci.
 *     tags:
 *       - Admin
 *     security:
 *       - DeviceAuth: []
 */
router.post("/patients/:rm/reset-device", validate({ params: rmParam }), async (req, res, next) => {
  try {
    const patient = await findByRm(req.params.rm);
    if (!patient) return notFound(res);
    await db.update(patients).set({ boundDeviceHash: null }).where(eq(patients.id, patient.id));
    await revokeAllSessions(patient.id);
    await audit("device_reset", { patientId: patient.id, req });
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;