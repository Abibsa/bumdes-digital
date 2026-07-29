import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Package, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    kas: 0,
    pendapatan: 0,
    stokCount: 0,
    transaksiCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);

      // 1. Ambil Saldo Kas & Pendapatan dari Jurnal
      const { data: journals } = await supabase.from('journals').select('debit, credit, accounts(code, type)');
      let kas = 0;
      let pendapatan = 0;
      
      journals?.forEach((j: any) => {
        if (j.accounts?.code === '1.1.01') kas += (j.debit - j.credit); // Kas
        if (j.accounts?.type === 'Revenue') pendapatan += (j.credit - j.debit); // Pendapatan
      });

      // 2. Ambil Jumlah Total Macam Barang
      const { count: stokCount } = await supabase.from('items').select('*', { count: 'exact', head: true });

      // 3. Ambil Jumlah Transaksi Penjualan
      const { count: transaksiCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });

      setStats({
        kas,
        pendapatan,
        stokCount: stokCount || 0,
        transaksiCount: transaksiCount || 0
      });
      setLoading(false);
    };

    fetchDashboard();
  }, []);

  const statCards = [
    { title: 'Total Saldo Kas', value: `Rp ${stats.kas.toLocaleString('id-ID')}`, icon: <DollarSign size={24} className="text-emerald-500" />, bg: 'bg-emerald-50' },
    { title: 'Total Pendapatan', value: `Rp ${stats.pendapatan.toLocaleString('id-ID')}`, icon: <TrendingUp size={24} className="text-blue-500" />, bg: 'bg-blue-50' },
    { title: 'Macam Barang/Stok', value: `${stats.stokCount} Item`, icon: <Package size={24} className="text-amber-500" />, bg: 'bg-amber-50' },
    { title: 'Jumlah Transaksi', value: stats.transaksiCount.toString(), icon: <Users size={24} className="text-purple-500" />, bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6 pb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-500 text-sm font-medium">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">
                  {loading ? '...' : stat.value}
                </h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                {stat.icon}
              </div>
            </div>
            {/* Indikator statis untuk visualisasi, bisa dibuat dinamis nanti */}
            <div className="flex items-center text-xs font-medium text-slate-500">
              Update Real-time (Database)
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-[400px] flex flex-col items-center justify-center">
          <p className="text-slate-400">Papan Pengumuman BUMDes</p>
          <p className="text-sm text-slate-500 mt-2">Semua fitur sekarang terhubung ke Supabase.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-6">Status Sistem</h3>
          <div className="space-y-4">
            {['Modul Stok', 'Modul Kasir (POS)', 'Modul Akuntansi'].map((modul, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">✓</div>
                  <div>
                    <h4 className="font-medium text-slate-800 text-sm">{modul}</h4>
                    <p className="text-xs text-slate-500">Berjalan normal</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
