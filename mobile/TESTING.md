# Panduan Testing — Frontend Pasien (Momy Dar / Bloom)

## Status Saat Ini

Project masih menggunakan **data mock** dan belum memiliki test suite. Dokumen ini menjelaskan target dan cara mulai menambahkan test.

---

## Stack yang Direkomendasikan

| Tool | Fungsi |
|------|--------|
| **Jest** | Test runner |
| **jest-expo** | Preset untuk Expo |
| **@testing-library/react-native** | Testing komponen React Native |
| **@testing-library/jest-native** | Matcher tambahan |

### Instalasi

```bash
npm install -D jest @types/jest ts-jest jest-expo \
  @testing-library/react-native @testing-library/jest-native
```

### Script di package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## Struktur Folder Test

```text
__tests__/
├── unit/
│   └── services/
│       └── patientService.test.ts
├── components/
│   ├── Badge.test.tsx
│   └── BottomNav.test.tsx
└── screens/                    # opsional
    └── LoginScreen.test.tsx
```

Atau co-located di samping file sumber:

```text
src/services/__tests__/patientService.test.ts
src/components/__tests__/Badge.test.tsx
```

---

## Prioritas Penulisan Test

1. **Unit test service** (`patientService`) — paling berharga, mudah, cepat.
2. **Component test** kecil (Badge, BottomNav).
3. **Screen test** hanya untuk alur kritis (Login) jika diperlukan.
4. **Manual testing** di Expo Go / emulator tetap wajib untuk UI.

---

## Contoh Test yang Sudah Disediakan

- `__tests__/unit/services/patientService.test.ts` — template unit test service
- `__tests__/components/Badge.test.tsx` — template component test
- `jest.config.js` — konfigurasi dasar

Salin file-file tersebut ke root project, sesuaikan path import, lalu jalankan:

```bash
npm test
```

---

## Yang Tidak Perlu Ditest Berlebihan

- Detail styling (warna, margin, fontSize) kecuali sangat kritis.
- Snapshot test yang terlalu rapuh.
- Implementasi internal yang sering berubah.
- Aset gambar / font.

---

## CI

Setelah test tersedia, aktifkan step berikut di `.github/workflows/ci.yml`:

```yaml
- name: Run unit tests
  run: npm test -- --passWithNoTests
```

Type-check (`tsc --noEmit`) sudah dijalankan di CI.
