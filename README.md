<div align="center">
  
# 🚀 BUMDes Digital: Sistem Enterprise Noto Mulyo
**Digitalisasi Keuangan & Operasional Terpadu BUMDes Noto Mulyo Pulodarat**

[![React](https://img.shields.io/badge/React-18.x-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-DB-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

*Program Kerja Unggulan Kuliah Kerja Nyata (KKN) Angkatan XXI Tahun 2026*  
**Diciptakan dan Dikembangkan oleh: Muhammad Ashab Ibnu Abdul Aziz (NIM: 231240001399)**

</div>

---

## 📖 Latar Belakang Program (Proker KKN)
Berdasarkan hasil observasi lapangan di **BUMDes Noto Mulyo, Desa Pulodarat, Kecamatan Pecangaan, Kabupaten Jepara**, ditemukan tantangan dalam hal manajemen waktu pengurus dan sistem pembukuan yang masih konvensional. 

Program Kerja (Proker) KKN ini menginisiasi transformasi digital dengan membangun sistem pencatatan keuangan dan Point of Sale (POS) kelas *Enterprise* yang dirancang khusus untuk mempermudah operasional unit usaha (Toko ATK, Pengasapan Lele, Tempat Parkir, dll) agar lebih transparan, akuntabel, dan *real-time*.

## ✨ Fitur Utama (Core Features)

### 🛒 1. Kasir Pintar (Point of Sale) & Struk Thermal
- **Transaksi Super Cepat:** Desain kasir responsif untuk tablet & mobile.
- **Kalkulasi Cerdas:** Menghitung total belanja & kembalian secara otomatis.
- **Otomatisasi Jurnal:** Setiap penjualan langsung tercatat sebagai Jurnal Akuntansi (Kas & Pendapatan) sekaligus mencatat Beban Pokok Penjualan (HPP) & pengurangan Persediaan.
- **Cetak Struk:** Mendukung pencetakan struk langsung di toko untuk kepuasan pelanggan.

### 📦 2. Manajemen & Kartu Stok (Buku Pembantu Persediaan)
- **Sinkronisasi Real-time:** Stok otomatis berkurang secara presisi pada setiap transaksi kasir yang berhasil.
- **Kartu Stok Dinamis:** Pantau riwayat seluruh barang masuk (IN) dan keluar (OUT) lengkap dengan saldo berjalan.
- **Indikator Stok Cerdas:** Memantau barang yang hampir habis dengan antarmuka dinamis.

### ⚖️ 3. Akuntansi Kelas Enterprise (Standar Noto Mulyo 2025)
Terintegrasi secara penuh dengan **Chart of Accounts (COA) 5-Level** standar BUMDes. Fitur meliputi:
- **Buku Jurnal Umum:** Mencatat seluruh transaksi debit-kredit.
- **Buku Besar (General Ledger):** Memfilter riwayat per akun secara spesifik untuk melihat saldo berjalan.
- **Neraca Saldo (Trial Balance):** Memastikan keseimbangan (balance) antara seluruh aktiva, kewajiban, ekuitas, pendapatan, dan beban.

### 📊 4. Pelaporan Keuangan Komprehensif Real-Time
- **Laporan Laba Rugi:** Membedah total Pendapatan, HPP, hingga Beban Operasional untuk mendapatkan **Laba Bersih**.
- **Laporan Posisi Keuangan (Neraca):** Pemantauan mendalam atas Kas, Piutang, Persediaan, Aset Tetap, Utang, dan Ekuitas.
- **Laporan Perubahan Ekuitas (LPE):** Mengkalkulasi otomatis penambahan modal dari SHU/Laba berjalan.
- **Laporan Arus Kas (LAK):** Merekap arus uang masuk dan keluar.

### 💳 5. Buku Pembantu Utang & Piutang
- **Catatan Pihak Terkait:** Pantau seluruh customer dan supplier BUMDes.
- **Sistem Cicilan/Pelunasan:** Kelola status piutang warga atau utang supplier yang apabila dilunasi akan otomatis membuat Jurnal ke Kas.

### 👥 6. Manajemen Multi-Pengurus (Multi-User)
Mendukung kolaborasi seluruh anggota kepengurusan BUMDes (Direktur, Bendahara, Admin/Manajer Toko) dengan pembagian role/hak akses sistem.

## 🛠️ Stack Teknologi (Tech Stack)
Aplikasi ini dibangun menggunakan arsitektur modern untuk menjamin kecepatan, keindahan desain UI/UX, dan keandalan data:
- **Frontend Layer:** React (Vite) dengan strict TypeScript.
- **Styling:** Tailwind CSS v4 untuk UI/UX kelas Premium (*Glassmorphism*, transisi mulus, dan *Dark Mode*).
- **Database & Backend:** Supabase (PostgreSQL) dengan perlindungan *Row Level Security* (RLS) dan *Foreign Key Integrity*.
- **Icons & Visuals:** Lucide React icons.

## 🚀 Panduan Instalasi (Quick Start)

### 1. Kloning Repositori
```bash
git clone https://github.com/Abibsa/bumdes-digital.git
cd bumdes-digital
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Database (Supabase)
Buat file `.env.local` di folder *root* dan masukkan kredensial Supabase Anda:
```env
VITE_SUPABASE_URL=https://[PROJECT-ID].supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...
```

**Penting:** Jangan lupa jalankan script SQL yang ada di file `database_schema.sql` dan `database_update.sql` ke menu **SQL Editor** pada Supabase Anda untuk melakukan migrasi & seeding tabel.

### 4. Jalankan Server Development
```bash
npm run dev
```
Aplikasi dapat diakses di browser pada alamat `http://localhost:5173`.

---
<div align="center">
  <b>Dibangun dengan 💻 dan ☕ untuk BUMDes Noto Mulyo Pulodarat</b><br>
  <i>Inovasi KKN Angkatan XXI Tahun 2026</i><br>
  <strong>&copy; 2026 Muhammad Ashab Ibnu Abdul Aziz (NIM: 231240001399)</strong>
</div>
