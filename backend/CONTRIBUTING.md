# Panduan Kontribusi — USG & Maternal Health Central Backend

Panduan internal tim untuk standar development, branching, workflow, dan kualitas kode.

---

## Daftar Isi

1. [Memulai](#1-memulai)
2. [Strategi Branching](#2-strategi-branching)
3. [Alur Pengembangan](#3-alur-pengembangan)
4. [Konvensi Commit](#4-konvensi-commit)
5. [Pull Request & Code Review](#5-pull-request--code-review)
6. [Standar Penulisan Kode](#6-standar-penulisan-kode)
7. [Panduan Testing](#7-panduan-testing)
8. [Panduan Arsitektur](#8-panduan-arsitektur)
9. [Dokumentasi](#9-dokumentasi)
10. [Rilis & Deployment](#10-rilis--deployment)
11. [Pelacakan Issue & Task](#11-pelacakan-issue--task)

---

## 1. Memulai

### Prasyarat

- Node.js **v20+** (disarankan v22 LTS)
- MySQL **8.x**
- Git
- Akses ke repository tim dan secrets (tanya tech lead jika belum punya)

### Setup Lokal

```bash
git clone <repository-url>
cd usg-backend

npm install

cp .env.example .env
# Isi DATABASE_URL, JWT_SECRET, DEVICE_SECRET_KEY sesuai environment lokal / staging

# Buat database: CREATE DATABASE usg_db;
npm run db:push
npm run seed          # opsional – test device, mock patients, tips

npm run dev
```

### Perintah yang Sering Dipakai

| Perintah             | Keterangan                           |
|----------------------|--------------------------------------|
| `npm run dev`        | Menjalankan server dengan auto-reload|
| `npm start`          | Menjalankan dalam mode production    |
| `npm test`           | Menjalankan test suite               |
| `npm run db:push`    | Push schema Drizzle ke MySQL         |
| `npm run seed`       | Mengisi data uji coba                |
| `npm run lint`       | Menjalankan linter (jika sudah dikonfigurasi) |

---

## 2. Strategi Branching

Kita menggunakan **GitHub Flow** yang disesuaikan untuk tim internal.

| Tipe Branch   | Konvensi Penamaan                  | Contoh                            | Tujuan                              | Digabung ke            |
|---------------|------------------------------------|-----------------------------------|-------------------------------------|------------------------|
| **Main**      | `main`                             | `main`                            | Production                          | —                      |
| **Develop**   | `develop`                          | `develop`                         | Integrasi / staging                 | `main` (via PR)        |
| **Feature**   | `feature/<deskripsi-singkat>`      | `feature/patient-push-token`      | Fitur baru                          | `develop`              |
| **Bugfix**    | `bugfix/<deskripsi-singkat>`       | `bugfix/login-jwt-expiry`         | Perbaikan bug non-critical          | `develop`              |
| **Hotfix**   | `hotfix/<deskripsi-singkat>`       | `hotfix/device-auth-bypass`       | Bug kritis di production            | `main` + `develop`     |
| **Release**   | `release/vX.Y.Z`                   | `release/v1.2.0`                  | Persiapan rilis (opsional)          | `main` + `develop`     |

### Aturan

- Semua development dimulai dari `develop` terbaru.
- Dilarang push langsung ke `main` atau `develop`.
- Nama branch harus **kebab-case** dan deskriptif.
- Branch sebisa mungkin berumur pendek. Lebih baik banyak PR kecil daripada satu PR besar.

```bash
git checkout develop
git pull origin develop
git checkout -b feature/add-recording-pagination
```

---

## 3. Alur Pengembangan

1. Ambil task dari board / issue tracker.
2. Sinkronkan dengan `develop` terbaru.
3. Buat branch sesuai konvensi penamaan.
4. Implementasi + tulis/perbarui test.
5. Jalankan test lokal:
   ```bash
   npm test
   npm run lint
   ```
6. Commit menggunakan Conventional Commits.
7. Push dan buat Pull Request ke `develop`.
8. Minta review ke anggota tim yang relevan.
9. Setelah disetujui + CI hijau → merge.
10. Perbarui status task di board.

---

## 4. Konvensi Commit

Gunakan **Conventional Commits**.

### Format

```
<type>(<scope opsional>): <deskripsi singkat>

[body opsional]

[footer opsional]
```

### Jenis Commit

| Type       | Penggunaan                                       |
|------------|--------------------------------------------------|
| `feat`     | Fitur baru                                       |
| `fix`      | Perbaikan bug                                    |
| `docs`     | Dokumentasi saja                                 |
| `style`    | Formatting (tidak mengubah logic)                |
| `refactor` | Perubahan kode tanpa menambah fitur / memperbaiki bug |
| `test`     | Menambah atau memperbaiki test                   |
| `chore`    | Dependency, tooling, build                       |
| `perf`     | Peningkatan performa                             |
| `ci`       | Perubahan CI/CD                                  |

### Contoh

```bash
feat(auth): menambahkan masa berlaku JWT 30 hari untuk login pasien
fix(ingest): menolak recording yang tidak memiliki R2 key
docs: memperbarui tabel endpoint API dan skema autentikasi
test(patient): menambahkan integration test untuk daftar recording
chore: memperbarui drizzle-orm ke versi terbaru
refactor(services): mengekstrak logika retry push notification
```

---

## 5. Pull Request & Code Review

### Sebelum Membuat PR

- [ ] Branch sudah sinkron dengan `develop`
- [ ] Semua test lulus (`npm test`)
- [ ] Endpoint baru / perubahan business logic sudah memiliki test
- [ ] Schema Zod dan schema Drizzle konsisten
- [ ] Swagger / OpenAPI sudah diperbarui jika diperlukan
- [ ] `progress.md` sudah diperbarui jika relevan
- [ ] Tidak ada secret / file `.env` yang ikut ter-commit

### Judul PR

Harus mengikuti format Conventional Commits.

### Template Deskripsi PR

```markdown
## Ringkasan
<!-- Ringkasan perubahan -->

## Task / Issue Terkait
<!-- Link ke task di board -->

## Perubahan
- 
- 

## Rencana Pengujian
- [ ] Unit / integration test ditambahkan atau diperbarui
- [ ] Test lulus
- [ ] Pengujian manual dengan Postman (jelaskan skenarionya)

## Catatan untuk Reviewer
<!-- Hal yang perlu diperhatikan, edge case, dll. -->
```

### Aturan Review

- Minimal **1 approval** dari anggota tim.
- CI harus hijau.
- Reviewer fokus pada: kebenaran logic, keamanan, keterbacaan, cakupan test, dan konsistensi dengan standar project.
- Lebih disarankan **squash merge** untuk feature branch agar history tetap bersih.
- Jangan merge PR sendiri tanpa approval (kecuali hotfix darurat yang sudah dikoordinasikan).

---

## 6. Standar Penulisan Kode

Ikuti **Naming Standards** yang ada di README.

### 6.1 Payload, Zod & Database

Gunakan **PascalCase** untuk key payload, schema Zod, dan kolom database agar mapping langsung.

```js
export const RecordingPayloadSchema = z.object({
  PatientIdentifier: z.string(),
  RecordedAt: z.string().datetime(),
  R2ObjectKey: z.string(),
  DurationSeconds: z.number().int().positive(),
});
```

### 6.2 Variabel Lokal (Relaxed Hungarian – Opsional)

| Prefiks | Tipe     | Contoh                   |
|---------|----------|--------------------------|
| `o`     | Object   | `oPayload`, `oUser`      |
| `va`    | Array    | `vaRecordings`           |
| `n`     | Number   | `nTotal`, `nLimit`       |
| `c`     | String   | `cToken`, `cDeviceKey`   |
| `b`     | Boolean  | `bIsValid`               |
| `d`     | Date     | `dExpiredAt`             |

`camelCase` biasa tetap diperbolehkan untuk variabel sederhana.

### 6.3 Function

- Lebih disarankan menggunakan **arrow function** untuk controller, middleware, dan route handler.
- Nama function menggunakan `camelCase`.

```js
export const createRecording = async (req, res, next) => {
  // ...
};
```

### 6.4 File & Folder

- Konsisten menggunakan `snake_case.js` atau `kebab-case.js` di dalam module.
- Path route tetap lowercase dan RESTful.

### 6.5 Penanganan Error & Logging

- Jangan menelan error secara diam-diam.
- Sertakan konteks yang berguna (file, function, request body, identitas user jika ada).

```js
try {
  // business logic
} catch (error) {
  next(error);
}
```

### 6.6 Aturan Umum

- Menggunakan Pure ES Modules (`"type": "module"`).
- Controller dibuat tipis, logic ditaruh di service.
- Semua input eksternal wajib divalidasi dengan Zod.
- Jangan commit secret, data pasien real, atau production key.
- Hindari magic number / magic string — taruh di constant atau config.

---

## 7. Panduan Testing

### Baseline Saat Ini

Suite dasar (`npm test`) sudah mencakup:

- Health check
- Generasi Swagger
- Penolakan autentikasi device
- Validasi Zod (ingestion & login)
- Proteksi JWT pasien

### Target Testing

| Level            | Tooling                  | Fokus                                      | Prioritas |
|------------------|--------------------------|--------------------------------------------|-----------|
| Unit             | Vitest / Jest            | Services, pure function, helper            | Tinggi    |
| Integration      | Supertest + Vitest       | Endpoint HTTP + database uji               | Tinggi    |
| Contract / E2E   | Postman / Newman         | Alur kritis (login → daftar recording)     | Sedang    |
| Manual           | Postman Collection       | Exploratory & regression                   | Berkelanjutan |

### Struktur yang Disarankan

```text
tests/
├── unit/
│   ├── services/
│   └── middlewares/
├── integration/
│   ├── auth.test.js
│   ├── recordings.test.js
│   ├── patient.test.js
│   └── tips.test.js
└── helpers/
    ├── setup.js
    └── factories.js
```

### Aturan Penulisan Test

- Setiap endpoint baru atau perubahan business rule **wajib** memiliki minimal satu integration test.
- Gunakan database terpisah (`usg_db_test`).
- Bersihkan data antar test (transaction atau factory).
- Cover happy path dan kasus error penting (401, 400, 404, 403).
- Assertion harus bermakna (hindari snapshot berlebihan untuk response API).

```bash
npm test
npm run test:watch
npm run test:coverage
```

---

## 8. Panduan Arsitektur

### Tanggung Jawab Tiap Layer

| Layer          | Tanggung Jawab                                      | Lokasi                            |
|----------------|-----------------------------------------------------|-----------------------------------|
| Routes         | Method + path + rantai middleware                   | `src/modules/*/...`               |
| Controllers    | Parse request, panggil service, bentuk response     | Controllers di dalam module       |
| Services       | Business logic, orkestrasi, pemanggilan eksternal   | `src/services/` + service module  |
| Data Access    | Query Drizzle                                       | Di dalam service / repository     |
| Middlewares    | Autentikasi, validasi, penanganan error             | `src/middlewares/`                |
| Schemas        | Definisi Zod + tabel Drizzle                        | `src/db/schema.js` + modules      |

### Prinsip Desain

- **Controller tipis, service gemuk**.
- Modular per domain (`auth`, `ingest`, `patient`, `tips`, `notification`).
- Side effect (push notification, HTTP eksternal) ditaruh di service agar mudah di-mock.
- Semua konfigurasi melalui `env.js` yang divalidasi Zod.
- Hindari coupling antar module yang tidak perlu.

---

## 9. Dokumentasi

Setiap perubahan yang memengaruhi behaviour publik harus diikuti dengan pembaruan dokumentasi:

- [ ] README.md (tabel endpoint, skema autentikasi, langkah setup)
- [ ] Swagger / OpenAPI
- [ ] Koleksi Postman (`postman_collection.json`)
- [ ] `progress.md` (jika tim masih menggunakannya)
- [ ] File ini (`CONTRIBUTING.md`) jika ada perubahan proses

---

## 10. Rilis & Deployment

1. Pastikan `develop` stabil dan semua test lulus.
2. (Opsional) Buat branch `release/vX.Y.Z`.
3. Perbarui versi di `package.json`.
4. Buat PR ke `main`.
5. Setelah digabung ke `main` → buat Git tag `vX.Y.Z`.
6. Deploy dari commit yang sudah di-tag.
7. Gabungkan kembali `main` ke `develop`.

**Hotfix**: mulai dari `main`, setelah selesai digabung ke `main` **dan** `develop`.

Koordinasikan deployment dengan anggota yang bertanggung jawab. Jangan melakukan deploy sendirian tanpa komunikasi.

---

## 11. Pelacakan Issue & Task

- Ambil task dari board yang disepakati tim (Jira / Linear / GitHub Projects / dll).
- Cantumkan link task di deskripsi PR.
- Perbarui status task secara aktif (In Progress → In Review → Done).
- Bug production yang kritis langsung dibuat sebagai `hotfix/*` dan dikomunikasikan ke tim.

Untuk masalah keamanan, laporkan secara pribadi ke tech lead / pemilik keamanan — jangan dibuka di channel publik.

---

**Ada pertanyaan atau usulan perbaikan proses?**  
Diskusikan di channel tim atau langsung ke tech lead sebelum mengubah standar yang sudah disepakati.
