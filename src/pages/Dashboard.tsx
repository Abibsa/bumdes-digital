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

      const { data: journals } = await supabase.from('journals').select('debit, credit, accounts(code, type)');
      let kas = 0;
      let pendapatan = 0;
      
      journals?.forEach((j: any) => {
        if (j.accounts?.code === '1.1.01') kas += (j.debit - j.credit);
        if (j.accounts?.type === 'Revenue') pendapatan += (j.credit - j.debit);
      });

      const { count: stokCount } = await supabase.from('items').select('*', { count: 'exact', head: true });
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
    { title: 'Total Saldo Kas', value: `Rp ${stats.kas.toLocaleString('id-ID')}`, icon: <DollarSign size={28} className="text-emerald-500" />, bg: 'bg-emerald-100 dark:bg-emerald-900/30', textCol: 'text-emerald-900 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
    { title: 'Total Pendapatan', value: `Rp ${stats.pendapatan.toLocaleString('id-ID')}`, icon: <TrendingUp size={28} className="text-primary-500" />, bg: 'bg-primary-100 dark:bg-primary-900/30', textCol: 'text-primary-900 dark:text-primary-300', border: 'border-primary-200 dark:border-primary-800' },
    { title: 'Macam Barang/Stok', value: `${stats.stokCount} Item`, icon: <Package size={28} className="text-amber-500" />, bg: 'bg-amber-100 dark:bg-amber-900/30', textCol: 'text-amber-900 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
    { title: 'Jumlah Transaksi', value: stats.transaksiCount.toString(), icon: <Users size={28} className="text-sky-500" />, bg: 'bg-sky-100 dark:bg-sky-900/30', textCol: 'text-sky-900 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800' },
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2">Selamat Datang di BUMDes Digital! 👋</h1>
          <p className="text-primary-100 text-sm md:text-base max-w-xl leading-relaxed">
            Sistem informasi cerdas untuk mengelola stok, kasir, dan laporan keuangan BUMDes secara otomatis dan real-time.
          </p>
        </div>
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute right-20 -bottom-10 w-32 h-32 bg-emerald-400 opacity-20 rounded-full blur-xl"></div>
      </div>

      {/* Grid Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className={`card rounded-2xl p-6 border ${stat.border} shadow-sm hover:shadow-md trans-all hover:-translate-y-1 relative overflow-hidden group`}>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">{stat.title}</p>
                <h3 className={`text-2xl md:text-3xl font-extrabold ${stat.textCol}`}>
                  {loading ? '...' : stat.value}
                </h3>
              </div>
              <div className={`p-4 rounded-2xl ${stat.bg} group-hover:scale-110 trans-all`}>
                {stat.icon}
              </div>
            </div>
            <div className="mt-4 flex items-center text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 inline-block px-2 py-1 rounded-md">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></div>
              LIVE DATABASE
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass rounded-2xl p-6 h-[300px] flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/30 text-primary-500 rounded-full flex items-center justify-center mb-4">
            <TrendingUp size={32} />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xl">Grafik Pertumbuhan</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
            Area ini dapat diisi dengan grafik chart.js penjualan per bulan di masa mendatang.
          </p>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 mb-6 text-lg border-b border-slate-100 dark:border-slate-700 pb-3">Status Sistem</h3>
          <div className="space-y-4">
            {['Sistem Keamanan Login', 'Sinkronisasi Database', 'Modul Akuntansi'].map((modul, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-700 trans-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">✓</div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{modul}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Berjalan Normal</p>
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
