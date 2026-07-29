import { Settings } from 'lucide-react';

export default function Pengaturan() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col h-[calc(100vh-130px)] items-center justify-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
        <Settings size={32} />
      </div>
      <h2 className="text-xl font-bold text-slate-800">Pengaturan Aplikasi</h2>
      <p className="text-slate-500 mt-2 text-center max-w-sm">Halaman pengaturan profil BUMDes dan hak akses akan segera hadir pada update berikutnya.</p>
    </div>
  );
}
