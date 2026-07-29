import { useEffect, useState } from 'react';
import { FileText, TrendingUp, DollarSign, Download, Plus, X, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Akuntansi() {
  const [activeTab, setActiveTab] = useState<'laba-rugi' | 'neraca' | 'jurnal'>('laba-rugi');
  
  const [labaRugi, setLabaRugi] = useState({ pendapatanToko: 0, pendapatanLain: 0, hpp: 0, bebanOperasional: 0, labaKotor: 0, labaBersih: 0 });
  const [neraca, setNeraca] = useState({ kas: 0, persediaan: 0, totalAset: 0, modal: 0 });
  const [jurnalList, setJurnalList] = useState<any[]>([]);
  
  // Pengeluaran State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseData, setExpenseData] = useState({ amount: '', desc: '' });
  
  // Pemasukan Non-Toko State
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeData, setIncomeData] = useState({ amount: '', source: 'Tempat Parkir', desc: '' });

  const [loading, setLoading] = useState(false);

  const fetchLaporan = async () => {
    setLoading(true);
    const { data: journals } = await supabase
      .from('journals')
      .select(`
        id, created_at, description, debit, credit,
        accounts(id, code, name, type)
      `)
      .order('created_at', { ascending: false });
    
    if (journals) setJurnalList(journals);

    let pendapatanToko = 0, pendapatanLain = 0, hpp = 0, bebanOperasional = 0;
    let kas = 0, persediaan = 0, modal = 0;

    journals?.forEach((j: any) => {
      const accType = j.accounts?.type;
      const accCode = j.accounts?.code;
      
      if (accType === 'Revenue') {
        if (accCode === '4.1.01') pendapatanToko += (j.credit - j.debit);
        else if (accCode === '4.1.02') pendapatanLain += (j.credit - j.debit);
        else pendapatanLain += (j.credit - j.debit); // fallback
      }
      
      if (accType === 'Expense') {
        if (accCode === '5.1.01') hpp += (j.debit - j.credit); // HPP
        else bebanOperasional += (j.debit - j.credit); // Beban lainnya
      }
      
      if (accCode === '1.1.01') kas += (j.debit - j.credit);
      if (accCode === '1.1.03') persediaan += (j.debit - j.credit);
      if (accType === 'Equity') modal += (j.credit - j.debit);
    });

    const totalPendapatan = pendapatanToko + pendapatanLain;
    const labaKotor = totalPendapatan - hpp;
    const labaBersih = labaKotor - bebanOperasional;
    const labaDitahan = labaBersih; // Laba bulan berjalan masuk ke modal
    
    setLabaRugi({ pendapatanToko, pendapatanLain, hpp, bebanOperasional, labaKotor, labaBersih });
    setNeraca({ kas, persediaan, totalAset: kas + persediaan, modal: modal + labaDitahan });
    setLoading(false);
  };

  useEffect(() => {
    fetchLaporan();
  }, []);

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

  // EXPORT EXCEL Laba Rugi
  const exportLabaRugiExcel = () => {
    const data = [
      ['LAPORAN LABA RUGI BUMDES NOTO MULYO'],
      [''],
      ['PENDAPATAN'],
      ['Pendapatan Penjualan Toko', labaRugi.pendapatanToko],
      ['Pendapatan Usaha Lainnya (Parkir, Lele, dll)', labaRugi.pendapatanLain],
      ['Total Pendapatan', labaRugi.pendapatanToko + labaRugi.pendapatanLain],
      [''],
      ['BEBAN'],
      ['Harga Pokok Penjualan (HPP)', `(${labaRugi.hpp})`],
      ['LABA KOTOR', labaRugi.labaKotor],
      [''],
      ['Beban Operasional', `(${labaRugi.bebanOperasional})`],
      ['LABA BERSIH', labaRugi.labaBersih]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laba Rugi");
    XLSX.writeFile(wb, "Laporan_Laba_Rugi.xlsx");
  };

  // EXPORT PDF Neraca
  const exportNeracaPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("LAPORAN NERACA BUMDES NOTO MULYO", 14, 20);
    
    doc.setFontSize(12);
    doc.text("AKTIVA (ASET)", 14, 35);
    (doc as any).autoTable({
      startY: 40,
      head: [['Nama Akun', 'Saldo (Rp)']],
      body: [
        ['Kas (Uang Tunai)', neraca.kas.toLocaleString('id-ID')],
        ['Persediaan Barang', neraca.persediaan.toLocaleString('id-ID')],
        ['TOTAL AKTIVA', neraca.totalAset.toLocaleString('id-ID')]
      ],
    });

    const finalY = (doc as any).lastAutoTable.finalY || 40;
    doc.text("PASIVA (KEWAJIBAN & EKUITAS)", 14, finalY + 15);
    (doc as any).autoTable({
      startY: finalY + 20,
      head: [['Nama Akun', 'Saldo (Rp)']],
      body: [
        ['Modal & Laba Ditahan', neraca.modal.toLocaleString('id-ID')],
        ['TOTAL PASIVA', neraca.modal.toLocaleString('id-ID')]
      ],
    });

    doc.save("Laporan_Neraca.pdf");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] space-y-6">
      
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white rounded-2xl border border-slate-200 shadow-sm p-4 z-10 relative">
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          {[
            { id: 'laba-rugi', name: 'Laba Rugi', icon: <TrendingUp size={18} /> },
            { id: 'neraca', name: 'Neraca', icon: <DollarSign size={18} /> },
            { id: 'jurnal', name: 'Buku Jurnal', icon: <FileText size={18} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 sm:flex-none flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary-50 text-primary-700 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2 w-full xl:w-auto mt-2 xl:mt-0">
          <button 
            onClick={() => setShowIncomeModal(true)}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl font-bold transition-colors border border-emerald-100"
          >
            <ArrowDownCircle size={18} /> Setor Pemasukan
          </button>
          <button 
            onClick={() => setShowExpenseModal(true)}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2.5 rounded-xl font-bold transition-colors border border-rose-100"
          >
            <ArrowUpCircle size={18} /> Catat Pengeluaran
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative z-0">
        {loading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex items-center justify-center font-bold text-primary-600">Memuat Laporan...</div>}
        
        {/* Laba Rugi */}
        {activeTab === 'laba-rugi' && (
          <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 pb-6 mb-8 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Laporan Laba Rugi</h2>
                  <p className="text-slate-500 font-medium">BUMDes Noto Mulyo Pulodarat</p>
                </div>
                <button onClick={exportLabaRugiExcel} className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm bg-primary-50 text-primary-700 hover:bg-primary-100 px-4 py-2.5 rounded-xl font-bold border border-primary-100 trans-all active:scale-95">
                  <Download size={18} /> Download Excel
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h3 className="font-extrabold text-slate-800 mb-4 border-b border-slate-200 pb-2 text-lg">PENDAPATAN</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Pendapatan Penjualan Toko</span>
                      <span className="font-bold text-slate-800">Rp {labaRugi.pendapatanToko.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Pendapatan Usaha Lain (Parkir, Lele, dll)</span>
                      <span className="font-bold text-slate-800">Rp {labaRugi.pendapatanLain.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-emerald-700 border-t border-slate-200 pt-3 mt-2">
                      <span>Total Pendapatan</span>
                      <span>Rp {(labaRugi.pendapatanToko + labaRugi.pendapatanLain).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h3 className="font-extrabold text-slate-800 mb-4 border-b border-slate-200 pb-2 text-lg">HARGA POKOK & LABA KOTOR</h3>
                  <div className="flex justify-between text-slate-600 font-medium mb-4">
                    <span>Harga Pokok Penjualan (HPP Toko)</span>
                    <span className="text-rose-600 font-bold">(Rp {labaRugi.hpp.toLocaleString('id-ID')})</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-lg text-slate-800 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span>Laba Kotor</span>
                    <span>Rp {labaRugi.labaKotor.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h3 className="font-extrabold text-slate-800 mb-4 border-b border-slate-200 pb-2 text-lg">BEBAN OPERASIONAL</h3>
                  <div className="flex justify-between text-slate-600 font-medium mb-2">
                    <span>Biaya Operasional (Listrik, Air, Gaji, dll)</span>
                    <span className="text-rose-600 font-bold">(Rp {labaRugi.bebanOperasional.toLocaleString('id-ID')})</span>
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 pb-6 mb-8 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Laporan Neraca</h2>
                  <p className="text-slate-500 font-medium">BUMDes Noto Mulyo Pulodarat</p>
                </div>
                <button onClick={exportNeracaPdf} className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2.5 rounded-xl font-bold border border-rose-100 trans-all active:scale-95">
                  <Download size={18} /> Download PDF
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-extrabold text-lg text-slate-800 mb-4 border-b-2 border-primary-600 pb-2 inline-block">AKTIVA (ASET)</h3>
                  <div className="space-y-3 text-slate-600 font-medium">
                    <div className="flex justify-between">
                      <span>Kas (Uang Tunai)</span>
                      <span className="font-bold text-slate-800">Rp {neraca.kas.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Persediaan Barang Dagang</span>
                      <span className="font-bold text-slate-800">Rp {neraca.persediaan.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-extrabold text-slate-800 mt-6 pt-4 border-t-2 border-slate-100 bg-slate-50 p-4 rounded-xl">
                    <span>Total Aktiva</span>
                    <span>Rp {neraca.totalAset.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-extrabold text-lg text-slate-800 mb-4 border-b-2 border-primary-600 pb-2 inline-block">PASIVA (MODAL)</h3>
                  <div className="space-y-3 text-slate-600 font-medium">
                    <div className="flex justify-between">
                      <span>Modal & Laba Ditahan</span>
                      <span className="font-bold text-slate-800">Rp {neraca.modal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="flex justify-between font-extrabold text-slate-800 mt-6 pt-4 border-t-2 border-slate-100 bg-slate-50 p-4 rounded-xl">
                    <span>Total Pasiva</span>
                    <span>Rp {neraca.modal.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buku Jurnal */}
        {activeTab === 'jurnal' && (
          <div className="flex-1 overflow-auto bg-slate-50/30 p-0 md:p-4">
            <div className="bg-white md:rounded-2xl border-y md:border border-slate-200 overflow-hidden shadow-sm h-full">
              <div className="overflow-x-auto h-full">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold sticky top-0 z-10 shadow-sm">
                      <th className="p-4 pl-6 w-40">Waktu</th>
                      <th className="p-4">Deskripsi / Uraian</th>
                      <th className="p-4 w-40">Akun</th>
                      <th className="p-4 text-right">Debit</th>
                      <th className="p-4 text-right pr-6">Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jurnalList.map((j) => (
                      <tr key={j.id} className="hover:bg-primary-50/50 transition-colors">
                        <td className="p-4 pl-6 text-xs font-semibold text-slate-400">
                          {new Date(j.created_at).toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 text-sm font-bold text-slate-800">{j.description}</td>
                        <td className="p-4">
                          <span className="inline-flex px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                            {j.accounts?.name}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-right text-emerald-600 font-extrabold">
                          {j.debit > 0 ? `Rp ${j.debit.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="p-4 pr-6 text-sm text-right text-rose-600 font-extrabold">
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
      </div>

      {/* Modal Pemasukan Non-Toko */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="flex justify-between items-center p-6 border-b border-emerald-100 bg-emerald-50/50">
              <h3 className="text-xl font-extrabold text-emerald-900 flex items-center gap-2">
                <ArrowDownCircle className="text-emerald-500" /> Setor Pemasukan
              </h3>
              <button onClick={() => setShowIncomeModal(false)} className="text-emerald-400 hover:text-emerald-700 bg-emerald-100/50 hover:bg-emerald-200 p-2 rounded-xl trans-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleCatatPemasukan} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Sumber Pemasukan</label>
                <select 
                  value={incomeData.source} 
                  onChange={e => setIncomeData({...incomeData, source: e.target.value})} 
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-emerald-500 font-medium text-slate-800 bg-slate-50"
                >
                  <option value="Tempat Parkir">Tempat Parkir</option>
                  <option value="Pengasapan Lele">Pengasapan Lele</option>
                  <option value="Jasa Lainnya">Layanan Jasa Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nominal Pemasukan (Rp)</label>
                <input required type="number" min="1" value={incomeData.amount} onChange={e => setIncomeData({...incomeData, amount: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-emerald-500 font-bold text-emerald-700 bg-slate-50 text-lg" placeholder="150000" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Catatan / Rincian Singkat</label>
                <textarea required rows={2} value={incomeData.desc} onChange={e => setIncomeData({...incomeData, desc: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-emerald-500 font-medium text-slate-800 bg-slate-50" placeholder="Setoran parkir minggu ke-1..." />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowIncomeModal(false)} className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold trans-all">Batal</button>
                <button type="submit" disabled={loading} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 disabled:opacity-50 trans-all active:scale-95">Simpan ke Kas</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pengeluaran (Beban) */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="flex justify-between items-center p-6 border-b border-rose-100 bg-rose-50/50">
              <h3 className="text-xl font-extrabold text-rose-900 flex items-center gap-2">
                <ArrowUpCircle className="text-rose-500" /> Catat Pengeluaran
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-rose-400 hover:text-rose-700 bg-rose-100/50 hover:bg-rose-200 p-2 rounded-xl trans-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleCatatPengeluaran} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nominal Pengeluaran (Rp)</label>
                <input required type="number" min="1" value={expenseData.amount} onChange={e => setExpenseData({...expenseData, amount: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-rose-500 font-bold text-rose-700 bg-slate-50 text-lg" placeholder="50000" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Keterangan / Tujuan Biaya</label>
                <textarea required rows={3} value={expenseData.desc} onChange={e => setExpenseData({...expenseData, desc: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-rose-500 font-medium text-slate-800 bg-slate-50" placeholder="Beli token listrik atau bayar kebersihan..." />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold trans-all">Batal</button>
                <button type="submit" disabled={loading} className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-600/30 disabled:opacity-50 trans-all active:scale-95">Simpan Pengeluaran</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
