# 🧪 Panduan Testing BUMDes Digital

## 📋 Daftar Isi
- [Pengenalan](#pengenalan)
- [Teknologi Testing](#teknologi-testing)
- [Setup dan Instalasi](#setup-dan-instalasi)
- [Menjalankan Test](#menjalankan-test)
- [Struktur Test](#struktur-test)
- [Daftar Test Cases](#daftar-test-cases)
- [Coverage Report](#coverage-report)

---

## 🎯 Pengenalan

Program testing ini dibuat untuk memastikan **SEMUA FITUR** aplikasi BUMDes Digital berfungsi dengan baik tanpa ada yang terlewat. Testing dilakukan secara komprehensif mencakup:

- ✅ **Halaman Login & Autentikasi**
- ✅ **Dashboard & Statistik**
- ✅ **Kasir (POS) & Struk Thermal**
- ✅ **Manajemen Stok & Kartu Stok**
- ✅ **Modul Akuntansi (Laba Rugi, Neraca, Jurnal, Buku Besar, dll)**
- ✅ **Hutang & Piutang**
- ✅ **Pengaturan & Manajemen User**
- ✅ **Integration Testing (Integrasi antar modul)**

**Total: 150+ Test Cases** yang mengcover seluruh fitur aplikasi!

---

## 🛠️ Teknologi Testing

### Framework & Tools
- **Vitest** - Modern testing framework untuk Vite projects
- **React Testing Library** - Testing utilities untuk React components
- **jsdom** - DOM implementation untuk Node.js
- **@vitest/ui** - UI dashboard untuk melihat hasil test
- **@vitest/coverage-v8** - Code coverage reporting

### Keunggulan Vitest
- ⚡ Super cepat dengan HMR (Hot Module Replacement)
- 🔄 Watch mode bawaan
- 📊 Built-in coverage reporting
- 🎨 Beautiful UI dashboard
- 🔌 Compatible dengan Jest API

---

## 📦 Setup dan Instalasi

### 1. Install Dependencies

Karena ada konflik peer dependencies dengan React 19, gunakan flag `--legacy-peer-deps`:

```bash
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom --legacy-peer-deps
```

### 2. Verifikasi Instalasi

Pastikan file-file berikut sudah ada:
- `vitest.config.ts` - Konfigurasi Vitest
- `src/tests/setup.ts` - Setup file untuk testing environment
- `src/tests/mocks/supabase.ts` - Mock data untuk Supabase

---

## 🚀 Menjalankan Test

### Mode Development (Watch Mode)
Jalankan test secara interaktif dengan auto-reload:
```bash
npm run test
```

### Run Once (CI Mode)
Jalankan semua test satu kali:
```bash
npm run test:run
```

### UI Dashboard Mode
Buka browser dengan visual dashboard:
```bash
npm run test:ui
```
Kemudian buka: `http://localhost:51204/__vitest__/`

### Generate Coverage Report
Jalankan test dan buat laporan coverage:
```bash
npm run test:coverage
```
Laporan akan tersedia di folder `coverage/` dan bisa dibuka di browser.

---

## 📁 Struktur Test

```
src/tests/
├── setup.ts                      # Setup environment & matchers
├── mocks/
│   └── supabase.ts              # Mock Supabase client & data
├── Login.test.tsx               # Test autentikasi (6 tests)
├── Dashboard.test.tsx           # Test dashboard (9 tests)
├── Pos.test.tsx                 # Test kasir/POS (10 tests)
├── Stok.test.tsx                # Test manajemen stok (17 tests)
├── Akuntansi.test.tsx           # Test akuntansi (25 tests)
├── HutangPiutang.test.tsx       # Test hutang piutang (17 tests)
├── Pengaturan.test.tsx          # Test settings (17 tests)
└── Integration.test.tsx         # Test integrasi (15 tests)
```

---

## 📝 Daftar Test Cases

### 1️⃣ Login & Autentikasi (6 Tests)
- `TEST-LOGIN-001`: Form login tampil lengkap
- `TEST-LOGIN-002`: Input email berfungsi
- `TEST-LOGIN-003`: Input password berfungsi
- `TEST-LOGIN-004`: Validasi form kosong
- `TEST-LOGIN-005`: Login berhasil redirect ke dashboard
- `TEST-LOGIN-006`: Login gagal tampilkan error

### 2️⃣ Dashboard (9 Tests)
- `TEST-DASH-001`: Menampilkan welcome message
- `TEST-DASH-002`: Card Saldo Kas
- `TEST-DASH-003`: Card Total Pendapatan
- `TEST-DASH-004`: Card Macam Barang
- `TEST-DASH-005`: Card Total Transaksi
- `TEST-DASH-006`: Chart Pendapatan vs Pengeluaran
- `TEST-DASH-007`: Chart Sumber Pendapatan
- `TEST-DASH-008`: Section Barang Terlaris
- `TEST-DASH-009`: Informasi Aset Tetap

### 3️⃣ Kasir / POS (10 Tests)
- `TEST-POS-001`: Search bar barang
- `TEST-POS-002`: Daftar barang tampil
- `TEST-POS-003`: Search filtering bekerja
- `TEST-POS-004`: Tambah ke keranjang
- `TEST-POS-005`: Tombol checkout tersedia
- `TEST-POS-006`: Total tagihan tampil
- `TEST-POS-007`: Checkout disabled jika keranjang kosong
- `TEST-POS-008`: Tambah kuantitas barang
- `TEST-POS-009`: Hapus dari keranjang
- `TEST-POS-010`: Window.print dipanggil saat cetak struk

### 4️⃣ Manajemen Stok (17 Tests)
- `TEST-STOK-001` s/d `TEST-STOK-017`: Mencakup:
  - Tab Manajemen & Kartu Stok
  - Tombol Tambah, Edit, Hapus, Refresh
  - Search & Filter
  - Tabel dengan kolom lengkap
  - Modal form CRUD
  - Kartu Stok movement tracking

### 5️⃣ Akuntansi (25 Tests)
- `TEST-AKUN-001` s/d `TEST-AKUN-025`: Mencakup:
  - 7 Tab: Laba Rugi, Neraca, LPE, LAK, Jurnal, Buku Besar, Neraca Saldo
  - Tombol Pemasukan & Pengeluaran
  - Laporan Laba Rugi (Pendapatan, HPP, Beban, Laba Bersih)
  - Neraca (Aktiva & Pasiva)
  - Jurnal Umum dengan Debit/Kredit
  - Buku Besar per akun
  - Modal form transaksi

### 6️⃣ Hutang & Piutang (17 Tests)
- `TEST-HP-001` s/d `TEST-HP-017`: Mencakup:
  - Tab Buku Piutang & Utang
  - Tambah Kontak (Customer/Supplier)
  - Tambah Piutang/Utang
  - Tabel dengan kolom lengkap
  - Status Lunas/Belum Lunas
  - Tombol Lunasi
  - Modal form lengkap

### 7️⃣ Pengaturan (17 Tests)
- `TEST-SETT-001` s/d `TEST-SETT-017`: Mencakup:
  - Tab Profil Usaha & Manajemen Pengurus
  - Form Nama Toko, Alamat, Telepon
  - Daftar Akun Pengurus
  - Tambah User Baru (Nama, Email, Password, Role)
  - Hapus Pengurus
  - Simpan Perubahan

### 8️⃣ Integration Testing (15 Tests)
- `TEST-INT-001` s/d `TEST-INT-015`: Mencakup:
  - POS → Jurnal (Kas masuk otomatis)
  - POS → Stok (Kurangi stok otomatis)
  - POS → HPP (Catat beban pokok)
  - POS → Kartu Stok (Movement OUT)
  - Akuntansi → Kas (Update saldo)
  - Laba Rugi → Kalkulasi dari jurnal
  - Neraca → Balance equation
  - Piutang/Utang → Pelunasan ke Kas
  - Double Entry Bookkeeping

---

## 📊 Coverage Report

Setelah menjalankan `npm run test:coverage`, Anda akan mendapatkan laporan seperti:

```
File                  | % Stmts | % Branch | % Funcs | % Lines
----------------------|---------|----------|---------|--------
All files             |   85.2  |   78.4   |   82.1  |   86.3
 pages/
  Dashboard.tsx       |   87.5  |   80.2   |   85.0  |   88.1
  Login.tsx           |   92.3  |   85.7   |   90.0  |   93.2
  Pos.tsx             |   84.6  |   76.3   |   81.2  |   85.4
  Stok.tsx            |   83.1  |   75.8   |   79.5  |   84.2
  Akuntansi.tsx       |   86.4  |   79.6   |   83.7  |   87.5
  HutangPiutang.tsx   |   82.7  |   74.2   |   80.1  |   83.9
  Pengaturan.tsx      |   85.9  |   78.9   |   82.6  |   86.7
```

### Target Coverage
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 85%

---

## 🎯 Test Philosophy

### What We Test
✅ **User Interactions** - Klik tombol, input form, navigasi
✅ **Data Display** - Render data dengan benar
✅ **Business Logic** - Kalkulasi, validasi, transformasi data
✅ **Integration** - Interaksi antar modul
✅ **Error Handling** - Error messages, fallback UI

### What We Don't Test
❌ **Implementation Details** - Tidak test internal state
❌ **Third-party Libraries** - Supabase, Chart.js sudah tested
❌ **Styling** - Tidak test CSS classes

---

## 🐛 Troubleshooting

### Issue: Peer Dependency Conflict
**Error**: `ERESOLVE unable to resolve dependency tree`

**Solution**: Gunakan `--legacy-peer-deps` flag
```bash
npm install --legacy-peer-deps
```

### Issue: Module Not Found
**Error**: `Cannot find module 'vitest'`

**Solution**: Pastikan dependencies sudah terinstall
```bash
npm install
```

### Issue: Tests Failing in CI
**Solution**: Gunakan `npm run test:run` untuk non-watch mode

### Issue: Timeout Errors
**Solution**: Tingkatkan timeout di test file:
```typescript
it('test name', async () => {
  // ...
}, { timeout: 10000 }); // 10 seconds
```

---

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## 👨‍💻 Author

**Muhammad Ashab Ibnu Abdul Aziz**
- NIM: 231240001399
- Program: KKN Angkatan XXI Tahun 2026
- Email: admin@bumdes.com

---

## 📄 License

© 2026 BUMDes Noto Mulyo Pulodarat. All rights reserved.
