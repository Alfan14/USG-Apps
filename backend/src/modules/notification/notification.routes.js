import { Router } from "express";
import crypto from "crypto";
import { z } from "zod";
import { db } from "../../db/index.js";
import { pushTokens, notifications } from "../../db/schema.js";
import { patientAuth } from "../../middlewares/patientAuth.js";
import { validate } from "../../middlewares/validate.js";
import { eq, desc } from "drizzle-orm";

const router = Router();

const pushTokenSchema = z.object({
  expo_push_token: z.string().min(1, "expo_push_token is required"),
  device_platform: z.enum(["ios", "android", "web"]).optional().default("android"),
});

/**
 * @openapi
 * /api/v1/patient/push-token:
 *   post:
 *     summary: Register or Update Expo Push Token
 *     description: Registers or rebinds an Expo Push Token to the authenticated patient for receiving USG alerts.
 *     tags:
 *       - Notifications
 *     security:
 *       - PatientAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - expo_push_token
 *             properties:
 *               expo_push_token:
 *                 type: string
 *                 example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
 *               device_platform:
 *                 type: string
 *                 enum: [ios, android, web]
 *                 example: "android"
 *     responses:
 *       200:
 *         description: Push token registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/push-token",
  patientAuth,
  validate({ body: pushTokenSchema }),
  async (req, res, next) => {
    try {
      const { expo_push_token, device_platform } = req.body;

      const existing = await db
        .select()
        .from(pushTokens)
        .where(eq(pushTokens.expoPushToken, expo_push_token))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(pushTokens)
          .set({
            patientId: req.patient.id,
            devicePlatform: device_platform,
          })
          .where(eq(pushTokens.expoPushToken, expo_push_token));
      } else {
        await db.insert(pushTokens).values({
          id: crypto.randomUUID(),
          patientId: req.patient.id,
          expoPushToken: expo_push_token,
          devicePlatform: device_platform,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Push token registered successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/patient/notifications:
 *   get:
 *     summary: Get Patient Notification History
 *     description: Returns the list of in-app notifications for the authenticated patient, ordered by newest first.
 *     tags:
 *       - Notifications
 *     security:
 *       - PatientAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       message:
 *                         type: string
 *                       type:
 *                         type: string
 *                         example: "video"
 *                       target_id:
 *                         type: string
 *                       is_read:
 *                         type: boolean
 *                       created_at:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/notifications", patientAuth, async (req, res, next) => {
  try {
    const notifList = await db
      .select({
        id: notifications.id,
        title: notifications.title,
        message: notifications.message,
        type: notifications.type,
        target_id: notifications.targetId,
        is_read: notifications.isRead,
        created_at: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.patientId, req.patient.id))
      .orderBy(desc(notifications.createdAt));

    return res.status(200).json({
      success: true,
      notifications: notifList,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/patient/notifications/read-all:
 *   patch:
 *     summary: Mark All Notifications as Read
 *     description: Marks every unread notification for the authenticated patient as read.
 *     tags:
 *       - Notifications
 *     security:
 *       - PatientAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.patch("/notifications/read-all", patientAuth, async (req, res, next) => {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.patientId, req.patient.id));

    return res.status(200).json({
      success: true,
      message: "Semua notifikasi ditandai sudah dibaca",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/patient/notifications/{id}/read:
 *   patch:
 *     summary: Mark a Single Notification as Read
 *     description: Marks one notification (by ID) as read. Only works if the notification belongs to the authenticated patient.
 *     tags:
 *       - Notifications
 *     security:
 *       - PatientAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification UUID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 */
router.patch("/notifications/:id/read", patientAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    if (existing.length === 0 || existing[0].patientId !== req.patient.id) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "Notifikasi tidak ditemukan",
      });
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));

    return res.status(200).json({
      success: true,
      message: "Notifikasi ditandai sudah dibaca",
    });
  } catch (error) {
    next(error);
  }
});

export default router;

