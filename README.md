# BUMDes Digital Pulodarat

Aplikasi manajemen operasional dan keuangan BUMDes Noto Mulyo Pulodarat. Dibangun khusus untuk memecahkan permasalahan pencatatan keuangan manual, pelacakan stok barang, dan pelaporan keuangan.

## 🚀 Fitur Utama

### 1. 🛒 Point of Sales (Kasir) & Struk
- Pencatatan transaksi penjualan secara real-time.
- Perhitungan kembalian otomatis.
- **Cetak Struk Thermal (Bluetooth/USB)** langsung dari aplikasi untuk pelanggan.

### 2. 📦 Manajemen Stok Barang
- Pelacakan stok otomatis berkurang setiap ada penjualan.
- Peringatan stok menipis dengan indikator warna (merah untuk < 10, kuning untuk < 20).
- Fitur penambahan stok (*restock*) secara mudah.

### 3. 📊 Akuntansi & Laporan Keuangan Berkala
- **Jurnal Otomatis:** Setiap transaksi toko, pemasukan unit lain, dan pengeluaran otomatis tercatat di buku jurnal (Double Entry / Debit-Kredit).
- **Multi-Unit Usaha:** Mendukung pencatatan pemasukan dari unit lain seperti Parkir Pabrik, Pengasapan Lele, dll.
- **Laporan Laba Rugi:** Tersedia real-time dan bisa difilter per bulan atau per tahun.
- **Laporan Neraca:** Melacak Kas, Persediaan Barang, dan **Aset Tetap BUMDes** (seperti pembangunan parkir 100jt, aset Ketapang, dsb).
- **Export Excel & PDF:** Laporan siap di-download dengan satu klik untuk pelaporan rutin ke desa.

### 4. 👥 Manajemen Pengurus (Multi-User)
- Akses ke sistem bisa dibagi untuk berbagai peran: Direktur BUMDes, Bendahara, Sekretaris, dan Admin.
- Tampilan nama user yang sedang login di menu utama.

### 5. 📱 Mobile Responsive & Dark Mode
- Tampilan 100% responsif, bisa diakses dengan nyaman menggunakan tablet atau HP di toko.
- Tersedia Mode Gelap (Dark Mode) untuk kenyamanan mata.

## 🛠️ Teknologi yang Digunakan
- **Frontend:** React, TypeScript, Tailwind CSS v4, Vite
- **Backend & Database:** Supabase (PostgreSQL)
- **Icons:** Lucide React
- **Export Laporan:** jsPDF, xlsx-js-style

## 📂 Struktur Database
Sistem menggunakan `database_schema_v3.sql` yang mencakup:
- `products`: Data barang & stok
- `transactions`: Transaksi kasir, pemasukan, pengeluaran
- `transaction_items`: Detail barang yang terjual
- `accounts`: Akun akuntansi (Bagan Akun Standar)
- `journals`: Buku jurnal (Debit & Kredit)
- `settings`: Pengaturan profil toko (Nama, Alamat)
- `fixed_assets`: Aset tetap BUMDes (Tanah, Mesin, Bangunan)
- `bumdes_users`: Daftar akun pengurus BUMDes

## 🚀 Cara Menjalankan Lokal

1. Clone repositori ini.
2. Jalankan `npm install` untuk mengunduh dependensi.
3. Sesuaikan URL dan Key Supabase di `.env`.
4. Jalankan `npm run dev`.
5. Buka `http://localhost:5173`.

---
*Dibangun untuk BUMDes Noto Mulyo Pulodarat - KKN Angkatan XXI Tahun 2026*
