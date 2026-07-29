import { DollarSign, Package, TrendingUp, Users } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { title: 'Total Saldo Kas', value: 'Rp 12.500.000', icon: <DollarSign className="text-emerald-500" size={24} />, trend: '+5.2%' },
    { title: 'Pendapatan Bulan Ini', value: 'Rp 4.250.000', icon: <TrendingUp className="text-blue-500" size={24} />, trend: '+12.5%' },
    { title: 'Total Barang/Stok', value: '142 Item', icon: <Package className="text-amber-500" size={24} />, trend: 'Stok Aman' },
    { title: 'Jumlah Transaksi', value: '45', icon: <Users className="text-purple-500" size={24} />, trend: 'Bulan ini' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
              <p className="text-xs text-slate-400 mt-2 font-medium">{stat.trend}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Chart Area Placeholder */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Grafik Pendapatan</h3>
          <div className="w-full h-64 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400">
            [ Area Grafik akan ditampilkan di sini ]
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Transaksi Terakhir</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Penjualan Toko</p>
                    <p className="text-xs text-slate-500">Hari ini, 10:{i}5 WIB</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-600">+Rp 150.000</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
