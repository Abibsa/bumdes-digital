import { FileText, Download, Filter } from 'lucide-react';

export default function Akuntansi() {
  const reports = [
    { title: 'Laporan Laba Rugi', desc: 'Menampilkan ringkasan pendapatan dan biaya untuk menghitung laba bersih BUMDes.', type: 'Bulanan' },
    { title: 'Neraca (Posisi Keuangan)', desc: 'Menampilkan aset, kewajiban, dan ekuitas (modal) BUMDes pada periode tertentu.', type: 'Tahunan' },
    { title: 'Jurnal Umum', desc: 'Catatan seluruh transaksi harian debit dan kredit.', type: 'Harian' },
    { title: 'Buku Besar', desc: 'Rincian mutasi untuk setiap akun (Kas, Penjualan, Biaya, dll).', type: 'Bulanan' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Laporan Akuntansi</h2>
          <p className="text-sm text-slate-500 mt-1">Pilih jenis laporan yang ingin Anda lihat atau unduh.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium transition-colors text-sm">
            <Filter size={16} />
            Filter Periode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-primary-400 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
                {report.type}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{report.title}</h3>
            <p className="text-sm text-slate-500 mb-6">{report.desc}</p>
            
            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-medium text-sm transition-colors border border-slate-200">
                Lihat di Layar
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-medium text-sm transition-colors border border-emerald-200">
                <Download size={16} />
                Excel (XLSX)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
