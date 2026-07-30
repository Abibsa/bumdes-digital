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
- **Cetak Struk:** Mendukung pencetakan struk ke printer *Bluetooth/USB* langsung di toko untuk kepuasan pelanggan.

### 📦 2. Otomatisasi Stok Gudang (Inventory Management)
- **Sinkronisasi Real-time:** Stok otomatis berkurang secara presisi pada setiap transaksi kasir yang berhasil.
- **Indikator Stok Cerdas:** Visualisasi warna untuk memantau barang yang hampir habis (Kuning < 20, Merah < 10).
- **CRUD Penuh:** Tambah, baca, ubah, dan hapus data barang dengan mudah.

### ⚖️ 3. Akuntansi Kelas Enterprise (Double Entry)
- **Jurnal Otomatis:** Setiap transaksi (Penjualan, Beban, Pendapatan Lain) akan otomatis diterjemahkan menjadi **Jurnal Akuntansi Debit & Kredit** yang 100% seimbang (Balance).
- **Cascade Data:** Sistem yang bersih; membatalkan transaksi otomatis membersihkan jurnal riwayatnya.

### 📊 4. Pelaporan Keuangan Komprehensif
- **Laba Rugi (Profit & Loss):** Membedah total Pendapatan Toko, Pendapatan Lain (seperti parkir), HPP, Beban Operasional, hingga mendapati **Laba Bersih**.
- **Neraca (Balance Sheet):** Pemantauan mendalam atas Kas tunai, Persediaan Barang, hingga akumulasi **Aset Tetap BUMDes** (seperti Pembangunan Parkir 100jt, Mesin, dll).
- **Export Data:** Unduh laporan Laba Rugi langsung ke format **PDF & Excel**.

### 👥 5. Manajemen Multi-Pengurus (Multi-User)
Mendukung kolaborasi seluruh anggota kepengurusan BUMDes:
- **Direktur** (Akses kontrol penuh)
- **Bendahara** (Fokus pada Laporan & Jurnal)
- **Sekretaris & Manajer Toko** (Fokus operasional Kasir & Stok)

## 🛠️ Stack Teknologi (Tech Stack)
Aplikasi ini dibangun menggunakan arsitektur modern untuk menjamin kecepatan dan keandalan data:
- **Frontend Layer:** React (Vite) dengan strict TypeScript.
- **Styling:** Tailwind CSS v4 untuk UI yang menawan & Dark Mode.
- **Database & Backend:** Supabase (PostgreSQL) dengan *Foreign Key Integrity*.
- **Icons & UI:** Lucide React icons.
- **Automated Testing:** Script `system_tester.js` untuk 27 Kasus Uji Ekstrim (*Ultimate CRUD & Business Logic Testing*).

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

### 4. Jalankan Server Development
```bash
npm run dev
```
Aplikasi dapat diakses di browser pada alamat `http://localhost:5173`.

---

### 🧪 Menjalankan Automated System Tester
Untuk memvalidasi integritas 100% logika sistem dan database (seperti balance akuntansi, sinkronisasi stok, dll), jalankan *script ultimate tester*:
```bash
node system_tester.js
```
*(Script ini akan menguji seluruh proses operasi tanpa merusak data asli BUMDes).*

---
<div align="center">
  <b>Dibangun dengan 💻 dan ☕ untuk BUMDes Noto Mulyo Pulodarat</b><br>
  <i>Inovasi KKN Angkatan XXI Tahun 2026</i><br>
  <strong>&copy; 2026 Muhammad Ashab Ibnu Abdul Aziz (NIM: 231240001399)</strong>
</div>
