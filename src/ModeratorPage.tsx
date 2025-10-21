// src/ModeratorPage.tsx
'use client';
import React from 'react';
import {
  Plus, Save, Trash2, MoveUp, MoveDown, LogIn,
  Eye, EyeOff, ChevronDown, ChevronRight, Power
} from 'lucide-react';

/**
 * Vite env:
 *   VITE_SUPABASE_FUNC_URL = https://...supabase.co/functions/v1/hyper-function
 *   VITE_SUPABASE_ANON     = <token anon do Supabase>
 */
const FUNC_URL = (import.meta.env.VITE_SUPABASE_FUNC_URL || '').trim();
const ANON     = (import.meta.env.VITE_SUPABASE_ANON || '').trim();

export type Brand = {
  name: string;
  tag: 'HOT' | 'NEW' | 'TOP';
  logo: string;
  image: string;
  imagePos?: React.CSSProperties['objectPosition'] | string;
  minDep: string;
  bonus: string;
  cashback: string;
  freeSpins: string;
  code: string;
  link: string;
  theme?: { accent: string; shadow: string; ring?: string };
  payments?: Array<'btc' | 'mb' | 'mbw' | 'visa' | 'mc'>;
  showLogo?: boolean;
  /** NOVO: controla se aparece no site público */
  enabled?: boolean;
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
  showLogo: true,
  enabled: true, // NOVO
});

/** Helper para chamar a Edge Function já com Authorization Bearer <ANON> */
function api(path = '', init: RequestInit = {}) {
  if (!FUNC_URL) throw new Error('Falta configurar VITE_SUPABASE_FUNC_URL');
  if (!ANON)     throw new Error('Falta configurar VITE_SUPABASE_ANON');
  return fetch(`${FUNC_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANON}`,
      ...(init.headers || {}),
    },
  });
}

export default function ModeratorPage() {
  const [pass, setPass] = React.useState('');
  const [authed, setAuthed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [collapsed, setCollapsed] = React.useState<Set<number>>(new Set());

  const toggleOpen = (i: number) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });

  // ------- LOAD -------
  const load = React.useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const r = await api('', { method: 'GET', cache: 'no-store' });
      if (!r.ok) throw new Error(`Erro ao carregar (${r.status})`);
      const data = await r.json();
      const list: Brand[] = (data?.data || []).map((b: Brand) => ({
        ...b,
        payments: b.payments && b.payments.length ? b.payments : ['mbw', 'mb', 'visa', 'mc', 'btc'],
        imagePos: b.imagePos ?? 'center',
        showLogo: typeof b.showLogo === 'boolean' ? b.showLogo : true,
        enabled:  typeof b.enabled  === 'boolean' ? b.enabled  : true, // default
      }));
      setBrands(list);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ------- LOGIN (dry-run) -------
  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    try {
      if (!pass) throw new Error('Escreve a senha de admin');
      const probe = await api('', {
        method: 'PUT',
        headers: { 'x-admin-key': pass, 'x-dry-run': '1' },
        body: JSON.stringify([]),
      });
      if (probe.status === 204 || probe.ok) {
        await load();
        setAuthed(true);
      } else if (probe.status === 401) {
        throw new Error('Senha inválida');
      } else {
        const txt = await probe.text().catch(() => '');
        throw new Error(`Falha ao validar (${probe.status}) ${txt}`);
      }
    } catch (e: any) {
      setError(e.message || 'Falhou autenticação');
    }
  };

  React.useEffect(() => { if (authed) load(); }, [authed, load]);

  // ------- CRUD -------
  const addBrand = () => setBrands((b) => [...b, emptyBrand()]);
  const removeBrand = (i: number) => {
    setBrands((b) => b.filter((_, idx) => idx !== i));
    setCollapsed(prev => {
      const next = new Set<number>();
      Array.from(prev).forEach(idx => { if (idx < i) next.add(idx); else if (idx > i) next.add(idx - 1); });
      return next;
    });
  };
  const move = (i: number, dir: -1 | 1) =>
    setBrands((b) => {
      const j = i + dir;
      if (j < 0 || j >= b.length) return b.slice();
      const arr = b.slice();
      const [x] = arr.splice(i, 1);
      arr.splice(j, 0, x);
      // acompanha estado colapsado
      setCollapsed(prev => {
        const next = new Set(prev);
        const wasI = next.has(i);
        const wasJ = next.has(j);
        if (wasI) next.delete(i);
        if (wasJ) next.delete(j);
        if (wasI) next.add(j);
        if (wasJ) next.add(i);
        return next;
      });
      return arr;
    });

  const update = <K extends keyof Brand>(i: number, key: K, val: Brand[K]) =>
    setBrands((b) => b.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)));

  // ------- SAVE -------
  const save = async () => {
    setSaving(true);
    setError(undefined);
    try {
      if (!pass) throw new Error('Escreve a senha de admin');
      const payload = brands.map((b) => ({
        ...b,
        imagePos: b.imagePos || 'center',
        payments: (b.payments && b.payments.length ? b.payments : ['mbw','mb','visa','mc','btc']),
        showLogo: typeof b.showLogo === 'boolean' ? b.showLogo : true,
        enabled:  typeof b.enabled  === 'boolean' ? b.enabled  : true,
      }));
      const r = await api('', {
        method: 'PUT',
        headers: { 'x-admin-key': pass },
        body: JSON.stringify(payload, null, 2),
      });
      if (r.status === 401) throw new Error('Senha inválida');
      if (!r.ok) throw new Error(`Falha ao gravar (${r.status})`);
    } catch (e: any) {
      setError(e.message || 'Falha ao gravar');
    } finally {
      setSaving(false);
    }
  };

  // ------- UI -------
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
        {brands.map((b, i) => {
          const isOpen = !collapsed.has(i);
          return (
            <div key={i} className="rounded-2xl bg-white/10 ring-1 ring-white/15 text-white overflow-hidden">
              {/* Cabeçalho */}
              <div className="p-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleOpen(i)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/15"
                  title={isOpen ? 'Minimizar' : 'Maximizar'}
                >
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

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

                {/* Toggle mostrar logo */}
                <button
                  type="button"
                  onClick={() => update(i, 'showLogo', !b.showLogo)}
                  className={`ml-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ring-1 ring-white/15 ${
                    b.showLogo ? 'bg-emerald-600/90' : 'bg-white/10'
                  }`}
                  title={b.showLogo ? 'Ocultar logo no card' : 'Mostrar logo no card'}
                >
                  {b.showLogo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <span className="text-xs font-semibold">
                    {b.showLogo ? 'Logo: ON' : 'Logo: OFF'}
                  </span>
                </button>

                {/* NOVO: Toggle visibilidade pública */}
                <button
                  type="button"
                  onClick={() => update(i, 'enabled', !(b.enabled !== false))}
                  className={`ml-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ring-1 ring-white/15 ${
                    b.enabled !== false ? 'bg-emerald-700/90' : 'bg-white/10'
                  }`}
                  title={b.enabled !== false ? 'Tornar invisível no site' : 'Mostrar no site'}
                >
                  <Power className="h-4 w-4" />
                  <span className="text-xs font-semibold">
                    {b.enabled !== false ? 'Visível: ON' : 'Visível: OFF'}
                  </span>
                </button>

                <div className="ml-auto flex gap-1">
                  <button onClick={() => move(i, -1)} className="p-2 rounded-lg bg-white/10" title="Mover para cima">
                    <MoveUp className="h-4 w-4" />
                  </button>
                  <button onClick={() => move(i, 1)} className="p-2 rounded-lg bg-white/10" title="Mover para baixo">
                    <MoveDown className="h-4 w-4" />
                  </button>
                  <button onClick={() => removeBrand(i)} className="p-2 rounded-lg bg-red-600/80" title="Remover">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Corpo com animação de altura */}
              <Accordion open={isOpen}>
                <div className="p-4 grid md:grid-cols-2 gap-3">
                  <div className="grid gap-3">
                    <Input label="Logo URL" val={b.logo} onChange={(v) => update(i, 'logo', v)} />
                    <Input label="Imagem URL" val={b.image} onChange={(v) => update(i, 'image', v)} />
                    <Input label="Link" val={b.link} onChange={(v) => update(i, 'link', v)} />
                    <Input
                      label="Posição imagem (ex: center, left, 20% 50%)"
                      val={b.imagePos || ''}
                      onChange={(v) => update(i, 'imagePos', v as any)}
                    />
                  </div>

                  <div className="grid gap-3">
                    <Input label="Min. Dep." val={b.minDep} onChange={(v) => update(i, 'minDep', v)} />
                    <Input label="Bónus" val={b.bonus} onChange={(v) => update(i, 'bonus', v)} />
                    <Input label="Cashback/Wager" val={b.cashback} onChange={(v) => update(i, 'cashback', v)} />
                    <Input label="Free Spins" val={b.freeSpins} onChange={(v) => update(i, 'freeSpins', v)} />
                    <Input label="Código" val={b.code} onChange={(v) => update(i, 'code', v)} />
                  </div>

                  <Input
                    label="Theme.accent"
                    val={b.theme?.accent || ''}
                    onChange={(v) =>
                      update(i, 'theme', { ...(b.theme || {}), accent: v, shadow: b.theme?.shadow || 'rgba(0,0,0,.3)' })
                    }
                  />
                  <Input
                    label="Theme.shadow"
                    val={b.theme?.shadow || ''}
                    onChange={(v) =>
                      update(i, 'theme', { ...(b.theme || {}), shadow: v, accent: b.theme?.accent || '#22c55e' })
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

                {/* Preview */}
                <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <PreviewBox label="Pré-visualização do Logo" show={!!b.showLogo && !!b.logo}>
                    {b.logo ? (
                      <img src={b.logo} alt="logo" className="h-12 object-contain" />
                    ) : (
                      <span className="text-xs text-white/60">Sem URL do logo</span>
                    )}
                  </PreviewBox>
                  <PreviewBox label="Pré-visualização da Imagem">
                    {b.image ? (
                      <div className="relative w-full" style={{ paddingTop: '45%' }}>
                        <img
                          src={b.image}
                          alt="image"
                          className="absolute inset-0 h-full w-full object-cover rounded-md"
                          style={{ objectPosition: b.imagePos || 'center' }}
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-white/60">Sem URL da imagem</span>
                    )}
                  </PreviewBox>
                </div>
              </Accordion>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Input simples */
function Input({
  label, val, onChange,
}: { label: string; val: string | number | undefined; onChange: (v: string) => void; }) {
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

/** Caixa de preview */
function PreviewBox({
  label, show = true, children,
}: { label: string; show?: boolean; children: React.ReactNode; }) {
  return (
    <div className="rounded-lg p-3 bg-black/25 ring-1 ring-white/10">
      <div className="text-xs text-white/70 mb-2">{label}</div>
      {show ? children : <span className="text-xs text-white/60">Oculto</span>}
    </div>
  );
}

/** Componente de colapso com animação de altura */
function Accordion({ open, children }: { open: boolean; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number | 'auto'>(open ? 'auto' : 0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      const h = el.scrollHeight;
      setHeight(h);
      const id = window.setTimeout(() => setHeight('auto'), 200);
      return () => window.clearTimeout(id);
    } else {
      setHeight(el.scrollHeight);
      requestAnimationFrame(() => setHeight(0));
    }
  }, [open]);

  return (
    <div
      ref={ref}
      style={{ overflow: 'hidden', transition: 'height 200ms ease', height: height === 'auto' ? 'auto' : `${height}px` }}
      aria-hidden={!open}
    >
      {children}
    </div>
  );
}
