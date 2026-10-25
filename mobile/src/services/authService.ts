import { apiClient, TOKEN_STORAGE_KEY } from './api';
import { storage } from '../utils/storage';
import { PatientProfile } from '../types';
import {
  formatDateToIndonesian,
  getAvatarInitials,
} from '../utils/formatters';

export function mapBackendPatient(raw: any): PatientProfile {
  const weeks = raw.gestational_age_weeks ?? raw.gestationalAgeWeeks ?? 0;
  const gestationalAge = weeks > 0 ? `${weeks} minggu` : 'Trimester 1';
  
  return {
    id: raw.id,
    name: raw.name || 'Pasien',
    patientId: raw.patient_identifier || raw.patientId || '',
    gestationalAgeWeeks: weeks,
    gestationalAge,
    hpl: raw.hpl ? formatDateToIndonesian(raw.hpl) : 'Belum ditentukan',
    clinicName: raw.clinic_name || 'Poli Kandungan & Kebidanan',
    phone: raw.phone || undefined,
    birthDate: raw.birth_date || undefined,
    avatarInitials: getAvatarInitials(raw.name),
    createdAt: raw.created_at,
  };
}

class AuthService {
  private currentPatient: PatientProfile | null = null;

  async login(patientIdentifier: string, birthDate: string): Promise<PatientProfile> {
    const cleanIdentifier = patientIdentifier.trim();
    const cleanBirthDate = birthDate.trim();

    if (!cleanIdentifier) {
      throw new Error('ID Pasien / No. Rekam Medis belum diisi.');
    }
    if (!cleanBirthDate) {
      throw new Error('Tanggal lahir belum dipilih.');
    }

    const response = await apiClient.post('/auth/login', {
      patient_identifier: cleanIdentifier,
      birth_date: cleanBirthDate,
    });

    const { token, patient: basicPatient } = response.data;

    if (!token) {
      throw new Error('Token otentikasi tidak diterima dari server.');
    }

    // Simpan token ke storage
    await storage.setItem(TOKEN_STORAGE_KEY, token);

    // Ambil profil lengkap (termasuk HPL & klinik)
    try {
      const profile = await this.getProfile();
      this.currentPatient = profile;
      return profile;
    } catch {
      // Jika profile gagal sementara, gunakan data dasar dari login
      const fallbackProfile = mapBackendPatient(basicPatient);
      this.currentPatient = fallbackProfile;
      return fallbackProfile;
    }
  }

  async getProfile(): Promise<PatientProfile> {
    const response = await apiClient.get('/patient/profile');
    if (response.data?.patient) {
      const patient = mapBackendPatient(response.data.patient);
      this.currentPatient = patient;
      return patient;
    }
    throw new Error('Gagal memuat profil pasien');
  }

  getCurrentPatient(): PatientProfile | null {
    return this.currentPatient;
  }

  async getToken(): Promise<string | null> {
    return await storage.getItem(TOKEN_STORAGE_KEY);
  }

  async logout(): Promise<void> {
    this.currentPatient = null;
    await storage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export const authService = new AuthService();
