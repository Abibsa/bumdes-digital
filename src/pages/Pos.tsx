import { useState } from 'react';
import { Search, Plus, Minus, Trash2, Printer } from 'lucide-react';

export default function Pos() {
  const [cart, setCart] = useState([
    { id: 1, name: 'Buku Tulis Sidu 38 Lembar', price: 3500, qty: 2 },
    { id: 2, name: 'Pulpen Faster Hitam', price: 2000, qty: 1 }
  ]);

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-130px)]">
      {/* Product Selection */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari barang (nama atau barcode)..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto">
          {/* Mock Products */}
          {[1,2,3,4,5,6,7,8,9,10].map(i => (
            <div key={i} className="border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-primary-500 hover:shadow-md transition-all">
              <div className="aspect-square bg-slate-100 rounded-lg mb-3"></div>
              <h4 className="font-medium text-slate-800 text-sm mb-1 line-clamp-2">Barang Contoh {i}</h4>
              <p className="text-primary-600 font-bold">Rp {(i * 1500).toLocaleString('id-ID')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="w-full xl:w-[400px] flex-shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Keranjang Belanja</h2>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {cart.map((item, idx) => (
            <div key={idx} className="flex gap-3 items-center">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-slate-800">{item.name}</h4>
                <p className="text-primary-600 font-bold text-sm">Rp {item.price.toLocaleString('id-ID')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200">
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center font-medium text-sm">{item.qty}</span>
                <button className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200">
                  <Plus size={14} />
                </button>
              </div>
              <button className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-100 ml-2">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-600 font-medium">Total Harga</span>
            <span className="text-2xl font-bold text-slate-800">Rp {total.toLocaleString('id-ID')}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-900 transition-colors">
              <Printer size={18} />
              Simpan & Cetak
            </button>
            <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors">
              Bayar Saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
