import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Pos from './pages/Pos';
import Stok from './pages/Stok';
import Akuntansi from './pages/Akuntansi';
import Pengaturan from './pages/Pengaturan';

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
