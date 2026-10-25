import { Router } from "express";
import { db } from "../../db/index.js";
import { recordings } from "../../db/schema.js";
import { patientAuth } from "../../middlewares/patientAuth.js";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// Apply patient authentication to all patient routes
router.use(patientAuth);

/**
 * @openapi
 * /api/v1/patient/profile:
 *   get:
 *     summary: Get Authenticated Patient Profile
 *     tags:
 *       - Patient Features
 *     security:
 *       - PatientAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 patient:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     patient_identifier:
 *                       type: string
 *                     name:
 *                       type: string
 *                     birth_date:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     gestational_age_weeks:
 *                       type: integer
 *                     hpl:
 *                       type: string
 *                       description: "Hari Perkiraan Lahir (Estimated Due Date), format YYYY-MM-DD"
 *                     clinic_name:
 *                       type: string
 *                       description: "Nama klinik/poli tempat pasien terdaftar"
 *                     created_at:
 *                       type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/profile", async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      patient: {
        id: req.patient.id,
        patient_identifier: req.patient.patientIdentifier,
        name: req.patient.name,
        birth_date: req.patient.birthDate,
        phone: req.patient.phone,
        gestational_age_weeks: req.patient.gestationalAgeWeeks,
        hpl: req.patient.hpl ?? null,
        clinic_name: req.patient.clinicName ?? "Poli Kandungan",
        created_at: req.patient.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/patient/recordings:
 *   get:
 *     summary: Get Patient Ultrasound Recordings
 *     description: List of recordings ordered by recorded_at DESC. Direct video_url is ready for React Native Expo Video player.
 *     tags:
 *       - Patient Features
 *     security:
 *       - PatientAuth: []
 *     responses:
 *       200:
 *         description: List of recordings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 recordings:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
router.get("/recordings", async (req, res, next) => {
  try {
    const userRecordings = await db
      .select({
        id: recordings.id,
        video_url: recordings.videoUrl,
        filename: recordings.filename,
        duration_seconds: recordings.durationSeconds,
        title: recordings.title,
        doctor_name: recordings.doctorName,
        notes: recordings.notes,
        gestational_age_weeks: recordings.gestationalAgeWeeks,
        clinic_name: recordings.clinicName,
        recorded_at: recordings.recordedAt,
        created_at: recordings.createdAt,
      })
      .from(recordings)
      .where(eq(recordings.patientId, req.patient.id))
      .orderBy(desc(recordings.recordedAt));

    return res.status(200).json({
      success: true,
      recordings: userRecordings,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/patient/recordings/{id}:
 *   get:
 *     summary: Get Specific Recording Detail
 *     tags:
 *       - Patient Features
 *     security:
 *       - PatientAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recording detail
 *       404:
 *         description: Recording not found
 */
router.get("/recordings/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const rows = await db
      .select({
        id: recordings.id,
        video_url: recordings.videoUrl,
        filename: recordings.filename,
        duration_seconds: recordings.durationSeconds,
        title: recordings.title,
        doctor_name: recordings.doctorName,
        notes: recordings.notes,
        gestational_age_weeks: recordings.gestationalAgeWeeks,
        clinic_name: recordings.clinicName,
        recorded_at: recordings.recordedAt,
        created_at: recordings.createdAt,
      })
      .from(recordings)
      .where(and(eq(recordings.id, id), eq(recordings.patientId, req.patient.id)))
      .limit(1);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "Rekaman USG tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      recording: rows[0],
    });
  } catch (error) {
    next(error);
  }
});

export default router;

