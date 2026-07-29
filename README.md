# Aplikasi BUMDes Digital Pulodarat

Aplikasi manajemen keuangan, kasir (Point of Sales), dan stok barang yang dirancang khusus untuk BUMDes Noto Mulyo, Desa Pulodarat, Jepara. Aplikasi ini dibangun untuk memudahkan pengurus dalam mencatat transaksi harian dan menyusun laporan akuntansi (Laba Rugi, Neraca) secara otomatis.

## Teknologi yang Digunakan
- **Frontend:** React.js (Vite) dengan TypeScript
- **Styling:** TailwindCSS v4
- **Routing:** React Router v7
- **Database & Auth (Backend):** Supabase (PostgreSQL)

## Kredensial Database (Supabase)
- **Database Password:** `KknPulodarat123#`
*(Harap simpan informasi ini dengan aman. Kredensial rahasia lainnya seperti API Key dan URL harus disimpan di dalam file `.env` lokal).*

## Cara Menjalankan Secara Lokal (Offline)

1. Pastikan komputer/laptop sudah terinstal **Node.js**.
2. Buka terminal (Command Prompt / PowerShell) di dalam folder proyek ini (`bumdes-digital`).
3. Jalankan perintah instalasi dependensi:
   ```bash
   npm install
   ```
4. Setelah instalasi selesai, jalankan server pengembangan:
   ```bash
   npm run dev
   ```
5. Buka browser dan akses alamat `http://localhost:5173`.

## Struktur Modul Aplikasi
- **Dashboard:** Ringkasan keuangan dan peringatan stok.
- **Kasir (POS):** Layar khusus untuk transaksi penjualan dan cetak struk.
- **Manajemen Stok:** Kelola master data barang, harga, dan ketersediaan stok.
- **Akuntansi:** Akses ke laporan keuangan berstandar seperti Jurnal Umum, Buku Besar, Laba Rugi, dan Neraca.
