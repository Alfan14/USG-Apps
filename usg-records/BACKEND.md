# BACKEND.md — Prompt Specification for USG & Maternal Health Central Backend

> **How to use this file:**  
> Copy and paste the prompt below into an AI coding assistant (e.g. Claude, Cursor, Antigravity) in a new, empty repository directory to generate the complete backend service from scratch.

---

```markdown
# Role & Project Goal
You are a senior backend architect. Build a production-grade, extensible backend service using pure **Node.js JavaScript (ES Modules: `"type": "module"`)**, **Express.js**, **MySQL**, and **Drizzle ORM**. Do NOT use TypeScript.

This backend serves as the central API for a maternal healthcare & ultrasound video delivery ecosystem:
1. **Hospital USG Recorder Laptop (Edge Client)**: A dedicated Windows laptop in the hospital examination room that records ultrasound videos, uploads MP4 files directly to Cloudflare R2 (generating public/CDN video URLs with randomized UUIDs), and calls this backend to register the recording metadata.
2. **Patient Mobile App (React Native Expo)**: A mobile application used by pregnant mothers to:
   - View their ultrasound recordings (streamed directly via the R2 public video URL).
   - Read weekly pregnancy tips & maternal health articles.
   - Receive push notifications when new ultrasound results are ready.

---

## 1. Tech Stack & Dependencies
- **Runtime:** Node.js (v20+ or v22 LTS) with native ES Modules (`"type": "module"`)
- **Web Framework:** Express.js (`express`)
- **Database & ORM:** MySQL 8+ with **Drizzle ORM** (`drizzle-orm`, `drizzle-kit`, `mysql2`)
- **API Documentation:** OpenAPI 3.0 via **Swagger** (`swagger-ui-express`, `swagger-jsdoc`)
- **Validation:** `zod`
- **Security & Auth:** `jsonwebtoken`, `bcryptjs`, `cors`, `helmet`, `dotenv`
- **Logging:** `morgan`
- **Push Notification Ready:** Modular push notification service ready for Expo Push tokens.
- **Zero build step:** Runs directly using `node --watch src/server.js` in development.

---

## 2. Security & Authentication Architecture

### A. Device Ingestion Authentication (Recorder Laptop ➔ Backend)
- **Header:** `X-Device-Key: <SECRET_DEVICE_KEY>` or `Authorization: Bearer <SECRET_DEVICE_KEY>`
- Handled by middleware: `src/middlewares/deviceAuth.js`
- Validates the key against `DEVICE_SECRET_KEY` env var (or hashes stored in the `devices` table).

### B. Patient Mobile App Authentication (Mobile App ➔ Backend)
- **Login:** Patient inputs `patient_identifier` (Nomor Rekam Medis / NIK, e.g. `12345678`) and `birth_date` (`YYYY-MM-DD`).
- **Token:** Backend issues a signed **JWT Access Token** (valid for 30 days for mobile convenience).
- **Header:** `Authorization: Bearer <PATIENT_JWT_TOKEN>`
- Handled by middleware: `src/middlewares/patientAuth.js`

---

## 3. Database Schema (MySQL + Drizzle ORM in JavaScript)

Define tables in `src/db/schema.js`:

```javascript
import { mysqlTable, varchar, timestamp, boolean, int, text, mysqlEnum, date } from "drizzle-orm/mysql-core";

// 1. Devices (Authorized hospital recorder machines)
export const devices = mysqlTable("devices", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  apiKeyHash: varchar("api_key_hash", { length: 255 }).notNull(),
  location: varchar("location", { length: 100 }).default("Poli Kandungan"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Patients (Mothers / Patients)
export const patients = mysqlTable("patients", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patientIdentifier: varchar("patient_identifier", { length: 50 }).notNull().unique(), // No. RM / NIK
  name: varchar("name", { length: 150 }).notNull(),
  birthDate: date("birth_date", { mode: "string" }).notNull(),
  phone: varchar("phone", { length: 30 }),
  gestationalAgeWeeks: int("gestational_age_weeks").default(0), // Usia kehamilan
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// 3. Recordings (USG Video Records)
export const recordings = mysqlTable("recordings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id),
  deviceId: varchar("device_id", { length: 36 }).references(() => devices.id),
  videoUrl: text("video_url").notNull(), // Direct R2 public CDN link
  filename: varchar("255").notNull(),
  durationSeconds: int("duration_seconds").default(0).notNull(),
  title: varchar("title", { length: 150 }).default("Pemeriksaan USG Kandungan").notNull(),
  doctorName: varchar("doctor_name", { length: 100 }).default("dr. Sp.OG").notNull(),
  notes: text("notes"), // Catatan dokter (e.g. "BPD normal, DJJ 145 bpm")
  recordedAt: timestamp("recorded_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Pregnancy Tips & Articles (Educational Content for Mobile App)
export const pregnancyTips = mysqlTable("pregnancy_tips", {
  id: varchar("id", { length: 36 }).primaryKey(),
  trimester: int("trimester").notNull(), // 1, 2, or 3
  minWeek: int("min_week").default(1),
  maxWeek: int("max_week").default(40),
  title: varchar("title", { length: 200 }).notNull(),
  summary: varchar("summary", { length: 300 }),
  content: text("content").notNull(),
  category: mysqlEnum("category", ["nutrition", "exercise", "fetal_development", "warning_signs"]).default("fetal_development"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Patient Push Notification Tokens
export const pushTokens = mysqlTable("push_tokens", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id),
  expoPushToken: varchar("expo_push_token", { length: 255 }).notNull().unique(),
  devicePlatform: varchar("device_platform", { length: 20 }), // 'ios' | 'android'
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
```

---

## 4. API Endpoints Specification

### Swagger Documentation
- `GET /api-docs` ➔ Interactive Swagger UI documenting all endpoints, schemas, and security schemes.

### Ingestion API (Protected by Device Key: `X-Device-Key`)
- `POST /api/v1/recordings`
  - **Header:** `X-Device-Key: usg-recorder-secret-key-123`
  - **Body (Zod validated):**
    ```json
    {
      "patient_identifier": "12345678",
      "video_url": "https://pub-xxxx.r2.dev/recordings/12345678-a8f3b2c1d4e5.mp4",
      "filename": "12345678-a8f3b2c1d4e5.mp4",
      "duration_seconds": 142,
      "recorded_at": "2026-10-11T20:15:00.000Z",
      "doctor_name": "dr. H. Santoso, Sp.OG",
      "notes": "Detak jantung janin normal (142 bpm), gerakan aktif."
    }
    ```
  - **Behavior:**
    1. Looks up patient by `patient_identifier`. If not found, creates mock patient profile from mock SIMRS service.
    2. Saves recording row.
    3. Triggers push notification to any registered Expo push tokens for this patient: *"Hasil rekaman USG Anda sudah siap dilihat di aplikasi!"*.
  - **Response 201:** `{ "success": true, "recording_id": "...", "patient": { ... } }`

### Patient Auth API (Public)
- `POST /api/v1/auth/login`
  - **Body:** `{ "patient_identifier": "12345678", "birth_date": "1996-05-14" }`
  - **Response 200:** `{ "token": "jwt...", "patient": { "id": "...", "name": "Siti Rahma", "patient_identifier": "12345678", "gestational_age_weeks": 24 } }`

### Patient Features API (Protected by Patient JWT: `Authorization: Bearer <TOKEN>`)
- `GET /api/v1/patient/profile` ➔ Patient profile details.
- `GET /api/v1/patient/recordings` ➔ List of ultrasound recordings ordered by `recorded_at DESC`.
  - Response includes direct `video_url` ready for React Native Expo `<Video source={{ uri: video_url }} />`.
- `GET /api/v1/patient/recordings/:id` ➔ Specific recording detail.
- `GET /api/v1/patient/tips` ➔ List of pregnancy tips (optionally filtered by `?trimester=2` or `?week=24`).
- `GET /api/v1/patient/tips/:id` ➔ Specific tip/article content.
- `POST /api/v1/patient/push-token` ➔ Register/update Expo push token `{ "expo_push_token": "ExponentPushToken[...]", "device_platform": "android" }`.

---

## 5. Swagger / OpenAPI 3.0 Integration

Configure Swagger in `src/docs/swagger.js`:
- Setup `swagger-jsdoc` with title `"USG & Maternal Health API"`, version `"1.0.0"`.
- Define two Security Schemes:
  1. `DeviceAuth`: ApiKey in header `X-Device-Key`
  2. `PatientAuth`: HTTP Bearer JWT
- Serve at `/api-docs` via `swagger-ui-express`.

---

## 6. Postman Collection Export

Create a pre-configured `postman_collection.json` in the project root:
- Collection Name: `USG & Maternal Health API`
- Variables: `baseUrl` (`http://localhost:4000`), `deviceKey` (`usg-recorder-secret-key-123`), `patientToken` (`{{token}}`).
- Pre-scripted requests for:
  1. `Health Check`
  2. `Device - Ingest New USG Video`
  3. `Patient - Login (Mock RM)` (with test script auto-saving `token` variable)
  4. `Patient - Get Profile`
  5. `Patient - Get USG Recordings`
  6. `Patient - Get Pregnancy Tips`
  7. `Patient - Register Push Token`

---

## 7. Directory Structure (Pure JavaScript ESM)

```text
usg-backend/
├── src/
│   ├── config/
│   │   └── env.js              # Zod environment variable parser
│   ├── db/
│   │   ├── index.js            # Drizzle MySQL connection (mysql2)
│   │   ├── schema.js           # Drizzle schema (devices, patients, recordings, tips, pushTokens)
│   │   └── seed.js             # Seeder for devices, mock patients, and initial pregnancy tips
│   ├── docs/
│   │   └── swagger.js          # Swagger JSDoc & UI configuration
│   ├── middlewares/
│   │   ├── deviceAuth.js       # Validates X-Device-Key
│   │   ├── patientAuth.js      # Validates Patient JWT
│   │   ├── validate.js         # Zod request validation helper
│   │   └── errorHandler.js     # Global error handler
│   ├── modules/
│   │   ├── auth/               # Patient login
│   │   ├── ingest/             # Recorder laptop ingestion route
│   │   ├── patient/            # Patient profile & USG recordings list
│   │   ├── tips/               # Pregnancy tips & articles
│   │   └── notification/       # Push token registration & Expo push dispatch
│   ├── services/
│   │   ├── simrs.service.js    # Mock SIMRS lookup (easy to swap with real hospital API later)
│   │   └── push.service.js     # Expo Push Notification client
│   ├── app.js                  # Express setup (cors, helmet, json, swagger, routes)
│   └── server.js               # Entry point
├── postman_collection.json     # Ready-to-import Postman collection
├── drizzle.config.js
├── package.json                # "type": "module"
└── .env.example
```

---

## 8. Configuration Files

### `package.json`
```json
{
  "name": "usg-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "src/server.js",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "seed": "node src/db/seed.js"
  },
  "dependencies": {
    "bcryptjs": "^3.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "drizzle-orm": "^0.40.0",
    "express": "^4.21.2",
    "helmet": "^8.0.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "mysql2": "^3.12.0",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.1",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30.5"
  }
}
```

### `drizzle.config.js`
```javascript
import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  schema: "./src/db/schema.js",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

### `.env.example`
```env
PORT=4000
NODE_ENV=development

# MySQL Connection String
DATABASE_URL=mysql://root:password@localhost:3306/usg_db

# Security
JWT_SECRET=super-secret-jwt-key-replace-in-production
DEVICE_SECRET_KEY=usg-recorder-secret-key-123
```

---

## 9. Mock SIMRS & Seed Data Requirements
In `src/db/seed.js`:
- Insert test recorder device with secret `usg-recorder-secret-key-123`.
- Insert 3 mock patients matching keypad test IDs:
  - `12345678`: Siti Rahma, DOB: 1996-05-14, 24 weeks pregnant
  - `87654321`: Dewi Lestari, DOB: 1994-08-22, 16 weeks pregnant
  - `11223344`: Rina Anggraini, DOB: 1998-11-03, 32 weeks pregnant
- Insert sample pregnancy tips for Trimester 1, 2, and 3 (nutrition, fetal movement, preparation for labor).
```
