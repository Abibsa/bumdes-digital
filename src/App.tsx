import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';

function Pos() { return <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><h1 className="text-xl font-bold">Modul Kasir (POS)</h1><p className="text-slate-500 mt-2">Sedang dalam pengembangan...</p></div> }
function Stok() { return <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><h1 className="text-xl font-bold">Manajemen Stok Barang</h1><p className="text-slate-500 mt-2">Sedang dalam pengembangan...</p></div> }
function Akuntansi() { return <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><h1 className="text-xl font-bold">Laporan Akuntansi</h1><p className="text-slate-500 mt-2">Sedang dalam pengembangan...</p></div> }
function Pengaturan() { return <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><h1 className="text-xl font-bold">Pengaturan Sistem</h1><p className="text-slate-500 mt-2">Sedang dalam pengembangan...</p></div> }

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="kasir" element={<Pos />} />
          <Route path="stok" element={<Stok />} />
          <Route path="akuntansi" element={<Akuntansi />} />
          <Route path="pengaturan" element={<Pengaturan />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
