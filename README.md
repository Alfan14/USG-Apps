# 🤰 Maternal USG & Healthcare System — Monorepo

> **Tugas / Proyek Mata Kuliah Pemrograman Bergerak**  
> Sistem Ekosistem Pemantauan Kesehatan Ibu Hamil dan Integrasi Hasil Pemeriksaan USG Digital.

## 🚀 Ringkasan Sistem (System Architecture)

Sistem ini adalah solusi ekosistem terintegrasi yang menghubungkan perangkat perekam USG di poli kandungan rumah sakit/klinik secara real-time dengan aplikasi mobile yang diakses oleh ibu hamil.

```
+-------------------------------------------------------------------+
|                        EKOSISTEM SISTEM                           |
+-------------------------------------------------------------------+
|                                                                   |
|  [ 🖥️ USG Recorder Kiosk ]                                         |
|  (Perekam USG di Poli Kandungan - Next.js)                        |
|        │                                                          |
|        ├── 1. Upload Video USG ──► [ ☁️ Cloudflare R2 CDN ]        |
|        │                                  │                       |
|        └── 2. Ingest Metadata             │ Link Video Direct     |
|                 │                         │                       |
|                 ▼                         ▼                       |
|  [ ⚙️ Backend REST API ] ◄──────────────────┤                       |
|  (Express.js + Drizzle + MySQL)           │                       |
|        │                                  │                       |
|        ├── 3. Send Push Notification      │                       |
|        │                                  │                       |
|        ▼                                  ▼                       |
|  [ 📱 Mobile Patient App ] ◄──────────────┘                       |
|  (React Native / Expo)                                            |
|                                                                   |
+-------------------------------------------------------------------+
```

---

## 📂 Struktur Monorepo

Monorepo ini terdiri dari 3 modul utama:

```text
.
├── 📱 mobile/        # Aplikasi React Native (Expo) untuk pasien / ibu hamil
├── ⚙️ backend/       # Core REST API (Node.js, Express, Drizzle ORM, MySQL, Swagger)
├── 🖥️ usg-records/   # Aplikasi Desktop/Kiosk Perekam USG Poli Kandungan (Next.js)
└── 📄 package.json   # Root workspace manager & npm scripts orchestration
```

### 📋 Deskripsi Modul

1. **`mobile/` (Aplikasi Pasien)**
   - **Teknologi:** React Native, Expo, TypeScript, React Navigation, Axios.
   - **Fitur Utama:**
     - Autentikasi akun terikat perangkat (Device Binding Security).
     - Pemutar video rekaman USG HD.
     - Riwayat pemeriksaan kandungan & estimasi HPL.
     - Artikel edukasi & tips kehamilan berbasis trimester.
     - Notifikasi push (Expo Push Notification) saat hasil USG baru diunggah.

2. **`backend/` (Core API Server)**
   - **Teknologi:** Node.js, Express.js, Drizzle ORM, MySQL 8, Zod, JWT, Swagger.
   - **Fitur Utama:**
     - Ingestion API terproteksi kunci perangkat (`X-Device-Key`).
     - Keamanan autentikasi pasien (rotasi refresh token, anti brute-force, audit logging).
     - Manajemen jadwal dan klaim No. Rekam Medis (RM).
     - Dokumentasi API otomatis berbasis OpenAPI/Swagger.

3. **`usg-records/` (Perangkat Perekam USG)**
   - **Teknologi:** Next.js 15, FFmpeg integration, SQLite (local buffer), Cloudflare R2 Storage.
   - **Fitur Utama:**
     - Antarmuka Kiosk mode untuk ruang pemeriksaan medis.
     - Perekaman video USG langsung dari perangkat medis/capture card.
     - Pengunggahan otomatis ke cloud storage R2 & sinkronisasi data ke backend server.

---

## 🛠️ Prasyarat & Instalasi (Prerequisites)

Sebelum menjalankan proyek, pastikan perangkat Anda telah terpasang:
- **Node.js:** `v20.x` atau `v22.x` (LTS)
- **Database:** MySQL Server 8.0+
- **Package Manager:** `npm` (v10+)
- **Expo Go App** (di smartphone Android/iOS untuk pengujian mobile)

---

## ⚡ Panduan Menjalankan Proyek (Quick Start)

### 1. Kloning Repositori
```bash
git clone https://github.com/USERNAME/REPO_NAME.git
cd REPO_NAME
```

### 2. Install Seluruh Dependensi (Monorepo Workspace)
Jalankan perintah ini di root direktori untuk menginstal dependensi seluruh paket sekaligus:
```bash
npm run install:all
```

---

### 3. Konfigurasi Environment Variables (`.env`)

Salin berkas contoh `.env.example` di masing-masing folder modul:

#### a. Backend (`backend/.env`)
```bash
cp backend/.env.example backend/.env
```
Isi konfigurasi database MySQL & rahasia JWT pada `backend/.env`:
```env
PORT=4000
NODE_ENV=development
DATABASE_URL="mysql://root:password@127.0.0.1:3306/usg_db"
JWT_SECRET="ganti_dengan_32_karakter_acak_min_secret_key"
DEVICE_SECRET_KEY="usg-recorder-secret-key-123"
```

#### b. Mobile (`mobile/.env`)
```bash
cp mobile/.env.example mobile/.env
```
Konfigurasi endpoint API backend (gunakan IP lokal komputer Anda jika diuji pada HP fisik):
```env
EXPO_PUBLIC_API_BASE_URL="http://192.168.1.X:4000/api/v1"
```

---

### 4. Inisialisasi Database & Seeding Data

Jalankan migrasi database MySQL dan data seed awal:
```bash
# Jalankan push schema Drizzle
npm --prefix backend run db:push

# Jalankan data seeder (akun sampel & artikel kehamilan)
npm --prefix backend run db:seed
```

---

### 5. Menjalankan Seluruh Modul (Development Mode)

Anda dapat menjalankan modul secara terpisah atau bersamaan dari root direktori:

#### 🚀 Jalankan Semua Modul Sekaligus
```bash
npm run dev
```

#### 📌 Jalankan Modul Spesifik

- **Hanya Backend API Server (`http://localhost:4000`):**
  ```bash
  npm run dev:backend
  ```

- **Hanya Mobile App (Expo Metro Bundler):**
  ```bash
  npm run dev:mobile
  ```

- **Hanya USG Kiosk Recorder (`http://localhost:3000`):**
  ```bash
  npm run dev:kiosk
  ```

---

## 📖 Dokumentasi API (Swagger / OpenAPI)

Setelah server backend berjalan, akses dokumentasi interaktif Swagger di:
👉 **`http://localhost:4000/api-docs`**

Tersedia juga spesifikasi OpenAPI dalam format JSON di `http://localhost:4000/api-docs.json`.

---

## 🧪 Pengujian (Testing)

Jalankan pengujian terintegrasi untuk memastikan semua API berjalan dengan baik:

```bash
# Unit & Integration test pada Backend API
npm --prefix backend test
```

---

## 📄 Lisensi & Hak Cipta

Proyek ini dikembangkan untuk memenuhi tugas mata kuliah **Pemrograman Bergerak**. Seluruh kode sumber didistribusikan di bawah lisensi MIT.