# USG & Maternal Health Central Backend

Layanan API pusat dan ingestion untuk ekosistem layanan kesehatan ibu dan pengiriman video ultrasonografi.

Dibangun dengan **pure Node.js (ES Modules)**, **Express.js**, **MySQL**, dan **Drizzle ORM**.

---

## 🏛️ Gambaran Ekosistem

```mermaid
graph LR
    subgraph Examination Room
        Laptop[USG Recorder Laptop<br/>Windows Client] -->|1. Upload Video MP4| R2[(Cloudflare R2<br/>Object Storage)]
        Laptop -->|2. Daftarkan Metadata<br/>X-Device-Key| Backend[USG Central Backend<br/>Node.js / Express / MySQL]
    end

    subgraph Maternal App
        Backend -->|3. Push Notification<br/>Expo Push Service| MobileApp[Aplikasi Mobile Pasien<br/>React Native Expo]
        MobileApp -->|4. Autentikasi & Ambil Data<br/>Bearer JWT| Backend
        MobileApp -->|5. Stream Video Langsung| R2
    end
```

1. **Laptop USG Recorder Rumah Sakit (Edge Client)**: Laptop Windows khusus di ruang pemeriksaan yang merekam sesi ultrasonografi, mengunggah file MP4 langsung ke Cloudflare R2, dan mendaftarkan metadata melalui Device Ingestion API (`POST /api/v1/recordings`).
2. **Aplikasi Mobile Pasien (React Native Expo)**: Aplikasi mobile yang digunakan ibu hamil untuk menonton rekaman ultrasonografi langsung dari R2, membaca tips/artikel kehamilan mingguan, dan menerima notifikasi push.
3. **Layanan Backend Pusat (Repository Ini)**: Backend REST pure JavaScript ESM yang menyediakan autentikasi device ingestion, autentikasi pasien, integrasi mock SIMRS, katalog tips kehamilan, dan pengiriman push notification.

---

## 🚀 Tech Stack

- **Runtime:** Node.js (v20+ / v22 LTS) dengan Native ES Modules (`"type": "module"`)
- **Web Framework:** Express.js (`express`)
- **Database & ORM:** MySQL 8+ dengan [Drizzle ORM](https://orm.drizzle.team/) (`drizzle-orm`, `drizzle-kit`, `mysql2`)
- **Dokumentasi API:** OpenAPI 3.0 melalui Swagger (`swagger-ui-express`, `swagger-jsdoc`)
- **Validasi:** Zod (`zod`)
- **Keamanan & Autentikasi:** `jsonwebtoken`, `bcryptjs`, `cors`, `helmet`, `dotenv`
- **HTTP Logging:** `morgan`
- **Push Notification:** Modular Expo Push Notification dispatcher

---

## 📁 Struktur Project

```text
usg-backend/
├── drizzle/                    # Generated SQL schema migrations
├── src/
│   ├── config/
│   │   └── env.js              # Parser environment variable dengan Zod
│   ├── db/
│   │   ├── index.js            # Koneksi pool MySQL Drizzle
│   │   ├── schema.js           # Schema Drizzle (devices, patients, recordings, pregnancy_tips, push_tokens)
│   │   └── seed.js             # Seeder untuk device, mock patient, dan tips awal
│   ├── docs/
│   │   └── swagger.js          # Konfigurasi Swagger JSDoc & UI
│   ├── middlewares/
│   │   ├── deviceAuth.js       # Validasi X-Device-Key (Laptop recorder)
│   │   ├── patientAuth.js      # Validasi Patient JWT (Aplikasi mobile)
│   │   ├── validate.js         # Helper validasi request dengan Zod
│   │   └── errorHandler.js     # Penanganan error terpusat
│   ├── modules/
│   │   ├── auth/               # Login pasien
│   │   ├── ingest/             # Endpoint ingestion dari laptop recorder
│   │   ├── patient/            # Profil pasien & daftar rekaman USG
│   │   ├── tips/               # Tips & artikel kehamilan
│   │   └── notification/       # Registrasi push token
│   ├── services/
│   │   ├── simrs.service.js    # Mock pencarian data rumah sakit SIMRS
│   │   └── push.service.js     # Client Expo Push Notification
│   ├── app.js                  # Setup Express (cors, helmet, json, swagger, routes)
│   ├── server.js               # Entry point
│   └── test-verify.js          # Suite test otomatis (sanity check)
├── postman_collection.json     # Koleksi Postman siap impor
├── drizzle.config.js           # Konfigurasi Drizzle Kit CLI
├── package.json                # "type": "module"
├── progress.md                 # Pelacakan development & verifikasi
└── .env.example                # Contoh konfigurasi environment
```

---

## ⚙️ Memulai

### 1. Prasyarat
- Node.js v20.x atau lebih tinggi
- Instance MySQL 8.x (lokal atau remote)

### 2. Setup Environment
Salin `.env.example` menjadi `.env` dan sesuaikan kredensial:
```bash
cp .env.example .env
```

Pengaturan default `.env`:
```env
PORT=4000
NODE_ENV=development

# MySQL Connection String
DATABASE_URL=mysql://root:password@localhost:3306/usg_db

# Security Keys
JWT_SECRET=super-secret-jwt-key-replace-in-production
DEVICE_SECRET_KEY=usg-recorder-secret-key-123
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Database & Seeding
Buat database di MySQL (contoh: `CREATE DATABASE usg_db;`), lalu jalankan:
```bash
# Push schema Drizzle ke MySQL
npm run db:push

# (Opsional) Seed test device, 3 mock patient, dan tips kehamilan
npm run seed
```

### 5. Menjalankan Server
```bash
# Mode development dengan auto-reload native Node
npm run dev

# Mode production
npm start
```

---

## 📖 Dokumentasi API & Swagger UI

Dokumentasi interaktif OpenAPI 3.0 tersedia langsung di browser:

- **Swagger UI:** [http://localhost:4000/api-docs](http://localhost:4000/api-docs)
- **OpenAPI JSON Spec:** [http://localhost:4000/api-docs.json](http://localhost:4000/api-docs.json)

---

## 🔒 Skema Autentikasi

### A. Device Ingestion (Laptop Recorder ➔ Backend)
- **Header:** `X-Device-Key: usg-recorder-secret-key-123` atau `Authorization: Bearer usg-recorder-secret-key-123`
- Melindungi: `POST /api/v1/recordings`

### B. Aplikasi Mobile Pasien (Mobile App ➔ Backend)
- **Login:** `POST /api/v1/auth/login` dengan `patient_identifier` (No. RM/NIK) dan `birth_date` (`YYYY-MM-DD`).
- **Token:** Mengembalikan JWT Bearer token berlaku 30 hari.
- **Header:** `Authorization: Bearer <JWT_TOKEN>`
- Melindungi: Semua route `/api/v1/patient/*`.

---

## 📡 Referensi Endpoint API

| Method | Endpoint                         | Auth        | Keterangan                                                   |
|--------|----------------------------------|-------------|--------------------------------------------------------------|
| `GET`  | `/health`                        | Public      | Pengecekan kesehatan sistem                                  |
| `GET`  | `/api-docs`                      | Public      | Swagger UI interaktif                                        |
| `POST` | `/api/v1/recordings`             | Device Key  | Ingest metadata rekaman USG baru                             |
| `POST` | `/api/v1/auth/login`             | Public      | Login pasien melalui RM/NIK & tanggal lahir                  |
| `GET`  | `/api/v1/patient/profile`        | Patient JWT | Melihat profil pasien yang sedang login                      |
| `GET`  | `/api/v1/patient/recordings`     | Patient JWT | Daftar rekaman (`recorded_at DESC`)                          |
| `GET`  | `/api/v1/patient/recordings/:id` | Patient JWT | Detail satu rekaman                                          |
| `GET`  | `/api/v1/patient/tips`           | Patient JWT | Tips edukasi (filter `trimester`, `week`, `category`)        |
| `GET`  | `/api/v1/patient/tips/:id`       | Patient JWT | Melihat artikel tips tertentu                                |
| `POST` | `/api/v1/patient/push-token`     | Patient JWT | Registrasi/update Expo push token                            |

---

## 🧪 Testing

Jalankan suite test otomatis:
```bash
npm test
```

Yang divalidasi:
1. Response health check (`GET /health`)
2. Generasi spesifikasi Swagger (`GET /api-docs.json`)
3. Penolakan autentikasi device jika key hilang (`401`)
4. Validasi schema body Zod pada route ingestion (`400`)
5. Validasi schema body Zod pada route login (`400`)
6. Proteksi JWT pasien pada route `/profile` (`401`)

---

## 📬 Koleksi Postman

Impor [postman_collection.json](postman_collection.json) langsung ke Postman.

- **Variable yang tersedia:** `baseUrl` (`http://localhost:4000`), `deviceKey` (`usg-recorder-secret-key-123`), `token`.
- **Script test yang sudah dikonfigurasi:** Menjalankan request **#3 (Patient Login)** secara otomatis mengekstrak dan menyimpan JWT ke variable koleksi `{{token}}` untuk request pasien selanjutnya.

---

## Standar Penamaan

Panduan ini memastikan konsistensi, keterbacaan, dan kemudahan debugging di seluruh arsitektur backend, sekaligus menyelaraskan schema database, validasi Zod, dan konvensi modern Node.js.

### 1. Payload Mobile, Zod, dan Mapping Database

Untuk meminimalkan boilerplate mapping data, key payload yang masuk harus langsung cocok dengan kolom database.

* **Format:** **PascalCase** (selaras langsung dengan definisi schema database).
* **Schema Zod:** Definisikan schema validasi Zod menggunakan key PascalCase agar bisa memvalidasi request masuk dan langsung menghasilkan baris database yang cocok.

```js
import { z } from 'zod';

// Schema Zod yang cocok persis dengan kolom database
export const UserPayloadSchema = z.object({
  Fullname: z.string(),
  Username: z.string().min(3),
  Telp: z.string(),
  Status: z.enum(['active', 'inactive'])
});

// Contoh Controller Express
export const createUser = async (req, res) => {
  // Body hasil parse tetap mempertahankan key PascalCase dari validasi
  const validatedPayload = UserPayloadSchema.parse(req.body);

  // Insert Drizzle ORM langsung tanpa perlu rename key manual
  await db.insert(users).values(validatedPayload);
};
```

---

### 2. Relaxed Hungarian Notation (Variabel Lokal)

Meskipun variabel lokal standar sebaiknya mengikuti `camelCase` idiomatik JavaScript, penggunaan prefiks tipe ringan (Hungarian notation) tersedia sebagai opsi untuk logic bisnis yang kompleks atau tahap transformasi data agar lebih jelas.

| Tipe Data   | Prefiks | Contoh Penggunaan yang Direkomendasikan                          |
|-------------|--------|------------------------------------------------------------------|
| **Object**  | `o`    | Record database atau payload struktural (contoh: `oPayload`, `oUser`) |
| **Array**   | `va`   | Koleksi data jamak atau list (contoh: `vaUsers`, `vaRows`)       |
| **Number**  | `n`    | Counter matematika, pagination, limit (contoh: `nTotal`, `nLimit`) |
| **String**  | `c`    | Token unik, ID, hash, nilai string (contoh: `cToken`, `cUniqueId`) |
| **Boolean** | `b`    | Flag status evaluasi dan pengecekan (contoh: `bIsValid`, `bHasExpoToken`) |
| **Date**    | `d`    | Masa berlaku dan timestamp operasional (contoh: `dExpiredAt`, `dNow`) |

**Contoh Penggunaan Fleksibel:**
```js
// camelCase standar untuk variabel sederhana tetap diperbolehkan:
const token = req.headers.authorization;

// Gunakan prefiks ketika pelacakan tipe secara eksplisit memperjelas logic multi-langkah:
const oPayload = req.body;
const bIsActive = oPayload.Status === "active";
const vaUsers = await db.select().from(users);
```

---

### 3. Standar Function

* Function wajib menggunakan **camelCase**.
* **Arrow function** (`const myFunc = () => {}`) sangat direkomendasikan untuk route handler, callback controller, dan middleware Express.
* Function tradisional bernama diperbolehkan untuk inisialisasi module top-level yang diekspor atau utility khusus Drizzle jika lebih disukai.

```js
// Direkomendasikan: Controller Express sebagai arrow function
export const createUser = async (req, res, next) => {
  // Business logic
};

// Hindari kombinasi non-standar:
function Create_User() {}
function createuser() {}
```

---

### 4. Routing, Struktur File, dan Arsitektur

Karena project mengandalkan **Native ES Modules (`"type": "module"`)**, penamaan file yang disengaja mencegah masalah resolusi saat import.

* **Nama File:** Gunakan **snake_case.js** untuk file endpoint mentah, atau **kebab-case.js** tergantung layout folder. Konsistensi di seluruh module sangat penting.
* **Registrasi Route:** Jaga path route tetap lowercase, RESTful, dan bersih.

```text
src/
├── controllers/
│   └── user_controller.js       (Function yang diekspor memakai camelCase)
├── routes/
│   └── user_routes.js           (Definisi Express router)
└── schemas/
    └── user_schema.js           (Definisi tabel Drizzle & Zod)
```

**Implementasi route (`user_routes.js`):**
```js
import { Router } from 'express';
import { createUser } from '../controllers/user_controller.js';

const router = Router();
router.post('/v1/users', createUser); // Endpoint RESTful yang terstruktur

export default router;
```

---

### 5. Logging & Diagnostik Error

Saat meneruskan informasi ke mekanisme logger atau menangkap exception di dalam blok middleware, jaga agar scope payload yang masuk tetap utuh. Ini mempertahankan transparansi struktural antara parsing request, schema validasi, dan error sistem.

```js
try {
  // Eksekusi business logic
} catch (error) {
  // Jaga struktur asli tetap bersih untuk kemudahan tracing
  Logging(error, {
    file: "user_controller.js",
    func: "createUser",
    request: req.body,        // Payload target validasi yang belum dimodifikasi
    user: req.user?.Username, // Lacak siapa yang memicu event jika sudah terautentikasi
  });

  next(error);
}
```
