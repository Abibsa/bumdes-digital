import { useEffect, useState } from 'react';
import { Store, MapPin, Phone, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Pengaturan() {
  const [settings, setSettings] = useState({
    id: '',
    store_name: '',
    store_address: '',
    store_contact: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data } = await supabase.from('settings').select('*').single();
      if (data) {
        setSettings(data);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    if (settings.id) {
      await supabase.from('settings').update({
        store_name: settings.store_name,
        store_address: settings.store_address,
        store_contact: settings.store_contact
      }).eq('id', settings.id);
    } else {
      const { data } = await supabase.from('settings').insert({
        store_name: settings.store_name,
        store_address: settings.store_address,
        store_contact: settings.store_contact
      }).select().single();
      if (data) setSettings(data);
    }
    
    setSaving(false);
    alert('Pengaturan berhasil disimpan!');
    // Trigger reload to update MainLayout
    window.location.reload();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-130px)]">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Pengaturan Profil Usaha</h2>
        <p className="text-sm text-slate-500 mt-1">Informasi ini akan ditampilkan pada kop Struk Kasir dan laporan Akuntansi.</p>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {loading ? (
          <div className="text-slate-500">Memuat pengaturan...</div>
        ) : (
          <form onSubmit={handleSave} className="max-w-2xl space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nama Toko / Usaha BUMDes</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Store size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={settings.store_name}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Alamat Lengkap</label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-3 flex pointer-events-none text-slate-400">
                  <MapPin size={18} />
                </div>
                <textarea
                  required
                  rows={3}
                  value={settings.store_address}
                  onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">No Telepon / WhatsApp</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={settings.store_contact}
                  onChange={(e) => setSettings({ ...settings, store_contact: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <button 
                type="submit" 
                disabled={saving}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
