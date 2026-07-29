import { useEffect, useState } from 'react';
import { FileText, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Akuntansi() {
  const [activeTab, setActiveTab] = useState<'laba-rugi' | 'neraca' | 'jurnal'>('laba-rugi');
  
  const [labaRugi, setLabaRugi] = useState({ pendapatan: 0, hpp: 0, labaKotor: 0 });
  const [neraca, setNeraca] = useState({ kas: 0, persediaan: 0, totalAset: 0 });
  const [jurnalList, setJurnalList] = useState<any[]>([]);

  const fetchLaporan = async () => {
    // Fetch all accounts
    const { data: accounts } = await supabase.from('accounts').select('*');
    if (!accounts) return;

    // Fetch all journals
    const { data: journals } = await supabase
      .from('journals')
      .select(`
        id, created_at, description, debit, credit,
        accounts(id, code, name, type)
      `)
      .order('created_at', { ascending: false });
    
    if (journals) setJurnalList(journals);

    // Hitung Laba Rugi (Pendapatan - HPP)
    let pendapatan = 0;
    let hpp = 0;
    
    // Hitung Neraca (Kas & Persediaan)
    let kas = 0;
    let persediaan = 0;

    // Kalkulasi saldo berdasarkan jurnal (Debit vs Kredit)
    journals?.forEach((j: any) => {
      const accType = j.accounts?.type;
      const accCode = j.accounts?.code;
      
      // Revenue (Kredit +, Debit -)
      if (accType === 'Revenue') pendapatan += (j.credit - j.debit);
      // Expense (Debit +, Kredit -)
      if (accType === 'Expense' && accCode === '5.1.01') hpp += (j.debit - j.credit);
      
      // Asset Kas (Debit +, Kredit -)
      if (accCode === '1.1.01') kas += (j.debit - j.credit);
      // Asset Persediaan (Debit +, Kredit -)
      if (accCode === '1.1.03') persediaan += (j.debit - j.credit);
    });

    // Ambil Modal Awal dari Tabel Items (Total nilai persediaan saat ini sebagai estimasi modal tambahan jika diperlukan, tapi jurnal sudah mencatat pergerakan persediaan)
    // Untuk BUMDes sederhana, kita hanya pakai dari jurnal.
    
    setLabaRugi({ pendapatan, hpp, labaKotor: pendapatan - hpp });
    setNeraca({ kas, persediaan, totalAset: kas + persediaan });
  };

  useEffect(() => {
    fetchLaporan();
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] space-y-6">
      
      {/* Tab Navigasi */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex gap-2">
        {[
          { id: 'laba-rugi', name: 'Laba Rugi', icon: <TrendingUp size={18} /> },
          { id: 'neraca', name: 'Neraca', icon: <DollarSign size={18} /> },
          { id: 'jurnal', name: 'Buku Jurnal', icon: <FileText size={18} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {tab.icon} {tab.name}
          </button>
        ))}
      </div>

      {/* Konten Laporan */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* Laba Rugi */}
        {activeTab === 'laba-rugi' && (
          <div className="p-8 max-w-3xl mx-auto w-full">
            <div className="text-center mb-8 border-b border-slate-200 pb-6">
              <h2 className="text-2xl font-bold text-slate-800">Laporan Laba Rugi</h2>
              <p className="text-slate-500">BUMDes Noto Mulyo Pulodarat</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Pendapatan</h3>
                <div className="flex justify-between text-slate-600 mb-2">
                  <span>Pendapatan Penjualan Toko</span>
                  <span>Rp {labaRugi.pendapatan.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 mt-2">
                  <span>Total Pendapatan</span>
                  <span>Rp {labaRugi.pendapatan.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Harga Pokok Penjualan (HPP)</h3>
                <div className="flex justify-between text-slate-600 mb-2">
                  <span>HPP Penjualan Toko</span>
                  <span>(Rp {labaRugi.hpp.toLocaleString('id-ID')})</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-xl text-primary-700 border-t-2 border-slate-800 pt-4 mt-6">
                <span>Laba Kotor</span>
                <span>Rp {labaRugi.labaKotor.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Neraca */}
        {activeTab === 'neraca' && (
          <div className="p-8 max-w-3xl mx-auto w-full">
            <div className="text-center mb-8 border-b border-slate-200 pb-6">
              <h2 className="text-2xl font-bold text-slate-800">Laporan Neraca</h2>
              <p className="text-slate-500">BUMDes Noto Mulyo Pulodarat</p>
            </div>
            
            <div className="grid grid-cols-2 gap-12">
              {/* Aktiva (Aset) */}
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

              {/* Pasiva (Kewajiban & Ekuitas) */}
              <div>
                <h3 className="font-bold text-lg text-slate-800 mb-4 border-b border-slate-800 pb-2">PASIVA (MODAL)</h3>
                <div className="space-y-2 text-slate-600">
                  <div className="flex justify-between">
                    <span>Modal & Laba Ditahan (Auto)</span>
                    <span>Rp {neraca.totalAset.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-slate-800 mt-6 pt-2 border-t border-slate-200">
                  <span>Total Pasiva</span>
                  <span>Rp {neraca.totalAset.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buku Jurnal */}
        {activeTab === 'jurnal' && (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 sticky top-0">
                  <th className="font-medium p-4 pl-6 w-40">Waktu</th>
                  <th className="font-medium p-4">Deskripsi / Uraian</th>
                  <th className="font-medium p-4 w-32">Akun</th>
                  <th className="font-medium p-4 text-right">Debit</th>
                  <th className="font-medium p-4 text-right pr-6">Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jurnalList.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 text-sm text-slate-500">
                      {new Date(j.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-sm text-slate-700">{j.description}</td>
                    <td className="p-4 text-sm font-medium text-slate-600">{j.accounts?.name}</td>
                    <td className="p-4 text-sm text-right text-emerald-600 font-medium">
                      {j.debit > 0 ? `Rp ${j.debit.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="p-4 pr-6 text-sm text-right text-rose-600 font-medium">
                      {j.credit > 0 ? `Rp ${j.credit.toLocaleString('id-ID')}` : '-'}
                    </td>
                  </tr>
                ))}
                {jurnalList.length === 0 && (
                  <tr><td colSpan={5} className="text-center p-8 text-slate-400">Belum ada catatan jurnal transaksi.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
