# 🚀 Panduan Instalasi Testing Suite

## 📋 Persiapan

Pastikan Anda sudah berada di direktori project:
```bash
cd bumdes-digital
```

---

## 🔧 Langkah Instalasi

### Step 1: Install Testing Dependencies

Karena aplikasi menggunakan React 19 dan ada konflik peer dependencies dengan testing library, gunakan salah satu command berikut:

#### Metode A: Menggunakan --legacy-peer-deps (RECOMMENDED)
```bash
npm install --save-dev vitest@1.0.4 @vitest/ui@1.0.4 @vitest/coverage-v8@1.0.4 @testing-library/react@14.1.2 @testing-library/jest-dom@6.1.5 @testing-library/user-event@14.5.1 jsdom@23.0.1 --legacy-peer-deps
```

#### Metode B: Menggunakan --force
```bash
npm install --save-dev vitest@1.0.4 @vitest/ui@1.0.4 @vitest/coverage-v8@1.0.4 @testing-library/react@14.1.2 @testing-library/jest-dom@6.1.5 @testing-library/user-event@14.5.1 jsdom@23.0.1 --force
```

#### Metode C: Menggunakan Yarn (Alternatif)
```bash
# Install yarn dulu jika belum ada
npm install -g yarn

# Install dependencies
yarn add -D vitest@1.0.4 @vitest/ui@1.0.4 @vitest/coverage-v8@1.0.4 @testing-library/react@14.1.2 @testing-library/jest-dom@6.1.5 @testing-library/user-event@14.5.1 jsdom@23.0.1
```

---

### Step 2: Verifikasi Instalasi

Cek apakah semua dependencies sudah terinstall:
```bash
npm list vitest
npm list @testing-library/react
```

Jika muncul versi number, berarti berhasil! ✅

---

### Step 3: Jalankan Test Pertama Kali

#### Test Mode (Watch - Auto Reload)
```bash
npm run test
```

Tekan `a` untuk run all tests, atau `q` untuk quit.

#### Test UI (Visual Dashboard)
```bash
npm run test:ui
```
Kemudian buka browser di: **http://localhost:51204/__vitest__/**

#### Run Once (Single Run)
```bash
npm run test:run
```

#### Coverage Report
```bash
npm run test:coverage
```
Laporan akan tersimpan di folder `coverage/`. Buka `coverage/index.html` di browser.

---

## ✅ Expected Output

Setelah berhasil, Anda akan melihat output seperti:
```
✓ src/tests/Login.test.tsx (6)
✓ src/tests/Dashboard.test.tsx (9)
✓ src/tests/Pos.test.tsx (10)
✓ src/tests/Stok.test.tsx (17)
✓ src/tests/Akuntansi.test.tsx (25)
✓ src/tests/HutangPiutang.test.tsx (17)
✓ src/tests/Pengaturan.test.tsx (17)
✓ src/tests/Integration.test.tsx (15)

Test Files  8 passed (8)
     Tests  116 passed (116)
```

---

## 🐛 Troubleshooting

### Problem 1: Error ERESOLVE
```
npm error ERESOLVE unable to resolve dependency tree
```

**Solusi**: Tambahkan flag `--legacy-peer-deps` atau `--force`

---

### Problem 2: TypeScript Error Masih Muncul
```
Cannot find module 'vitest'
```

**Solusi**: 
1. Restart VS Code (Ctrl+Shift+P → "Reload Window")
2. Atau close dan buka lagi project

---

### Problem 3: Test Tidak Jalan
```
Command 'test' not found
```

**Solusi**: 
1. Cek `package.json` pastikan ada scripts:
```json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```
2. Run `npm install` lagi

---

### Problem 4: Port 51204 Already in Use
```
Port 51204 is already in use
```

**Solusi**: 
- Tutup proses yang menggunakan port tersebut, atau
- Edit `vitest.config.ts` dan ganti port

---

## 📊 Struktur Test Files

Setelah instalasi, struktur akan seperti ini:
```
bumdes-digital/
├── src/
│   └── tests/
│       ├── setup.ts
│       ├── mocks/
│       │   └── supabase.ts
│       ├── Login.test.tsx
│       ├── Dashboard.test.tsx
│       ├── Pos.test.tsx
│       ├── Stok.test.tsx
│       ├── Akuntansi.test.tsx
│       ├── HutangPiutang.test.tsx
│       ├── Pengaturan.test.tsx
│       └── Integration.test.tsx
├── vitest.config.ts
├── TESTING_GUIDE.md
└── INSTALL_TESTING.md (this file)
```

---

## 🎉 Selesai!

Setelah instalasi berhasil:
1. ✅ Error TypeScript akan hilang
2. ✅ Bisa run test dengan `npm run test`
3. ✅ Bisa lihat coverage dengan `npm run test:coverage`
4. ✅ Bisa pakai UI dashboard dengan `npm run test:ui`

---

## 📚 Next Steps

1. Baca `TESTING_GUIDE.md` untuk dokumentasi lengkap
2. Lihat file test untuk contoh implementasi
3. Mulai development dengan confidence - semua fitur ter-test! 🚀

---

**Happy Testing! 🧪**

*Dibuat dengan ❤️ untuk BUMDes Noto Mulyo Pulodarat*
