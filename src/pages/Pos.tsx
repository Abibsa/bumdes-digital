import { useEffect, useState } from 'react';
import { Search, Plus, Minus, Trash2, Printer, ShoppingBag, Package } from 'lucide-react';
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
  const [lastInvoice, setLastInvoice] = useState('');
  const [storeInfo, setStoreInfo] = useState({ name: 'BUMDes Noto Mulyo', address: 'Pulodarat, Jepara' });

  // Mobile cart toggle
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const fetchItems = async () => {
    const { data } = await supabase.from('items').select('*').order('name');
    if (data) setItems(data);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*').single();
    if (data) {
      setStoreInfo({ name: data.store_name, address: data.store_address });
    }
  };

  useEffect(() => {
    fetchItems();
    fetchSettings();
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

  const getOrCreateAccount = async (code: string, name: string, type: string) => {
    const { data } = await supabase.from('accounts').select('id').eq('code', code).single();
    if (data) return data.id;
    const { data: newAcc } = await supabase.from('accounts').insert({ code, name, type }).select('id').single();
    return newAcc?.id;
  };

  const handleCheckout = async (andPrint: boolean = false) => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const invoiceNumber = `INV-${Date.now()}`;
      setLastInvoice(invoiceNumber);

      const { data: trx, error: trxErr } = await supabase.from('transactions').insert({
        invoice_number: invoiceNumber,
        type: 'Penjualan',
        total_amount: total,
        notes: 'Penjualan Kasir'
      }).select('id').single();

      if (trxErr || !trx) throw new Error('Gagal membuat transaksi');

      let totalHpp = 0;
      for (const item of cart) {
        await supabase.from('transaction_details').insert({
          transaction_id: trx.id,
          item_id: item.id,
          qty: item.qty,
          unit_price: item.price,
          subtotal: item.price * item.qty
        });
        await supabase.from('items').update({ stock: item.stock - item.qty }).eq('id', item.id);
        totalHpp += (item.cost_price || 0) * item.qty;
      }

      const kasId = await getOrCreateAccount('1.1.01', 'Kas', 'Asset');
      const penjId = await getOrCreateAccount('4.1.01', 'Pendapatan Penjualan', 'Revenue');
      const hppId = await getOrCreateAccount('5.1.01', 'Harga Pokok Penjualan', 'Expense');
      const persId = await getOrCreateAccount('1.1.03', 'Persediaan Barang', 'Asset');

      await supabase.from('journals').insert([
        { transaction_id: trx.id, account_id: kasId, debit: total, credit: 0, description: `Penjualan ${invoiceNumber}` },
        { transaction_id: trx.id, account_id: penjId, debit: 0, credit: total, description: `Penjualan ${invoiceNumber}` }
      ]);

      if (totalHpp > 0) {
        await supabase.from('journals').insert([
          { transaction_id: trx.id, account_id: hppId, debit: totalHpp, credit: 0, description: `HPP Penjualan ${invoiceNumber}` },
          { transaction_id: trx.id, account_id: persId, debit: 0, credit: totalHpp, description: `HPP Penjualan ${invoiceNumber}` }
        ]);
      }

      if (andPrint) {
        setTimeout(() => window.print(), 500);
      } else {
        alert(`Transaksi Berhasil! Nota: ${invoiceNumber}`);
      }

      setCart([]);
      setIsMobileCartOpen(false);
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
    <>
      <div className="flex flex-col xl:flex-row gap-6 h-full min-h-[calc(100vh-130px)] print:hidden relative pb-20 xl:pb-0">
        {/* AREA BARANG (KIRI) */}
        <div className="flex-1 bg-white/70 backdrop-blur-md rounded-3xl border border-white/50 shadow-sm p-4 md:p-6 flex flex-col h-[60vh] xl:h-auto">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400" size={20} />
            <input
              type="text"
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari barang (nama atau barcode)..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-50 trans-all font-medium text-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-4 overflow-y-auto pr-2 pb-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-white border-2 border-slate-100 rounded-2xl p-4 cursor-pointer hover:border-primary-400 hover:shadow-lg trans-all flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary-50 rounded-bl-full -mr-8 -mt-8 trans-all group-hover:scale-150 group-hover:bg-primary-100"></div>
                <div className="relative z-10">
                  <h4 className="font-bold text-slate-800 text-sm md:text-base mb-1 line-clamp-2">{item.name}</h4>
                  <p className="text-xs font-semibold text-slate-400 mb-3">Sisa Stok: <span className={item.stock < 5 ? 'text-rose-500' : 'text-emerald-500'}>{item.stock}</span></p>
                </div>
                <p className="text-primary-700 font-extrabold text-sm md:text-base relative z-10">Rp {item.price.toLocaleString('id-ID')}</p>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-400">
                <Package size={48} className="mb-3 opacity-20" />
                <p className="font-medium">Barang tidak ditemukan.</p>
              </div>
            )}
          </div>
        </div>

        {/* AREA KERANJANG (KANAN / BAWAH DI MOBILE) */}
        {/* Floating Toggle Button for Mobile */}
        <button
          onClick={() => setIsMobileCartOpen(!isMobileCartOpen)}
          className={`xl:hidden fixed bottom-6 right-6 z-40 bg-primary-900 text-white p-4 rounded-full shadow-2xl flex items-center gap-3 trans-all ${cart.length > 0 ? 'animate-bounce' : ''}`}
        >
          <div className="relative">
            <ShoppingBag size={24} />
            {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-primary-900">{cart.length}</span>}
          </div>
          <span className="font-bold hidden sm:block">Lihat Keranjang</span>
        </button>

        {/* Cart Panel */}
        <div className={`
          fixed xl:static inset-x-0 bottom-0 z-30 w-full xl:w-[420px] flex-shrink-0 bg-white xl:rounded-3xl border-t xl:border border-slate-200 shadow-2xl xl:shadow-sm flex flex-col h-[75vh] xl:h-auto trans-all
          ${isMobileCartOpen ? 'translate-y-0' : 'translate-y-full xl:translate-y-0'}
        `}>
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 xl:rounded-t-3xl">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShoppingBag size={20} className="text-primary-600" /> Keranjang Belanja
            </h2>
            <button onClick={() => setIsMobileCartOpen(false)} className="xl:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-slate-200 text-slate-600">
              <Minus size={18} />
            </button>
          </div>

          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3">
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <ShoppingBag size={48} className="opacity-20" />
                <p className="font-medium">Belum ada barang dipilih.</p>
              </div>
            )}
            {cart.map(item => (
              <div key={item.id} className="flex gap-3 items-center p-3 rounded-2xl border border-slate-100 bg-white shadow-sm hover:border-primary-200 trans-all">
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                  <p className="text-primary-600 font-extrabold text-sm">Rp {(item.price * item.qty).toLocaleString('id-ID')}</p>
                </div>
                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm trans-all"><Minus size={14} /></button>
                  <span className="w-6 text-center font-bold text-sm text-slate-800">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm trans-all"><Plus size={14} /></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white trans-all ml-1"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-slate-500 font-bold text-sm uppercase tracking-wider">Total Tagihan</span>
              <span className="text-2xl font-black text-primary-900">Rp {total.toLocaleString('id-ID')}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button disabled={cart.length === 0 || loading} onClick={() => handleCheckout(true)} className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-slate-800 text-white hover:bg-slate-900 trans-all disabled:opacity-50 active:scale-95 shadow-lg shadow-slate-800/20">
                <Printer size={20} />
                <span className="text-xs font-bold uppercase tracking-wider">Cetak Struk</span>
              </button>
              <button disabled={cart.length === 0 || loading} onClick={() => handleCheckout(false)} className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 trans-all disabled:opacity-50 active:scale-95 shadow-lg shadow-emerald-600/30">
                <ShoppingBag size={20} />
                <span className="text-xs font-bold uppercase tracking-wider">{loading ? 'Memproses...' : 'Simpan Data'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AREA STRUK PRINT (Sama seperti sebelumnya) */}
      <div className="hidden print:block w-[58mm] text-[11px] leading-snug font-mono text-black mx-auto p-1 pb-4">
        <div className="text-center mb-4">
          <h2 className="font-bold text-[14px]">{storeInfo.name}</h2>
          <p>{storeInfo.address}</p>
          <div className="border-b border-dashed border-black my-2"></div>
        </div>

        <div className="mb-2">
          <p>No: {lastInvoice}</p>
          <p>Tgl: {new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID')}</p>
          <div className="border-b border-dashed border-black my-2"></div>
        </div>

        <div className="mb-2">
          {cart.map((item, i) => (
            <div key={i} className="mb-2">
              <p>{item.name}</p>
              <div className="flex justify-between">
                <span>{item.qty} x {item.price.toLocaleString('id-ID')}</span>
                <span>{(item.qty * item.price).toLocaleString('id-ID')}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-b border-dashed border-black my-2"></div>

        <div className="flex justify-between font-bold text-[13px] mb-4">
          <span>TOTAL:</span>
          <span>Rp {total.toLocaleString('id-ID')}</span>
        </div>

        <div className="text-center mt-6">
          <p>Terima Kasih</p>
          <p>Barang yang dibeli tidak dapat ditukar.</p>
        </div>
      </div>
    </>
  );
}
