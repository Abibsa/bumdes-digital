import { useEffect, useState } from 'react';
import { FileText, TrendingUp, DollarSign, Download, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Akuntansi() {
  const [activeTab, setActiveTab] = useState<'laba-rugi' | 'neraca' | 'jurnal'>('laba-rugi');
  
  const [labaRugi, setLabaRugi] = useState({ pendapatan: 0, hpp: 0, bebanOperasional: 0, labaKotor: 0, labaBersih: 0 });
  const [neraca, setNeraca] = useState({ kas: 0, persediaan: 0, totalAset: 0, modal: 0 });
  const [jurnalList, setJurnalList] = useState<any[]>([]);
  
  // Pengeluaran State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseData, setExpenseData] = useState({ amount: '', desc: '' });
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

    let pendapatan = 0, hpp = 0, bebanOperasional = 0;
    let kas = 0, persediaan = 0, modal = 0;

    journals?.forEach((j: any) => {
      const accType = j.accounts?.type;
      const accCode = j.accounts?.code;
      
      if (accType === 'Revenue') pendapatan += (j.credit - j.debit);
      
      if (accType === 'Expense') {
        if (accCode === '5.1.01') hpp += (j.debit - j.credit); // HPP
        else bebanOperasional += (j.debit - j.credit); // Beban lainnya (Listrik, Air, Gaji)
      }
      
      if (accCode === '1.1.01') kas += (j.debit - j.credit);
      if (accCode === '1.1.03') persediaan += (j.debit - j.credit);
      if (accType === 'Equity') modal += (j.credit - j.debit);
    });

    const labaKotor = pendapatan - hpp;
    const labaBersih = labaKotor - bebanOperasional;
    const labaDitahan = labaBersih; // Laba bulan berjalan masuk ke modal (Laba Ditahan)
    
    setLabaRugi({ pendapatan, hpp, bebanOperasional, labaKotor, labaBersih });
    setNeraca({ kas, persediaan, totalAset: kas + persediaan, modal: modal + labaDitahan });
    setLoading(false);
  };

  useEffect(() => {
    fetchLaporan();
  }, []);

  const handleCatatPengeluaran = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const amount = Number(expenseData.amount);
      const desc = expenseData.desc;

      // Ambil atau buat akun Beban Operasional (5.1.02)
      let { data: bebanAcc } = await supabase.from('accounts').select('id').eq('code', '5.1.02').single();
      if (!bebanAcc) {
        const { data: newAcc } = await supabase.from('accounts').insert({ code: '5.1.02', name: 'Beban Operasional', type: 'Expense' }).select('id').single();
        bebanAcc = newAcc;
      }

      // Ambil akun Kas (1.1.01)
      const { data: kasAcc } = await supabase.from('accounts').select('id').eq('code', '1.1.01').single();

      // Transaksi Beban (Bukan Penjualan)
      const { data: trx } = await supabase.from('transactions').insert({
        invoice_number: `EXP-${Date.now()}`,
        type: 'Biaya',
        total_amount: amount,
        notes: desc
      }).select('id').single();

      // Buat Jurnal
      if (trx && bebanAcc && kasAcc) {
        await supabase.from('journals').insert([
          { transaction_id: trx.id, account_id: bebanAcc.id, debit: amount, credit: 0, description: desc }, // Beban Bertambah
          { transaction_id: trx.id, account_id: kasAcc.id, debit: 0, credit: amount, description: desc }    // Kas Berkurang
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

  // EXPORT EXCEL Laba Rugi
  const exportLabaRugiExcel = () => {
    const data = [
      ['LAPORAN LABA RUGI BUMDES NOTO MULYO'],
      [''],
      ['Pendapatan Penjualan', labaRugi.pendapatan],
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
      
      <div className="flex flex-wrap gap-4 justify-between items-center bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'laba-rugi', name: 'Laba Rugi', icon: <TrendingUp size={18} /> },
            { id: 'neraca', name: 'Neraca', icon: <DollarSign size={18} /> },
            { id: 'jurnal', name: 'Buku Jurnal', icon: <FileText size={18} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => setShowExpenseModal(true)}
          className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl font-medium transition-colors"
        >
          <Plus size={18} /> Catat Pengeluaran (Beban)
        </button>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
        {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">Memuat Laporan...</div>}
        
        {/* Laba Rugi */}
        {activeTab === 'laba-rugi' && (
          <div className="p-8 max-w-3xl mx-auto w-full">
            <div className="flex justify-between items-end border-b border-slate-200 pb-6 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Laporan Laba Rugi</h2>
                <p className="text-slate-500">BUMDes Noto Mulyo Pulodarat</p>
              </div>
              <button onClick={exportLabaRugiExcel} className="flex items-center gap-2 text-sm bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-2 rounded-lg font-medium">
                <Download size={16} /> Excel
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Pendapatan</h3>
                <div className="flex justify-between text-slate-600 mb-2">
                  <span>Pendapatan Penjualan Toko</span>
                  <span>Rp {labaRugi.pendapatan.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Harga Pokok Penjualan (HPP)</h3>
                <div className="flex justify-between text-slate-600 mb-2">
                  <span>HPP Penjualan Toko</span>
                  <span className="text-rose-600">(Rp {labaRugi.hpp.toLocaleString('id-ID')})</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-lg text-slate-700 bg-slate-50 p-3 rounded-lg">
                <span>Laba Kotor</span>
                <span>Rp {labaRugi.labaKotor.toLocaleString('id-ID')}</span>
              </div>

              <div className="pt-4">
                <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Beban Operasional</h3>
                <div className="flex justify-between text-slate-600 mb-2">
                  <span>Biaya Operasional (Listrik, Air, Gaji, dll)</span>
                  <span className="text-rose-600">(Rp {labaRugi.bebanOperasional.toLocaleString('id-ID')})</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-xl text-primary-700 border-t-2 border-slate-800 pt-4 mt-6">
                <span>Laba Bersih</span>
                <span>Rp {labaRugi.labaBersih.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Neraca */}
        {activeTab === 'neraca' && (
          <div className="p-8 max-w-3xl mx-auto w-full">
            <div className="flex justify-between items-end border-b border-slate-200 pb-6 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Laporan Neraca</h2>
                <p className="text-slate-500">BUMDes Noto Mulyo Pulodarat</p>
              </div>
              <button onClick={exportNeracaPdf} className="flex items-center gap-2 text-sm bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-2 rounded-lg font-medium">
                <Download size={16} /> PDF
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <div>
                <h3 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-800 pb-2">AKTIVA (ASET)</h3>
                <div className="space-y-2 text-slate-600">
                  <div className="flex justify-between">
                    <span>Kas (Uang Tunai)</span>
                    <span>Rp {neraca.kas.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Persediaan Barang Dagang</span>
                    <span>Rp {neraca.persediaan.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-slate-800 mt-6 pt-2 border-t border-slate-200">
                  <span>Total Aktiva</span>
                  <span>Rp {neraca.totalAset.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-800 pb-2">PASIVA (MODAL)</h3>
                <div className="space-y-2 text-slate-600">
                  <div className="flex justify-between">
                    <span>Modal & Laba Ditahan</span>
                    <span>Rp {neraca.modal.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-slate-800 mt-6 pt-2 border-t border-slate-200">
                  <span>Total Pasiva</span>
                  <span>Rp {neraca.modal.toLocaleString('id-ID')}</span>
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
                      <th className="p-4 w-32">Akun</th>
                      <th className="p-4 text-right">Debit</th>
                      <th className="p-4 text-right pr-6">Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jurnalList.map((j) => (
                      <tr key={j.id} className="hover:bg-primary-50/50 transition-colors">
                        <td className="p-4 pl-6 text-sm text-slate-500">
                          {new Date(j.created_at).toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 text-sm font-medium text-slate-800">{j.description}</td>
                        <td className="p-4">
                          <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase tracking-wider">
                            {j.accounts?.name}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-right text-emerald-600 font-bold">
                          {j.debit > 0 ? `Rp ${j.debit.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="p-4 pr-6 text-sm text-right text-rose-600 font-bold">
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

      {/* Modal Pengeluaran */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-rose-50">
              <h3 className="text-lg font-bold text-rose-800">Catat Pengeluaran</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-rose-400 hover:text-rose-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCatatPengeluaran} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
                <input required type="number" min="1" value={expenseData.amount} onChange={e => setExpenseData({...expenseData, amount: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500" placeholder="Contoh: 150000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan / Tujuan Biaya</label>
                <textarea required rows={3} value={expenseData.desc} onChange={e => setExpenseData({...expenseData, desc: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500" placeholder="Contoh: Beli token listrik bulan ini..." />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Batal</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 disabled:opacity-50">Simpan Jurnal</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
