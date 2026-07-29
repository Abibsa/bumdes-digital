import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, FileText, Settings, Store, LogOut, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

export default function MainLayout() {
  const navigate = useNavigate();
  const [storeInfo, setStoreInfo] = useState({ name: 'BUMDes Digital', address: 'Pulodarat, Jepara' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden trans-all"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-white border-r border-slate-200 
        flex flex-col shadow-xl md:shadow-sm print:hidden trans-all
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 min-w-[40px] bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold shadow-primary">
              <Store size={20} />
            </div>
            <div className="overflow-hidden">
              <h1 className="font-bold text-lg leading-tight text-primary-900 truncate" title={storeInfo.name}>{storeInfo.name}</h1>
              <p className="text-xs text-slate-500 font-medium truncate" title={storeInfo.address}>{storeInfo.address}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-xl trans-all ${
                  isActive 
                    ? 'bg-primary-50 text-primary-700 font-bold shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                }`
              }
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3.5 w-full text-left rounded-xl trans-all text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold">
            <LogOut size={20} />
            <span className="text-sm">Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        
        {/* Header Responsive */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-4 md:px-8 shadow-sm z-10 print:hidden justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 trans-all"
            >
              <Menu size={20} />
            </button>
            <h2 className="font-bold text-lg text-slate-800 hidden sm:block">Sistem Pengelolaan BUMDes</h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700 hidden sm:block">Admin Pusat</span>
            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
              A
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 relative z-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
