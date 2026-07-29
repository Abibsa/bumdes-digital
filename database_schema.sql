-- =================================================================================
-- SKEMA DATABASE BUMDES DIGITAL (NOTO MULYO)
-- Silakan copy dan jalankan seluruh kode ini di menu "SQL Editor" Supabase Anda.
-- =================================================================================

-- 1. Tabel Chart of Accounts (COA) / Bagan Akun
CREATE TABLE accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL, -- Contoh: '1.1.01'
  name text NOT NULL,        -- Contoh: 'Kas'
  type text NOT NULL,        -- 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'
  balance numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Master Barang / Stok
CREATE TABLE items (
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
CREATE TABLE transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number text UNIQUE NOT NULL,
  type text NOT NULL, -- 'Penjualan', 'Pembelian', 'Biaya'
  total_amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_by text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel Detail Transaksi (Barang yang dibeli/dijual)
CREATE TABLE transaction_details (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id) ON DELETE RESTRICT,
  qty integer NOT NULL,
  unit_price numeric NOT NULL,
  subtotal numeric NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabel Jurnal Umum (Akuntansi)
CREATE TABLE journals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE RESTRICT,
  debit numeric DEFAULT 0,
  credit numeric DEFAULT 0,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mengaktifkan RLS (Row Level Security) agar database aman
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

-- Membuat Policy agar frontend bisa membaca dan menulis data (Untuk sementara: Public Access)
CREATE POLICY "Allow public all access on accounts" ON accounts FOR ALL USING (true);
CREATE POLICY "Allow public all access on items" ON items FOR ALL USING (true);
CREATE POLICY "Allow public all access on transactions" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow public all access on transaction_details" ON transaction_details FOR ALL USING (true);
CREATE POLICY "Allow public all access on journals" ON journals FOR ALL USING (true);
