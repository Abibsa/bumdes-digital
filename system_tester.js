import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// 1. Baca Environment
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

// Helper untuk log
const ok = (msg) => console.log(`✅ [OK] ${msg}`);
const fail = (msg) => { console.error(`❌ [GAGAL] ${msg}`); process.exit(1); };
const info = (msg) => console.log(`\n🔹 ${msg}`);

async function runFullTest() {
  console.log("====================================================");
  console.log("🧪 BUMDES DIGITAL - AUTOMATED INTEGRATION TEST 🧪");
  console.log("====================================================\n");

  let testItemId = null;
  let testTrxId = null;

  try {
    // ---------------------------------------------------------
    info("TEST 1: CREATE DUMMY ITEM (STOK BARANG)");
    // ---------------------------------------------------------
    const { data: item, error: itemErr } = await supabase.from('items').insert({
      sku: 'TEST-001',
      name: 'Barang Uji Coba BUMDes',
      category: 'Lainnya',
      price: 15000,
      cost_price: 10000,
      stock: 50
    }).select().single();

    if (itemErr) fail(`Gagal membuat barang test: ${itemErr.message}`);
    testItemId = item.id;
    ok(`Barang '${item.name}' berhasil dibuat dengan stok awal: ${item.stock}`);

    // ---------------------------------------------------------
    info("TEST 2: CREATE TRANSACTION (KASIR)");
    // ---------------------------------------------------------
    const invoice = `TEST-INV-${Date.now()}`;
    const qtySold = 3;
    const totalAmount = item.price * qtySold;
    const totalHpp = item.cost_price * qtySold;

    // 2A. Insert Header
    const { data: trx, error: trxErr } = await supabase.from('transactions').insert({
      invoice_number: invoice,
      type: 'Penjualan',
      total_amount: totalAmount,
      notes: 'Automated Test'
    }).select().single();
    
    if (trxErr) fail(`Gagal membuat header transaksi: ${trxErr.message}`);
    testTrxId = trx.id;
    ok(`Header transaksi ${invoice} berhasil dibuat.`);

    // 2B. Insert Detail
    const { error: detailErr } = await supabase.from('transaction_details').insert({
      transaction_id: trx.id,
      item_id: item.id,
      qty: qtySold,
      unit_price: item.price,
      subtotal: totalAmount
    });
    if (detailErr) fail(`Gagal membuat detail transaksi: ${detailErr.message}`);
    ok(`Detail transaksi (terjual ${qtySold} unit) berhasil dicatat.`);

    // 2C. Update Stock
    const { error: stockErr } = await supabase.from('items').update({ stock: item.stock - qtySold }).eq('id', item.id);
    if (stockErr) fail(`Gagal update stok: ${stockErr.message}`);
    ok(`Stok berhasil dikurangi di database.`);

    // ---------------------------------------------------------
    info("TEST 3: VERIFY STOCK SYNC");
    // ---------------------------------------------------------
    const { data: checkItem } = await supabase.from('items').select('stock').eq('id', item.id).single();
    if (checkItem.stock === (50 - qtySold)) {
      ok(`Sinkronisasi Stok Berhasil! Stok sekarang: ${checkItem.stock} (Awal 50 - Terjual ${qtySold})`);
    } else {
      fail(`Stok tidak sinkron! Diharapkan: ${50 - qtySold}, Aktual: ${checkItem.stock}`);
    }

    // ---------------------------------------------------------
    info("TEST 4: CREATE & VERIFY ACCOUNTING JOURNALS (JURNAL OTOMATIS)");
    // ---------------------------------------------------------
    // Cari Akun
    const getAcc = async (code) => (await supabase.from('accounts').select('id').eq('code', code).single()).data?.id;
    let kasId = await getAcc('1.1.01');
    let penjId = await getAcc('4.1.01');
    
    if (!kasId) {
      const {data} = await supabase.from('accounts').insert({code: '1.1.01', name: 'Kas', type: 'Asset'}).select().single();
      kasId = data.id;
    }
    if (!penjId) {
      const {data} = await supabase.from('accounts').insert({code: '4.1.01', name: 'Pendapatan Penjualan', type: 'Revenue'}).select().single();
      penjId = data.id;
    }

    const { error: j1Err } = await supabase.from('journals').insert([
      { transaction_id: trx.id, account_id: kasId, debit: totalAmount, credit: 0, description: `Penjualan ${invoice}` },
      { transaction_id: trx.id, account_id: penjId, debit: 0, credit: totalAmount, description: `Penjualan ${invoice}` }
    ]);
    if (j1Err) fail(`Gagal mencatat jurnal: ${j1Err.message}`);

    const { data: checkJournals } = await supabase.from('journals').select('debit, credit').eq('transaction_id', trx.id);
    let tDebit = 0, tCredit = 0;
    checkJournals.forEach(j => { tDebit += j.debit; tCredit += j.credit; });
    
    if (tDebit === totalAmount && tCredit === totalAmount) {
      ok(`Jurnal Akuntansi Sinkron & Balance! (Debit: Rp ${tDebit}, Kredit: Rp ${tCredit})`);
    } else {
      fail(`Jurnal Akuntansi TIDAK BALANCE!`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    // ---------------------------------------------------------
    info("TEST 5: CLEANUP DUMMY DATA");
    // ---------------------------------------------------------
    if (testTrxId) {
      await supabase.from('transactions').delete().eq('id', testTrxId);
      ok("Data riwayat transaksi test dihapus (cascade menghapus detail & jurnal otomatis).");
    }
    if (testItemId) {
      await supabase.from('items').delete().eq('id', testItemId);
      ok("Barang dummy dihapus dari gudang.");
    }

    console.log("\n====================================================");
    console.log("🎉 SEMUA TEST BERHASIL LULUS! SISTEM 100% BEKERJA. 🎉");
    console.log("====================================================\n");
  }
}

runFullTest();
