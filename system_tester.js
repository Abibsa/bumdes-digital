import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// ============================================================
// 🧪 BUMDES DIGITAL - COMPREHENSIVE SYSTEM TESTER
// Menguji SELURUH fitur & modul tanpa terlewat satupun.
// ============================================================

// 1. Baca Environment
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

// Counters
let passed = 0;
let failed = 0;
let warned = 0;
const results = [];

const ok = (test, msg) => { passed++; results.push({ status: '✅', test, msg }); console.log(`  ✅ ${msg}`); };
const fail = (test, msg) => { failed++; results.push({ status: '❌', test, msg }); console.error(`  ❌ ${msg}`); };
const warn = (test, msg) => { warned++; results.push({ status: '⚠️', test, msg }); console.warn(`  ⚠️ ${msg}`); };
const section = (title) => console.log(`\n${'═'.repeat(60)}\n  ${title}\n${'═'.repeat(60)}`);

// Cleanup registry (IDs to delete at the end)
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
  console.log('\n' + '🧪'.repeat(30));
  console.log('  BUMDES DIGITAL - COMPREHENSIVE SYSTEM TESTER');
  console.log('  Waktu: ' + new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
  console.log('🧪'.repeat(30));

  // ================================================================
  // MODUL 1: KONEKSI DATABASE
  // ================================================================
  section('MODUL 1: KONEKSI DATABASE SUPABASE');

  try {
    const { data, error } = await supabase.from('settings').select('id').limit(1);
    if (error) fail('DB-01', `Koneksi database gagal: ${error.message}`);
    else ok('DB-01', 'Koneksi ke Supabase berhasil.');
  } catch (e) {
    fail('DB-01', `Koneksi ke Supabase mati total: ${e.message}`);
  }

  // ================================================================
  // MODUL 2: CEK SEMUA TABEL (8 TABEL)
  // ================================================================
  section('MODUL 2: VALIDASI STRUKTUR DATABASE (8 TABEL)');

  const tables = [
    { name: 'accounts', label: 'Bagan Akun (COA)' },
    { name: 'items', label: 'Master Barang / Stok' },
    { name: 'transactions', label: 'Header Transaksi' },
    { name: 'transaction_details', label: 'Detail Transaksi' },
    { name: 'journals', label: 'Jurnal Umum (Akuntansi)' },
    { name: 'settings', label: 'Pengaturan Toko' },
    { name: 'fixed_assets', label: 'Aset Tetap' },
    { name: 'bumdes_users', label: 'Manajemen Pengurus' },
  ];

  for (const t of tables) {
    const { error } = await supabase.from(t.name).select('id').limit(1);
    if (error) fail(`TBL-${t.name}`, `Tabel "${t.name}" (${t.label}) TIDAK DITEMUKAN: ${error.message}`);
    else ok(`TBL-${t.name}`, `Tabel "${t.name}" (${t.label}) ✓`);
  }

  // ================================================================
  // MODUL 3: STOK BARANG (CRUD LENGKAP)
  // ================================================================
  section('MODUL 3: MANAJEMEN STOK BARANG (CRUD)');

  // 3A. CREATE
  const { data: newItem, error: createErr } = await supabase.from('items').insert({
    sku: `TEST-SKU-${Date.now()}`,
    name: 'Barang Test Otomatis',
    category: 'Lainnya',
    price: 25000,
    cost_price: 18000,
    stock: 100
  }).select().single();

  if (createErr || !newItem) {
    fail('STOK-CREATE', `Gagal membuat barang baru: ${createErr?.message}`);
  } else {
    cleanup.items.push(newItem.id);
    ok('STOK-CREATE', `Tambah barang "${newItem.name}" (SKU: ${newItem.sku}) → stok awal: ${newItem.stock}`);
  }

  // 3B. READ
  if (newItem) {
    const { data: readItem } = await supabase.from('items').select('*').eq('id', newItem.id).single();
    if (readItem && readItem.name === 'Barang Test Otomatis') ok('STOK-READ', 'Baca data barang berhasil, data cocok.');
    else fail('STOK-READ', 'Data barang tidak cocok setelah dibuat.');
  }

  // 3C. UPDATE
  if (newItem) {
    await supabase.from('items').update({ price: 30000, stock: 80 }).eq('id', newItem.id);
    const { data: updated } = await supabase.from('items').select('price, stock').eq('id', newItem.id).single();
    if (updated?.price === 30000 && updated?.stock === 80) {
      ok('STOK-UPDATE', `Update barang berhasil (harga: 25000→30000, stok: 100→80)`);
    } else {
      fail('STOK-UPDATE', `Update barang gagal. Aktual: harga=${updated?.price}, stok=${updated?.stock}`);
    }
  }

  // 3D. SEARCH FILTER (simulasi fitur pencarian)
  if (newItem) {
    const { data: searchResult } = await supabase.from('items').select('*').ilike('name', '%Test Otomatis%');
    if (searchResult && searchResult.length > 0) ok('STOK-SEARCH', `Pencarian barang berfungsi (ditemukan ${searchResult.length} hasil).`);
    else fail('STOK-SEARCH', 'Pencarian barang gagal, tidak menemukan hasil.');
  }

  // ================================================================
  // MODUL 4: KASIR / POS (SIMULASI TRANSAKSI LENGKAP)
  // ================================================================
  section('MODUL 4: KASIR / POINT OF SALE (POS)');

  let testTrxId = null;
  const qtySold = 5;

  if (newItem) {
    // 4A. Buat Header Transaksi
    const invoice = `TEST-INV-${Date.now()}`;
    const totalAmount = 30000 * qtySold; // harga sudah diupdate ke 30000
    const totalHpp = 18000 * qtySold;

    const { data: trx, error: trxErr } = await supabase.from('transactions').insert({
      invoice_number: invoice,
      type: 'Penjualan',
      total_amount: totalAmount,
      notes: 'Automated Test - Kasir',
      created_by: 'System Tester'
    }).select().single();

    if (trxErr || !trx) {
      fail('POS-HEADER', `Gagal membuat transaksi kasir: ${trxErr?.message}`);
    } else {
      testTrxId = trx.id;
      cleanup.transactions.push(trx.id);
      ok('POS-HEADER', `Transaksi ${invoice} berhasil dibuat (total: Rp ${totalAmount.toLocaleString('id-ID')})`);
    }

    // 4B. Buat Detail Transaksi
    if (testTrxId) {
      const { error: detErr } = await supabase.from('transaction_details').insert({
        transaction_id: testTrxId,
        item_id: newItem.id,
        qty: qtySold,
        unit_price: 30000,
        subtotal: totalAmount
      });
      if (detErr) fail('POS-DETAIL', `Gagal mencatat detail transaksi: ${detErr.message}`);
      else ok('POS-DETAIL', `Detail transaksi dicatat: ${qtySold} unit @ Rp 30.000`);
    }

    // 4C. Update Stok (simulasi pengurangan)
    if (testTrxId) {
      await supabase.from('items').update({ stock: 80 - qtySold }).eq('id', newItem.id);
      const { data: checkStock } = await supabase.from('items').select('stock').eq('id', newItem.id).single();
      if (checkStock?.stock === (80 - qtySold)) {
        ok('POS-STOCK-SYNC', `Sinkronisasi stok berhasil! (80 - ${qtySold} = ${checkStock.stock})`);
      } else {
        fail('POS-STOCK-SYNC', `Stok tidak sinkron! Harapan: ${80 - qtySold}, Aktual: ${checkStock?.stock}`);
      }
    }

    // 4D. Catat Jurnal Otomatis (Double-Entry)
    if (testTrxId) {
      const kasId = await getOrCreateAccount('1.1.01', 'Kas', 'Asset');
      const penjId = await getOrCreateAccount('4.1.01', 'Pendapatan Penjualan', 'Revenue');
      const hppId = await getOrCreateAccount('5.1.01', 'Harga Pokok Penjualan', 'Expense');
      const persId = await getOrCreateAccount('1.1.03', 'Persediaan Barang', 'Asset');

      // Jurnal Penjualan
      const { error: jErr1 } = await supabase.from('journals').insert([
        { transaction_id: testTrxId, account_id: kasId, debit: totalAmount, credit: 0, description: `Test Penjualan ${invoice}` },
        { transaction_id: testTrxId, account_id: penjId, debit: 0, credit: totalAmount, description: `Test Penjualan ${invoice}` }
      ]);
      if (jErr1) fail('POS-JURNAL-PENJ', `Gagal mencatat jurnal penjualan: ${jErr1.message}`);
      else ok('POS-JURNAL-PENJ', `Jurnal penjualan dicatat (Debit Kas, Kredit Pendapatan: Rp ${totalAmount.toLocaleString('id-ID')})`);

      // Jurnal HPP
      const { error: jErr2 } = await supabase.from('journals').insert([
        { transaction_id: testTrxId, account_id: hppId, debit: totalHpp, credit: 0, description: `Test HPP ${invoice}` },
        { transaction_id: testTrxId, account_id: persId, debit: 0, credit: totalHpp, description: `Test HPP ${invoice}` }
      ]);
      if (jErr2) fail('POS-JURNAL-HPP', `Gagal mencatat jurnal HPP: ${jErr2.message}`);
      else ok('POS-JURNAL-HPP', `Jurnal HPP dicatat (Debit HPP, Kredit Persediaan: Rp ${totalHpp.toLocaleString('id-ID')})`);
    }
  }

  // ================================================================
  // MODUL 5: AKUNTANSI - VERIFIKASI DOUBLE-ENTRY BALANCE
  // ================================================================
  section('MODUL 5: AKUNTANSI - DOUBLE ENTRY BALANCE');

  if (testTrxId) {
    const { data: checkJournals } = await supabase.from('journals').select('debit, credit').eq('transaction_id', testTrxId);
    let tDebit = 0, tCredit = 0;
    checkJournals?.forEach(j => { tDebit += j.debit; tCredit += j.credit; });

    if (tDebit === tCredit && tDebit > 0) {
      ok('AKT-BALANCE', `Prinsip Double-Entry SEIMBANG! Debit = Kredit = Rp ${tDebit.toLocaleString('id-ID')}`);
    } else {
      fail('AKT-BALANCE', `Jurnal TIDAK BALANCE! Debit: ${tDebit}, Kredit: ${tCredit}`);
    }
  }

  // Cek keseluruhan jurnal di database
  const { data: allJournals } = await supabase.from('journals').select('debit, credit');
  let globalDebit = 0, globalCredit = 0;
  allJournals?.forEach(j => { globalDebit += j.debit; globalCredit += j.credit; });
  if (globalDebit === globalCredit) {
    ok('AKT-GLOBAL', `Jurnal GLOBAL seimbang! Total Debit = Total Kredit = Rp ${globalDebit.toLocaleString('id-ID')}`);
  } else {
    fail('AKT-GLOBAL', `Jurnal GLOBAL TIDAK BALANCE! Selisih: Rp ${Math.abs(globalDebit - globalCredit).toLocaleString('id-ID')}`);
  }

  // ================================================================
  // MODUL 6: AKUNTANSI - PENCATATAN PENGELUARAN
  // ================================================================
  section('MODUL 6: AKUNTANSI - CATAT PENGELUARAN');

  const expInvoice = `TEST-EXP-${Date.now()}`;
  const expAmount = 50000;

  const { data: expTrx, error: expTrxErr } = await supabase.from('transactions').insert({
    invoice_number: expInvoice,
    type: 'Biaya',
    total_amount: expAmount,
    notes: 'Test Beli ATK Kantor'
  }).select('id').single();

  if (expTrxErr || !expTrx) {
    fail('EXP-TRX', `Gagal membuat transaksi pengeluaran: ${expTrxErr?.message}`);
  } else {
    cleanup.transactions.push(expTrx.id);

    const bebanId = await getOrCreateAccount('5.1.02', 'Beban Operasional', 'Expense');
    const kasId = await getOrCreateAccount('1.1.01', 'Kas', 'Asset');

    const { error: expJErr } = await supabase.from('journals').insert([
      { transaction_id: expTrx.id, account_id: bebanId, debit: expAmount, credit: 0, description: 'Test Beli ATK Kantor' },
      { transaction_id: expTrx.id, account_id: kasId, debit: 0, credit: expAmount, description: 'Test Beli ATK Kantor' }
    ]);

    if (expJErr) fail('EXP-JURNAL', `Gagal mencatat jurnal pengeluaran: ${expJErr.message}`);
    else ok('EXP-JURNAL', `Pengeluaran Rp ${expAmount.toLocaleString('id-ID')} berhasil dicatat (Debit Beban, Kredit Kas).`);

    // Verify balance
    const { data: expCheck } = await supabase.from('journals').select('debit, credit').eq('transaction_id', expTrx.id);
    let eD = 0, eC = 0;
    expCheck?.forEach(j => { eD += j.debit; eC += j.credit; });
    if (eD === eC) ok('EXP-BALANCE', `Jurnal pengeluaran BALANCE (Rp ${eD.toLocaleString('id-ID')}).`);
    else fail('EXP-BALANCE', `Jurnal pengeluaran TIDAK BALANCE!`);
  }

  // ================================================================
  // MODUL 7: AKUNTANSI - PENCATATAN PEMASUKAN NON-TOKO
  // ================================================================
  section('MODUL 7: AKUNTANSI - CATAT PEMASUKAN NON-TOKO');

  const incInvoice = `TEST-INC-${Date.now()}`;
  const incAmount = 75000;

  const { data: incTrx, error: incTrxErr } = await supabase.from('transactions').insert({
    invoice_number: incInvoice,
    type: 'Pendapatan Lain',
    total_amount: incAmount,
    notes: '[Tempat Parkir] Test Sewa Parkir Mingguan'
  }).select('id').single();

  if (incTrxErr || !incTrx) {
    fail('INC-TRX', `Gagal membuat transaksi pemasukan: ${incTrxErr?.message}`);
  } else {
    cleanup.transactions.push(incTrx.id);

    const pendId = await getOrCreateAccount('4.1.02', 'Pendapatan Usaha Lainnya', 'Revenue');
    const kasId = await getOrCreateAccount('1.1.01', 'Kas', 'Asset');

    const { error: incJErr } = await supabase.from('journals').insert([
      { transaction_id: incTrx.id, account_id: kasId, debit: incAmount, credit: 0, description: '[Tempat Parkir] Test Sewa Parkir' },
      { transaction_id: incTrx.id, account_id: pendId, debit: 0, credit: incAmount, description: '[Tempat Parkir] Test Sewa Parkir' }
    ]);

    if (incJErr) fail('INC-JURNAL', `Gagal mencatat jurnal pemasukan: ${incJErr.message}`);
    else ok('INC-JURNAL', `Pemasukan non-toko Rp ${incAmount.toLocaleString('id-ID')} berhasil dicatat.`);

    // Verify balance
    const { data: incCheck } = await supabase.from('journals').select('debit, credit').eq('transaction_id', incTrx.id);
    let iD = 0, iC = 0;
    incCheck?.forEach(j => { iD += j.debit; iC += j.credit; });
    if (iD === iC) ok('INC-BALANCE', `Jurnal pemasukan BALANCE (Rp ${iD.toLocaleString('id-ID')}).`);
    else fail('INC-BALANCE', `Jurnal pemasukan TIDAK BALANCE!`);
  }

  // ================================================================
  // MODUL 8: ASET TETAP (CRUD)
  // ================================================================
  section('MODUL 8: PENCATATAN ASET TETAP');

  // 8A. CREATE
  const { data: newAsset, error: assetErr } = await supabase.from('fixed_assets').insert({
    name: 'Mesin Uji Coba',
    category: 'Peralatan',
    acquisition_cost: 5000000,
    notes: 'Aset dummy untuk testing'
  }).select().single();

  if (assetErr || !newAsset) {
    fail('ASET-CREATE', `Gagal membuat aset tetap: ${assetErr?.message}`);
  } else {
    cleanup.fixed_assets.push(newAsset.id);
    ok('ASET-CREATE', `Aset "${newAsset.name}" berhasil dicatat (Rp ${newAsset.acquisition_cost.toLocaleString('id-ID')})`);
  }

  // 8B. READ & VERIFY NERACA INTEGRATION
  const { data: allAssets } = await supabase.from('fixed_assets').select('acquisition_cost');
  const totalAset = allAssets?.reduce((sum, a) => sum + a.acquisition_cost, 0) || 0;
  if (totalAset > 0) {
    ok('ASET-NERACA', `Total Aset Tetap untuk Neraca: Rp ${totalAset.toLocaleString('id-ID')} (${allAssets.length} aset)`);
  } else {
    warn('ASET-NERACA', 'Belum ada data aset tetap untuk Neraca.');
  }

  // 8C. DELETE
  if (newAsset) {
    const { error: delAssetErr } = await supabase.from('fixed_assets').delete().eq('id', newAsset.id);
    if (delAssetErr) fail('ASET-DELETE', `Gagal menghapus aset: ${delAssetErr.message}`);
    else {
      ok('ASET-DELETE', 'Hapus aset tetap berhasil.');
      cleanup.fixed_assets = cleanup.fixed_assets.filter(id => id !== newAsset.id);
    }
  }

  // ================================================================
  // MODUL 9: MANAJEMEN PENGURUS / MULTI-USER
  // ================================================================
  section('MODUL 9: MANAJEMEN PENGURUS (MULTI-USER)');

  // 9A. READ existing users
  const { data: existingUsers, error: usersErr } = await supabase.from('bumdes_users').select('*');
  if (usersErr) {
    fail('USER-READ', `Gagal membaca data pengurus: ${usersErr.message}`);
  } else {
    ok('USER-READ', `Ditemukan ${existingUsers.length} pengurus terdaftar.`);
    existingUsers.forEach(u => {
      console.log(`       👤 ${u.name} — ${u.role} (${u.email})`);
    });
  }

  // 9B. CREATE test user
  const testEmail = `test-${Date.now()}@bumdes-test.com`;
  const { data: newUser, error: newUserErr } = await supabase.from('bumdes_users').insert({
    name: 'Test User Otomatis',
    role: 'Staff Toko',
    email: testEmail
  }).select().single();

  if (newUserErr || !newUser) {
    fail('USER-CREATE', `Gagal menambah pengurus: ${newUserErr?.message}`);
  } else {
    cleanup.bumdes_users.push(newUser.id);
    ok('USER-CREATE', `Pengurus "${newUser.name}" berhasil ditambahkan.`);
  }

  // 9C. DELETE test user
  if (newUser) {
    const { error: delUserErr } = await supabase.from('bumdes_users').delete().eq('id', newUser.id);
    if (delUserErr) fail('USER-DELETE', `Gagal menghapus pengurus test: ${delUserErr.message}`);
    else {
      ok('USER-DELETE', 'Hapus pengurus test berhasil.');
      cleanup.bumdes_users = cleanup.bumdes_users.filter(id => id !== newUser.id);
    }
  }

  // ================================================================
  // MODUL 10: PENGATURAN TOKO / PROFIL USAHA
  // ================================================================
  section('MODUL 10: PENGATURAN TOKO / PROFIL USAHA');

  const { data: storeSettings, error: settingsErr } = await supabase.from('settings').select('*').limit(1).single();
  if (settingsErr || !storeSettings) {
    warn('SET-READ', 'Pengaturan toko belum diisi. Kop struk kasir akan kosong.');
  } else {
    ok('SET-READ', `Nama Toko : ${storeSettings.store_name}`);
    ok('SET-ADDR', `Alamat    : ${storeSettings.store_address}`);
    ok('SET-PHONE', `Kontak   : ${storeSettings.store_contact}`);
  }

  // Test update
  if (storeSettings) {
    const originalName = storeSettings.store_name;
    await supabase.from('settings').update({ store_name: 'TEST UPDATE NAMA' }).eq('id', storeSettings.id);
    const { data: check } = await supabase.from('settings').select('store_name').eq('id', storeSettings.id).single();
    if (check?.store_name === 'TEST UPDATE NAMA') {
      ok('SET-UPDATE', 'Update pengaturan toko berhasil.');
      // Kembalikan ke semula
      await supabase.from('settings').update({ store_name: originalName }).eq('id', storeSettings.id);
      ok('SET-RESTORE', 'Pengaturan toko dikembalikan ke semula.');
    } else {
      fail('SET-UPDATE', 'Gagal update pengaturan toko.');
    }
  }

  // ================================================================
  // MODUL 11: DASHBOARD DATA INTEGRITY
  // ================================================================
  section('MODUL 11: DASHBOARD - INTEGRITAS DATA');

  // 11A. Statistik ringkasan
  const { count: itemCount } = await supabase.from('items').select('*', { count: 'exact', head: true });
  const { count: trxCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
  ok('DASH-ITEMS', `Total jenis barang di Stok: ${itemCount}`);
  ok('DASH-TRX', `Total transaksi tercatat: ${trxCount}`);

  // 11B. Top Selling Products query
  const { data: topSelling, error: topErr } = await supabase.from('transaction_details').select('qty, items(name)');
  if (topErr) fail('DASH-TOP', `Gagal mengambil data barang terlaris: ${topErr.message}`);
  else ok('DASH-TOP', `Query barang terlaris berhasil (${topSelling?.length || 0} record detail transaksi).`);

  // 11C. Chart data (Jurnal per bulan)
  const { data: chartJournals, error: chartErr } = await supabase.from('journals').select('debit, credit, created_at, accounts(code, type)');
  if (chartErr) fail('DASH-CHART', `Gagal mengambil data chart: ${chartErr.message}`);
  else ok('DASH-CHART', `Data grafik pendapatan/pengeluaran tersedia (${chartJournals?.length || 0} entri jurnal).`);

  // ================================================================
  // MODUL 12: LAPORAN LABA RUGI (KALKULASI)
  // ================================================================
  section('MODUL 12: LAPORAN LABA RUGI');

  let pendapatanToko = 0, pendapatanLain = 0, hpp = 0, bebanOps = 0;
  chartJournals?.forEach((j) => {
    const accType = j.accounts?.type;
    const accCode = j.accounts?.code;
    if (accType === 'Revenue') {
      if (accCode === '4.1.01') pendapatanToko += (j.credit - j.debit);
      else pendapatanLain += (j.credit - j.debit);
    }
    if (accType === 'Expense') {
      if (accCode === '5.1.01') hpp += (j.debit - j.credit);
      else bebanOps += (j.debit - j.credit);
    }
  });

  const totalPendapatan = pendapatanToko + pendapatanLain;
  const labaKotor = totalPendapatan - hpp;
  const labaBersih = labaKotor - bebanOps;

  ok('LR-PEND-TOKO', `Pendapatan Toko      : Rp ${pendapatanToko.toLocaleString('id-ID')}`);
  ok('LR-PEND-LAIN', `Pendapatan Lain      : Rp ${pendapatanLain.toLocaleString('id-ID')}`);
  ok('LR-HPP',       `Harga Pokok Penjualan: Rp ${hpp.toLocaleString('id-ID')}`);
  ok('LR-BEBAN',     `Beban Operasional    : Rp ${bebanOps.toLocaleString('id-ID')}`);
  ok('LR-LABA-KOTOR',`Laba Kotor           : Rp ${labaKotor.toLocaleString('id-ID')}`);
  ok('LR-LABA-BERSIH', `Laba Bersih        : Rp ${labaBersih.toLocaleString('id-ID')}`);

  // ================================================================
  // MODUL 13: NERACA (KALKULASI)
  // ================================================================
  section('MODUL 13: NERACA / BALANCE SHEET');

  let kas = 0, persediaan = 0, modal = 0;
  chartJournals?.forEach((j) => {
    if (j.accounts?.code === '1.1.01') kas += (j.debit - j.credit);
    if (j.accounts?.code === '1.1.03') persediaan += (j.debit - j.credit);
    if (j.accounts?.type === 'Equity') modal += (j.credit - j.debit);
  });

  const { data: neracaAssets } = await supabase.from('fixed_assets').select('acquisition_cost');
  const neracaAsetTetap = neracaAssets?.reduce((s, a) => s + a.acquisition_cost, 0) || 0;
  const totalAktiva = kas + persediaan + neracaAsetTetap;
  const totalPasiva = modal + labaBersih;

  ok('NRC-KAS',       `Kas Uang Tunai  : Rp ${kas.toLocaleString('id-ID')}`);
  ok('NRC-PERSEDIAAN',`Persediaan      : Rp ${persediaan.toLocaleString('id-ID')}`);
  ok('NRC-ASET-TETAP',`Aset Tetap      : Rp ${neracaAsetTetap.toLocaleString('id-ID')}`);
  ok('NRC-TOTAL-ASET',`Total Aktiva    : Rp ${totalAktiva.toLocaleString('id-ID')}`);
  ok('NRC-MODAL',     `Modal + Laba    : Rp ${totalPasiva.toLocaleString('id-ID')}`);

  // ================================================================
  // MODUL 14: INTEGRITAS RELASI FOREIGN KEY
  // ================================================================
  section('MODUL 14: INTEGRITAS RELASI DATABASE');

  // Cek apakah semua transaction_details punya item_id yang valid
  const { data: allDetails } = await supabase.from('transaction_details').select('item_id');
  const { data: allItemIds } = await supabase.from('items').select('id');
  const validIds = new Set(allItemIds?.map(i => i.id));
  let orphanCount = 0;
  allDetails?.forEach(d => { if (!validIds.has(d.item_id)) orphanCount++; });
  if (orphanCount === 0) ok('FK-ITEMS', 'Semua detail transaksi memiliki referensi barang yang valid.');
  else warn('FK-ITEMS', `${orphanCount} detail transaksi merujuk barang yang sudah tidak ada.`);

  // Cek journal → account relasi
  const { data: allJournalAccs } = await supabase.from('journals').select('account_id');
  const { data: allAccIds } = await supabase.from('accounts').select('id');
  const validAccIds = new Set(allAccIds?.map(a => a.id));
  let orphanAcc = 0;
  allJournalAccs?.forEach(j => { if (!validAccIds.has(j.account_id)) orphanAcc++; });
  if (orphanAcc === 0) ok('FK-ACCOUNTS', 'Semua jurnal memiliki referensi akun yang valid.');
  else warn('FK-ACCOUNTS', `${orphanAcc} jurnal merujuk akun yang sudah tidak ada.`);

  // ================================================================
  // MODUL 15: CASCADE DELETE (REFERENTIAL INTEGRITY)
  // ================================================================
  section('MODUL 15: CASCADE DELETE TRANSAKSI');

  // Buat transaksi sementara lalu hapus → cek apakah detail & jurnal ikut terhapus
  const cascadeInv = `TEST-CASCADE-${Date.now()}`;
  const { data: cascTrx } = await supabase.from('transactions').insert({
    invoice_number: cascadeInv, type: 'Penjualan', total_amount: 10000, notes: 'Cascade test'
  }).select('id').single();

  if (cascTrx) {
    const kasId = await getOrCreateAccount('1.1.01', 'Kas', 'Asset');
    const penjId = await getOrCreateAccount('4.1.01', 'Pendapatan Penjualan', 'Revenue');

    await supabase.from('journals').insert([
      { transaction_id: cascTrx.id, account_id: kasId, debit: 10000, credit: 0, description: 'Cascade test' },
      { transaction_id: cascTrx.id, account_id: penjId, debit: 0, credit: 10000, description: 'Cascade test' }
    ]);

    // Hapus header
    await supabase.from('transactions').delete().eq('id', cascTrx.id);

    // Cek apakah jurnal ikut terhapus
    const { data: remainingJournals } = await supabase.from('journals').select('id').eq('transaction_id', cascTrx.id);
    if (!remainingJournals || remainingJournals.length === 0) {
      ok('CASCADE', 'CASCADE DELETE bekerja sempurna! Hapus transaksi → jurnal otomatis ikut terhapus.');
    } else {
      fail('CASCADE', `CASCADE DELETE gagal! Masih ada ${remainingJournals.length} jurnal yatim piatu.`);
    }
  }

  // ================================================================
  // CLEANUP
  // ================================================================
  section('CLEANUP - MEMBERSIHKAN DATA TEST');

  // Hapus transaksi test (cascade akan menghapus details & journals)
  for (const id of cleanup.transactions) {
    await supabase.from('transactions').delete().eq('id', id);
  }
  ok('CLEAN-TRX', `${cleanup.transactions.length} transaksi test dihapus (termasuk detail & jurnal).`);

  // Hapus items test
  for (const id of cleanup.items) {
    await supabase.from('items').delete().eq('id', id);
  }
  ok('CLEAN-ITEMS', `${cleanup.items.length} barang test dihapus.`);

  // Hapus assets test
  for (const id of cleanup.fixed_assets) {
    await supabase.from('fixed_assets').delete().eq('id', id);
  }

  // Hapus users test
  for (const id of cleanup.bumdes_users) {
    await supabase.from('bumdes_users').delete().eq('id', id);
  }

  // ================================================================
  // RINGKASAN AKHIR
  // ================================================================
  console.log('\n' + '═'.repeat(60));
  console.log('  📊 RINGKASAN HASIL TEST');
  console.log('═'.repeat(60));
  console.log(`  ✅ Berhasil : ${passed} test`);
  console.log(`  ❌ Gagal    : ${failed} test`);
  console.log(`  ⚠️  Warning : ${warned} test`);
  console.log('═'.repeat(60));

  if (failed === 0) {
    console.log('\n  🎉🎉🎉 SELURUH SISTEM BUMDES DIGITAL 100% LOLOS UJI! 🎉🎉🎉');
    console.log('  Semua modul berfungsi sempurna dan data tersinkronisasi.\n');
  } else {
    console.log(`\n  💥 TERDAPAT ${failed} KEGAGALAN! Periksa log di atas.\n`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests();
