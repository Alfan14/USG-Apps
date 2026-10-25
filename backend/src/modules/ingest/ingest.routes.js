import { Router } from "express";
import crypto from "crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { env } from "../../config/env.js";
import { db } from "../../db/index.js";
import { patients, recordings } from "../../db/schema.js";
import { deviceAuth } from "../../middlewares/deviceAuth.js";
import { deviceLimiter } from "../../middlewares/rateLimit.js";
import { validate } from "../../middlewares/validate.js";
import { findOrCreatePatient } from "../../services/simrs.service.js";
import { notifyPatientNewRecording } from "../../services/push.service.js";
import { audit } from "../../services/audit.service.js";
import { isValidRm, normalizeRm } from "../../utils/security.js";

const router = Router();

const ingestRecordingSchema = z.object({
  patient_identifier: z
    .string()
    .trim()
    .transform(normalizeRm)
    .refine(isValidRm, "patient_identifier harus berformat RM-angka (contoh: RM-20418)"),
  // Opsional: nama dari pendaftaran offline. Dipakai sebagai faktor verifikasi saat pasien mendaftar.
  patient_name: z.string().trim().min(3).max(150).optional(),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  video_url: z.string().url("video_url must be a valid URL"),
  filename: z.string().min(1, "filename is required"),
  duration_seconds: z.coerce.number().int().min(0).default(0),
  recorded_at: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "recorded_at must be a valid ISO timestamp",
  }),
  title: z.string().optional().default("Pemeriksaan USG Kandungan"),
  doctor_name: z.string().optional().default("dr. Sp.OG"),
  notes: z.string().optional().nullable(),
});

/**
 * @openapi
 * /api/v1/recordings:
 *   post:
 *     summary: Ingest USG Recording Metadata from Laptop Recorder
 *     description: >
 *       Dipanggil laptop recorder setelah video diunggah ke Cloudflare R2. Jika pasien belum ada,
 *       kirim patient_name (atau RM harus dikenal SIMRS). Untuk pasien yang belum mendaftar di
 *       aplikasi, endpoint ini membuka jendela klaim (CLAIM_WINDOW_HOURS) agar pasien bisa registrasi.
 *     tags:
 *       - Device Ingestion
 *     security:
 *       - DeviceAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patient_identifier
 *               - video_url
 *               - filename
 *               - recorded_at
 *             properties:
 *               patient_identifier:
 *                 type: string
 *                 example: "RM-12345678"
 *               patient_name:
 *                 type: string
 *                 example: "Siti Rahma"
 *               video_url:
 *                 type: string
 *                 example: "https://pub-xxxx.r2.dev/recordings/RM-12345678-a8f3b2c1d4e5.mp4"
 *               filename:
 *                 type: string
 *               duration_seconds:
 *                 type: integer
 *               recorded_at:
 *                 type: string
 *                 format: date-time
 *               title:
 *                 type: string
 *               doctor_name:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Recording successfully registered
 *       400:
 *         description: Validation error
 *       401:
 *         description: Missing or invalid device key
 *       404:
 *         description: Pasien tidak ditemukan (kirim patient_name untuk mendaftarkan)
 */
router.post(
  "/recordings",
  deviceLimiter,
  deviceAuth,
  validate({ body: ingestRecordingSchema }),
  async (req, res, next) => {
    try {
      const {
        patient_identifier,
        patient_name,
        birth_date,
        video_url,
        filename,
        duration_seconds,
        recorded_at,
        title,
        doctor_name,
        notes,
      } = req.body;

      // 1. Cari pasien, atau daftarkan (unclaimed) dari data admin / SIMRS. Tidak ada data karangan.
      const patient = await findOrCreatePatient(patient_identifier, {
        name: patient_name,
        birthDate: birth_date,
      });

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: "Not Found",
          message: "Pasien dengan No. RM tersebut tidak ditemukan. Sertakan patient_name untuk mendaftarkan.",
        });
      }

      // 2. Simpan rekaman
      const recordingId = crypto.randomUUID();
      const newRecording = {
        id: recordingId,
        patientId: patient.id,
        deviceId: req.device?.id !== "default-device-id" ? req.device?.id : null,
        videoUrl: video_url,
        filename,
        durationSeconds: duration_seconds,
        title: title || "Pemeriksaan USG Kandungan",
        doctorName: doctor_name || "dr. Sp.OG",
        notes: notes || null,
        gestationalAgeWeeks: patient.gestationalAgeWeeks ?? 0, // snapshot saat rekaman
        clinicName: patient.clinicName ?? "Poli Kandungan",
        recordedAt: recordedDate,
      };

      await db.insert(recordings).values(newRecording);

      // 3. Pasien belum mendaftar di aplikasi -> buka (perbarui) jendela klaim
      let claimOpenUntil = null;
      if (patient.status === "unclaimed") {
        claimOpenUntil = new Date(Date.now() + env.CLAIM_WINDOW_HOURS * 60 * 60 * 1000);
        await db.update(patients).set({ claimExpiresAt: claimOpenUntil }).where(eq(patients.id, patient.id));
        await audit("claim_window_opened", {
          patientId: patient.id,
          req,
          detail: { until: claimOpenUntil.toISOString() },
        });
      }

      // 4. Push notification (non-blocking)
      notifyPatientNewRecording(patient.id, newRecording).catch((pushErr) => {
        console.error("Non-blocking push notification error:", pushErr);
      });

      return res.status(201).json({
        success: true,
        recording_id: recordingId,
        patient: {
          id: patient.id,
          name: patient.name,
          patient_identifier: patient.patientIdentifier,
          gestational_age_weeks: patient.gestationalAgeWeeks,
          status: patient.status,
        },
        claim_open_until: claimOpenUntil,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;