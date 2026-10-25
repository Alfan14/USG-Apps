export interface PatientProfile {
  id: string;
  name: string;
  email?: string;
  patientId: string; // patient_identifier in backend
  birthDate?: string;
  phone?: string;
  gestationalAgeWeeks?: number;
  gestationalAge: string; // e.g. "24 minggu"
  hpl?: string; // e.g. "2027-01-20" or formatted "20 Januari 2027"
  clinicName?: string;
  avatarInitials: string;
  createdAt?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  medicalRecordNumber: string; // No. RM
  motherName: string;
  email: string;
  password: string;
}

export interface UltrasoundRecord {
  id: string;
  date: string;
  time: string;
  gestationalAge: string;
  gestationalAgeWeeks?: number;
  status: 'Selesai' | 'Dijadwalkan' | 'Diproses';
  hasVideo: boolean;
  videoDuration?: string;
  videoUrl?: string;
  doctor: string;
  clinic: string;
  summaryNote: string;
  filename?: string;
  recordedAt?: string;
  createdAt?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'video' | 'health' | 'general';
  targetId?: string;
  createdAt?: string;
}

export interface PregnancyTip {
  id: string;
  category: string;
  title: string;
  readTime: string;
  categoryIcon: 'heart' | 'apple' | 'leaf' | 'briefcase' | 'smile';
  isBookmarked: boolean;
  content?: string;
  summary?: string;
  imageUrl?: string;
  trimester?: number;
  minWeek?: number;
  maxWeek?: number;
}

export type RootScreen =
  | 'splash'
  | 'login'
  | 'register'
  | 'home'
  | 'history'
  | 'details'
  | 'videoplayer'
  | 'notifications'
  | 'tips'
  | 'profile';
