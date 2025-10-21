// src/ModeratorPage.tsx
'use client';
import React from 'react';
import { Plus, Save, Trash2, MoveUp, MoveDown, LogIn } from 'lucide-react';

// URL da função Edge no Supabase
const BRANDS_URL = 'https://fovgbsynuxfgypzctvxg.supabase.co/functions/v1/hyper-function';

export type Brand = {
  name: string;
  tag: 'HOT' | 'NEW' | 'TOP';
  logo: string;
  image: string;
  imagePos?: React.CSSProperties['objectPosition'];
  minDep: string;
  bonus: string;
  cashback: string;
  freeSpins: string;
  code: string;
  link: string;
  theme?: { accent: string; shadow: string; ring?: string };
  payments?: Array<'btc' | 'mb' | 'mbw' | 'visa' | 'mc'>;
};

const emptyBrand = (): Brand => ({
  name: '',
  tag: 'NEW',
  logo: '',
  image: '',
  imagePos: 'center',
  minDep: '',
  bonus: '',
  cashback: '',
  freeSpins: '',
  code: '',
  link: '',
  theme: { accent: '#22c55e', shadow: 'rgba(34,197,94,.45)' },
  payments: ['mbw', 'mb', 'visa', 'mc', 'btc'],
});

export default function ModeratorPage() {
  const [pass, setPass] = React.useState('');
  const [authed, setAuthed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [brands, setBrands] = React.useState<Brand[]>([]);

  // -------- carregar dados --------
  const load = React.useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const r = await fetch(BRANDS_URL, {
        method: 'GET',
        headers: { 'x-admin-key': pass },
        cache: 'no-store',
      });
      if (r.status === 401) throw new Error('Senha inválida');
      if (!r.ok) throw new Error(`Erro ao carregar (${r.status})`);
      const data = await r.json();
      setBrands(data?.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [pass]);

  // -------- login --------
  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    try {
      const r = await fetch(BRANDS_URL, {
        method: 'GET',
        headers: { 'x-admin-key': pass },
      });
      if (r.status === 401) throw new Error('Senha inválida');
      if (!r.ok) throw new Error(`Erro (${r.status})`);
      const data = await r.json();
      setBrands(data?.data || []);
      setAuthed(true);
    } catch (e: any) {
      setError(e.message || 'Falhou autenticação');
    }
  };

  React.useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  // -------- CRUD --------
  const addBrand = () => setBrands((b) => [...b, emptyBrand()]);
  const removeBrand = (i: number) => setBrands((b) => b.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) =>
    setBrands((b) => {
      const j = i + dir;
      if (j < 0 || j >= b.length) return b.slice();
      const arr = b.slice();
      const [x] = arr.splice(i, 1);
      arr.splice(j, 0, x);
      return arr;
    });

  const update = <K extends keyof Brand>(i: number, key: K, val: Brand[K]) =>
    setBrands((b) => b.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)));

  // -------- gravar alterações --------
  const save = async () => {
    setSaving(true);
    setError(undefined);
    try {
      const r = await fetch(BRANDS_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': pass,
        },
        body: JSON.stringify(brands, null, 2),
      });
      if (r.status === 401) throw new Error('Senha inválida');
      if (!r.ok) throw new Error(`Falha ao gravar (${r.status})`);
    } catch (e: any) {
      setError(e.message || 'Falha ao gravar');
    } finally {
      setSaving(false);
    }
  };

  // -------- interface --------
  if (!authed) {
    return (
      <div className="mx-auto max-w-md mt-16 p-6 rounded-2xl bg-white/10 text-white ring-1 ring-white/15">
        <h1 className="text-xl font-bold mb-3">Moderator Login</h1>
        <form onSubmit={doLogin} className="flex gap-2">
          <input
            type="password"
            className="flex-1 rounded-lg px-3 py-2 bg-black/30 ring-1 ring-white/15 outline-none"
            placeholder="Senha de administrador"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white">
            <LogIn className="h-4 w-4" /> Entrar
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
        <p className="mt-3 text-xs text-white/60">A senha não é guardada no navegador.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={addBrand}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white"
        >
          <Plus className="h-4 w-4" /> Adicionar casino
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'A gravar…' : 'Gravar alterações'}
        </button>
        {loading && <span className="text-white/70 text-sm">a carregar…</span>}
        {error && <span className="text-red-300 text-sm">{error}</span>}
      </div>

      <div className="grid gap-4">
        {brands.map((b, i) => (
          <div key={i} className="rounded-2xl p-4 bg-white/10 ring-1 ring-white/15 text-white">
            <div className="flex items-center gap-2 mb-3">
              <input
                value={b.name}
                onChange={(e) => update(i, 'name', e.target.value)}
                className="font-bold bg-black/30 ring-1 ring-white/15 rounded-lg px-3 py-1.5"
                placeholder="Nome"
              />
              <select
                value={b.tag}
                onChange={(e) => update(i, 'tag', e.target.value as any)}
                className="bg-black/30 ring-1 ring-white/15 rounded-lg px-2 py-1.5"
              >
                <option value="HOT">HOT</option>
                <option value="NEW">NEW</option>
                <option value="TOP">TOP</option>
              </select>
              <div className="ml-auto flex gap-1">
                <button onClick={() => move(i, -1)} className="p-2 rounded-lg bg-white/10">
                  <MoveUp className="h-4 w-4" />
                </button>
                <button onClick={() => move(i, 1)} className="p-2 rounded-lg bg-white/10">
                  <MoveDown className="h-4 w-4" />
                </button>
                <button onClick={() => removeBrand(i)} className="p-2 rounded-lg bg-red-600/80">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <Input label="Logo URL" val={b.logo} onChange={(v) => update(i, 'logo', v)} />
              <Input label="Imagem URL" val={b.image} onChange={(v) => update(i, 'image', v)} />
              <Input label="Link" val={b.link} onChange={(v) => update(i, 'link', v)} />
              <Input
                label="Posição imagem (ex: center, left, 20% 50%)"
                val={b.imagePos || ''}
                onChange={(v) => update(i, 'imagePos', v as any)}
              />
              <Input label="Min. Dep." val={b.minDep} onChange={(v) => update(i, 'minDep', v)} />
              <Input label="Bónus" val={b.bonus} onChange={(v) => update(i, 'bonus', v)} />
              <Input
                label="Cashback/Wager"
                val={b.cashback}
                onChange={(v) => update(i, 'cashback', v)}
              />
              <Input
                label="Free Spins"
                val={b.freeSpins}
                onChange={(v) => update(i, 'freeSpins', v)}
              />
              <Input label="Código" val={b.code} onChange={(v) => update(i, 'code', v)} />
              <Input
                label="Theme.accent"
                val={b.theme?.accent || ''}
                onChange={(v) =>
                  update(i, 'theme', {
                    ...(b.theme || {}),
                    accent: v,
                    shadow: b.theme?.shadow || 'rgba(0,0,0,.3)',
                  })
                }
              />
              <Input
                label="Theme.shadow"
                val={b.theme?.shadow || ''}
                onChange={(v) =>
                  update(i, 'theme', {
                    ...(b.theme || {}),
                    shadow: v,
                    accent: b.theme?.accent || '#22c55e',
                  })
                }
              />
              <Input
                label="Payments (csv: mbw,mb,visa,mc,btc)"
                val={(b.payments || []).join(',')}
                onChange={(v) =>
                  update(i, 'payments', v.split(',').map((s) => s.trim()).filter(Boolean) as any)
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Input({
  label,
  val,
  onChange,
}: {
  label: string;
  val: string | number | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-white/70">{label}</span>
      <input
        value={String(val ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg px-3 py-2 bg-black/30 ring-1 ring-white/15 outline-none"
      />
    </label>
  );
}
