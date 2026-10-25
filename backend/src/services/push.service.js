import crypto from "crypto";
import { db } from "../db/index.js";
import { pushTokens, notifications } from "../db/schema.js";
import { eq } from "drizzle-orm";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Sends push notifications to an array of Expo push tokens.
 * @param {Array<{ to: string, title: string, body: string, data?: Object }>} messages
 */
export async function sendExpoPushNotifications(messages) {
  if (!messages || messages.length === 0) return { success: true, count: 0 };

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    return { success: true, count: messages.length, result };
  } catch (error) {
    console.error("Expo push notification delivery error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Notifies a patient when a new ultrasound recording is registered.
 * Persists an in-app notification row to the DB and dispatches Expo push.
 * @param {string} patientId
 * @param {Object} recording
 */
export async function notifyPatientNewRecording(patientId, recording) {
  try {
    const notifTitle = "Hasil Pemeriksaan USG Baru 🩺";
    const notifBody = "Hasil rekaman USG Anda sudah siap dilihat di aplikasi!";

    // 1. Persist in-app notification to database
    await db.insert(notifications).values({
      id: crypto.randomUUID(),
      patientId,
      title: notifTitle,
      message: notifBody,
      type: "video",
      targetId: recording.id,
      isRead: false,
    });

    // 2. Dispatch Expo push notification (best-effort)
    const tokens = await db
      .select()
      .from(pushTokens)
      .where(eq(pushTokens.patientId, patientId));

    if (tokens.length === 0) {
      console.log(`ℹ️ No registered Expo push tokens found for patient ${patientId}`);
      return { success: true, notified: 0 };
    }

    const messages = tokens.map((t) => ({
      to: t.expoPushToken,
      sound: "default",
      title: notifTitle,
      body: notifBody,
      data: {
        recordingId: recording.id,
        recordedAt: recording.recordedAt,
        type: "NEW_RECORDING",
      },
    }));

    console.log(`📲 Dispatching push notification to ${messages.length} device(s) for patient ${patientId}`);
    const result = await sendExpoPushNotifications(messages);
    return { success: true, notified: messages.length, result };
  } catch (error) {
    console.error(`Failed to notify patient ${patientId}:`, error.message);
    return { success: false, error: error.message };
  }
}
