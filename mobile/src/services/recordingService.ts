import { apiClient } from './api';
import { UltrasoundRecord } from '../types';
import {
  formatDateToIndonesian,
  formatTimeToIndonesian,
  formatDurationSeconds,
} from '../utils/formatters';

export function mapBackendRecording(raw: any): UltrasoundRecord {
  const duration = formatDurationSeconds(raw.duration_seconds);
  const date = formatDateToIndonesian(raw.recorded_at);
  const time = formatTimeToIndonesian(raw.recorded_at);
  const weeks = raw.gestational_age_weeks;
  const gestationalAge = weeks ? `USG ${weeks} minggu` : (raw.title || 'Pemeriksaan USG');

  return {
    id: raw.id,
    date,
    time,
    gestationalAge,
    gestationalAgeWeeks: weeks,
    status: 'Selesai',
    hasVideo: Boolean(raw.video_url),
    videoDuration: duration,
    videoUrl: raw.video_url || undefined,
    doctor: raw.doctor_name || 'dr. Sp.OG',
    clinic: raw.clinic_name || 'Klinik Bersalin Bloom',
    summaryNote: raw.notes || 'Pemeriksaan USG kandungan telah selesai dilaksanakan.',
    filename: raw.filename,
    recordedAt: raw.recorded_at,
    createdAt: raw.created_at,
  };
}

class RecordingService {
  async getRecordings(): Promise<UltrasoundRecord[]> {
    const response = await apiClient.get('/patient/recordings');
    const rawList = response.data?.recordings || [];
    return rawList.map(mapBackendRecording);
  }

  async getRecordingById(id: string): Promise<UltrasoundRecord> {
    const response = await apiClient.get(`/patient/recordings/${id}`);
    if (response.data?.recording) {
      return mapBackendRecording(response.data.recording);
    }
    throw new Error('Rekaman USG tidak ditemukan.');
  }
}

export const recordingService = new RecordingService();
