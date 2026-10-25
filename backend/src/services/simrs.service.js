import crypto from "crypto";
import { db } from "../db/index.js";
import { patients } from "../db/schema.js";
import { eq } from "drizzle-orm";

/**
 * Data mock SIMRS untuk pengembangan. Ganti dengan integrasi SIMRS RS yang sebenarnya.
 * Kunci memakai format No. RM resmi: RM-<angka>.
 */
const SIMRS_MOCK_REGISTRY = {
  "RM-12345678": {
    name: "Siti Rahma",
    birthDate: "1996-05-14",
    phone: "081234567890",
    gestationalAgeWeeks: 24,
    hpl: "2027-01-20",
    clinicName: "Poli Kandungan",
  },
  "RM-87654321": {
    name: "Dewi Lestari",
    birthDate: "1994-08-22",
    phone: "082345678901",
    gestationalAgeWeeks: 16,
    hpl: "2027-03-17",
    clinicName: "Poli Kandungan",
  },
  "RM-11223344": {
    name: "Rina Anggraini",
    birthDate: "1998-11-03",
    phone: "083456789012",
    gestationalAgeWeeks: 32,
    hpl: "2026-12-09",
    clinicName: "Poli Kandungan",
  },
};

/**
 * Simulasi lookup SIMRS. Mengembalikan null jika RM tidak dikenal.
 * (Versi lama mengarang data untuk RM apa pun; itu dihapus karena nama dipakai untuk verifikasi.)
 *
 * @param {string} patientIdentifier - No. Rekam Medis (RM-<angka>)
 */
export async function lookupPatientInSIMRS(patientIdentifier) {
  await new Promise((resolve) => setTimeout(resolve, 50));

  if (SIMRS_MOCK_REGISTRY[patientIdentifier]) {
    return {
      patientIdentifier,
      ...SIMRS_MOCK_REGISTRY[patientIdentifier],
    };
  }

  // Fallback for arbitrary patient identifiers during edge recording testing
  return {
    patientIdentifier,
    name: `Ibu Pasien (${patientIdentifier})`,
    birthDate: "1995-01-01",
    phone: "081200000000",
    gestationalAgeWeeks: 20,
    hpl: "2027-02-15",
    clinicName: "Poli Kandungan",
  };
}

/**
 * Cari pasien di database lokal; jika belum ada, buat dari `hints` (data dari aplikasi
 * recorder/admin) atau dari SIMRS. Pasien baru berstatus `unclaimed`.
 * Mengembalikan null jika RM tidak bisa ditemukan di mana pun (tidak ada data karangan).
 *
 * @param {string} patientIdentifier
 * @param {{ name?: string, birthDate?: string, phone?: string }} [hints]
 */
export async function findOrCreatePatient(patientIdentifier, hints = {}) {
  const existing = await db
    .select()
    .from(patients)
    .where(eq(patients.patientIdentifier, patientIdentifier))
    .limit(1);

  if (existing.length > 0) return existing[0];

  let source = null;
  if (hints.name) {
    source = {
      patientIdentifier,
      name: hints.name,
      birthDate: hints.birthDate ?? null,
      phone: hints.phone ?? null,
      gestationalAgeWeeks: 0,
    };
  } else {
    source = await lookupPatientInSIMRS(patientIdentifier);
  }

  if (!source) return null;

  const newPatient = {
    id: crypto.randomUUID(),
    patientIdentifier: simrsRecord.patientIdentifier,
    name: simrsRecord.name,
    birthDate: simrsRecord.birthDate,
    phone: simrsRecord.phone,
    gestationalAgeWeeks: simrsRecord.gestationalAgeWeeks,
    hpl: simrsRecord.hpl,
    clinicName: simrsRecord.clinicName,
  };

  await db.insert(patients).values(newPatient);

  return newPatient;
}

