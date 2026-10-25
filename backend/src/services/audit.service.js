import crypto from "crypto";
import { db } from "../db/index.js";
import { auditLogs } from "../db/schema.js";

/**
 * Catat kejadian keamanan. Tidak pernah melempar error (kegagalan log tidak boleh
 * menggagalkan request). JANGAN masukkan password, token, atau data medis ke `detail`.
 */
export async function audit(event, { patientId = null, req = null, detail = null } = {}) {
  try {
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      patientId,
      event,
      ip: req?.ip ? String(req.ip).slice(0, 64) : null,
      deviceHash: req?.deviceHash ?? null,
      detail: detail ? JSON.stringify(detail).slice(0, 1000) : null,
    });
  } catch (err) {
    console.error("Audit log write failed:", err.message);
  }
}