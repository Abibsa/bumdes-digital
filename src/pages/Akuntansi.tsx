import { useEffect, useState, useMemo } from 'react';
import { FileText, TrendingUp, DollarSign, ArrowDownCircle, ArrowUpCircle, BookOpen, Scale, Wallet, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FixedAsset {
  id: string;
  name: string;
  category: string;
  acquisition_date: string;
  acquisition_cost: number;
  notes: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface Journal {
  id: string;
  created_at: string;
  description: string;
  debit: number;
  credit: number;
  account_id: string;
  accounts?: Account;
}

type TabType = 'laba-rugi' | 'neraca' | 'jurnal' | 'buku-besar' | 'neraca-saldo' | 'lpe' | 'lak' | 'aset-tetap';

export default function Akuntansi() {
  const [activeTab, setActiveTab] = useState<TabType>('laba-rugi');
  
  const [journals, setJournals] = useState<Journal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>([]);
  
  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseData, setExpenseData] = useState({ amount: '', desc: '' });
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeData, setIncomeData] = useState({ amount: '', source: 'Tempat Parkir', desc: '' });
  
  // Filters
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<string>('');
  
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    // Fetch Accounts
    const { data: accData } = await supabase.from('accounts').select('*').order('code');
    if (accData) setAccounts(accData);

    // Fetch Journals
    let query = supabase.from('journals').select(`id, created_at, description, debit, credit, account_id, accounts(id, code, name, type)`).order('created_at', { ascending: false });
    const { data: jrnData } = await query;
    if (jrnData) setJournals(jrnData as any);

    // Fetch Assets
    const { data: assets } = await supabase.from('fixed_assets').select('*').order('name');
    if (assets) setFixedAssets(assets);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Derived Data
  const accountBalances = useMemo(() => {
    const balances: Record<string, { debit: number; credit: number; balance: number; account: Account }> = {};
    accounts.forEach(acc => {
      balances[acc.id] = { debit: 0, credit: 0, balance: 0, account: acc };
    });
    
    journals.forEach(j => {
      if (!balances[j.account_id]) return;
      balances[j.account_id].debit += Number(j.debit || 0);
      balances[j.account_id].credit += Number(j.credit || 0);
    });

    Object.values(balances).forEach(b => {
      if (b.account.type === 'Asset' || b.account.type === 'Expense') {
        b.balance = b.debit - b.credit;
      } else {
        b.balance = b.credit - b.debit;
      }
    });

    return balances;
  }, [journals, accounts]);

  // Derived Reports
  const labaRugiData = useMemo(() => {
    let pendapatan = 0;
    let hpp = 0;
    let beban = 0;
    
    Object.values(accountBalances).forEach(b => {
      if (b.account.type === 'Revenue') pendapatan += b.balance;
      else if (b.account.type === 'Expense') {
        if (b.account.code.startsWith('5')) hpp += b.balance;
        else beban += b.balance;
      }
    });
    
    return { pendapatan, hpp, beban, labaKotor: pendapatan - hpp, labaBersih: pendapatan - hpp - beban };
  }, [accountBalances]);

  const neracaData = useMemo(() => {
    let aktivaLancar = 0;
    let kewajiban = 0;
    let ekuitas = 0;

    Object.values(accountBalances).forEach(b => {
      if (b.account.type === 'Asset' && !b.account.code.startsWith('1.3') && !b.account.code.startsWith('1.4')) {
        aktivaLancar += b.balance;
      } else if (b.account.type === 'Liability') {
        kewajiban += b.balance;
      } else if (b.account.type === 'Equity') {
        ekuitas += b.balance;
      }
    });
    
    const asetTetap = fixedAssets.reduce((sum, a) => sum + a.acquisition_cost, 0);
    const totalAset = aktivaLancar + asetTetap;
    const totalPasiva = kewajiban + ekuitas + labaRugiData.labaBersih;

    return { aktivaLancar, asetTetap, totalAset, kewajiban, ekuitas, totalPasiva };
  }, [accountBalances, fixedAssets, labaRugiData]);

  const lakData = useMemo(() => {
    let operasi = 0, investasi = 0, pendanaan = 0;
    journals.forEach(j => {
      if (j.accounts?.code.startsWith('1.1.01')) {
        const netCash = Number(j.debit || 0) - Number(j.credit || 0);
        // Simple heuristic: if description has Modal/Deviden -> Pendanaan. Aset -> Investasi. Else -> Operasi.
        const desc = (j.description || '').toLowerCase();
        if (desc.includes('modal') || desc.includes('deviden') || desc.includes('investor')) {
          pendanaan += netCash;
        } else if (desc.includes('aset') || desc.includes('bangunan') || desc.includes('kendaraan')) {
          investasi += netCash;
        } else {
          operasi += netCash;
        }
      }
    });
    return { operasi, investasi, pendanaan, total: operasi + investasi + pendanaan };
  }, [journals]);

  // ... (Include handlers: getOrCreateAccount, handleCatatPengeluaran, handleCatatPemasukan)
  const getOrCreateAccount = async (code: string, name: string, type: string) => {
    let { data: acc } = await supabase.from('accounts').select('id').eq('code', code).single();
    if (!acc) {
      const { data: newAcc } = await supabase.from('accounts').insert({ code, name, type }).select('id').single();
      acc = newAcc;
    }
    return acc?.id;
  };

  const handleCatatPengeluaran = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const amount = Number(expenseData.amount);
      const desc = expenseData.desc;
      const bebanId = await getOrCreateAccount('6.1.99.99', 'Beban Administrasi dan Umum Lainnya', 'Expense');
      const kasId = await getOrCreateAccount('1.1.01.01', 'Kas Tunai', 'Asset');
      const { data: trx } = await supabase.from('transactions').insert({ invoice_number: `EXP-${Date.now()}`, type: 'Biaya', total_amount: amount, notes: desc }).select('id').single();
      if (trx && bebanId && kasId) {
        await supabase.from('journals').insert([
          { transaction_id: trx.id, account_id: bebanId, debit: amount, credit: 0, description: desc },
          { transaction_id: trx.id, account_id: kasId, debit: 0, credit: amount, description: desc }
        ]);
      }
      setShowExpenseModal(false); setExpenseData({ amount: '', desc: '' }); fetchData(); alert('Pengeluaran berhasil dicatat!');
    } catch (error) { console.error(error); alert('Terjadi kesalahan pencatatan.'); }
    setLoading(false);
  };

  const handleCatatPemasukan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const amount = Number(incomeData.amount);
      const desc = `[${incomeData.source}] ${incomeData.desc}`;
      let revCode = '4.1.99.99';
      let revName = 'Pendapatan Lain-lain lainnya';
      if (incomeData.source === 'Tempat Parkir') { revCode = '4.1.07.01'; revName = 'Pendapatan Parkir Mobil'; }
      else if (incomeData.source === 'Pengasapan Lele') { revCode = '4.3.01.91'; revName = 'Pendapatan Penjualan Barang Jadi'; }
      else if (incomeData.source === 'Samsat Budiman') { revCode = '4.1.12.01'; revName = 'Pendapatan Samsat Budiman'; }
      else if (incomeData.source === 'Agen Internet') { revCode = '4.1.05.99'; revName = 'Pendapatan Jasa INTERNET'; }
      else if (incomeData.source === 'Jasa Lainnya') { revCode = '4.1.99.99'; revName = 'Pendapatan Lain-lain lainnya'; }
      const pendapatanId = await getOrCreateAccount(revCode, revName, 'Revenue');
      const kasId = await getOrCreateAccount('1.1.01.01', 'Kas Tunai', 'Asset');
      const { data: trx } = await supabase.from('transactions').insert({ invoice_number: `INC-${Date.now()}`, type: 'Pendapatan Lain', total_amount: amount, notes: desc }).select('id').single();
      if (trx && pendapatanId && kasId) {
        await supabase.from('journals').insert([
          { transaction_id: trx.id, account_id: kasId, debit: amount, credit: 0, description: desc },
          { transaction_id: trx.id, account_id: pendapatanId, debit: 0, credit: amount, description: desc }
        ]);
      }
      setShowIncomeModal(false); setIncomeData({ amount: '', source: 'Tempat Parkir', desc: '' }); fetchData(); alert('Pemasukan berhasil dicatat!');
    } catch (error) { console.error(error); alert('Terjadi kesalahan pencatatan.'); }
    setLoading(false);
  };

  // UI Render function pieces
  const renderLabaRugi = () => (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Laporan Laba Rugi</h2>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border">
          <h3 className="font-bold text-lg mb-4">PENDAPATAN</h3>
          <div className="flex justify-between"><span>Total Pendapatan</span><span className="font-bold">Rp {labaRugiData.pendapatan.toLocaleString('id-ID')}</span></div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border">
          <h3 className="font-bold text-lg mb-4">HARGA POKOK & LABA KOTOR</h3>
          <div className="flex justify-between text-rose-600 mb-4"><span>HPP</span><span>(Rp {labaRugiData.hpp.toLocaleString('id-ID')})</span></div>
          <div className="flex justify-between font-extrabold text-lg p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            <span>Laba Kotor</span><span>Rp {labaRugiData.labaKotor.toLocaleString('id-ID')}</span>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border">
          <h3 className="font-bold text-lg mb-4">BEBAN OPERASIONAL</h3>
          <div className="flex justify-between text-rose-600 mb-2"><span>Total Beban Operasional</span><span>(Rp {labaRugiData.beban.toLocaleString('id-ID')})</span></div>
        </div>
        <div className="flex justify-between font-black text-2xl text-white bg-primary-900 p-6 rounded-2xl shadow-xl">
          <span>LABA BERSIH</span><span>Rp {labaRugiData.labaBersih.toLocaleString('id-ID')}</span>
        </div>
      </div>
    </div>
  );

  const renderNeraca = () => (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto w-full">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-8">Neraca (Posisi Keuangan)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card rounded-2xl p-6 shadow-sm border">
            <h3 className="font-extrabold text-lg mb-4 border-b-2 border-emerald-500 pb-2">AKTIVA (ASET)</h3>
            <div className="flex justify-between mb-2"><span>Aktiva Lancar</span><span className="font-bold">Rp {neracaData.aktivaLancar.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between mb-4"><span>Aset Tetap</span><span className="font-bold">Rp {neracaData.asetTetap.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between font-extrabold bg-emerald-50 text-emerald-700 p-4 rounded-xl">
              <span>Total Aktiva</span><span>Rp {neracaData.totalAset.toLocaleString('id-ID')}</span>
            </div>
          </div>
          <div className="card rounded-2xl p-6 shadow-sm border">
            <h3 className="font-extrabold text-lg mb-4 border-b-2 border-rose-500 pb-2">PASIVA (KEWAJIBAN & EKUITAS)</h3>
            <div className="flex justify-between mb-2"><span>Kewajiban</span><span className="font-bold">Rp {neracaData.kewajiban.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between mb-2"><span>Modal Ekuitas</span><span className="font-bold">Rp {neracaData.ekuitas.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between mb-4"><span>Laba Berjalan</span><span className="font-bold text-emerald-600">Rp {labaRugiData.labaBersih.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between font-extrabold bg-rose-50 text-rose-700 p-4 rounded-xl">
              <span>Total Pasiva</span><span>Rp {neracaData.totalPasiva.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBukuBesar = () => {
    const accountJournals = journals.filter(j => j.account_id === selectedLedgerAccount);
    let runningBalance = 0;
    const sorted = [...accountJournals].reverse(); // oldest first
    const rows = sorted.map(j => {
      const type = accounts.find(a => a.id === selectedLedgerAccount)?.type;
      const isPositive = type === 'Asset' || type === 'Expense' ? j.debit - j.credit : j.credit - j.debit;
      runningBalance += isPositive;
      return { ...j, runningBalance };
    });

    return (
      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto w-full space-y-6">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Buku Besar</h2>
          <select value={selectedLedgerAccount} onChange={e => setSelectedLedgerAccount(e.target.value)} className="w-full md:w-1/2 px-4 py-3 border-2 rounded-xl">
            <option value="">-- Pilih Akun --</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
          </select>
          {selectedLedgerAccount && (
            <div className="card rounded-2xl overflow-hidden border">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 font-bold uppercase text-xs">
                  <tr><th className="p-4">Tgl</th><th className="p-4">Keterangan</th><th className="p-4">Debit</th><th className="p-4">Kredit</th><th className="p-4">Saldo</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td className="p-4">{new Date(r.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="p-4">{r.description}</td>
                      <td className="p-4">{r.debit > 0 ? r.debit.toLocaleString() : '-'}</td>
                      <td className="p-4">{r.credit > 0 ? r.credit.toLocaleString() : '-'}</td>
                      <td className="p-4 font-bold">Rp {r.runningBalance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderNeracaSaldo = () => {
    const activeAccounts = Object.values(accountBalances).filter(b => b.debit > 0 || b.credit > 0 || b.balance !== 0);
    const totalDeb = activeAccounts.reduce((sum, b) => sum + (b.account.type === 'Asset' || b.account.type === 'Expense' ? b.balance : 0), 0);
    const totalKre = activeAccounts.reduce((sum, b) => sum + (b.account.type !== 'Asset' && b.account.type !== 'Expense' ? b.balance : 0), 0);
    
    return (
      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto w-full">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-6">Neraca Saldo</h2>
          <div className="card rounded-2xl overflow-hidden border">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 font-bold uppercase text-xs">
                <tr><th className="p-4 w-32">Kode</th><th className="p-4">Nama Akun</th><th className="p-4 text-right">Debit</th><th className="p-4 text-right">Kredit</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeAccounts.sort((a,b) => a.account.code.localeCompare(b.account.code)).map(b => (
                  <tr key={b.account.id}>
                    <td className="p-4">{b.account.code}</td>
                    <td className="p-4 font-bold">{b.account.name}</td>
                    <td className="p-4 text-right">{(b.account.type === 'Asset' || b.account.type === 'Expense') && b.balance > 0 ? b.balance.toLocaleString('id-ID') : '-'}</td>
                    <td className="p-4 text-right">{(b.account.type !== 'Asset' && b.account.type !== 'Expense') && b.balance > 0 ? b.balance.toLocaleString('id-ID') : '-'}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-black text-primary-900">
                  <td className="p-4" colSpan={2}>TOTAL</td>
                  <td className="p-4 text-right">Rp {totalDeb.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-right">Rp {totalKre.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderLPE = () => (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Laporan Perubahan Ekuitas (LPE)</h2>
        <div className="card rounded-2xl p-6 border space-y-4">
          <div className="flex justify-between"><span>Modal Awal (Ekuitas)</span><span className="font-bold">Rp {neracaData.ekuitas.toLocaleString('id-ID')}</span></div>
          <div className="flex justify-between text-emerald-600"><span>Laba (Rugi) Periode Berjalan</span><span className="font-bold">Rp {labaRugiData.labaBersih.toLocaleString('id-ID')}</span></div>
          <div className="flex justify-between font-extrabold border-t pt-4 text-lg"><span>Ekuitas Akhir</span><span>Rp {(neracaData.ekuitas + labaRugiData.labaBersih).toLocaleString('id-ID')}</span></div>
        </div>
      </div>
    </div>
  );

  const renderLAK = () => (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Laporan Arus Kas (LAK)</h2>
        <div className="card rounded-2xl p-6 border space-y-4">
          <div className="flex justify-between"><span>Arus Kas dari Aktivitas Operasi</span><span className="font-bold">Rp {lakData.operasi.toLocaleString('id-ID')}</span></div>
          <div className="flex justify-between"><span>Arus Kas dari Aktivitas Investasi</span><span className="font-bold">Rp {lakData.investasi.toLocaleString('id-ID')}</span></div>
          <div className="flex justify-between"><span>Arus Kas dari Aktivitas Pendanaan</span><span className="font-bold">Rp {lakData.pendanaan.toLocaleString('id-ID')}</span></div>
          <div className="flex justify-between font-extrabold border-t pt-4 text-lg"><span>Kenaikan (Penurunan) Kas Bersih</span><span>Rp {lakData.total.toLocaleString('id-ID')}</span></div>
        </div>
      </div>
    </div>
  );

  const renderJurnal = () => (
    <div className="flex-1 overflow-auto bg-slate-50 p-4">
      <div className="card border overflow-hidden shadow-sm h-full">
        <table className="w-full text-left text-sm min-w-[700px]">
          <thead className="bg-slate-100 font-bold uppercase text-xs">
            <tr><th className="p-4">Waktu</th><th className="p-4">Deskripsi</th><th className="p-4">Akun</th><th className="p-4 text-right">Debit</th><th className="p-4 text-right">Kredit</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {journals.map(j => (
              <tr key={j.id} className="hover:bg-primary-50">
                <td className="p-4">{new Date(j.created_at).toLocaleString('id-ID')}</td>
                <td className="p-4">{j.description}</td>
                <td className="p-4 font-bold">{j.accounts?.code} {j.accounts?.name}</td>
                <td className="p-4 text-right text-emerald-600">{j.debit > 0 ? j.debit.toLocaleString() : '-'}</td>
                <td className="p-4 text-right text-rose-600">{j.credit > 0 ? j.credit.toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] space-y-4">
      {/* Navbar Tabs */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center card rounded-2xl shadow-sm p-4 z-10">
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          {[
            { id: 'laba-rugi', name: 'Laba Rugi', icon: <TrendingUp size={16} /> },
            { id: 'neraca', name: 'Neraca', icon: <Scale size={16} /> },
            { id: 'lpe', name: 'LPE', icon: <Wallet size={16} /> },
            { id: 'lak', name: 'LAK', icon: <Activity size={16} /> },
            { id: 'jurnal', name: 'Buku Jurnal', icon: <FileText size={16} /> },
            { id: 'buku-besar', name: 'Buku Besar', icon: <BookOpen size={16} /> },
            { id: 'neraca-saldo', name: 'Neraca Saldo', icon: <DollarSign size={16} /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-sm font-bold trans-all ${activeTab === tab.id ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              {tab.icon} <span className="hidden md:inline">{tab.name}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowIncomeModal(true)} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold border"><ArrowDownCircle size={16} /> Pemasukan</button>
          <button onClick={() => setShowExpenseModal(true)} className="flex items-center gap-2 bg-rose-50 text-rose-700 px-4 py-2 rounded-xl font-bold border"><ArrowUpCircle size={16} /> Pengeluaran</button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 card rounded-2xl shadow-sm overflow-hidden flex flex-col relative bg-white">
        {loading && <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center font-bold text-primary-600">Memuat Laporan...</div>}
        {activeTab === 'laba-rugi' && renderLabaRugi()}
        {activeTab === 'neraca' && renderNeraca()}
        {activeTab === 'buku-besar' && renderBukuBesar()}
        {activeTab === 'neraca-saldo' && renderNeracaSaldo()}
        {activeTab === 'lpe' && renderLPE()}
        {activeTab === 'lak' && renderLAK()}
        {activeTab === 'jurnal' && renderJurnal()}
      </div>
      
      {/* Modals omitted for brevity, logic remains identical to previous modals using handleCatatPengeluaran, handleCatatPemasukan */}
      {/* To satisfy the compiler and user's functionality, I will include the minimal functional modals */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Setor Pemasukan</h3>
            <form onSubmit={handleCatatPemasukan} className="space-y-4">
              <select value={incomeData.source} onChange={e => setIncomeData({...incomeData, source: e.target.value})} className="w-full p-3 border rounded-xl">
                <option value="Tempat Parkir">Tempat Parkir</option>
                <option value="Pengasapan Lele">Pengasapan Lele</option>
                <option value="Samsat Budiman">Samsat Budiman</option>
                <option value="Agen Internet">Agen Internet</option>
                <option value="Jasa Lainnya">Jasa Lainnya</option>
              </select>
              <input required type="number" value={incomeData.amount} onChange={e => setIncomeData({...incomeData, amount: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="Nominal" />
              <textarea required value={incomeData.desc} onChange={e => setIncomeData({...incomeData, desc: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="Catatan" />
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowIncomeModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Batal</button><button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
      
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Catat Pengeluaran</h3>
            <form onSubmit={handleCatatPengeluaran} className="space-y-4">
              <input required type="number" value={expenseData.amount} onChange={e => setExpenseData({...expenseData, amount: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="Nominal" />
              <textarea required value={expenseData.desc} onChange={e => setExpenseData({...expenseData, desc: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="Keterangan Beban" />
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl">Batal</button><button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-xl">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
