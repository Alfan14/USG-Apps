# Panduan Kontribusi — Frontend Pasien (Momy Dar / Bloom)

Panduan internal tim untuk standar development, branching, workflow, testing, dan kualitas kode pada aplikasi mobile pasien.

---

## Daftar Isi

1. [Memulai](#1-memulai)
2. [Strategi Branching](#2-strategi-branching)
3. [Alur Pengembangan](#3-alur-pengembangan)
4. [Konvensi Commit](#4-konvensi-commit)
5. [Pull Request & Code Review](#5-pull-request--code-review)
6. [Standar Penulisan Kode](#6-standar-penulisan-kode)
7. [Panduan Testing](#7-panduan-testing)
8. [Struktur & Arsitektur](#8-struktur--arsitektur)
9. [Dokumentasi](#9-dokumentasi)
10. [CI/CD](#10-cicd)
11. [Rilis & Deployment](#11-rilis--deployment)
12. [Pelacakan Issue & Task](#12-pelacakan-issue--task)

---

## 1. Memulai

### Prasyarat

- Node.js **v20+** (disarankan v22 LTS)
- npm atau yarn
- Expo CLI / Expo Go (untuk development)
- Android Studio / Xcode (opsional, untuk emulator native)
- Akses ke repository dan environment (tanya tech lead jika belum punya)

### Setup Lokal

```bash
git clone <repository-url>
cd momy-dar   # atau nama folder project

npm install

# Jalankan development server
npm start
# atau
npx expo start
```

### Perintah yang Sering Dipakai

| Perintah              | Keterangan                              |
|-----------------------|-----------------------------------------|
| `npm start`           | Menjalankan Expo development server     |
| `npm run android`     | Jalankan di Android emulator/device     |
| `npm run ios`         | Jalankan di iOS simulator               |
| `npm run web`         | Jalankan di browser                     |
| `npx tsc --noEmit`    | Type-check TypeScript                   |
| `npm test`            | Menjalankan test (setelah dikonfigurasi)|

---

## 2. Strategi Branching

Kita menggunakan **GitHub Flow** yang disesuaikan untuk tim internal.

| Tipe Branch   | Konvensi Penamaan                  | Contoh                              | Tujuan                              | Digabung ke            |
|---------------|------------------------------------|-------------------------------------|-------------------------------------|------------------------|
| **Main**      | `main`                             | `main`                              | Production                          | —                      |
| **Develop**   | `develop`                          | `develop`                           | Integrasi / staging                 | `main` (via PR)        |
| **Feature**   | `feature/<deskripsi-singkat>`      | `feature/video-player-controls`     | Fitur baru                          | `develop`              |
| **Bugfix**    | `bugfix/<deskripsi-singkat>`       | `bugfix/login-validation`           | Perbaikan bug non-critical          | `develop`              |
| **Hotfix**   | `hotfix/<deskripsi-singkat>`       | `hotfix/crash-on-video`             | Bug kritis di production            | `main` + `develop`     |
| **Release**   | `release/vX.Y.Z`                   | `release/v1.1.0`                    | Persiapan rilis (opsional)          | `main` + `develop`     |

### Aturan

- Semua development dimulai dari `develop` terbaru.
- Dilarang push langsung ke `main` atau `develop`.
- Nama branch harus **kebab-case** dan deskriptif.
- Branch sebisa mungkin berumur pendek. Lebih baik banyak PR kecil daripada satu PR besar.

```bash
git checkout develop
git pull origin develop
git checkout -b feature/add-bookmark-tips
```

---

## 3. Alur Pengembangan

1. Ambil task dari board / issue tracker.
2. Sinkronkan dengan `develop` terbaru.
3. Buat branch sesuai konvensi penamaan.
4. Implementasi + tulis/perbarui test jika relevan.
5. Jalankan pengecekan lokal:
   ```bash
   npx tsc --noEmit
   npm test          # jika sudah ada
   npx expo start    # uji manual di Expo Go / emulator
   ```
6. Commit menggunakan Conventional Commits.
7. Push dan buat Pull Request ke `develop`.
8. Minta review ke anggota tim yang relevan.
9. Setelah disetujui + CI hijau → merge.
10. Perbarui status task di board.

**Catatan penting:**  
Ikuti desain di folder `ui/` sebagai acuan utama. Jangan mengubah konsep visual tanpa kesepakatan.

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
| `style`    | Formatting / penyesuaian UI minor (tidak mengubah logic) |
| `refactor` | Perubahan kode tanpa menambah fitur / memperbaiki bug |
| `test`     | Menambah atau memperbaiki test                   |
| `chore`    | Dependency, tooling, build                       |
| `perf`     | Peningkatan performa                             |
| `ci`       | Perubahan CI/CD                                  |

### Contoh

```bash
feat(home): menambahkan kartu pemeriksaan terbaru
fix(login): memperbaiki validasi ID pasien kosong
style(tips): menyesuaikan spacing filter pills
test(services): menambahkan unit test patientService
chore: memperbarui expo ke versi terbaru
refactor(navigation): menyederhanakan handleOpenDetails
```

---

## 5. Pull Request & Code Review

### Sebelum Membuat PR

- [ ] Branch sudah sinkron dengan `develop`
- [ ] TypeScript type-check lulus (`npx tsc --noEmit`)
- [ ] Tidak ada error di Expo / Metro bundler
- [ ] UI sesuai desain di folder `ui/` (sejauh relevan)
- [ ] Data mock tetap diberi label jelas (jika masih dipakai)
- [ ] Tidak ada secret / token yang ter-commit
- [ ] Test ditambahkan/diperbarui jika ada perubahan logic

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

## Screenshot / Video (jika perubahan UI)
<!-- Lampirkan screenshot sebelum/sesudah atau rekaman singkat -->

## Cara Menguji
- [ ] Type-check lulus
- [ ] Uji manual di Expo Go / emulator
- [ ] Alur yang terdampak sudah dicek (login, navigasi, dll)

## Catatan untuk Reviewer
<!-- Hal yang perlu diperhatikan, edge case, dll. -->
```

### Aturan Review

- Minimal **1 approval** dari anggota tim.
- CI harus hijau.
- Reviewer fokus pada: kesesuaian desain, correctness, TypeScript, keterbacaan, dan penanganan state (loading/empty/error).
- Lebih disarankan **squash merge** untuk feature branch.
- Jangan merge PR sendiri tanpa approval (kecuali hotfix darurat yang sudah dikoordinasikan).

---

## 6. Standar Penulisan Kode

### 6.1 Bahasa & UI

- Seluruh teks antarmuka menggunakan **Bahasa Indonesia** yang natural dan konsisten.
- Ikuti desain di folder `ui/` sebagai sumber utama.
- Gunakan token warna dari `src/theme/colors.ts`. Hindari hard-code warna baru tanpa alasan.

### 6.2 TypeScript

- Gunakan TypeScript dengan `strict: true`.
- Hindari `any` sebisa mungkin. Definisikan tipe di `src/types/`.
- Props komponen harus di-type dengan jelas.

### 6.3 Komponen & Struktur

- Pisahkan **Screen**, **Component**, **Service**, **Theme**, dan **Types**.
- Komponen yang reusable diletakkan di `src/components/`.
- Screen diletakkan di `src/screens/`.
- Logic data / API di `src/services/`.

### 6.4 Naming

- Komponen & tipe: **PascalCase** (`HomeScreen`, `PatientProfile`)
- Fungsi, variabel, hooks: **camelCase** (`handleLogin`, `isLoading`)
- File komponen/screen: **PascalCase.tsx** (mengikuti pola yang sudah ada)
- Konstanta: **UPPER_SNAKE_CASE** jika global, atau camelCase jika lokal

### 6.5 State & Side Effect

- Gunakan `useState` / `useEffect` dengan bersih.
- Jangan menyimpan data sensitif di state yang tidak perlu.
- Tangani kondisi **loading**, **empty**, dan **error** pada setiap layar yang relevan.

### 6.6 Data Mock

- Data mock wajib diberi komentar jelas bahwa ini hanya untuk development.
- Jangan menampilkan data mock seolah-olah data pasien asli.
- Saat backend sudah siap, ganti melalui service layer, jangan hard-code di UI.

### 6.7 Keamanan

- Jangan commit `.env`, token, atau kredensial.
- Jangan `console.log` data sensitif (token, ID pasien, URL video privat).
- Video USG bersifat pribadi — pastikan hanya ditampilkan untuk pasien yang sedang login.

---

## 7. Panduan Testing

### Target Testing

| Level            | Tooling                              | Fokus                                      | Prioritas |
|------------------|--------------------------------------|--------------------------------------------|-----------|
| Unit             | Jest + React Native Testing Library  | Service, helper, pure function             | Tinggi    |
| Component        | Jest + RNTL                          | Komponen UI kecil (Badge, BottomNav, dll)  | Sedang    |
| Integration      | Jest + RNTL                          | Alur antar screen (opsional)               | Rendah    |
| Manual           | Expo Go / Emulator                   | Visual, navigasi, interaksi                | Wajib     |

### Struktur yang Disarankan

```text
__tests__/
├── unit/
│   ├── services/
│   │   └── patientService.test.ts
│   └── utils/
├── components/
│   ├── Badge.test.tsx
│   └── BottomNav.test.tsx
└── screens/                  # opsional
    └── LoginScreen.test.tsx
```

Atau co-located:

```text
src/
├── services/
│   ├── patientService.ts
│   └── __tests__/
│       └── patientService.test.ts
├── components/
│   ├── Badge.tsx
│   └── __tests__/
│       └── Badge.test.tsx
```

### Aturan Penulisan Test

- Setiap service / logic bisnis penting sebaiknya punya unit test.
- Test komponen fokus pada behaviour (render teks, tekan tombol, state berubah), bukan snapshot berlebihan.
- Mock network / async jika perlu.
- Jangan menguji detail implementasi internal yang mudah berubah.

### Setup Testing (nanti)

```bash
npm install -D jest @types/jest ts-jest jest-expo @testing-library/react-native @testing-library/jest-native
```

Contoh script di `package.json`:

```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "typecheck": "tsc --noEmit"
}
```

---

## 8. Struktur & Arsitektur

### Struktur Saat Ini

```text
src/
├── components/          # Komponen reusable (Badge, BottomNav)
├── screens/             # Layar penuh (Home, Login, History, dll)
├── services/            # patientService + mockData
├── theme/               # colors.ts
└── types/               # Definisi TypeScript
ui/                      # Desain acuan (jangan diubah)
assets/                  # Gambar & ikon
```

### Prinsip

- **UI mengikuti desain `ui/`**.
- **Service layer** memisahkan data (mock / API) dari komponen.
- Navigasi saat ini dikelola di `App.tsx` dengan state. Jika nanti kompleks, pertimbangkan React Navigation, tapi jangan ganti tanpa kesepakatan.
- Hindari logic bisnis berat di dalam komponen UI.

---

## 9. Dokumentasi

Setiap perubahan yang memengaruhi behaviour atau UI penting sebaiknya diikuti:

- [ ] Update README jika ada perubahan setup / fitur utama
- [ ] Screenshot di PR jika ada perubahan visual
- [ ] Komentar di kode untuk bagian yang tidak jelas (terutama mock vs real API)
- [ ] File ini (`CONTRIBUTING.md`) jika ada perubahan proses tim

---

## 10. CI/CD

### Continuous Integration (GitHub Actions)

Setiap push/PR ke `develop` dan `main` menjalankan:

1. Install dependencies
2. TypeScript type-check
3. Unit test (setelah tersedia)
4. (Opsional) Lint

Contoh workflow ada di `.github/workflows/ci.yml`.

### Continuous Deployment

- **Staging / Internal**: build dengan EAS (Expo Application Services) dari branch `develop`.
- **Production**: build dari `main` setelah approval, lalu submit ke Play Store / App Store melalui EAS Submit.

Jangan submit ke store tanpa koordinasi dengan tech lead / product owner.

---

## 11. Rilis & Deployment

1. Pastikan `develop` stabil.
2. Buat PR ke `main` (atau gunakan branch `release/vX.Y.Z`).
3. Setelah merge ke `main`, buat Git tag `vX.Y.Z`.
4. Build production dengan EAS:
   ```bash
   eas build --platform all --profile production
   ```
5. Submit ke store jika diperlukan.
6. Merge balik `main` ke `develop`.

**Hotfix**: mulai dari `main`, setelah selesai digabung ke `main` **dan** `develop`.

---

## 12. Pelacakan Issue & Task

- Ambil task dari board yang disepakati tim.
- Cantumkan link task di deskripsi PR.
- Perbarui status task secara aktif (In Progress → In Review → Done).
- Bug kritis langsung dibuat sebagai `hotfix/*` dan dikomunikasikan ke tim.

Untuk masalah keamanan atau data pasien, laporkan secara pribadi ke tech lead — jangan dibuka di channel publik.

---

**Ada pertanyaan atau usulan perbaikan proses?**  
Diskusikan di channel tim atau langsung ke tech lead sebelum mengubah standar yang sudah disepakati.
