const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/**
 * Format string tanggal (YYYY-MM-DD atau ISO Date) menjadi format Bahasa Indonesia:
 * Contoh: "2026-10-07" -> "07 Oktober 2026"
 */
export const formatDateToIndonesian = (dateInput?: string | Date | null): string => {
  if (!dateInput) return '-';

  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) {
      // Jika string YYYY-MM-DD standar
      if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
        const [year, month, day] = dateInput.substring(0, 10).split('-');
        const monthIndex = parseInt(month, 10) - 1;
        return `${parseInt(day, 10).toString().padStart(2, '0')} ${MONTH_NAMES_ID[monthIndex] || month} ${year}`;
      }
      return String(dateInput);
    }

    const day = d.getDate().toString().padStart(2, '0');
    const month = MONTH_NAMES_ID[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return String(dateInput);
  }
};

/**
 * Format waktu menjadi HH.MM
 * Contoh: "2026-10-07T10:30:00Z" -> "10.30"
 */
export const formatTimeToIndonesian = (dateInput?: string | Date | null): string => {
  if (!dateInput) return '09.00';

  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '09.00';
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}.${minutes}`;
  } catch {
    return '09.00';
  }
};

/**
 * Format durasi video dari detik ke MM:SS
 * Contoh: 272 detik -> "04:32"
 */
export const formatDurationSeconds = (seconds?: number | null): string => {
  if (!seconds || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Ambil inisial nama pasien (maksimal 2 huruf kapital)
 * Contoh: "Maya Johnson" -> "MJ", "Dewi" -> "D"
 */
export const getAvatarInitials = (name?: string | null): string => {
  if (!name || !name.trim()) return 'P';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

/**
 * Pemetaan kategori artikel tips ke ikon
 */
export const mapCategoryToIcon = (
  category?: string
): 'heart' | 'apple' | 'leaf' | 'briefcase' | 'smile' => {
  switch (category?.toLowerCase()) {
    case 'nutrition':
      return 'apple';
    case 'exercise':
      return 'heart';
    case 'warning_signs':
      return 'briefcase';
    case 'fetal_development':
    default:
      return 'leaf';
  }
};

/**
 * Pemetaan nama kategori ke Bahasa Indonesia
 */
export const mapCategoryToLabel = (category?: string): string => {
  switch (category?.toLowerCase()) {
    case 'nutrition':
      return 'Nutrisi';
    case 'exercise':
      return 'Perawatan kehamilan';
    case 'warning_signs':
      return 'Tanda bahaya';
    case 'fetal_development':
      return 'Perkembangan janin';
    default:
      return category || 'Tips kehamilan';
  }
};
