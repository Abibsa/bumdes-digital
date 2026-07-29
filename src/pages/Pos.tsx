import { useEffect, useState } from 'react';
import { Search, Plus, Minus, Trash2, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Item {
  id: string;
  sku: string;
  name: string;
  price: number;
  cost_price: number;
  stock: number;
}

interface CartItem extends Item {
  qty: number;
}

export default function Pos() {
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    const { data } = await supabase.from('items').select('*').order('name');
    if (data) setItems(data);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const addToCart = (item: Item) => {
    if (item.stock <= 0) return alert('Stok habis!');
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      if (existing.qty >= item.stock) return alert('Melebihi sisa stok!');
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const newQty = c.qty + delta;
        if (newQty > c.stock) { alert('Melebihi sisa stok!'); return c; }
        return { ...c, qty: Math.max(1, newQty) };
      }
      return c;
    }));
  };

  const removeFromCart = (id: string) => setCart(cart.filter(c => c.id !== id));

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // Helper untuk mendapatkan atau membuat akun COA dasar
  const getOrCreateAccount = async (code: string, name: string, type: string) => {
    const { data } = await supabase.from('accounts').select('id').eq('code', code).single();
    if (data) return data.id;
    const { data: newAcc } = await supabase.from('accounts').insert({ code, name, type }).select('id').single();
    return newAcc?.id;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      // 1. Buat Transaksi Header
      const invoiceNumber = `INV-${Date.now()}`;
      const { data: trx, error: trxErr } = await supabase.from('transactions').insert({
        invoice_number: invoiceNumber,
        type: 'Penjualan',
        total_amount: total,
        notes: 'Penjualan Kasir'
      }).select('id').single();

      if (trxErr || !trx) throw new Error('Gagal membuat transaksi');

      let totalHpp = 0;
      // 2. Insert Details & Update Stock
      for (const item of cart) {
        await supabase.from('transaction_details').insert({
          transaction_id: trx.id,
          item_id: item.id,
          qty: item.qty,
          unit_price: item.price,
          subtotal: item.price * item.qty
        });
        await supabase.rpc('decrement_stock', { row_id: item.id, amount: item.qty }); // Fallback ke update biasa jika rpc tidak ada
        // Menggunakan cara aman update karena tidak ada rpc
        await supabase.from('items').update({ stock: item.stock - item.qty }).eq('id', item.id);
        totalHpp += (item.cost_price || 0) * item.qty;
      }

      // 3. Penjurnalan Akuntansi
      const kasId = await getOrCreateAccount('1.1.01', 'Kas', 'Asset');
      const penjId = await getOrCreateAccount('4.1.01', 'Pendapatan Penjualan', 'Revenue');
      const hppId = await getOrCreateAccount('5.1.01', 'Harga Pokok Penjualan', 'Expense');
      const persId = await getOrCreateAccount('1.1.03', 'Persediaan Barang', 'Asset');

      // Jurnal: Kas (Debit) vs Penjualan (Kredit)
      await supabase.from('journals').insert([
        { transaction_id: trx.id, account_id: kasId, debit: total, credit: 0, description: `Penjualan ${invoiceNumber}` },
        { transaction_id: trx.id, account_id: penjId, debit: 0, credit: total, description: `Penjualan ${invoiceNumber}` }
      ]);
      
      // Jurnal: HPP (Debit) vs Persediaan (Kredit)
      if (totalHpp > 0) {
        await supabase.from('journals').insert([
          { transaction_id: trx.id, account_id: hppId, debit: totalHpp, credit: 0, description: `HPP Penjualan ${invoiceNumber}` },
          { transaction_id: trx.id, account_id: persId, debit: 0, credit: totalHpp, description: `HPP Penjualan ${invoiceNumber}` }
        ]);
      }

      alert(`Transaksi Berhasil! Nota: ${invoiceNumber}`);
      setCart([]);
      fetchItems();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat checkout');
    }
    setLoading(false);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-130px)]">
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari barang (nama atau barcode)..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto">
          {filteredItems.map(item => (
            <div key={item.id} onClick={() => addToCart(item)} className="border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-primary-500 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <h4 className="font-medium text-slate-800 text-sm mb-1 line-clamp-2">{item.name}</h4>
                <p className="text-xs text-slate-500 mb-2">Stok: {item.stock}</p>
              </div>
              <p className="text-primary-600 font-bold">Rp {item.price.toLocaleString('id-ID')}</p>
            </div>
          ))}
          {filteredItems.length === 0 && <p className="text-slate-400 col-span-full">Barang tidak ditemukan / Kosong.</p>}
        </div>
      </div>

      <div className="w-full xl:w-[400px] flex-shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Keranjang Belanja</h2>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {cart.length === 0 && <p className="text-slate-400 text-center mt-10">Keranjang kosong.</p>}
          {cart.map(item => (
            <div key={item.id} className="flex gap-3 items-center">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-slate-800">{item.name}</h4>
                <p className="text-primary-600 font-bold text-sm">Rp {(item.price * item.qty).toLocaleString('id-ID')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"><Minus size={14} /></button>
                <span className="w-6 text-center font-medium text-sm">{item.qty}</span>
                <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"><Plus size={14} /></button>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 ml-2"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-600 font-medium">Total Harga</span>
            <span className="text-2xl font-bold text-slate-800">Rp {total.toLocaleString('id-ID')}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button disabled={cart.length === 0 || loading} onClick={() => { handleCheckout(); window.print(); }} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-900 transition-colors disabled:opacity-50">
              <Printer size={18} /> Simpan & Cetak
            </button>
            <button disabled={cart.length === 0 || loading} onClick={handleCheckout} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors disabled:opacity-50">
              {loading ? 'Memproses...' : 'Bayar Saja'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
