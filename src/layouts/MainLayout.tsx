import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, FileText, Settings, Store, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

export default function MainLayout() {
  const navigate = useNavigate();
  const [storeInfo, setStoreInfo] = useState({ name: 'BUMDes Digital', address: 'Pulodarat, Jepara' });

  useEffect(() => {
    supabase.from('settings').select('*').single().then(({ data }) => {
      if (data) setStoreInfo({ name: data.store_name, address: data.store_address });
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/kasir', icon: <ShoppingCart size={20} />, label: 'Kasir (POS)' },
    { path: '/stok', icon: <Package size={20} />, label: 'Stok Barang' },
    { path: '/akuntansi', icon: <FileText size={20} />, label: 'Akuntansi' },
    { path: '/pengaturan', icon: <Settings size={20} />, label: 'Pengaturan' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* Sidebar - Sembunyikan saat mode print */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm print:hidden">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 min-w-[40px] bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold shadow-primary">
            <Store size={20} />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-lg leading-tight text-primary-900 truncate" title={storeInfo.name}>{storeInfo.name}</h1>
            <p className="text-xs text-slate-500 font-medium truncate" title={storeInfo.address}>{storeInfo.address}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary-50 text-primary-700 font-semibold shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl transition-all duration-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-medium">
            <LogOut size={20} />
            <span className="text-sm">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header - Sembunyikan saat mode print */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shadow-sm z-10 print:hidden justify-between">
          <h2 className="font-semibold text-lg text-slate-800">Dashboard</h2>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">A</div>
            <span className="text-sm font-medium text-slate-700">Admin</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative z-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
