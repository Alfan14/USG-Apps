/** Validasi form autentikasi (dipakai layar dan service). Mengembalikan pesan error atau null. */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RM_REGEX = /^[A-Za-z0-9-]+$/;

export const PASSWORD_MIN_LENGTH = 8;

export const validateEmail = (value: string): string | null => {
  const v = value.trim();
  if (!v) return 'Email belum diisi.';
  if (!EMAIL_REGEX.test(v)) return 'Format email tidak valid.';
  return null;
};

export const validatePassword = (value: string): string | null => {
  if (!value) return 'Kata sandi belum diisi.';
  return null;
};

export const validateNewPassword = (value: string): string | null => {
  if (!value) return 'Kata sandi belum diisi.';
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter.`;
  }
  return null;
};

export const validateMotherName = (value: string): string | null => {
  const v = value.trim();
  if (!v) return 'Nama ibu belum diisi.';
  if (v.length < 3) return 'Nama ibu terlalu pendek.';
  return null;
};

export const validateMedicalRecordNumber = (value: string): string | null => {
  const v = value.trim();
  if (!v) return 'No. Rekam Medis belum diisi.';
  if (v.length < 4) return 'No. Rekam Medis terlalu pendek.';
  if (!RM_REGEX.test(v)) return 'No. Rekam Medis hanya boleh huruf, angka, dan tanda hubung (-).';
  return null;
};
