import { useEffect, useState } from 'react';
import { FileText, TrendingUp, DollarSign, Download, X, ArrowDownCircle, ArrowUpCircle, Building2, Plus, Trash2, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface FixedAsset {
  id: string;
  name: string;
  category: string;
  acquisition_date: string;
  acquisition_cost: number;
  notes: string;
}

export default function Akuntansi() {
  const [activeTab, setActiveTab] = useState<'laba-rugi' | 'neraca' | 'jurnal' | 'aset-tetap'>('laba-rugi');

  const [labaRugi, setLabaRugi] = useState({ pendapatanToko: 0, pendapatanLain: 0, hpp: 0, bebanOperasional: 0, labaKotor: 0, labaBersih: 0 });
  const [neraca, setNeraca] = useState({ kas: 0, persediaan: 0, asetTetap: 0, totalAset: 0, modal: 0 });
  const [jurnalList, setJurnalList] = useState<any[]>([]);

  // Aset Tetap State
  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>([]);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetData, setAssetData] = useState({ name: '', category: 'Peralatan', acquisition_cost: '', notes: '' });

  // Pengeluaran State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseData, setExpenseData] = useState({ amount: '', desc: '' });

  // Pemasukan Non-Toko State
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeData, setIncomeData] = useState({ amount: '', source: 'Tempat Parkir', desc: '' });

  // Filter Periode State
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMode, setFilterMode] = useState<'all' | 'monthly'>('all');

  const [loading, setLoading] = useState(false);

  const getDateRange = () => {
    if (filterMode === 'all') return { start: null, end: null };
    const start = new Date(filterYear, filterMonth - 1, 1);
    const end = new Date(filterYear, filterMonth, 0, 23, 59, 59);
    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  };

  const fetchLaporan = async () => {
    setLoading(true);
    const range = getDateRange();

    let query = supabase
      .from('journals')
      .select(`
        id, created_at, description, debit, credit,
        accounts(id, code, name, type)
      `)
      .order('created_at', { ascending: false });

    if (range.start && range.end) {
      query = query.gte('created_at', range.start).lte('created_at', range.end);
    }

    const { data: journals } = await query;

    if (journals) setJurnalList(journals);

    let pendapatanToko = 0, pendapatanLain = 0, hpp = 0, bebanOperasional = 0;
    let kas = 0, persediaan = 0, modal = 0;

    journals?.forEach((j: any) => {
      const accType = j.accounts?.type;
      const accCode = j.accounts?.code;

      if (accType === 'Revenue') {
        if (accCode === '4.1.01') pendapatanToko += (j.credit - j.debit);
        else if (accCode === '4.1.02') pendapatanLain += (j.credit - j.debit);
        else pendapatanLain += (j.credit - j.debit);
      }

      if (accType === 'Expense') {
        if (accCode === '5.1.01') hpp += (j.debit - j.credit);
        else bebanOperasional += (j.debit - j.credit);
      }

      if (accCode === '1.1.01') kas += (j.debit - j.credit);
      if (accCode === '1.1.03') persediaan += (j.debit - j.credit);
      if (accType === 'Equity') modal += (j.credit - j.debit);
    });

    const totalPendapatan = pendapatanToko + pendapatanLain;
    const labaKotor = totalPendapatan - hpp;
    const labaBersih = labaKotor - bebanOperasional;
    const labaDitahan = labaBersih;

    // Fetch Fixed Assets for Neraca
    const { data: assets } = await supabase.from('fixed_assets').select('*').order('name');
    let totalAsetTetap = 0;
    if (assets) {
      setFixedAssets(assets);
      totalAsetTetap = assets.reduce((sum: number, a: FixedAsset) => sum + a.acquisition_cost, 0);
    }

    setLabaRugi({ pendapatanToko, pendapatanLain, hpp, bebanOperasional, labaKotor, labaBersih });
    setNeraca({
      kas,
      persediaan,
      asetTetap: totalAsetTetap,
      totalAset: kas + persediaan + totalAsetTetap,
      modal: modal + labaDitahan
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchLaporan();
  }, [filterMonth, filterYear, filterMode]);

  const getOrCreateAccount = async (code: string, name: string, type: string) => {
    let { data: acc } = await supabase.from('accounts').select('id').eq('code', code).single();
    if (!acc) {
      const { data: newAcc } = await supabase.from('accounts').insert({ code, name, type }).select('id').single();
      acc = newAcc;
    }
    return acc?.id;
  };

  const handleCatatPengeluaran = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const amount = Number(expenseData.amount);
      const desc = expenseData.desc;

      const bebanId = await getOrCreateAccount('5.1.02', 'Beban Operasional', 'Expense');
      const kasId = await getOrCreateAccount('1.1.01', 'Kas', 'Asset');

      const { data: trx } = await supabase.from('transactions').insert({
        invoice_number: `EXP-${Date.now()}`,
        type: 'Biaya',
        total_amount: amount,
        notes: desc
      }).select('id').single();

      if (trx && bebanId && kasId) {
        await supabase.from('journals').insert([
          { transaction_id: trx.id, account_id: bebanId, debit: amount, credit: 0, description: desc },
          { transaction_id: trx.id, account_id: kasId, debit: 0, credit: amount, description: desc }
        ]);
      }

      setShowExpenseModal(false);
      setExpenseData({ amount: '', desc: '' });
      fetchLaporan();
      alert('Pengeluaran berhasil dicatat!');
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan pencatatan.');
    }
    setLoading(false);
  };

  const handleCatatPemasukan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const amount = Number(incomeData.amount);
      const desc = `[${incomeData.source}] ${incomeData.desc}`;

      const pendapatanId = await getOrCreateAccount('4.1.02', 'Pendapatan Usaha Lainnya', 'Revenue');
      const kasId = await getOrCreateAccount('1.1.01', 'Kas', 'Asset');

      const { data: trx } = await supabase.from('transactions').insert({
        invoice_number: `INC-${Date.now()}`,
        type: 'Pendapatan Lain',
        total_amount: amount,
        notes: desc
      }).select('id').single();

      if (trx && pendapatanId && kasId) {
        await supabase.from('journals').insert([
          { transaction_id: trx.id, account_id: kasId, debit: amount, credit: 0, description: desc },
          { transaction_id: trx.id, account_id: pendapatanId, debit: 0, credit: amount, description: desc }
        ]);
      }

      setShowIncomeModal(false);
      setIncomeData({ amount: '', source: 'Tempat Parkir', desc: '' });
      fetchLaporan();
      alert('Pemasukan berhasil dicatat!');
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan pencatatan.');
    }
    setLoading(false);
  };

  // Tambah Aset Tetap
  const handleTambahAset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.from('fixed_assets').insert({
        name: assetData.name,
        category: assetData.category,
        acquisition_cost: Number(assetData.acquisition_cost),
        notes: assetData.notes
      });
      setShowAssetModal(false);
      setAssetData({ name: '', category: 'Peralatan', acquisition_cost: '', notes: '' });
      fetchLaporan();
      alert('Aset tetap berhasil ditambahkan!');
    } catch (error) {
      console.error(error);
      alert('Gagal menambah aset tetap.');
    }
    setLoading(false);
  };

  const handleHapusAset = async (id: string) => {
    if (!confirm('Yakin ingin menghapus aset ini?')) return;
    await supabase.from('fixed_assets').delete().eq('id', id);
    fetchLaporan();
  };

  const periodLabel = filterMode === 'all'
    ? 'Seluruh Periode'
    : `${['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][filterMonth - 1]} ${filterYear}`;

  // EXPORT EXCEL Laba Rugi
  const exportLabaRugiExcel = () => {
    const data = [
      ['LAPORAN LABA RUGI BUMDES NOTO MULYO', ''],
      [`Periode: ${periodLabel}`, ''],
      ['TANGGAL CETAK: ' + new Date().toLocaleDateString('id-ID'), ''],
      ['', ''],
      ['PENDAPATAN', 'NOMINAL (Rp)'],
      ['Pendapatan Penjualan Toko', labaRugi.pendapatanToko],
      ['Pendapatan Usaha Lainnya (Parkir, Lele, dll)', labaRugi.pendapatanLain],
      ['Total Pendapatan', labaRugi.pendapatanToko + labaRugi.pendapatanLain],
      ['', ''],
      ['BEBAN', 'NOMINAL (Rp)'],
      ['Harga Pokok Penjualan (HPP)', labaRugi.hpp * -1],
      ['LABA KOTOR', labaRugi.labaKotor],
      ['', ''],
      ['Beban Operasional', labaRugi.bebanOperasional * -1],
      ['LABA BERSIH', labaRugi.labaBersih]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    ws['!cols'] = [{ wch: 45 }, { wch: 25 }];
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }
    ];

    const titleStyle = { font: { bold: true, sz: 14, color: { rgb: "0F172A" } }, alignment: { horizontal: "center" } };
    const dateStyle = { font: { italic: true, sz: 10, color: { rgb: "64748B" } }, alignment: { horizontal: "center" } };
    const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0F172A" } }, border: { top: { style: "thin" }, bottom: { style: "thin" } } };
    const boldRowStyle = { font: { bold: true }, fill: { fgColor: { rgb: "F8FAFC" } } };
    const profitStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "10B981" } } };
    const numberFormat = { numFmt: '"Rp"#,##0_);\\("Rp"#,##0\\)' };

    if (ws['A1']) ws['A1'].s = titleStyle;
    if (ws['A2']) ws['A2'].s = dateStyle;
    if (ws['A3']) ws['A3'].s = dateStyle;
    
    if (ws['A5']) ws['A5'].s = headerStyle;
    if (ws['B5']) ws['B5'].s = headerStyle;
    if (ws['A10']) ws['A10'].s = headerStyle;
    if (ws['B10']) ws['B10'].s = headerStyle;

    if (ws['A8']) ws['A8'].s = boldRowStyle;
    if (ws['B8']) ws['B8'].s = { ...boldRowStyle, ...numberFormat };
    if (ws['A12']) ws['A12'].s = boldRowStyle;
    if (ws['B12']) ws['B12'].s = { ...boldRowStyle, ...numberFormat };

    if (ws['A15']) ws['A15'].s = profitStyle;
    if (ws['B15']) ws['B15'].s = { ...profitStyle, ...numberFormat };

    [6, 7, 11, 14].forEach(row => {
      if (ws[`B${row}`]) ws[`B${row}`].s = numberFormat;
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laba Rugi");
    XLSX.writeFile(wb, "Laporan_Laba_Rugi.xlsx");
  };

  // EXPORT PDF Neraca
  const exportNeracaPdf = () => {
    const doc = new jsPDF();
    
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN NERACA", 14, 12);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("BUMDes Noto Mulyo Pulodarat", 14, 18);
    doc.text(`Periode: ${periodLabel}`, 14, 24);
    
    doc.setTextColor(15, 23, 42);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("AKTIVA (ASET)", 14, 42);
    (doc as any).autoTable({
      startY: 47,
      head: [['Nama Akun', 'Saldo (Rp)']],
      body: [
        ['Kas (Uang Tunai)', neraca.kas.toLocaleString('id-ID')],
        ['Persediaan Barang', neraca.persediaan.toLocaleString('id-ID')],
        ...fixedAssets.map(a => [`[Aset Tetap] ${a.name}`, a.acquisition_cost.toLocaleString('id-ID')]),
        ['TOTAL AKTIVA', neraca.totalAset.toLocaleString('id-ID')]
      ],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 47;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("PASIVA (KEWAJIBAN & EKUITAS)", 14, finalY + 15);
    (doc as any).autoTable({
      startY: finalY + 20,
      head: [['Nama Akun', 'Saldo (Rp)']],
      body: [
        ['Modal & Laba Ditahan', neraca.modal.toLocaleString('id-ID')],
        ['TOTAL PASIVA', neraca.modal.toLocaleString('id-ID')]
      ],
      theme: 'grid',
      headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save("Laporan_Neraca.pdf");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] space-y-4">

      {/* Tab & Action Buttons */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center card rounded-2xl shadow-sm p-4 z-10 relative">
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          {[
            { id: 'laba-rugi', name: 'Laba Rugi', icon: <TrendingUp size={18} /> },
            { id: 'neraca', name: 'Neraca', icon: <DollarSign size={18} /> },
            { id: 'jurnal', name: 'Buku Jurnal', icon: <FileText size={18} /> },
            { id: 'aset-tetap', name: 'Aset Tetap', icon: <Building2 size={18} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 sm:flex-none flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl font-bold transition-all ${activeTab === tab.id
                  ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 w-full xl:w-auto mt-2 xl:mt-0">
          <button
            onClick={() => setShowIncomeModal(true)}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-4 py-2.5 rounded-xl font-bold transition-colors border border-emerald-100 dark:border-emerald-800"
          >
            <ArrowDownCircle size={18} /> Setor Pemasukan
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 px-4 py-2.5 rounded-xl font-bold transition-colors border border-rose-100 dark:border-rose-800"
          >
            <ArrowUpCircle size={18} /> Catat Pengeluaran
          </button>
        </div>
      </div>

      {/* ===== FILTER PERIODE ===== */}
      <div className="card rounded-2xl shadow-sm p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 z-10 relative">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
          <Calendar size={18} className="text-primary-500" /> Periode Laporan:
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-4 py-2 rounded-lg text-sm font-bold trans-all ${filterMode === 'all' ? 'bg-primary-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterMode('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-bold trans-all ${filterMode === 'monthly' ? 'bg-primary-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            Per Bulan
          </button>
          {filterMode === 'monthly' && (
            <div className="flex gap-2">
              <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} className="input-field border rounded-lg px-3 py-2 text-sm font-medium">
                {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="input-field border rounded-lg px-3 py-2 text-sm font-medium">
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1.5 rounded-lg hidden sm:inline-flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></div>
          {periodLabel}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 card rounded-2xl shadow-sm overflow-hidden flex flex-col relative z-0">
        {loading && <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm z-20 flex items-center justify-center font-bold text-primary-600">Memuat Laporan...</div>}

        {/* Laba Rugi */}
        {activeTab === 'laba-rugi' && (
          <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 dark:border-slate-700 pb-6 mb-8 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Laporan Laba Rugi</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{periodLabel}</p>
                </div>
                <button onClick={exportLabaRugiExcel} className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/30 trans-all active:scale-95 border-none">
                  <Download size={18} /> Download Excel
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2 text-lg">PENDAPATAN</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium">
                      <span>Pendapatan Penjualan Toko</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">Rp {labaRugi.pendapatanToko.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium">
                      <span>Pendapatan Usaha Lain (Parkir, Lele, dll)</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">Rp {labaRugi.pendapatanLain.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-emerald-700 dark:text-emerald-400 border-t border-slate-200 dark:border-slate-700 pt-3 mt-2">
                      <span>Total Pendapatan</span>
                      <span>Rp {(labaRugi.pendapatanToko + labaRugi.pendapatanLain).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2 text-lg">HARGA POKOK & LABA KOTOR</h3>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium mb-4">
                    <span>Harga Pokok Penjualan (HPP Toko)</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">(Rp {labaRugi.hpp.toLocaleString('id-ID')})</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-lg text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span>Laba Kotor</span>
                    <span>Rp {labaRugi.labaKotor.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2 text-lg">BEBAN OPERASIONAL</h3>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 font-medium mb-2">
                    <span>Biaya Operasional (Listrik, Air, Gaji, dll)</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">(Rp {labaRugi.bebanOperasional.toLocaleString('id-ID')})</span>
                  </div>
                </div>

                <div className="flex justify-between font-black text-2xl text-white bg-primary-900 p-6 rounded-2xl shadow-xl shadow-primary-900/20 mt-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                  <span className="relative z-10">LABA BERSIH</span>
                  <span className="relative z-10">Rp {labaRugi.labaBersih.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Neraca */}
        {activeTab === 'neraca' && (
          <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 dark:border-slate-700 pb-6 mb-8 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Laporan Neraca</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{periodLabel}</p>
                </div>
                <button onClick={exportNeracaPdf} className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-rose-500/30 trans-all active:scale-95 border-none">
                  <Download size={18} /> Download PDF
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="card rounded-2xl p-6 shadow-sm">
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 mb-4 border-b-2 border-emerald-500 pb-2 inline-block">AKTIVA (ASET)</h3>
                  
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 mt-4">Aktiva Lancar</p>
                  <div className="space-y-3 text-slate-600 dark:text-slate-300 font-medium">
                    <div className="flex justify-between">
                      <span>Kas (Uang Tunai)</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">Rp {neraca.kas.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Persediaan Barang Dagang</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">Rp {neraca.persediaan.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {fixedAssets.length > 0 && (
                    <>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">Aset Tetap</p>
                      <div className="space-y-3 text-slate-600 dark:text-slate-300 font-medium">
                        {fixedAssets.map(asset => (
                          <div key={asset.id} className="flex justify-between">
                            <span className="truncate mr-3">{asset.name}</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">Rp {asset.acquisition_cost.toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="flex justify-between font-extrabold text-slate-800 dark:text-slate-100 mt-6 pt-4 border-t-2 border-slate-100 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
                    <span>Total Aktiva</span>
                    <span className="text-emerald-700 dark:text-emerald-400">Rp {neraca.totalAset.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="card rounded-2xl p-6 shadow-sm">
                  <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 mb-4 border-b-2 border-rose-500 pb-2 inline-block">PASIVA (MODAL)</h3>
                  <div className="space-y-3 text-slate-600 dark:text-slate-300 font-medium mt-4">
                    <div className="flex justify-between">
                      <span>Modal & Laba Ditahan</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">Rp {neraca.modal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-extrabold text-slate-800 dark:text-slate-100 mt-6 pt-4 border-t-2 border-slate-100 dark:border-slate-700 bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl">
                    <span>Total Pasiva</span>
                    <span className="text-rose-700 dark:text-rose-400">Rp {neraca.modal.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buku Jurnal */}
        {activeTab === 'jurnal' && (
          <div className="flex-1 overflow-auto bg-slate-50/30 dark:bg-slate-800/30 p-0 md:p-4">
            <div className="card md:rounded-2xl border-y md:border overflow-hidden shadow-sm h-full">
              <div className="overflow-x-auto h-full">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold sticky top-0 z-10 shadow-sm">
                      <th className="p-4 pl-6 w-40">Waktu</th>
                      <th className="p-4">Deskripsi / Uraian</th>
                      <th className="p-4 w-40">Akun</th>
                      <th className="p-4 text-right">Debit</th>
                      <th className="p-4 text-right pr-6">Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {jurnalList.map((j) => (
                      <tr key={j.id} className="hover:bg-primary-50/50 dark:hover:bg-primary-950/30 transition-colors">
                        <td className="p-4 pl-6 text-xs font-semibold text-slate-400">
                          {new Date(j.created_at).toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-100">{j.description}</td>
                        <td className="p-4">
                          <span className="inline-flex px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                            {j.accounts?.name}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-right text-emerald-600 dark:text-emerald-400 font-extrabold">
                          {j.debit > 0 ? `Rp ${j.debit.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="p-4 pr-6 text-sm text-right text-rose-600 dark:text-rose-400 font-extrabold">
                          {j.credit > 0 ? `Rp ${j.credit.toLocaleString('id-ID')}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Aset Tetap */}
        {activeTab === 'aset-tetap' && (
          <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 dark:border-slate-700 pb-6 mb-8 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Daftar Aset Tetap</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Peralatan, Mesin, Bangunan milik BUMDes</p>
                </div>
                <button onClick={() => setShowAssetModal(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-primary-500/30 trans-all active:scale-95 border-none">
                  <Plus size={18} /> Tambah Aset
                </button>
              </div>

              <div className="space-y-4">
                {fixedAssets.length === 0 && (
                  <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                    <Building2 size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold">Belum ada aset tetap yang dicatat.</p>
                    <p className="text-sm mt-1">Klik "Tambah Aset" untuk mulai mencatat.</p>
                  </div>
                )}
                {fixedAssets.map(asset => (
                  <div key={asset.id} className="card rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:shadow-md trans-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:scale-110 trans-all">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100">{asset.name}</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md">{asset.category}</span>
                          {asset.notes && <span className="text-xs text-slate-400 dark:text-slate-500">{asset.notes}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <span className="text-xl font-black text-primary-900 dark:text-primary-300">Rp {asset.acquisition_cost.toLocaleString('id-ID')}</span>
                      <button onClick={() => handleHapusAset(asset.id)} className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white trans-all ml-auto sm:ml-0">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {fixedAssets.length > 0 && (
                  <div className="flex justify-between font-black text-xl text-white bg-primary-900 p-6 rounded-2xl shadow-xl shadow-primary-900/20 mt-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    <span className="relative z-10">TOTAL ASET TETAP</span>
                    <span className="relative z-10">Rp {neraca.asetTetap.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah Aset Tetap */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center p-6 border-b border-primary-100 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/50">
              <h3 className="text-xl font-extrabold text-primary-900 dark:text-primary-200 flex items-center gap-2">
                <Building2 className="text-primary-500" /> Tambah Aset Tetap
              </h3>
              <button onClick={() => setShowAssetModal(false)} className="text-primary-400 hover:text-primary-700 bg-primary-100/50 dark:bg-primary-800/50 hover:bg-primary-200 dark:hover:bg-primary-700 p-2 rounded-xl trans-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleTambahAset} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nama Aset</label>
                <input required type="text" value={assetData.name} onChange={e => setAssetData({ ...assetData, name: e.target.value })} className="w-full px-4 py-3 input-field border-2 rounded-xl focus:ring-0 focus:border-primary-500 font-medium" placeholder="Mesin Fotokopi" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Kategori</label>
                <select value={assetData.category} onChange={e => setAssetData({ ...assetData, category: e.target.value })} className="w-full px-4 py-3 input-field border-2 rounded-xl focus:ring-0 focus:border-primary-500 font-medium">
                  <option value="Peralatan">Peralatan</option>
                  <option value="Bangunan">Bangunan</option>
                  <option value="Kendaraan">Kendaraan</option>
                  <option value="Tanah">Tanah</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nilai Perolehan (Rp)</label>
                <input required type="number" min="1" value={assetData.acquisition_cost} onChange={e => setAssetData({ ...assetData, acquisition_cost: e.target.value })} className="w-full px-4 py-3 input-field border-2 rounded-xl focus:ring-0 focus:border-primary-500 font-bold text-primary-700 dark:text-primary-300 text-lg" placeholder="100000000" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Catatan (Opsional)</label>
                <textarea rows={2} value={assetData.notes} onChange={e => setAssetData({ ...assetData, notes: e.target.value })} className="w-full px-4 py-3 input-field border-2 rounded-xl focus:ring-0 focus:border-primary-500 font-medium" placeholder="Keterangan tambahan..." />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setShowAssetModal(false)} className="px-5 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold trans-all">Batal</button>
                <button type="submit" disabled={loading} className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-600/30 disabled:opacity-50 trans-all active:scale-95">Simpan Aset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pemasukan Non-Toko */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center p-6 border-b border-emerald-100 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/50">
              <h3 className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <ArrowDownCircle className="text-emerald-500" /> Setor Pemasukan
              </h3>
              <button onClick={() => setShowIncomeModal(false)} className="text-emerald-400 hover:text-emerald-700 bg-emerald-100/50 dark:bg-emerald-800/50 hover:bg-emerald-200 dark:hover:bg-emerald-700 p-2 rounded-xl trans-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleCatatPemasukan} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Sumber Pemasukan</label>
                <select
                  value={incomeData.source}
                  onChange={e => setIncomeData({ ...incomeData, source: e.target.value })}
                  className="w-full px-4 py-3 input-field border-2 rounded-xl focus:ring-0 focus:border-emerald-500 font-medium"
                >
                  <option value="Tempat Parkir">Tempat Parkir</option>
                  <option value="Pengasapan Lele">Pengasapan Lele</option>
                  <option value="Jasa Lainnya">Layanan Jasa Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nominal Pemasukan (Rp)</label>
                <input required type="number" min="1" value={incomeData.amount} onChange={e => setIncomeData({ ...incomeData, amount: e.target.value })} className="w-full px-4 py-3 input-field border-2 rounded-xl focus:ring-0 focus:border-emerald-500 font-bold text-emerald-700 dark:text-emerald-300 text-lg" placeholder="150000" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Catatan / Rincian Singkat</label>
                <textarea required rows={2} value={incomeData.desc} onChange={e => setIncomeData({ ...incomeData, desc: e.target.value })} className="w-full px-4 py-3 input-field border-2 rounded-xl focus:ring-0 focus:border-emerald-500 font-medium" placeholder="Setoran parkir minggu ke-1..." />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setShowIncomeModal(false)} className="px-5 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold trans-all">Batal</button>
                <button type="submit" disabled={loading} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 disabled:opacity-50 trans-all active:scale-95">Simpan ke Kas</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pengeluaran (Beban) */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center p-6 border-b border-rose-100 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/50">
              <h3 className="text-xl font-extrabold text-rose-900 dark:text-rose-200 flex items-center gap-2">
                <ArrowUpCircle className="text-rose-500" /> Catat Pengeluaran
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-rose-400 hover:text-rose-700 bg-rose-100/50 dark:bg-rose-800/50 hover:bg-rose-200 dark:hover:bg-rose-700 p-2 rounded-xl trans-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleCatatPengeluaran} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nominal Pengeluaran (Rp)</label>
                <input required type="number" min="1" value={expenseData.amount} onChange={e => setExpenseData({ ...expenseData, amount: e.target.value })} className="w-full px-4 py-3 input-field border-2 rounded-xl focus:ring-0 focus:border-rose-500 font-bold text-rose-700 dark:text-rose-300 text-lg" placeholder="50000" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Keterangan / Tujuan Biaya</label>
                <textarea required rows={3} value={expenseData.desc} onChange={e => setExpenseData({ ...expenseData, desc: e.target.value })} className="w-full px-4 py-3 input-field border-2 rounded-xl focus:ring-0 focus:border-rose-500 font-medium" placeholder="Beli token listrik atau bayar kebersihan..." />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="px-5 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold trans-all">Batal</button>
                <button type="submit" disabled={loading} className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-600/30 disabled:opacity-50 trans-all active:scale-95">Simpan Pengeluaran</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
