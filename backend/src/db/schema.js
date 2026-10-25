import {
  mysqlTable,
  varchar,
  timestamp,
  boolean,
  int,
  text,
  mysqlEnum,
  date,
  index,
} from "drizzle-orm/mysql-core";

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
//
// Siklus status akun:
//   unclaimed -> dibuat admin/recorder (belum ada email/password)
//   active    -> sudah diklaim lewat aplikasi mobile, terkunci ke 1 perangkat
//   locked    -> dikunci admin (tidak bisa login, semua sesi dicabut)
//   disabled  -> dinonaktifkan permanen
export const patients = mysqlTable("patients", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patientIdentifier: varchar("patient_identifier", { length: 50 }).notNull().unique(), // No. RM, format RM-<angka>
  name: varchar("name", { length: 150 }).notNull(), // dikunci setelah diklaim (tidak ada endpoint ubah nama)
  birthDate: date("birth_date", { mode: "string" }), // opsional: pendaftaran offline bisa hanya berisi RM + nama
  phone: varchar("phone", { length: 30 }),
  gestationalAgeWeeks: int("gestational_age_weeks").default(0), // Usia kehamilan
  hpl: date("hpl", { mode: "string" }), // Hari Perkiraan Lahir (Estimated Due Date)
  clinicName: varchar("clinic_name", { length: 150 }).default("Poli Kandungan"), // Nama klinik/poli
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// 3. Recordings (USG Video Records)
export const recordings = mysqlTable("recordings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id),
  deviceId: varchar("device_id", { length: 36 }).references(() => devices.id),
  videoUrl: text("video_url").notNull(), // Direct R2 public CDN link
  filename: varchar("filename", { length: 255 }).notNull(),
  durationSeconds: int("duration_seconds").default(0).notNull(),
  title: varchar("title", { length: 150 }).default("Pemeriksaan USG Kandungan").notNull(),
  doctorName: varchar("doctor_name", { length: 100 }).default("dr. Sp.OG").notNull(),
  notes: text("notes"), // Catatan dokter (e.g. "BPD normal, DJJ 145 bpm")
  gestationalAgeWeeks: int("gestational_age_weeks").default(0), // Snapshot usia kehamilan saat rekaman
  clinicName: varchar("clinic_name", { length: 150 }).default("Poli Kandungan"), // Nama klinik saat rekaman
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

// 6. In-App Notifications (Riwayat notifikasi pasien)
export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).default("general"), // 'video' | 'general' | 'tip'
  targetId: varchar("target_id", { length: 36 }), // e.g. recording UUID for type='video'
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
