-- =================================================================================
-- SKEMA DATABASE BUMDES DIGITAL (NOTO MULYO)
-- Silakan copy dan jalankan seluruh kode ini di menu "SQL Editor" Supabase Anda.
-- =================================================================================

-- 1. Tabel Chart of Accounts (COA) / Bagan Akun
CREATE TABLE IF NOT EXISTS accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL, -- Contoh: '1.1.01'
  name text NOT NULL,        -- Contoh: 'Kas'
  type text NOT NULL,        -- 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'
  balance numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Master Barang / Stok
CREATE TABLE IF NOT EXISTS items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  cost_price numeric NOT NULL DEFAULT 0, -- Harga beli (HPP)
  stock integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel Header Transaksi (Kasir & Umum)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number text UNIQUE NOT NULL,
  type text NOT NULL, -- 'Penjualan', 'Pembelian', 'Biaya'
  total_amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_by text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel Detail Transaksi (Barang yang dibeli/dijual)
CREATE TABLE IF NOT EXISTS transaction_details (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id) ON DELETE RESTRICT,
  qty integer NOT NULL,
  unit_price numeric NOT NULL,
  subtotal numeric NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabel Jurnal Umum (Akuntansi)
CREATE TABLE IF NOT EXISTS journals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE RESTRICT,
  debit numeric DEFAULT 0,
  credit numeric DEFAULT 0,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabel Pengaturan (Settings)
CREATE TABLE IF NOT EXISTS settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name text NOT NULL DEFAULT 'BUMDes Noto Mulyo',
  store_address text NOT NULL DEFAULT 'Pulodarat, Jepara',
  store_contact text DEFAULT '081234567890',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabel Aset Tetap (Fixed Assets)
CREATE TABLE IF NOT EXISTS fixed_assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Peralatan',
  acquisition_date date NOT NULL DEFAULT CURRENT_DATE,
  acquisition_cost bigint NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Tabel Manajemen Pengurus (bumdes_users)
CREATE TABLE IF NOT EXISTS bumdes_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    role text NOT NULL DEFAULT 'Admin',
    email text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================================================
-- Mengaktifkan RLS (Row Level Security) agar database aman
-- =================================================================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bumdes_users ENABLE ROW LEVEL SECURITY;

-- =================================================================================
-- Membuat Policy agar frontend bisa membaca dan menulis data (Untuk sementara: Public Access)
-- =================================================================================
CREATE POLICY "Allow public all access on accounts" ON accounts FOR ALL USING (true);
CREATE POLICY "Allow public all access on items" ON items FOR ALL USING (true);
CREATE POLICY "Allow public all access on transactions" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow public all access on transaction_details" ON transaction_details FOR ALL USING (true);
CREATE POLICY "Allow public all access on journals" ON journals FOR ALL USING (true);
CREATE POLICY "Allow public all access on settings" ON settings FOR ALL USING (true);
CREATE POLICY "Allow public all access on fixed_assets" ON fixed_assets FOR ALL USING (true);
CREATE POLICY "Allow public all access on bumdes_users" ON bumdes_users FOR ALL USING (true);

-- =================================================================================
-- Seeding Data Awal (Opsional)
-- =================================================================================

-- Insert data bawaan pengaturan jika masih kosong
INSERT INTO settings (store_name, store_address, store_contact) 
VALUES ('BUMDes Noto Mulyo', 'Desa Pulodarat, Kec. Pecangaan, Jepara', '0812-3456-7890');

-- Insert beberapa data awal Aset Tetap berdasarkan hasil observasi lapangan
INSERT INTO fixed_assets (name, category, acquisition_cost, notes) VALUES
  ('Mesin Fotokopi', 'Peralatan', 5000000, 'Aset toko BUMDes'),
  ('Etalase Toko', 'Peralatan', 3000000, 'Etalase display barang dagangan'),
  ('Laptop Operasional', 'Peralatan', 7000000, 'Laptop untuk operasional toko'),
  ('Printer', 'Peralatan', 2000000, 'Printer baru untuk toko'),
  ('Pembangunan Tempat Parkir', 'Bangunan', 100000000, 'Lahan parkir di sebelah pabrik (belum beroperasi)');

-- Insert data pengurus BUMDes
INSERT INTO bumdes_users (name, role, email) VALUES
    ('Mas Anjid', 'Direktur BUMDes', 'direktur@bumdes.com'),
    ('Mbak Nurul', 'Bendahara', 'bendahara@bumdes.com'),
    ('Admin Pusat', 'Admin Sistem', 'admin@bumdes.com');
