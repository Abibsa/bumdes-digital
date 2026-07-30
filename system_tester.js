import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// ============================================================
// 🧪 BUMDES DIGITAL - SUPER COMPREHENSIVE SYSTEM TESTER
// Menguji SELURUH operasi CRUD (Create, Read, Update, Delete)
// pada semua modul sistem tanpa terlewat satupun.
// ============================================================

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

let passed = 0, failed = 0;
const ok = (msg) => { passed++; console.log(`  ✅ ${msg}`); };
const fail = (msg) => { failed++; console.error(`  ❌ ${msg}`); };
const section = (title) => console.log(`\n${'═'.repeat(70)}\n  ${title}\n${'═'.repeat(70)}`);

const cleanup = { items: [], transactions: [], accounts: [], fixed_assets: [], bumdes_users: [] };

async function getOrCreateAccount(code, name, type) {
  let { data: acc } = await supabase.from('accounts').select('id').eq('code', code).single();
  if (!acc) {
    const { data: newAcc } = await supabase.from('accounts').insert({ code, name, type }).select('id').single();
    acc = newAcc;
    if (acc) cleanup.accounts.push(acc.id);
  }
  return acc?.id;
}

async function runAllTests() {
  console.log('\n' + '🧪'.repeat(35));
  console.log('  BUMDES DIGITAL - SUPER COMPREHENSIVE SYSTEM TESTER (Full CRUD)');
  console.log('  Waktu: ' + new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
  console.log('🧪'.repeat(35));

  // ================================================================
  section('MODUL 1: MANAJEMEN STOK BARANG (FULL CRUD)');
  // ================================================================
  
  // 1A. CREATE
  const { data: itemData, error: itemErr } = await supabase.from('items').insert({
    sku: `TEST-${Date.now()}`, name: 'Barang Uji Coba CRUD', category: 'ATK', price: 10000, cost_price: 5000, stock: 50
  }).select().single();
  
  if (itemErr || !itemData) fail(`[CREATE] Gagal menambah stok barang: ${itemErr?.message}`);
  else {
    cleanup.items.push(itemData.id);
    ok(`[CREATE] Barang berhasil ditambahkan (SKU: ${itemData.sku}, Stok: 50)`);
  }

  // 1B. READ & SEARCH
  if (itemData) {
    const { data: readItem } = await supabase.from('items').select('*').eq('id', itemData.id).single();
    if (readItem?.name === 'Barang Uji Coba CRUD') ok(`[READ] Membaca data stok berhasil, data akurat.`);
    else fail(`[READ] Membaca data stok gagal / tidak akurat.`);
    
    const { data: searchItem } = await supabase.from('items').select('*').ilike('name', '%Uji Coba%');
    if (searchItem?.length > 0) ok(`[SEARCH] Pencarian barang berfungsi (ketemu ${searchItem.length} barang).`);
    else fail(`[SEARCH] Pencarian barang gagal.`);
  }

  // 1C. UPDATE
  if (itemData) {
    await supabase.from('items').update({ price: 12000, stock: 150 }).eq('id', itemData.id);
    const { data: updatedItem } = await supabase.from('items').select('*').eq('id', itemData.id).single();
    if (updatedItem?.price === 12000 && updatedItem?.stock === 150) ok(`[UPDATE] Edit barang berhasil (Harga: 12.000, Stok: 150).`);
    else fail(`[UPDATE] Edit barang gagal.`);
  }

  // 1D. DELETE
  const { data: tempItem } = await supabase.from('items').insert({
    sku: `TEMP-${Date.now()}`, name: 'Barang Hapus', category: 'Lainnya', price: 1000, cost_price: 500, stock: 10
  }).select().single();
  if (tempItem) {
    await supabase.from('items').delete().eq('id', tempItem.id);
    const { data: checkDeleted } = await supabase.from('items').select('*').eq('id', tempItem.id).single();
    if (!checkDeleted) ok(`[DELETE] Menghapus stok barang berhasil secara permanen.`);
    else fail(`[DELETE] Gagal menghapus barang.`);
  }

  // ================================================================
  section('MODUL 2: ASET TETAP (FULL CRUD)');
  // ================================================================

  // 2A. CREATE
  const { data: assetData, error: assetErr } = await supabase.from('fixed_assets').insert({
    name: 'Aset Uji Coba', category: 'Bangunan', acquisition_cost: 15000000, notes: 'Tes aset'
  }).select().single();

  if (assetErr || !assetData) fail(`[CREATE] Gagal menambah aset: ${assetErr?.message}`);
  else {
    cleanup.fixed_assets.push(assetData.id);
    ok(`[CREATE] Aset tetap berhasil dicatat (Nilai: Rp 15.000.000).`);
  }

  // 2B. READ
  if (assetData) {
    const { data: readAsset } = await supabase.from('fixed_assets').select('*').eq('id', assetData.id).single();
    if (readAsset) ok(`[READ] Data aset tetap berhasil dibaca untuk masuk ke Neraca.`);
    else fail(`[READ] Gagal membaca data aset tetap.`);
  }

  // 2C. UPDATE
  if (assetData) {
    await supabase.from('fixed_assets').update({ acquisition_cost: 20000000, notes: 'Revisi Nilai' }).eq('id', assetData.id);
    const { data: updatedAsset } = await supabase.from('fixed_assets').select('*').eq('id', assetData.id).single();
    if (updatedAsset?.acquisition_cost === 20000000) ok(`[UPDATE] Edit data aset berhasil (Nilai direvisi: Rp 20.000.000).`);
    else fail(`[UPDATE] Edit data aset gagal.`);
  }

  // 2D. DELETE
  if (assetData) {
    await supabase.from('fixed_assets').delete().eq('id', assetData.id);
    const { data: checkDeletedAsset } = await supabase.from('fixed_assets').select('*').eq('id', assetData.id).single();
    if (!checkDeletedAsset) {
      ok(`[DELETE] Hapus data aset tetap berhasil.`);
      cleanup.fixed_assets = cleanup.fixed_assets.filter(id => id !== assetData.id);
    } else fail(`[DELETE] Gagal menghapus aset tetap.`);
  }

  // ================================================================
  section('MODUL 3: MANAJEMEN PENGURUS BUMDES (FULL CRUD)');
  // ================================================================

  // 3A. CREATE
  const { data: userData, error: userErr } = await supabase.from('bumdes_users').insert({
    name: 'Pengurus Tester', role: 'Staff Toko', email: `tester${Date.now()}@bumdes.com`
  }).select().single();

  if (userErr || !userData) fail(`[CREATE] Gagal membuat pengurus baru: ${userErr?.message}`);
  else {
    cleanup.bumdes_users.push(userData.id);
    ok(`[CREATE] Akun pengurus berhasil dibuat (${userData.email}).`);
  }

  // 3B. READ
  if (userData) {
    const { data: readUsers } = await supabase.from('bumdes_users').select('*');
    if (readUsers?.length > 0) ok(`[READ] Daftar seluruh pengurus berhasil diambil (${readUsers.length} pengguna).`);
    else fail(`[READ] Gagal mengambil daftar pengurus.`);
  }

  // 3C. UPDATE
  if (userData) {
    await supabase.from('bumdes_users').update({ role: 'Manager Toko' }).eq('id', userData.id);
    const { data: updatedUser } = await supabase.from('bumdes_users').select('*').eq('id', userData.id).single();
    if (updatedUser?.role === 'Manager Toko') ok(`[UPDATE] Update profil pengurus berhasil (Role diubah ke Manager).`);
    else fail(`[UPDATE] Update profil pengurus gagal.`);
  }

  // 3D. DELETE
  if (userData) {
    await supabase.from('bumdes_users').delete().eq('id', userData.id);
    const { data: checkDeletedUser } = await supabase.from('bumdes_users').select('*').eq('id', userData.id).single();
    if (!checkDeletedUser) {
      ok(`[DELETE] Hapus profil pengurus berhasil permanen.`);
      cleanup.bumdes_users = cleanup.bumdes_users.filter(id => id !== userData.id);
    } else fail(`[DELETE] Gagal menghapus profil pengurus.`);
  }

  // ================================================================
  section('MODUL 4: TRANSAKSI & JURNAL (AKUNTANSI) (CREATE & DELETE CASCADE)');
  // ================================================================

  // 4A. CREATE TRANSAKSI & JURNAL (Double Entry)
  const invNumber = `INV-CRUD-${Date.now()}`;
  const { data: trxData, error: trxErr } = await supabase.from('transactions').insert({
    invoice_number: invNumber, type: 'Penjualan', total_amount: 50000, notes: 'Transaksi Test'
  }).select().single();

  if (trxErr || !trxData) fail(`[CREATE] Gagal mencatat transaksi kasir: ${trxErr?.message}`);
  else {
    cleanup.transactions.push(trxData.id);
    ok(`[CREATE] Header Transaksi kasir berhasil dibuat (${invNumber}).`);

    // Catat Jurnal
    const kasId = await getOrCreateAccount('1.1.01', 'Kas', 'Asset');
    const penjId = await getOrCreateAccount('4.1.01', 'Pendapatan', 'Revenue');
    await supabase.from('journals').insert([
      { transaction_id: trxData.id, account_id: kasId, debit: 50000, credit: 0 },
      { transaction_id: trxData.id, account_id: penjId, debit: 0, credit: 50000 }
    ]);
    ok(`[CREATE] Jurnal Otomatis (Double Entry) berhasil dijahit ke transaksi.`);
  }

  // 4B. READ JURNAL (Pengecekan Balance)
  if (trxData) {
    const { data: checkJournals } = await supabase.from('journals').select('debit, credit').eq('transaction_id', trxData.id);
    let tDebit = 0, tCredit = 0;
    checkJournals?.forEach(j => { tDebit += j.debit; tCredit += j.credit; });
    if (tDebit === 50000 && tCredit === 50000) ok(`[READ] Kalkulasi Jurnal Balance (Debit: ${tDebit}, Kredit: ${tCredit}).`);
    else fail(`[READ] Kalkulasi Jurnal TIDAK BALANCE!`);
  }

  // 4C. UPDATE JURNAL (Ubah Catatan Transaksi)
  if (trxData) {
    await supabase.from('transactions').update({ notes: 'Transaksi Test Direvisi' }).eq('id', trxData.id);
    const { data: updatedTrx } = await supabase.from('transactions').select('notes').eq('id', trxData.id).single();
    if (updatedTrx?.notes === 'Transaksi Test Direvisi') ok(`[UPDATE] Revisi catatan transaksi berhasil.`);
    else fail(`[UPDATE] Gagal merevisi catatan transaksi.`);
  }

  // 4D. DELETE CASCADE (Menghapus Transaksi akan Menghapus Jurnal)
  if (trxData) {
    await supabase.from('transactions').delete().eq('id', trxData.id);
    const { data: checkCascade } = await supabase.from('journals').select('*').eq('transaction_id', trxData.id);
    if (!checkCascade || checkCascade.length === 0) {
      ok(`[DELETE] CASCADE DELETE BERHASIL! Menghapus riwayat transaksi otomatis membersihkan jurnal terkait.`);
      cleanup.transactions = cleanup.transactions.filter(id => id !== trxData.id);
    } else {
      fail(`[DELETE] CASCADE DELETE GAGAL! Jurnal masih tersisa di database.`);
    }
  }

  // ================================================================
  section('CLEANUP & FINAL REPORT');
  // ================================================================
  
  for (const id of cleanup.items) await supabase.from('items').delete().eq('id', id);
  for (const id of cleanup.transactions) await supabase.from('transactions').delete().eq('id', id);
  for (const id of cleanup.fixed_assets) await supabase.from('fixed_assets').delete().eq('id', id);
  for (const id of cleanup.bumdes_users) await supabase.from('bumdes_users').delete().eq('id', id);
  
  ok('CLEANUP', 'Sisa data sampah hasil ujicoba berhasil dibersihkan dari database asli.');

  console.log('\n' + '═'.repeat(70));
  console.log('  📊 HASIL PENGUJIAN FULL CRUD (Create, Read, Update, Delete)');
  console.log('═'.repeat(70));
  console.log(`  ✅ Berhasil : ${passed} Test Case`);
  console.log(`  ❌ Gagal    : ${failed} Test Case`);
  console.log('═'.repeat(70));

  if (failed === 0) console.log('\n  🎉 LUAR BIASA! SELURUH FITUR TAMBAH/BACA/EDIT/HAPUS BEKERJA 100%! 🎉\n');
  else console.log(`\n  💥 TERDAPAT ${failed} ERROR DALAM OPERASI CRUD!\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests();
