# BACKEND.md — Permintaan & Catatan untuk usg-backend

Dokumen ini mencatat fitur-fitur dan field yang **dibutuhkan oleh frontend pasien (usg-mobile)** tetapi **belum tersedia di usg-backend** saat ini.

> Dibuat berdasarkan hasil analisis gap antara `src/types/index.ts` dan kontrak API backend.
> Perbarui dokumen ini setiap kali ada penambahan atau perubahan kontrak API.

---

## 1. Field yang Diminta Ditambahkan ke Respons Pasien

### `GET /api/v1/patient/profile`

Respons saat ini:
```json
{
  "id": "...",
  "patient_identifier": "...",
  "name": "...",
  "birth_date": "YYYY-MM-DD",
  "phone": "...",
  "gestational_age_weeks": 24,
  "created_at": "..."
}
```

**Field yang diminta ditambahkan:**

| Field | Tipe | Keterangan |
|-------|------|------------|
| `hpl` | `string` (YYYY-MM-DD) | Hari Perkiraan Lahir. Bisa dihitung dari `gestational_age_weeks` atau disimpan terpisah di tabel `patients`. |
| `clinic_name` | `string` | Nama klinik/poli tempat pasien terdaftar. Bisa berupa nilai statis atau relasi ke tabel fasilitas. |

> **Catatan tambahan:**
> - Field `email` yang ada di UI profil akan dihapus dari tampilan karena tidak ada di backend.
> - Field `gestational_age_weeks` (integer) sudah ada. Frontend akan mengonversinya ke format string tampilan, misalnya `"24 minggu, 2 hari"`. Tidak ada perubahan backend yang diperlukan untuk field ini.

---

## 2. Field yang Diminta Ditambahkan ke Respons Rekaman

### `GET /api/v1/patient/recordings` dan `GET /api/v1/patient/recordings/:id`

Respons saat ini:
```json
{
  "id": "...",
  "video_url": "...",
  "filename": "...",
  "duration_seconds": 272,
  "title": "...",
  "doctor_name": "...",
  "notes": "...",
  "recorded_at": "...",
  "created_at": "..."
}
```

**Field yang diminta ditambahkan:**

| Field | Tipe | Keterangan |
|-------|------|------------|
| `gestational_age_weeks` | `integer` | Usia kehamilan **saat rekaman dilakukan** (bukan usia saat ini). Bisa disimpan di tabel `recordings` sebagai snapshot. |
| `clinic_name` | `string` | Nama klinik/poli di mana rekaman dibuat. |

> **Catatan:**
> - Field `status` tidak diperlukan dari backend. Frontend akan menganggap semua rekaman yang punya `video_url` berstatus "Selesai".
> - `duration_seconds` sudah ada dan akan diformat ke `mm:ss` di sisi frontend.

---

## 3. Endpoint Notifikasi yang Diminta

Saat ini backend hanya menyediakan `POST /api/v1/patient/push-token` untuk mendaftarkan token perangkat.

Frontend membutuhkan:

### `GET /api/v1/patient/notifications`
Ambil riwayat notifikasi pasien yang sedang login.

**Respons yang diharapkan:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "uuid",
      "title": "Video USG Anda tersedia",
      "message": "Kenangan kunjungan 07 Oktober Anda kini siap ditonton.",
      "type": "video",
      "target_id": "recording-uuid",
      "is_read": false,
      "created_at": "2026-10-07T11:45:00Z"
    }
  ]
}
```

### `PATCH /api/v1/patient/notifications/read-all`
Tandai semua notifikasi sebagai sudah dibaca.

**Respons yang diharapkan:**
```json
{ "success": true, "message": "Semua notifikasi ditandai sudah dibaca" }
```

### `PATCH /api/v1/patient/notifications/:id/read`
Tandai satu notifikasi sebagai sudah dibaca.

> **Status saat ini:** Fitur notifikasi di layar `NotificationsScreen.tsx` menggunakan **data mock berlabel** sambil menunggu endpoint ini tersedia.

---

## 4. Tips Kehamilan — Field Tambahan yang Diinginkan (Opsional)

### `GET /api/v1/patient/tips`

| Field | Tipe | Keterangan |
|-------|------|------------|
| `read_time_minutes` | `integer` | Estimasi waktu baca. Jika tidak ada, frontend akan menghitung dari panjang `content` (± 200 kata/menit). |
| `image_url` | `string` (URL) | Sudah ada di schema, pastikan di-expose di respons. |

---

## 5. Catatan Umum

- **Base URL**: `http://<IP_LAN>:4000/api/v1` — dikonfigurasi via konstanta di `src/services/api.ts`.
- **Autentikasi**: Semua endpoint pasien (kecuali login) wajib menyertakan header `Authorization: Bearer <JWT_TOKEN>`. Token berlaku 30 hari.
- **Format tanggal**: Backend menggunakan ISO 8601 (`YYYY-MM-DD` dan timestamp). Frontend mengonversi ke format tampilan Bahasa Indonesia.
- Jika ada perubahan kontrak API, perbarui dokumen ini dan notifikasikan ke tim frontend.
