import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { env } from "../config/env.js";
import { db } from "../db/index.js";
import { devices } from "../db/schema.js";
import { audit } from "../services/audit.service.js";
import { safeEqualString } from "../utils/security.js";

const unauthorized = (res, message) =>
  res.status(401).json({ success: false, error: "Unauthorized", message });

/**
 * Autentikasi perangkat recorder RS via X-Device-Key atau Bearer token.
 * Gagal tertutup: jika database error, request ditolak (bukan diloloskan).
 */
export async function deviceAuth(req, res, next) {
  let deviceKey = req.headers["x-device-key"];

  if (!deviceKey && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      deviceKey = parts[1];
    }
  }

  if (typeof deviceKey !== "string" || !deviceKey) {
    return unauthorized(res, "Device key is required in X-Device-Key or Authorization header");
  }

  try {
    const activeDevices = await db.select().from(devices).where(eq(devices.isActive, true));

    // 1. Kunci global dari env (opsional), dibandingkan dengan waktu konstan
    if (env.DEVICE_SECRET_KEY && safeEqualString(deviceKey, env.DEVICE_SECRET_KEY)) {
      req.device = activeDevices[0] || {
        id: "default-device-id",
        name: "Hospital USG Recorder Laptop",
        location: "Poli Kandungan",
      };
      return next();
    }

    // 2. Kunci per-perangkat (hash bcrypt di tabel devices)
    for (const dev of activeDevices) {
      if (dev.apiKeyHash && (await bcrypt.compare(deviceKey, dev.apiKeyHash))) {
        req.device = dev;
        return next();
      }
    }

    await audit("device_auth_failed", { req });
    return unauthorized(res, "Invalid device key provided");
  } catch (error) {
    return next(error);
  }
}