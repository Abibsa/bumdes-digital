import { useEffect, useState } from 'react';
import { Plus, MoreVertical, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Item {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

export default function Stok() {
  const [inventory, setInventory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching items:', error);
    } else {
      setInventory(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const addDummyItem = async () => {
    const randomId = Math.floor(Math.random() * 1000);
    const { error } = await supabase.from('items').insert({
      sku: `ATK-${randomId}`,
      name: `Barang Tes ${randomId}`,
      category: 'ATK',
      price: 5000,
      cost_price: 3500,
      stock: 10
    });
    if (!error) fetchItems();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-130px)]">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manajemen Stok Barang</h2>
          <p className="text-sm text-slate-500 mt-1">Data ini sekarang terhubung langsung ke database Supabase!</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchItems} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium transition-colors">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={addDummyItem} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors">
            <Plus size={18} />
            Tambah Dummy
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <p>Memuat data dari database...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <p>Belum ada data barang.</p>
            <p className="text-sm">Klik "Tambah Dummy" untuk mencoba.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="font-medium p-4 pl-6">Kode (SKU)</th>
                <th className="font-medium p-4">Nama Barang</th>
                <th className="font-medium p-4">Kategori</th>
                <th className="font-medium p-4">Harga Jual</th>
                <th className="font-medium p-4">Sisa Stok</th>
                <th className="font-medium p-4 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 text-sm font-mono text-slate-500">{item.sku}</td>
                  <td className="p-4 text-sm font-medium text-slate-800">{item.name}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-primary-600">
                    Rp {item.price.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.stock < 10 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {item.stock} unit
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <MoreVertical size={18} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
