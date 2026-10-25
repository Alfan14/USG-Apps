import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { env } from "../../config/env.js";
import { db } from "../../db/index.js";
import { patients } from "../../db/schema.js";
import { validate } from "../../middlewares/validate.js";
import { requireDeviceId } from "../../middlewares/deviceId.js";
import { patientAuth } from "../../middlewares/patientAuth.js";
import { authLimiter, registerLimiter } from "../../middlewares/rateLimit.js";
import { audit } from "../../services/audit.service.js";
import { createSession, revokeSession, rotateSession } from "../../services/token.service.js";
import { isValidRm, namesMatch, normalizeRm, safeEqualHex } from "../../utils/security.js";

const router = Router();

const BCRYPT_COST = 12;
// Hash palsu agar waktu respons sama baik akun ada maupun tidak (anti user-enumeration)
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_COST);

const emailSchema = z.string().trim().toLowerCase().email("Format email tidak valid").max(254);

const registerSchema = z.object({
  patient_identifier: z
    .string()
    .trim()
    .transform(normalizeRm)
    .refine(isValidRm, "No. RM harus berformat RM-angka (contoh: RM-20418)"),
  name: z.string().trim().min(3, "Nama terlalu pendek").max(150),
  email: emailSchema,
  password: z.string().min(8, "Kata sandi minimal 8 karakter").max(72, "Kata sandi maksimal 72 karakter"),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Kata sandi belum diisi").max(72),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(20).max(200),
});

const publicPatient = (p) => ({
  id: p.id,
  name: p.name,
  email: p.email,
  patient_identifier: p.patientIdentifier,
  gestational_age_weeks: p.gestationalAgeWeeks,
});

const REGISTER_REJECTED = {
  success: false,
  error: "Forbidden",
  code: "REGISTRATION_REJECTED",
  message:
    "Pendaftaran tidak dapat diproses. Pastikan No. RM dan nama sesuai, dan daftar segera setelah pemeriksaan USG. Jika masih gagal, hubungi bagian pendaftaran RS.",
};

const INVALID_CREDENTIALS = {
  success: false,
  error: "Unauthorized",
  code: "INVALID_CREDENTIALS",
  message: "Email atau kata sandi salah, atau akun dikunci sementara. Coba lagi nanti.",
};

const lockUntil = () => new Date(Date.now() + env.LOCK_MINUTES * 60 * 1000);

/** Naikkan hitungan gagal; kunci sementara jika sudah mencapai batas. */
async function registerFailure(patient) {
  const attempts = (patient.failedAttempts || 0) + 1;
  const patch =
    attempts >= env.MAX_FAILED_ATTEMPTS
      ? { failedAttempts: 0, lockedUntil: lockUntil() }
      : { failedAttempts: attempts };
  await db.update(patients).set(patch).where(eq(patients.id, patient.id));
}

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Klaim akun pasien (registrasi mobile)
 *     description: >
 *       Hanya bisa untuk pasien yang sudah didaftarkan RS dan sedang dalam jendela klaim
 *       (dibuka otomatis saat rekaman USG masuk). Akun lalu terkunci ke perangkat pertama.
 *       Wajib header X-Device-Id (dibuat otomatis oleh aplikasi).
 *     tags:
 *       - Patient Auth
 *     parameters:
 *       - in: header
 *         name: X-Device-Id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_identifier, name, email, password]
 *             properties:
 *               patient_identifier:
 *                 type: string
 *                 example: "RM-12345678"
 *               name:
 *                 type: string
 *                 example: "Siti Rahma"
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Akun diklaim, token diterbitkan
 *       403:
 *         description: Pendaftaran ditolak (pesan sengaja seragam)
 *       409:
 *         description: Email sudah dipakai
 */
router.post(
  "/register",
  registerLimiter,
  requireDeviceId,
  validate({ body: registerSchema }),
  async (req, res, next) => {
    try {
      const { patient_identifier, name, email, password } = req.body;
      const now = new Date();

      // Selalu lakukan hashing agar waktu respons tidak membedakan kasus.
      const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

      const rows = await db
        .select()
        .from(patients)
        .where(eq(patients.patientIdentifier, patient_identifier))
        .limit(1);
      const patient = rows[0];

      const reject = async (reason, extra) => {
        await audit("register_rejected", {
          patientId: patient?.id ?? null,
          req,
          detail: { reason, rm: patient_identifier },
        });
        if (extra) await extra();
        return res.status(403).json(REGISTER_REJECTED);
      };

      if (!patient) return reject("rm_not_found");
      if (patient.status !== "unclaimed") return reject("not_claimable");
      if (patient.lockedUntil && patient.lockedUntil > now) return reject("temporarily_locked");
      if (!patient.claimExpiresAt || patient.claimExpiresAt <= now) return reject("claim_window_closed");

      if (!namesMatch(name, patient.name)) {
        return reject("name_mismatch", () => registerFailure(patient));
      }

      // Klaim atomik: hanya satu request yang bisa menang.
      let result;
      try {
        [result] = await db
          .update(patients)
          .set({
            email,
            passwordHash,
            status: "active",
            claimedAt: now,
            claimExpiresAt: null,
            boundDeviceHash: req.deviceHash,
            failedAttempts: 0,
            lockedUntil: null,
          })
          .where(
            and(
              eq(patients.id, patient.id),
              eq(patients.status, "unclaimed"),
              gt(patients.claimExpiresAt, now)
            )
          );
      } catch (err) {
        if ((err.code ?? err.cause?.code) === "ER_DUP_ENTRY") {
          await audit("register_rejected", { patientId: patient.id, req, detail: { reason: "email_in_use" } });
          return res.status(409).json({
            success: false,
            error: "Conflict",
            code: "EMAIL_IN_USE",
            message: "Email tidak dapat digunakan. Gunakan email lain.",
          });
        }
        throw err;
      }

      if (!result || result.affectedRows !== 1) return reject("claim_race");

      const claimed = { ...patient, email, status: "active", boundDeviceHash: req.deviceHash };
      const tokens = await createSession(claimed, req);
      await audit("register_success", { patientId: patient.id, req });

      return res.status(201).json({ success: true, ...tokens, patient: publicPatient(claimed) });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Login pasien (email + kata sandi)
 *     description: Wajib header X-Device-Id. Hanya perangkat yang terkunci pada akun yang diterima.
 *     tags:
 *       - Patient Auth
 *     parameters:
 *       - in: header
 *         name: X-Device-Id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login berhasil
 *       401:
 *         description: Kredensial salah / akun dikunci sementara
 *       403:
 *         description: Perangkat tidak dikenali atau akun dikunci admin
 */
router.post(
  "/login",
  authLimiter,
  requireDeviceId,
  validate({ body: loginSchema }),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const now = new Date();

      const rows = await db.select().from(patients).where(eq(patients.email, email)).limit(1);
      const patient = rows[0];

      // Selalu jalankan bcrypt.compare (hash palsu jika akun tidak ada).
      const passwordOk = await bcrypt.compare(password, patient?.passwordHash || DUMMY_HASH);

      if (!patient || !patient.passwordHash) {
        await audit("login_failed", { req, detail: { reason: "unknown_account" } });
        return res.status(401).json(INVALID_CREDENTIALS);
      }

      if (patient.lockedUntil && patient.lockedUntil > now) {
        await audit("login_failed", { patientId: patient.id, req, detail: { reason: "temporarily_locked" } });
        return res.status(401).json(INVALID_CREDENTIALS);
      }

      if (!passwordOk) {
        await registerFailure(patient);
        await audit("login_failed", { patientId: patient.id, req, detail: { reason: "bad_password" } });
        return res.status(401).json(INVALID_CREDENTIALS);
      }

      // Password benar. Baru sekarang status akun & perangkat diperiksa.
      if (patient.status !== "active") {
        await audit("login_blocked", { patientId: patient.id, req, detail: { status: patient.status } });
        return res.status(403).json({
          success: false,
          error: "Forbidden",
          code: "ACCOUNT_LOCKED",
          message: "Akun dikunci. Hubungi bagian pendaftaran RS.",
        });
      }

      if (!patient.boundDeviceHash) {
        // Setelah reset perangkat oleh admin: kunci ke perangkat ini (atomik).
        const [bind] = await db
          .update(patients)
          .set({ boundDeviceHash: req.deviceHash })
          .where(and(eq(patients.id, patient.id), isNull(patients.boundDeviceHash)));
        if (!bind || bind.affectedRows !== 1) {
          return res.status(403).json({
            success: false,
            error: "Forbidden",
            code: "DEVICE_NOT_RECOGNIZED",
            message: "Perangkat tidak dikenali. Hubungi bagian pendaftaran RS.",
          });
        }
        patient.boundDeviceHash = req.deviceHash;
        await audit("device_rebound", { patientId: patient.id, req });
      } else if (!safeEqualHex(patient.boundDeviceHash, req.deviceHash)) {
        await audit("login_device_mismatch", { patientId: patient.id, req });
        return res.status(403).json({
          success: false,
          error: "Forbidden",
          code: "DEVICE_NOT_RECOGNIZED",
          message: "Akun ini terdaftar di perangkat lain. Hubungi bagian pendaftaran RS untuk memindahkan perangkat.",
        });
      }

      if (patient.failedAttempts > 0 || patient.lockedUntil) {
        await db.update(patients).set({ failedAttempts: 0, lockedUntil: null }).where(eq(patients.id, patient.id));
      }

      const tokens = await createSession(patient, req);
      await audit("login_success", { patientId: patient.id, req });

      return res.status(200).json({ success: true, ...tokens, patient: publicPatient(patient) });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Perbarui token (rotasi refresh token)
 *     description: >
 *       Refresh token hanya berlaku sekali. Aplikasi harus memanggil endpoint ini satu per satu
 *       (single-flight) dan menyimpan refresh token baru.
 *     tags:
 *       - Patient Auth
 *     parameters:
 *       - in: header
 *         name: X-Device-Id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token baru
 *       401:
 *         description: Refresh token tidak valid; pengguna harus login ulang
 */
router.post(
  "/refresh",
  authLimiter,
  requireDeviceId,
  validate({ body: refreshSchema }),
  async (req, res, next) => {
    try {
      const result = await rotateSession(req.body.refresh_token, req);
      if (!result.ok) {
        return res.status(401).json({
          success: false,
          error: "Unauthorized",
          code: "SESSION_INVALID",
          message: "Sesi tidak valid. Silakan masuk kembali.",
        });
      }
      return res.status(200).json({ success: true, ...result.tokens });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Keluar (cabut sesi saat ini)
 *     tags:
 *       - Patient Auth
 *     security:
 *       - PatientAuth: []
 *     responses:
 *       200:
 *         description: Sesi dicabut
 */
router.post("/logout", patientAuth, async (req, res, next) => {
  try {
    await revokeSession(req.authSession.id);
    await audit("logout", { patientId: req.patient.id, req });
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;