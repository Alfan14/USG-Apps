import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { setupSwagger } from "./docs/swagger.js";
import authRoutes from "./modules/auth/auth.routes.js";
import ingestRoutes from "./modules/ingest/ingest.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import patientRoutes from "./modules/patient/patient.routes.js";
import tipsRoutes from "./modules/tips/tips.routes.js";
import notificationRoutes from "./modules/notification/notification.routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

const app = express();

// Di belakang Cloudflare/Nginx, set TRUST_PROXY=1 agar req.ip (rate limit & audit) adalah IP klien asli.
app.set("trust proxy", env.TRUST_PROXY);

// Security and utility middlewares
app.use(helmet());
// Aplikasi mobile native tidak memakai CORS. Aktifkan hanya untuk origin yang diizinkan.
app.use(
  cors({
    origin: env.CORS_ORIGINS ? env.CORS_ORIGINS.split(",").map((o) => o.trim()) : false,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

// API Documentation (sebaiknya dimatikan / dibatasi di production)
setupSwagger(app);

// Health check endpoint
/**
 * @openapi
 * /health:
 *   get:
 *     summary: System Health Check
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: System operational status
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "USG & Maternal Health Central Backend",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "USG & Maternal Health Central Backend",
    timestamp: new Date().toISOString(),
  });
});

// Mount Module Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", ingestRoutes);
app.use("/api/v1/device", adminRoutes);
app.use("/api/v1/patient", patientRoutes);
app.use("/api/v1/patient", tipsRoutes);
app.use("/api/v1/patient", notificationRoutes);

// Fallback 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;