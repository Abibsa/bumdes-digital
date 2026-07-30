import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Gagal membaca kredensial Supabase dari .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDiagnostics() {
  console.log("=======================================");
  console.log("🔍 MEMULAI DIAGNOSTIK SISTEM BUMDES 🔍");
  console.log("=======================================\n");

  let allGood = true;

  // 1. Cek Koneksi Database & Tabel Pengurus (Multi-user)
  console.log("1️⃣  Mengecek Modul Multi-User & Koneksi...");
  const { data: users, error: userError } = await supabase.from('bumdes_users').select('*');
  if (userError) {
    console.error("❌ Tabel bumdes_users tidak ditemukan atau ada error:", userError.message);
    allGood = false;
  } else {
    console.log(`✅ Sukses! Ditemukan ${users.length} pengurus BUMDes terdaftar.`);
  }

  // 2. Cek Modul Kasir & Stok (Relasi Barang)
  console.log("\n2️⃣  Mengecek Modul Stok & Transaksi Kasir...");
  const { data: items, error: itemError } = await supabase.from('items').select('*');
  const { data: tx, error: txError } = await supabase.from('transactions').select('*');
  const { data: txItems, error: txItemsError } = await supabase.from('transaction_details').select('*');
  
  if (itemError || txError || txItemsError) {
    console.error("❌ Error membaca modul kasir/stok:");
    if (itemError) console.error("   - Items error:", itemError.message);
    if (txError) console.error("   - Transaksi error:", txError.message);
    if (txItemsError) console.error("   - Transaction Items error:", txItemsError.message);
    allGood = false;
  } else {
    console.log(`✅ Tabel Items: ${items.length} jenis barang.`);
    console.log(`✅ Tabel Transactions: ${tx.length} transaksi kasir tercatat.`);
    console.log(`✅ Tabel Transaction Items: ${txItems.length} record barang terjual.`);
    
    // Cek integritas: apakah ada barang terjual yang ID nya tidak valid?
    let invalidItems = 0;
    const itemIds = new Set(items.map(i => i.id));
    txItems.forEach(ti => {
      if (!itemIds.has(ti.item_id)) invalidItems++;
    });
    if (invalidItems > 0) {
      console.warn(`⚠️ Peringatan: Ada ${invalidItems} riwayat penjualan dengan barang yang sudah terhapus permanen.`);
    } else {
      console.log(`✅ Integritas Transaksi vs Barang: Aman Tersinkronisasi.`);
    }
  }

  // 3. Cek Modul Akuntansi & Jurnal Double-Entry
  console.log("\n3️⃣  Mengecek Modul Akuntansi (Buku Jurnal)...");
  const { data: journals, error: journalError } = await supabase.from('journals').select('*');
  
  if (journalError) {
    console.error("❌ Tabel journals tidak ditemukan.");
    allGood = false;
  } else {
    let totalDebit = 0;
    let totalCredit = 0;
    journals.forEach(j => {
      totalDebit += j.debit;
      totalCredit += j.credit;
    });

    console.log(`➡️ Total Jurnal Debit  : Rp ${totalDebit.toLocaleString('id-ID')}`);
    console.log(`➡️ Total Jurnal Kredit : Rp ${totalCredit.toLocaleString('id-ID')}`);
    
    if (totalDebit === totalCredit) {
      console.log(`✅ Prinsip Akuntansi Double-Entry SEIMBANG (Balance)! Jurnal tersinkronisasi sempurna.`);
    } else {
      console.error(`❌ ALARM BUMDES: Terdapat selisih Rp ${Math.abs(totalDebit - totalCredit).toLocaleString('id-ID')} pada Jurnal! Laporan Keuangan tidak balance.`);
      allGood = false;
    }
  }

  // 4. Cek Pencatatan Aset Tetap
  console.log("\n4️⃣  Mengecek Modul Aset Tetap BUMDes...");
  const { data: assets, error: assetError } = await supabase.from('fixed_assets').select('*');
  
  if (assetError) {
    console.error("❌ Tabel fixed_assets tidak ditemukan.");
    allGood = false;
  } else {
    const totalAset = assets.reduce((sum, a) => sum + a.acquisition_cost, 0);
    console.log(`✅ Ditemukan ${assets.length} Aset Tetap tercatat dengan total nilai: Rp ${totalAset.toLocaleString('id-ID')}`);
  }

  // 5. Cek Pengaturan Profil Usaha
  console.log("\n5️⃣  Mengecek Modul Profil & Cetak Struk...");
  const { data: settings, error: settingsError } = await supabase.from('settings').select('*');
  if (settingsError || settings.length === 0) {
    console.warn("⚠️ Peringatan: Profil BUMDes (Nama, Alamat) di Pengaturan belum disimpan. Struk kasir bisa jadi kosong kop-nya.");
  } else {
    console.log(`✅ Kop Struk Terdaftar: ${settings[0].store_name} - ${settings[0].store_address}`);
  }

  console.log("\n=======================================");
  if (allGood) {
    console.log("🎉 KESIMPULAN: SELURUH SISTEM & FITUR BUMDES DIGITAL 100% AMAN DAN TERSINKRONISASI! SIAP DIGUNAKAN! 🎉");
  } else {
    console.log("💥 KESIMPULAN: TERDAPAT MASALAH PADA SISTEM. SILAKAN CEK LOG DI ATAS! 💥");
  }
  console.log("=======================================\n");

  process.exit(allGood ? 0 : 1);
}

runDiagnostics();
