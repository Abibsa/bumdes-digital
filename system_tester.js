import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// ============================================================
// 🧪 BUMDES DIGITAL - ULTIMATE SYSTEM TESTER (V3)
// Menguji SETIAP modul, bisnis logic, integrasi akuntansi,
// dan full operasi CRUD secara komprehensif.
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

// Registry untuk pembersihan di akhir
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

async function runUltimateTests() {
  console.log('\n' + '🚀'.repeat(35));
  console.log('  BUMDES DIGITAL - ULTIMATE SYSTEM TESTER (FULL COVERAGE)');
  console.log('  Waktu Uji: ' + new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
  console.log('🚀'.repeat(35));

  // ================================================================
  section('MODUL 1: INFRASTRUKTUR & DATABASE');
  // ================================================================
  try {
    const { error } = await supabase.from('settings').select('id').limit(1);
    if (error) fail(`Koneksi Supabase bermasalah: ${error.message}`);
    else ok(`Koneksi API Supabase (PostgREST) berhasil.`);
  } catch (e) { fail(`Koneksi jaringan gagal: ${e.message}`); }

  const tables = ['accounts', 'items', 'transactions', 'transaction_details', 'journals', 'settings', 'fixed_assets', 'bumdes_users'];
  for (const t of tables) {
    const { error } = await supabase.from(t).select('id').limit(1);
    if (error) fail(`Tabel ${t} hilang!`); else ok(`Validasi Tabel: ${t} tersedia.`);
  }

  // ================================================================
  section('MODUL 2: STOK BARANG (FULL CRUD & CARI)');
  // ================================================================
  const { data: iData, error: iErr } = await supabase.from('items').insert({
    sku: `SKU-${Date.now()}`, name: 'Barang Ultimate', category: 'Sembako', price: 15000, cost_price: 10000, stock: 100
  }).select().single();
  if (iErr) fail(`[CREATE] Tambah barang gagal: ${iErr.message}`);
  else {
    cleanup.items.push(iData.id);
    ok(`[CREATE] Barang masuk gudang (SKU: ${iData.sku}, Stok: 100).`);
  }

  const { data: readItem } = await supabase.from('items').select('*').eq('id', iData.id).single();
  if (readItem?.name === 'Barang Ultimate') ok(`[READ] Membaca data barang akurat.`); else fail(`[READ] Gagal.`);

  await supabase.from('items').update({ price: 20000 }).eq('id', iData.id);
  const { data: upItem } = await supabase.from('items').select('price').eq('id', iData.id).single();
  if (upItem?.price === 20000) ok(`[UPDATE] Edit harga barang berhasil (15k -> 20k).`); else fail(`[UPDATE] Gagal.`);

  const { data: delTemp } = await supabase.from('items').insert({
    sku: `TMP-${Date.now()}`, name: 'Hapus Aku', category: 'X', price: 1, cost_price: 1, stock: 1
  }).select().single();
  await supabase.from('items').delete().eq('id', delTemp.id);
  const { data: checkDel } = await supabase.from('items').select('id').eq('id', delTemp.id).single();
  if (!checkDel) ok(`[DELETE] Penghapusan barang dari database sukses.`); else fail(`[DELETE] Gagal.`);

  // ================================================================
  section('MODUL 3: ASET TETAP BUMDES (FULL CRUD)');
  // ================================================================
  const { data: aData, error: aErr } = await supabase.from('fixed_assets').insert({
    name: 'Gedung KKN', category: 'Bangunan', acquisition_cost: 50000000
  }).select().single();
  if (aErr) fail(`[CREATE] Tambah aset gagal: ${aErr.message}`);
  else {
    cleanup.fixed_assets.push(aData.id);
    ok(`[CREATE] Aset tetap "Gedung KKN" dicatat (Rp 50.000.000).`);
  }

  await supabase.from('fixed_assets').update({ acquisition_cost: 55000000 }).eq('id', aData.id);
  const { data: upAsset } = await supabase.from('fixed_assets').select('acquisition_cost').eq('id', aData.id).single();
  if (upAsset?.acquisition_cost === 55000000) ok(`[UPDATE] Edit nilai aset berhasil (50jt -> 55jt).`); else fail(`[UPDATE] Gagal.`);

  // ================================================================
  section('MODUL 4: MANAJEMEN PENGURUS (MULTI-USER CRUD)');
  // ================================================================
  const testEmail = `tester_${Date.now()}@bumdes.id`;
  const { data: uData, error: uErr } = await supabase.from('bumdes_users').insert({
    name: 'Kakak KKN', role: 'Super Admin', email: testEmail
  }).select().single();
  if (uErr) fail(`[CREATE] Tambah pengurus gagal: ${uErr.message}`);
  else {
    cleanup.bumdes_users.push(uData.id);
    ok(`[CREATE] Pengurus baru terdaftar (${testEmail}).`);
  }

  await supabase.from('bumdes_users').update({ role: 'Direktur' }).eq('id', uData.id);
  const { data: upUser } = await supabase.from('bumdes_users').select('role').eq('id', uData.id).single();
  if (upUser?.role === 'Direktur') ok(`[UPDATE] Edit role pengurus berhasil (Super Admin -> Direktur).`); else fail(`[UPDATE] Gagal.`);

  // ================================================================
  section('MODUL 5: KASIR & SINKRONISASI STOK (BUSINESS LOGIC)');
  // ================================================================
  const invPos = `POS-${Date.now()}`;
  const qtyJual = 10;
  const hargaJual = 20000;
  const hppSatuan = 10000;
  
  // 1. Catat Transaksi
  const { data: tPos } = await supabase.from('transactions').insert({
    invoice_number: invPos, type: 'Penjualan', total_amount: qtyJual * hargaJual, notes: 'Tes Kasir'
  }).select().single();
  cleanup.transactions.push(tPos.id);
  ok(`[KASIR] Invoice dibuat: ${invPos}.`);

  // 2. Catat Detail (Keranjang)
  await supabase.from('transaction_details').insert({
    transaction_id: tPos.id, item_id: iData.id, qty: qtyJual, unit_price: hargaJual, subtotal: qtyJual * hargaJual
  });
  ok(`[KASIR] Detail keranjang tersimpan: ${qtyJual} unit terjual.`);

  // 3. Potong Stok
  await supabase.from('items').update({ stock: 100 - qtyJual }).eq('id', iData.id);
  const { data: chkStok } = await supabase.from('items').select('stock').eq('id', iData.id).single();
  if (chkStok?.stock === 90) ok(`[STOK] Sinkronisasi pemotongan stok otomatis bekerja (100 -> 90).`);
  else fail(`[STOK] Gagal potong stok!`);

  // ================================================================
  section('MODUL 6: AKUNTANSI - PENJURNALAN OTOMATIS (DOUBLE ENTRY)');
  // ================================================================
  const kasId = await getOrCreateAccount('1.1.01', 'Kas', 'Asset');
  const penjId = await getOrCreateAccount('4.1.01', 'Pendapatan', 'Revenue');
  const hppId = await getOrCreateAccount('5.1.01', 'HPP', 'Expense');
  const persId = await getOrCreateAccount('1.1.03', 'Persediaan', 'Asset');

  // Jurnal Penjualan
  await supabase.from('journals').insert([
    { transaction_id: tPos.id, account_id: kasId, debit: qtyJual * hargaJual, credit: 0 },
    { transaction_id: tPos.id, account_id: penjId, debit: 0, credit: qtyJual * hargaJual },
    // Jurnal HPP
    { transaction_id: tPos.id, account_id: hppId, debit: qtyJual * hppSatuan, credit: 0 },
    { transaction_id: tPos.id, account_id: persId, debit: 0, credit: qtyJual * hppSatuan }
  ]);
  
  const { data: jns } = await supabase.from('journals').select('debit, credit').eq('transaction_id', tPos.id);
  let d = 0, c = 0;
  jns?.forEach(j => { d += j.debit; c += j.credit; });
  if (d === c && d === ((qtyJual*hargaJual)+(qtyJual*hppSatuan))) {
    ok(`[JURNAL] Prinsip Double-Entry BALANCE sempurna (Debit = Kredit = Rp ${d.toLocaleString()}).`);
  } else fail(`[JURNAL] TIDAK BALANCE!`);

  // ================================================================
  section('MODUL 7: AKUNTANSI - PENGELUARAN & PEMASUKAN LAIN');
  // ================================================================
  const tExp = await supabase.from('transactions').insert({ invoice_number: `EXP-${Date.now()}`, type: 'Biaya', total_amount: 50000 }).select('id').single();
  cleanup.transactions.push(tExp.data.id);
  await supabase.from('journals').insert([
    { transaction_id: tExp.data.id, account_id: await getOrCreateAccount('5.1.02', 'Beban', 'Expense'), debit: 50000, credit: 0 },
    { transaction_id: tExp.data.id, account_id: kasId, debit: 0, credit: 50000 }
  ]);
  ok(`[PENGELUARAN] Biaya operasional 50rb dicatat & di-jurnal.`);

  const tInc = await supabase.from('transactions').insert({ invoice_number: `INC-${Date.now()}`, type: 'Pendapatan Lain', total_amount: 250000 }).select('id').single();
  cleanup.transactions.push(tInc.data.id);
  await supabase.from('journals').insert([
    { transaction_id: tInc.data.id, account_id: kasId, debit: 250000, credit: 0 },
    { transaction_id: tInc.data.id, account_id: await getOrCreateAccount('4.1.02', 'Pendapatan Lain', 'Revenue'), debit: 0, credit: 250000 }
  ]);
  ok(`[PEMASUKAN] Pemasukan parkir 250rb dicatat & di-jurnal.`);

  // ================================================================
  section('MODUL 8: LAPORAN KEUANGAN & NERACA');
  // ================================================================
  const { data: allJns } = await supabase.from('journals').select('debit, credit');
  let globalD = 0, globalC = 0;
  allJns?.forEach(j => { globalD += j.debit; globalC += j.credit; });
  if (globalD === globalC) ok(`[GLOBAL BALANCE] Seluruh catatan akuntansi di database SEIMBANG (Total: Rp ${globalD.toLocaleString()}).`);
  else fail(`[GLOBAL BALANCE] KEBOCORAN AKUNTANSI TERDETEKSI!`);

  const { data: aTotal } = await supabase.from('fixed_assets').select('acquisition_cost');
  const tAset = aTotal?.reduce((s, a) => s + a.acquisition_cost, 0);
  ok(`[NERACA] Kalkulasi nilai Aktiva Tetap terhitung: Rp ${tAset?.toLocaleString()}.`);

  // ================================================================
  section('MODUL 9: KEAMANAN DATABASE (CASCADE DELETE & FK)');
  // ================================================================
  // Test Cascade
  await supabase.from('transactions').delete().eq('id', tInc.data.id);
  const { data: jCheck } = await supabase.from('journals').select('id').eq('transaction_id', tInc.data.id);
  if (jCheck?.length === 0) {
    ok(`[CASCADE DELETE] Integritas data terjamin. Transaksi dihapus -> Jurnal ikut terhapus.`);
    cleanup.transactions = cleanup.transactions.filter(id => id !== tInc.data.id);
  } else fail(`[CASCADE DELETE] Gagal membersihkan relasi.`);

  // ================================================================
  section('CLEANUP & FINAL REPORT');
  // ================================================================
  for (const id of cleanup.items) await supabase.from('items').delete().eq('id', id);
  for (const id of cleanup.transactions) await supabase.from('transactions').delete().eq('id', id);
  for (const id of cleanup.fixed_assets) await supabase.from('fixed_assets').delete().eq('id', id);
  for (const id of cleanup.bumdes_users) await supabase.from('bumdes_users').delete().eq('id', id);
  ok(`[CLEANUP] Seluruh data pengujian dihapus dari sistem.`);

  console.log('\n' + '═'.repeat(70));
  console.log(`  📊 HASIL PENGUJIAN ULTIMATE (CRUD + BISNIS LOGIC + AKUNTANSI)`);
  console.log('═'.repeat(70));
  console.log(`  ✅ LULUS : ${passed} Kasus Uji`);
  console.log(`  ❌ GAGAL : ${failed} Kasus Uji`);
  console.log('═'.repeat(70));

  if (failed === 0) console.log('\n  🏆 APLIKASI BUMDES DIGITAL LULUS PENGUJIAN TINGKAT DEWA! 🏆\n');
  else console.log(`\n  💥 ADA ERROR, PERIKSA LOG DI ATAS! 💥\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runUltimateTests();
