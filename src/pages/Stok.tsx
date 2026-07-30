import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit, RefreshCw, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Item {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost_price: number;
  stock: number;
}

export default function Stok() {
  const [inventory, setInventory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [search, setSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    sku: '', name: '', category: 'ATK', price: '', cost_price: '', stock: ''
  });

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setInventory(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      sku: formData.sku,
      name: formData.name,
      category: formData.category,
      price: Number(formData.price),
      cost_price: Number(formData.cost_price),
      stock: Number(formData.stock)
    };

    if (editingItem) {
      await supabase.from('items').update(payload).eq('id', editingItem.id);
    } else {
      await supabase.from('items').insert(payload);
    }

    setShowModal(false);
    setEditingItem(null);
    setFormData({ sku: '', name: '', category: 'ATK', price: '', cost_price: '', stock: '' });
    fetchItems();
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      sku: item.sku, name: item.name, category: item.category, 
      price: item.price.toString(), cost_price: item.cost_price.toString(), stock: item.stock.toString()
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus barang ini?')) {
      await supabase.from('items').delete().eq('id', id);
      fetchItems();
    }
  };

  const filteredItems = inventory.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card rounded-2xl shadow-sm flex flex-col h-[calc(100vh-130px)]">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Manajemen Stok Barang</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola data barang dagangan dan jasa BUMDes.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchItems} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-medium transition-colors">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => { setEditingItem(null); setFormData({ sku: '', name: '', category: 'ATK', price: '', cost_price: '', stock: '' }); setShowModal(true); }} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-primary-600/30">
            <Plus size={18} />
            Tambah Barang
          </button>
        </div>
      </div>

      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama atau kode barang..." 
            className="w-full pl-10 pr-4 py-2.5 input-field border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm font-semibold"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50/30 dark:bg-slate-900/30">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">Memuat data dari database...</div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">Tidak ada data barang ditemukan.</div>
        ) : (
          <div className="card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                    <th className="p-4 pl-6">Kode (SKU)</th>
                    <th className="p-4">Nama Barang</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4">Harga Beli (HPP)</th>
                    <th className="p-4">Harga Jual</th>
                    <th className="p-4">Sisa Stok</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-primary-50/50 dark:hover:bg-primary-950/30 transition-colors">
                      <td className="p-4 pl-6 text-sm font-mono text-slate-500 dark:text-slate-400">{item.sku}</td>
                      <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-100">{item.name}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 tracking-wide uppercase">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-500 dark:text-slate-400">Rp {item.cost_price?.toLocaleString('id-ID')}</td>
                      <td className="p-4 text-sm font-extrabold text-primary-600 dark:text-primary-400">Rp {item.price.toLocaleString('id-ID')}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                          item.stock < 10 ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {item.stock} unit
                        </span>
                      </td>
                      <td className="p-4 text-center space-x-2">
                        <button onClick={() => handleEdit(item)} className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-colors"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(item.id)} className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{editingItem ? 'Edit Barang' : 'Tambah Barang Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kode (SKU)</label>
                <input required type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full px-3 py-2 input-field border rounded-lg focus:ring-2 focus:ring-primary-500 font-medium" placeholder="Contoh: ATK-001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Barang</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 input-field border rounded-lg focus:ring-2 focus:ring-primary-500 font-medium" placeholder="Contoh: Buku Tulis" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 input-field border rounded-lg focus:ring-2 focus:ring-primary-500 font-medium">
                    <option value="ATK">ATK</option>
                    <option value="Kebutuhan Pokok">Kebutuhan Pokok</option>
                    <option value="Jasa">Jasa</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stok Awal</label>
                  <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-3 py-2 input-field border rounded-lg focus:ring-2 focus:ring-primary-500 font-medium" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Harga Beli (HPP)</label>
                  <input required type="number" min="0" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} className="w-full px-3 py-2 input-field border rounded-lg focus:ring-2 focus:ring-primary-500 font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Harga Jual</label>
                  <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-3 py-2 input-field border rounded-lg focus:ring-2 focus:ring-primary-500 font-medium text-primary-600 dark:text-primary-400" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold trans-all">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-600/30 trans-all active:scale-95">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
