import { PatientProfile, UltrasoundRecord, NotificationItem, PregnancyTip } from '../types';

/**
 * Data mock pengembangan (Development Mock Data)
 * Sesuai petunjuk AGENTS.md, data mock ini ditandai secara jelas untuk kebutuhan visualisasi UI.
 */
export const MOCK_PATIENT: PatientProfile = {
  id: 'pat-1',
  name: 'Maya Johnson',
  email: 'maya.johnson@email.com',
  patientId: 'BL-20418',
  gestationalAge: '24 minggu, 2 hari',
  hpl: '25 Januari 2027',
  avatarInitials: 'MJ',
};

export const MOCK_RECORDS: UltrasoundRecord[] = [
  {
    id: 'usg-01',
    date: '07 Oktober 2026',
    time: '10.30',
    gestationalAge: 'USG 24 minggu',
    status: 'Selesai',
    hasVideo: true,
    videoDuration: '04:32',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    doctor: 'Dr. Elena Rivera',
    clinic: 'Klinik Bersalin Bloom',
    summaryNote: 'Pemeriksaan USG Anda telah selesai. Rekaman momen kunjungan Anda dapat ditonton di bawah ini.',
  },
  {
    id: 'usg-02',
    date: '09 September 2026',
    time: '14.00',
    gestationalAge: 'USG 20 minggu',
    status: 'Selesai',
    hasVideo: true,
    videoDuration: '06:18',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    doctor: 'Dr. Elena Rivera',
    clinic: 'Klinik Bersalin Bloom',
    summaryNote: 'Detak jantung janin normal, posisi janin aktif dan berkembang dengan sangat baik.',
  },
  {
    id: 'usg-03',
    date: '12 Agustus 2026',
    time: '09.15',
    gestationalAge: 'USG 16 minggu',
    status: 'Selesai',
    hasVideo: false,
    doctor: 'Dr. Elena Rivera',
    clinic: 'Klinik Bersalin Bloom',
    summaryNote: 'Pemeriksaan rutin trimester 2 awal. Tidak ada rekaman video disimpan pada sesi ini.',
  },
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Video USG Anda tersedia',
    message: 'Kenangan kunjungan 07 Oktober Anda kini siap ditonton.',
    time: 'Hari ini, 11.45',
    read: false,
    type: 'video',
    targetId: 'usg-01',
  },
  {
    id: 'notif-2',
    title: 'Perawatan di minggu ke-24',
    message: 'Temukan cara agar tetap nyaman seiring bertambahnya usia kehamilan.',
    time: '05 Oktober · 09.00',
    read: false,
    type: 'health',
  },
  {
    id: 'notif-3',
    title: 'Video USG baru',
    message: 'Rekaman 09 September Anda telah ditambahkan ke riwayat.',
    time: '09 September · 14.20',
    read: true,
    type: 'video',
    targetId: 'usg-02',
  },
];

export const MOCK_TIPS: PregnancyTip[] = [
  {
    id: 'tip-1',
    category: 'Perawatan kehamilan',
    title: 'Gerak ringan, tubuh nyaman',
    readTime: 'Baca 4 menit',
    categoryIcon: 'heart',
    isBookmarked: false,
    content: 'Olahraga teratur berintensitas rendah seperti prenatal yoga dan jalan santai di pagi hari dapat meredakan nyeri punggung serta menjaga kelancaran sirkulasi darah.',
  },
  {
    id: 'tip-2',
    category: 'Nutrisi',
    title: 'Menu bergizi seimbang',
    readTime: 'Baca 3 menit',
    categoryIcon: 'apple',
    isBookmarked: false,
    content: 'Pastikan asupan harian mencukupi zat besi, kalsium, asam folat, dan protein untuk mendukung pembentukan organ dan tulang si kecil.',
  },
  {
    id: 'tip-3',
    category: 'Perkembangan janin',
    title: 'Si kecil di minggu ke-24',
    readTime: 'Baca 4 menit',
    categoryIcon: 'leaf',
    isBookmarked: false,
    content: 'Pada minggu ke-24, indra pendengaran si kecil mulai peka. Si kecil sudah bisa merespons suara detak jantung ibu dan alunan suara lembut dari luar.',
  },
  {
    id: 'tip-4',
    category: 'Persiapan persalinan',
    title: 'Isi tas untuk persalinan',
    readTime: 'Baca 5 menit',
    categoryIcon: 'briefcase',
    isBookmarked: false,
    content: 'Siapkan dokumen identitas, kartu asuransi/klinik, pakaian berkancing depan, baju bayi, bedong, serta perlengkapan kenyamanan ibu.',
  },
  {
    id: 'tip-5',
    category: 'Perawatan bayi baru lahir',
    title: 'Persiapan menyusui awal',
    readTime: 'Baca 5 menit',
    categoryIcon: 'smile',
    isBookmarked: false,
    content: 'Ketahui pentingnya inisiasi menyusu dini (IMD) serta posisi pelekatan yang nyaman sejak hari pertama kelahiran.',
  },
];
