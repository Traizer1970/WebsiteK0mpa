'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Brand = {
  name: string; tag: "HOT" | "NEW" | "TOP"; logo: string; image: string;
  imagePos?: React.CSSProperties['objectPosition'];
  minDep: string; bonus: string; cashback: string; freeSpins: string; code: string; link: string;
  theme?: { accent: string; shadow: string; ring?: string; };
  payments?: Array<'btc'|'mb'|'mbw'|'visa'|'mc'>;
};

const STORAGE_KEY = 'k0mpa_brands_override_v1';
const PASS_KEY = 'k0mpa_moderator_pass_hash_v1';

// util: SHA-256 (returns hex)
async function hashPassword(password: string) {
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(digest));
  return arr.map(b => b.toString(16).padStart(2,'0')).join('');
}

function readStored(): Brand[] | null {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return null;
    return JSON.parse(s) as Brand[];
  } catch {
    return null;
  }
}
function writeStored(brands: Brand[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
}

export default function ModeratorPage() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // working data
  const [brands, setBrands] = useState<Brand[]>(() => readStored() ?? []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Brand>>({});
  const [filter, setFilter] = useState('');

  useEffect(() => {
    // keep brands in state in sync with localStorage changes (other tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setBrands(readStored() ?? []);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Auth: if no password set, first submit will create it
  async function onLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoadingAuth(true);
    try {
      const existing = localStorage.getItem(PASS_KEY);
      const hash = await hashPassword(passwordInput);
      if (!existing) {
        // first time: set password
        localStorage.setItem(PASS_KEY, hash);
        setAuthenticated(true);
        setNotice('Password criada — agora estás autenticado.');
      } else {
        if (existing === hash) {
          setAuthenticated(true);
          setNotice('Autenticado.');
        } else {
          setNotice('Password inválida.');
        }
      }
    } finally {
      setLoadingAuth(false);
      setPasswordInput('');
      setTimeout(()=>setNotice(null), 3000);
    }
  }

  function onLogout() {
    setAuthenticated(false);
    navigate('/');
  }

  // CRUD
  function onAddNew() {
    setForm({
      name: 'Novo Casino',
      tag: 'NEW',
      logo: '',
      image: '',
      minDep: '0€',
      bonus: '0%',
      cashback: '0%',
      freeSpins: '0FS',
      code: '',
      link: '',
      payments: ['btc','mb','visa'],
    });
    setEditingIndex(null);
  }

  function onEdit(i: number) {
    setEditingIndex(i);
    setForm(brands[i]);
  }

  function onDelete(i: number) {
    if (!confirm(`Remover "${brands[i].name}"?`)) return;
    const copy = [...brands];
    copy.splice(i,1);
    setBrands(copy);
    writeStored(copy);
  }

  function onSaveForm() {
    // basic validation
    if (!form.name) { setNotice('Nome obrigatório'); return; }
    const normalized: Brand = {
      name: String(form.name),
      tag: (form.tag as Brand['tag']) || 'NEW',
      logo: String(form.logo || ''),
      image: String(form.image || ''),
      imagePos: form.imagePos,
      minDep: String(form.minDep || '0€'),
      bonus: String(form.bonus || '0%'),
      cashback: String(form.cashback || ''),
      freeSpins: String(form.freeSpins || ''),
      code: String(form.code || ''),
      link: String(form.link || ''),
      theme: form.theme,
      payments: Array.isArray(form.payments) ? form.payments as any : (String(form.payments || '').split(',').map(s=>s.trim()).filter(Boolean) as any),
    };

    const copy = [...brands];
    if (editingIndex === null) {
      copy.unshift(normalized);
    } else {
      copy[editingIndex] = normalized;
    }
    setBrands(copy);
    writeStored(copy);
    setForm({});
    setEditingIndex(null);
    setNotice('Guardado');
    setTimeout(()=>setNotice(null), 1500);
  }

  function onCancelEdit() {
    setForm({});
    setEditingIndex(null);
  }

  function onExport() {
    const blob = new Blob([JSON.stringify(brands, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brands-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Brand[];
        setBrands(parsed);
        writeStored(parsed);
        setNotice('Import ok');
      } catch (err) {
        setNotice('Ficheiro inválido');
      } finally {
        setTimeout(()=>setNotice(null), 2000);
      }
    };
    reader.readAsText(f);
    e.currentTarget.value = '';
  }

  function onClearAll() {
    if (!confirm('Apagar todos os painéis guardados? (Isto só remove os dados guardados no browser)')) return;
    setBrands([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  // reorder simple move
  function move(i: number, dir: number) {
    const j = i + dir;
    if (j < 0 || j >= brands.length) return;
    const copy = [...brands];
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
    setBrands(copy);
    writeStored(copy);
  }

  // UI
  if (!authenticated) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Painel de Moderador</h2>
        <p className="mb-3 text-sm text-slate-600">Se ainda não definiste uma password, a primeira que usares será guardada localmente e ativará o acesso.</p>
        <form onSubmit={onLogin} className="space-y-3">
          <input value={passwordInput} onChange={e=>setPasswordInput(e.target.value)} placeholder="Password" type="password" className="w-full rounded px-3 py-2 border" />
          <div className="flex gap-2">
            <button type="submit" disabled={loadingAuth} className="px-4 py-2 bg-blue-600 text-white rounded">{loadingAuth ? '...' : 'Entrar / Criar'}</button>
            <button type="button" onClick={()=>{ localStorage.removeItem(PASS_KEY); setNotice('Password removida (se existia).'); setTimeout(()=>setNotice(null),2000); }} className="px-4 py-2 bg-gray-200 rounded">Reset Password (apenas local)</button>
            <button type="button" onClick={()=>navigate('/')} className="ml-auto px-4 py-2 rounded border">Voltar</button>
          </div>
        </form>
        {notice && <div className="mt-3 text-sm text-red-600">{notice}</div>}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold">Painel de Moderador</h2>
          <p className="text-sm text-slate-600">Editar painéis (persistência local). Estes dados serão usados pela app se existirem.</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={onExport} className="px-3 py-2 rounded bg-white/6">Export JSON</button>
          <label className="px-3 py-2 rounded bg-white/6 cursor-pointer">
            Import JSON <input onChange={onImport} accept="application/json" type="file" hidden />
          </label>
          <button onClick={onClearAll} className="px-3 py-2 rounded bg-red-600 text-white">Clear all</button>
          <button onClick={onLogout} className="px-3 py-2 rounded border">Logout</button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="w-1/3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Painéis ({brands.length})</h3>
            <button onClick={onAddNew} className="px-3 py-1 rounded bg-green-600 text-white">Novo</button>
          </div>

          <input placeholder="Filtrar..." value={filter} onChange={e=>setFilter(e.target.value)} className="w-full mb-3 px-3 py-2 border rounded" />

          <div className="space-y-2 max-h-[60vh] overflow:auto">
            {brands.filter(b => (!filter || b.name.toLowerCase().includes(filter.toLowerCase()))).map((b, i)=>(
              <div key={i} className="p-3 rounded border flex items-center gap-2">
                <div className="flex-1">
                  <div className="font-semibold">{b.name}</div>
                  <div className="text-xs text-slate-500">{b.tag} • {b.minDep} • {b.bonus}</div>
                </div>
                <div className="flex gap-1">
                  <button title="subir" onClick={()=>move(i,-1)} className="px-2">▲</button>
                  <button title="descer" onClick={()=>move(i,1)} className="px-2">▼</button>
                  <button onClick={()=>onEdit(i)} className="px-2">Editar</button>
                  <button onClick={()=>onDelete(i)} className="px-2 text-red-600">Apagar</button>
                </div>
              </div>
            ))}
            {brands.length === 0 && <div className="text-sm text-slate-500">Nenhum painel guardado</div>}
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold mb-2">{editingIndex === null ? 'Criar novo painel' : `Editar: ${brands[editingIndex!].name}`}</h3>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Nome" value={String(form.name || '')} onChange={e=>setForm({...form, name:e.target.value})} className="px-3 py-2 border rounded col-span-2" />
            <select value={String(form.tag || 'NEW')} onChange={e=>setForm({...form, tag: e.target.value as any})} className="px-3 py-2 border rounded">
              <option value="NEW">NEW</option>
              <option value="HOT">HOT</option>
              <option value="TOP">TOP</option>
            </select>
            <input placeholder="Código" value={String(form.code || '')} onChange={e=>setForm({...form, code:e.target.value})} className="px-3 py-2 border rounded" />
            <input placeholder="Min. Dep" value={String(form.minDep || '')} onChange={e=>setForm({...form, minDep:e.target.value})} className="px-3 py-2 border rounded" />
            <input placeholder="Bónus" value={String(form.bonus || '')} onChange={e=>setForm({...form, bonus:e.target.value})} className="px-3 py-2 border rounded" />
            <input placeholder="Cashback / Wager" value={String(form.cashback || '')} onChange={e=>setForm({...form, cashback:e.target.value})} className="px-3 py-2 border rounded" />
            <input placeholder="Free Spins" value={String(form.freeSpins || '')} onChange={e=>setForm({...form, freeSpins:e.target.value})} className="px-3 py-2 border rounded" />
            <input placeholder="Link (promo)" value={String(form.link || '')} onChange={e=>setForm({...form, link:e.target.value})} className="px-3 py-2 border rounded col-span-2" />
            <input placeholder="Logo URL" value={String(form.logo || '')} onChange={e=>setForm({...form, logo:e.target.value})} className="px-3 py-2 border rounded" />
            <input placeholder="Imagem URL" value={String(form.image || '')} onChange={e=>setForm({...form, image:e.target.value})} className="px-3 py-2 border rounded" />
            <input placeholder="Payments (comma separated e.g. btc,mb,visa)" value={Array.isArray(form.payments) ? (form.payments.join(',')) : (form.payments || '')} onChange={e=>{
              const arr = e.target.value.split(',').map(s=>s.trim()).filter(Boolean);
              setForm({...form, payments: arr});
            }} className="px-3 py-2 border rounded col-span-2" />
          </div>

          <div className="mt-3 flex gap-2">
            <button onClick={onSaveForm} className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
            <button onClick={onCancelEdit} className="px-4 py-2 rounded border">Cancelar</button>
            <button onClick={()=>{ setForm({}); setEditingIndex(null); }} className="px-4 py-2 rounded">Limpar</button>
          </div>

          {notice && <div className="mt-3 text-sm text-green-600">{notice}</div>}
        </div>
      </div>

      <div className="text-xs text-slate-500">
        <strong>Atenção:</strong> isto altera apenas o `localStorage` do browser. Para usar estes dados na app, a app principal tem de preferir ler `localStorage` (ve abaixo o snippet para integrar).
      </div>
    </div>
  );
}
