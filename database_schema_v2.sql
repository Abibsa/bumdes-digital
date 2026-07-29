-- =================================================================================
-- SKEMA DATABASE BUMDES DIGITAL (TAMBAHAN TAHAP 3)
-- Silakan copy dan jalankan kode ini di "SQL Editor" Supabase Anda.
-- =================================================================================

-- 1. Membuat Tabel Pengaturan (Settings)
CREATE TABLE settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name text NOT NULL DEFAULT 'BUMDes Noto Mulyo',
  store_address text NOT NULL DEFAULT 'Pulodarat, Jepara',
  store_contact text DEFAULT '081234567890',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mengaktifkan RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Membuat Policy agar frontend bisa membaca dan menulis data
CREATE POLICY "Allow public all access on settings" ON settings FOR ALL USING (true);

-- Insert data bawaan jika masih kosong
INSERT INTO settings (store_name, store_address, store_contact) 
VALUES ('BUMDes Noto Mulyo', 'Desa Pulodarat, Kec. Pecangaan, Jepara', '0812-3456-7890');
