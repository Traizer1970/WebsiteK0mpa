import React, { useEffect, useMemo, useState, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import {
  Search, ChevronRight, Gift, Store, Users, Tv,
  TrendingUp, Youtube, Instagram, Twitch as TwitchIcon, Send, Coins, Percent, Copy,
  Sparkles, Flame, Crown, ArrowLeft, ExternalLink
} from "lucide-react";

/* ---------- CONFIG ---------- */
const TWITCH_CHANNEL = "k0mpa";
/* YouTube (UC…) — @k0mpa */
const YT_CHANNEL_ID = "UCwhhk8mIE-wGg_EWX2adH5Q";

/* URLs Betify — troca para os teus links reais */
const BETIFY_SIGNUP_URL = "https://betify.com/?ref=k0mpa";      // <- altera
const BETIFY_PROMO_URL  = "https://betify.com/promotions";       // <- altera

/* ---------- utils ---------- */
function cn(...a: Array<string | false | undefined>) { return a.filter(Boolean).join(" "); }
function hexToRgb(hex: string) {
  const c = hex.replace("#", "");
  const n = parseInt(c.length === 3 ? c.split("").map(x=>x+x).join("") : c, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgba(hex: string, a: number) { const { r, g, b } = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
const TWITCH_PURPLE = "#9146FF";

/* links das redes */
const SOCIAL_LINKS = {
  youtube:  "https://youtube.com/@k0mpa",
  instagram:"https://instagram.com/k0mpa",
  twitch:   "https://twitch.tv/k0mpa",
  telegram: "https://t.me/k0mpa",
  discord:  "https://discord.gg/k0mpa",
  tiktok:        "https://www.tiktok.com/@k0mpa",
  tiktokValorant:"https://www.tiktok.com/@k0mpavalorant",
  x:             "https://x.com/k0mpa",
  instantGaming: "https://www.instant-gaming.com/en/?igr=k0mpa",
} as const;

/* ---------- Twitch LIVE (sem API key) ---------- */
function useLiveAutoTwitch(channel: string, intervalMs = 60_000) {
  const [isLive, setIsLive] = React.useState(false);
  React.useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;
    const looksLive = (txt: string) => {
      const s = (txt || "").toLowerCase().trim();
      if (!s || s.includes("not live") || s.includes("offline") || s.includes("channel not found") || s.includes("user not found") || s.includes("no channel") || s.includes("could not") || s.includes("error")) return false;
      const hasTimeWords = /(\d+h|\d+m|\d+s|hour|minute|second)/.test(s);
      const hasDigits = /\d/.test(s);
      return hasDigits && hasTimeWords;
    };
    const check = async () => {
      try {
        const url = `https://decapi.me/twitch/uptime/${encodeURIComponent(channel)}?t=${Date.now()}`;
        const res = await fetch(url, { cache: "no-store" });
        const txt = await res.text();
        if (!cancelled) setIsLive(looksLive(txt));
      } catch {}
    };
    check();
    timer = window.setInterval(check, intervalMs);
    return () => { cancelled = true; if (timer) window.clearInterval(timer); };
  }, [channel, intervalMs]);
  return isLive;
}

/* ---------- payments (logos via URL) ---------- */
const PAYMENT_ICON_URLS = {
  btc: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/2048px-Bitcoin.svg.png",
  mbw: "https://play-lh.googleusercontent.com/nDKhDELMEjag8qJ9aKAjfTSzWZKVg3tY2OZ-eo8Jp8hxYDgifCFQoNOqxDwTaAW-O8o",
  mb:  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Multibanco.svg/1733px-Multibanco.svg.png",
  visa:"https://download.logo.wine/logo/Visa_Inc./Visa_Inc.-Logo.wine.png",
  mc:  "https://www.pngplay.com/wp-content/uploads/13/Mastercard-Logo-Free-PNG.png",
} as const;

type PaymentType = keyof typeof PAYMENT_ICON_URLS;
function normalizePaymentType(t: string): PaymentType { return (t === "mbb" ? "mbw" : t) as PaymentType; }

/* ---------- primitives ---------- */
type DivProps = React.HTMLAttributes<HTMLDivElement>;
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
export function Button({ className, children, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
        "focus:outline-none focus-visible:outline-none",
        "focus:ring-2 focus:ring-rose-400/60",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
export function Card({ className, ...props }: DivProps) {
  return <div className={cn("rounded-2xl bg-white shadow-sm", className)} {...props} />;
}
export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold", className)} {...props}/>;
}

/* ---------- i18n ---------- */
type Lang = "PT" | "EN";
type Translations = {
  brand: string; search: string;
  nav: { menu: string; casinos: string; offers: string; betify: string; shop: string; community: string; slots: string; stream: string; minigames: string; new: string; };
  promo: { lootbox: string; everyDep: string; bonus: string; giveaways: string; monthly: string; depcode: string; claim: string; };
  card: { min: string; bonus: string; cashback: string; spins: string; code: string; terms: string; showMore: string; back: string; moreInfo: string; visit: string; go: string; copy: string; };
  social: { title: string; youtube: string; instagram: string; twitch: string; telegram: string; tiktok: string; tiktok_val: string; x: string; copyright: (y:number)=>string; };
  footer: { terms: string; privacy: string; cookies: string; rg_paragraph: string; rg_site: string; };
};
const messages: Record<Lang, Translations> = {
  PT: {
    brand: "K0MPA", search: "Pesquisar…",
    nav: { menu:"Menu", casinos:"Casinos", offers:"Ofertas", betify:"Betify", shop:"Loja", community:"Comunidade", slots:"Slots", stream:"Transmissão", minigames:"Mini Jogos", new:"NOVO" },
    promo:{ lootbox:"Lootbox", everyDep:"Every Dep.", bonus:"5% Bonus", giveaways:"Giveaways", monthly:"Monthly", depcode:"Dep. Code", claim:"Claim Bonus" },
    card:{ min:"Min. Dep.", bonus:"Bónus", cashback:"Cashback", spins:"Free Spins", code:"Código:", terms:"+18 | T&C aplicam-se", showMore:"Mais", back:"Voltar", moreInfo:"Mais informações", visit:"Visitar marca", go:"RESGATAR BÓNUS", copy:"Copiar" },
    social:{ title:"Redes", youtube:"Youtube", instagram:"Instagram", twitch:"Twitch", telegram:"Telegram", tiktok:"TikTok", tiktok_val:"TikTok2", x:"X", copyright:(y)=>`Copyright © ${y} K0MPA` },
    footer:{ terms:"Termos & Condições", privacy:"Política de Privacidade", cookies:"Política de Cookies",
             rg_paragraph:"18+ | Joga com responsabilidade. A maioria das pessoas joga por diversão. Não encares o jogo como forma de ganhar dinheiro. Joga apenas com o que podes perder. Define limites de tempo e dinheiro com antecedência. Nunca tentes recuperar perdas. Não uses o jogo para fugir a problemas do dia a dia.",
             rg_site:"BeGambleAware.org" }
  },
  EN: {
    brand:"K0MPA", search:"Search…",
    nav:{ menu:"Menu", casinos:"Casinos", offers:"Offers", betify:"Betify", shop:"Shop", community:"Community", slots:"Slots", stream:"Stream", minigames:"Mini Games", new:"NEW" },
    promo:{ lootbox:"Lootbox", everyDep:"Every Dep.", bonus:"5% Bonus", giveaways:"Giveaways", monthly:"Monthly", depcode:"Dep. Code", claim:"Claim Bonus" },
    card:{ min:"Min. Dep.", bonus:"Bonus", cashback:"Cashback", spins:"Free Spins", code:"Code:", terms:"+18 | T&C apply", showMore:"More", back:"Back", moreInfo:"More information", visit:"Visit brand", go:"CLAIM BONUS", copy:"Copy" },
    social:{ title:"Socials", youtube:"YouTube", instagram:"Instagram", twitch:"Twitch", telegram:"Telegram", tiktok:"TikTok", tiktok_val:"TikTok2", x:"X", copyright:(y)=>`Copyright © ${y} K0MPA` },
    footer:{ terms:"Terms & Conditions", privacy:"Privacy Policy", cookies:"Cookie Policy",
             rg_paragraph:"18+ | Play responsibly. Most people play for fun and enjoyment. Don’t think of gambling as a way to make money. Only play with money you can afford to lose. Set time and money limits in advance. Never chase losses. Don’t use gambling to escape everyday problems.",
             rg_site:"BeGambleAware.org" }
  }
};
const LangCtx = createContext<{lang:Lang; setLang:(l:Lang)=>void; t:Translations}>({lang:"PT", setLang:()=>{}, t:messages.PT});
function useLang(){ return useContext(LangCtx); }

/* ---------- Data ---------- */
export type Brand = {
  name: string; tag: "HOT" | "NEW" | "TOP"; logo: string; image: string;
  imagePos?: React.CSSProperties["objectPosition"];
  minDep: string; bonus: string; cashback: string; freeSpins: string; code: string; link: string;
  theme?: { accent: string; shadow: string; ring?: string; };
  payments?: Array<"btc"|"mb"|"mbb"|"visa"|"mc">;
};
const brands: Brand[] = [
  {
    name:"Betify",
    tag:"HOT",
    /* usa este logo no chip do topo do card; podes trocar para outro */
    logo:"https://www.ce-at.fr/img/logo.webp",
    image:"https://altacdn.com/bf/img/sliders/ca/150746_bf_website_banner_wsb.webp",
    imagePos:"left center",
    minDep:"20€", bonus:"100%", cashback:"Até 20%", freeSpins:"Até 100FS", code:"K0MPA", link: BETIFY_PROMO_URL,
    theme: { accent:"#22c55e", shadow:"rgba(34,197,94,0.45)", ring:"rgba(34,197,94,.45)" },
    payments:["btc","mb","mbb","visa","mc"]
  },
];

/* Ícones inline (TikTok + X) */
function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M16 3v4.2c1.9 1.3 3.2 1.9 5 2v3c-2.2-.1-3.8-.8-5-1.7v4.8c0 3.2-2.6 5.9-6.2 5.9S3.9 18.5 3.9 15.1c0-3.1 2.3-5.6 5.3-6v3c-1.3.3-2.3 1.5-2.3 3 0 1.7 1.3 3 3 3s3-1.4 3-3.1V3H16z" fill="currentColor"/>
    </svg>
  );
}
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M18.244 2H21.5l-7.62 8.72L23 22h-7.09l-5.54-7.2L3.6 22H.35l8.23-9.41L0 2h7.19l5.08 6.76L18.244 2z" fill="currentColor"/>
    </svg>
  );
}

/* ---------- header (FIXO) ---------- */
function TwitchBadge({ label = "Twitch" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white ring-1 ring-white/20 shadow-sm" style={{ background: TWITCH_PURPLE }}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
      </span>
      {label}
    </span>
  );
}
function HeaderBar({ isLive }: { isLive: boolean }) {
  const { lang, setLang, t } = useLang();
  const hdrRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const update = () => {
      const headerH = hdrRef.current?.offsetHeight ?? 56;
      const globalTopPad = headerH + 12;
      document.documentElement.style.setProperty("--sticky-top", `${globalTopPad + 24}px`);
      document.documentElement.style.setProperty("--hdr-offset", `${globalTopPad}px`);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <header ref={hdrRef} className="fixed top-3 left-0 right-0 z-50">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-8">
        <div className="flex h-12 items-center gap-3 rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/10 px-4 sm:px-5 text-white/90 shadow-[0_8px_30px_rgba(0,0,0,.25)]">
          <div className="mr-1.5 flex items-center gap-2.5">
            <span className="text-white font-black tracking-tight text-[15px] leading-none">{t.brand}</span>
            {isLive && (
              <a href={SOCIAL_LINKS.twitch} target="_blank" rel="noreferrer" aria-label="Abrir Twitch (em direto)" title="Live na Twitch">
                <TwitchBadge />
              </a>
            )}
          </div>

          <div className="relative hidden flex-1 md:flex">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
            <input
              type="search" placeholder={t.search}
              className="h-9 w-full rounded-lg bg-transparent pl-9 pr-3 text-sm text-white placeholder:text-white/55 ring-1 ring-white/15 transition focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>

          <div className="ml-auto">
            <LanguageToggle lang={lang} onChange={setLang} />
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------- Sidebar ---------- */
function Sidebar({ onOpenStream, onOpenBetify }: { onOpenStream: () => void; onOpenBetify: () => void }) {
  const { t, lang } = useLang();

  return (
    <aside className="hidden md:block w-[240px] mx-auto" style={{ position: "sticky", top: "var(--sticky-top,112px)" }}>
      <div
        className="rounded-2xl bg-white/10 backdrop-blur-md p-4 text-white/90 ring-1 ring-white/10 shadow-[0_8px_30px_rgba(0,0,0,.25)] flex flex-col"
        style={{ height: "calc(100vh - var(--sticky-top,112px) - 16px)", overflow: "auto" }}
      >
        <div>
          <div className="mb-2 flex items-center justify-between rounded-xl px-2 py-1">
            <span className="text-sm font-semibold text-white">{t.nav?.menu ?? "Menu"}</span>
            <ChevronRight className="h-4 w-4 text-white/70" />
          </div>

          <nav className="space-y-2">
            <a href={BETIFY_PROMO_URL} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-rose-400/60">
              <span className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                {t.nav.offers}
              </span>
              <Badge className="text-white" style={{ background: "#9146FF" }}>{t.nav.new}</Badge>
            </a>

            {/* Botão Betify dedicado */}
            <button
              type="button"
              onClick={onOpenBetify}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-rose-400/60"
            >
              <img src="https://www.ce-at.fr/img/logo.webp" alt="Betify" className="h-5 w-5 rounded-sm object-contain ring-1 ring-white/15 bg-white/90" />
              <span className="font-semibold">Betify</span>
            </button>

            <div className="my-3 h-px bg-white/10" />

            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/45 pointer-events-none select-none"
              aria-disabled="true"
              title={lang === "PT" ? "Em breve" : "Coming soon"}
            >
              <Store className="h-4 w-4 opacity-70" />
              <span>{t.nav.shop}</span>
              <span className="ml-auto text-[10px] text-white/35">{lang === "PT" ? "em breve" : "coming soon"}</span>
            </div>

            <a href={SOCIAL_LINKS.discord} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-rose-400/60">
              <Users className="h-4 w-4" />
              <span>{t.nav.community}</span>
            </a>

            <button type="button" onClick={onOpenStream} className="w-full text-left flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-rose-400/60">
              <Tv className="h-4 w-4" />
              <span>{t.nav.stream}</span>
            </button>

            {/* Instant Gaming */}
            <a href={SOCIAL_LINKS.instantGaming} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-rose-400/60">
              <Sparkles className="h-4 w-4" />
              <span>Instant Gaming</span>
            </a>
          </nav>
        </div>

        <div className="flex-1" />

        {/* Redes */}
        <footer className="pt-4 border-t border-white/10">
          <div className="mb-2 text-xs font-semibold text-white/80 tracking-wide">Redes</div>

          <ul className="grid grid-cols-2 md:grid-cols-2 gap-x-5 gap-y-3 text-sm">
            <li>
              <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline">
                <Youtube className="h-5 w-5" />
                Youtube
              </a>
            </li>
            <li>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline">
                <Instagram className="h-5 w-5" />
                Instagram
              </a>
            </li>
            <li>
              <a href={SOCIAL_LINKS.twitch} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline">
                <TwitchIcon className="h-5 w-5" />
                Twitch
              </a>
            </li>
            <li>
              <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline">
                <Send className="h-5 w-5" />
                Telegram
              </a>
            </li>
            <li>
              <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline">
                <TikTokIcon className="h-5 w-5" />
                TikTok
              </a>
            </li>
            <li>
              <a href={SOCIAL_LINKS.tiktokValorant} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline">
                <TikTokIcon className="h-5 w-5" />
                TikTok2
              </a>
            </li>
            <li className="col-span-2">
              <a href={SOCIAL_LINKS.x} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline">
                <TwitterIcon className="h-5 w-5" />
                Twitter
              </a>
            </li>
          </ul>

          <div className="mt-3 text-center text-[12px] text-white/55">
            Copyright © {new Date().getFullYear()} K0MPA
          </div>
        </footer>
      </div>
    </aside>
  );
}

/* ---------- helpers ---------- */
function tagVisual(tag: Brand["tag"]) {
  switch (tag) { case "HOT": return { accent:"#ef4444" }; case "NEW": return { accent:"#8b5cf6" }; default: return { accent:"#10b981" }; }
}
function TagBadge({ tag, inline=false, className="", style, accent }: { tag: Brand["tag"]; inline?: boolean; className?: string; style?: React.CSSProperties; accent?: string; }) {
  const Icon = (tag === "HOT" ? Flame : tag === "NEW" ? Sparkles : Crown) as React.ElementType;
  const acc = accent ?? tagVisual(tag).accent;
  return (
    <div className={cn(inline ? "relative inline-flex" : "absolute left-3 top-3 z-20", className)} style={style}>
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: `linear-gradient(180deg, ${acc}, ${acc})`, boxShadow: "0 4px 14px rgba(0,0,0,.18)" }}>
        <Icon className="h-3.5 w-3.5" />
        <span className="uppercase tracking-wide">{tag}</span>
      </span>
    </div>
  );
}

/* ---------- Payment logos ---------- */
function PaymentIcon({ type }: { type: PaymentType }) {
  const src = PAYMENT_ICON_URLS[type];
  const alt = type === "btc" ? "Bitcoin" : type === "mbw" ? "MB WAY" : type === "mb" ? "Multibanco" : type === "visa" ? "VISA" : "Mastercard";
  return <img src={src} alt={alt} loading="lazy" decoding="async" className="h-5 w-5 sm:h-6 sm:w-6 object-contain" draggable={false} />;
}
function PaymentBadge({ type }: { type: PaymentType }) { return (<div className="h-10 w-11 sm:h-11 sm:w-12 rounded-xl bg-white ring-1 ring-black/10 shadow-sm flex items-center justify-center"><PaymentIcon type={type} /></div>); }
function PaymentRibbon({ methods }: { methods: string[] }) {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-30 flex gap-2 sm:gap-3">
      {methods.map((m) => (<div key={m} className="pointer-events-auto"><PaymentBadge type={normalizePaymentType(m)} /></div>))}
    </div>
  );
}
function FancyCTA({ href, label, accent }: { href: string; label: string; accent: string; }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex h-12 w-full items-center justify-center rounded-2xl px-4 text-center text-sm font-extrabold text-white transition hover:brightness-110 ring-1 ring-white/10 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-rose-400/60" style={{ background: `linear-gradient(180deg, ${accent}, ${rgba(accent, 0.85)})`, boxShadow: `0 8px 20px ${rgba(accent, 0.35)}` }}>
      {label}
    </a>
  );
}

/* ---------- Twitch embed helpers ---------- */
function buildTwitchEmbedUrl(channel: string) {
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const parents = new Set<string>([
    host,
    host.startsWith("www.") ? host.slice(4) : `www.${host}`,
    "localhost",
    "127.0.0.1",
  ]);
  const qsParents = Array.from(parents).map(p => `parent=${encodeURIComponent(p)}`).join("&");
  return `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&autoplay=1&muted=1&${qsParents}`;
}

/* ---------- Overlay (full-screen) ---------- */
function StreamOverlay({ channel, onClose }: { channel: string; onClose: () => void }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.documentElement.style.overflow = prev; };
  }, [onClose]);
  const src = buildTwitchEmbedUrl(channel);
  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-5xl rounded-2xl ring-1 ring-white/15 shadow-[0_20px_80px_rgba(0,0,0,.6)] overflow-hidden">
        <div className="flex items-center justify-between bg-black/50 px-4 py-2 text-white">
          <div className="flex items-center gap-2"><TwitchBadge /><span className="text-sm font-semibold">/{channel}</span></div>
          <button onClick={onClose} className="rounded-md px-3 py-1 text-sm font-semibold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-rose-400/60">Fechar</button>
        </div>
        <div className="bg-black">
          <div className="relative w-full" style={{ paddingTop:"56.25%" }}>
            <iframe title={`twitch-${channel}-overlay`} src={src} allow="autoplay; picture-in-picture; fullscreen; encrypted-media" allowFullScreen frameBorder="0" scrolling="no" className="absolute inset-0 h-full w-full border-0" />
          </div>
        </div>
      </div>
    </div>
  );
  return mounted ? createPortal(content, document.body) : null;
}

/* ---------- Stream (hero) ---------- */
function StreamHero({ channel }: { channel: string }) {
  const src = buildTwitchEmbedUrl(channel);
  return (
    <section>
      <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-[0_12px_40px_rgba(0,0,0,.35)] bg-black">
        <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
          <iframe
            title={`twitch-${channel}-hero`}
            src={src}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            frameBorder="0"
            scrolling="no"
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>
    </section>
  );
}

/* Twitter (bird) */
function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M23 4.8c-.8.4-1.7.7-2.6.8a4.55 4.55 0 0 0 2-2.5 9.06 9.06 0 0 1-2.9 1.1 4.51 4.51 0 0 0-7.8 4.1A12.8 12.8 0 0 1 3 3.6a4.5 4.5 0 0 0 1.4 6 4.48 4.48 0 0 1-2-.6v.1a4.52 4.52 0 0 0 3.6 4.4c-.5.1-1 .2-1.6.1.4 1.3 1.7 2.3 3.3 2.3A9.05 9.05 0 0 1 2 19.5a12.77 12.77 0 0 0 6.9 2c8.3 0 12.9-6.9 12.6-13 0-.2 0-.4 0-.6A9.12 9.12 0 0 0 23 4.8z"
      />
    </svg>
  );
}

/* ---------- YouTube GRID (só vídeos, ignora shorts) ---------- */
type YtItem = { id: string; title: string; thumb: string };

function YouTubeGrid({ channelId, limit = 8 }: { channelId: string; limit?: number }) {
  const [items, setItems] = useState<YtItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!channelId) return;
    const url = `https://r.jina.ai/http://www.youtube.com/channel/${encodeURIComponent(channelId)}/videos`;
    (async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const html = await res.text();
        const re = /href="\/watch\?v=([a-zA-Z0-9_-]{11})"[^>]*\s+title="([^"]+)"/g;
        const seen = new Set<string>();
        const list: YtItem[] = [];
        let m: RegExpExecArray | null;
        while ((m = re.exec(html)) && list.length < limit + 2) {
          const id = m[1];
          const title = m[2];
          if (seen.has(id)) continue;
          seen.add(id);
          list.push({ id, title, thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` });
        }
        if (list.length === 0) throw new Error("no videos parsed");
        setItems(list.slice(0, limit));
        setFailed(false);
      } catch {
        setItems([]);
        setFailed(true);
      }
    })();
  }, [channelId, limit]);

  const last = items?.[0];

  return (
    <section className="space-y-3">
      <h2 className="text-white/90 text-base font-bold">Últimos vídeos</h2>

      {items === null && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 opacity-60">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-video rounded-xl bg-white/10 animate-pulse" />
          ))}
        </div>
      )}

      {!!items && items.length > 0 && (
        <>
          {last && (
            <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black">
              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                <iframe
                  title={last.title || "Último vídeo"}
                  src={`https://www.youtube-nocookie.com/embed/${last.id}`}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.slice(1).map((v) => (
              <a
                key={v.id}
                href={`https://www.youtube.com/watch?v=${v.id}`}
                target="_blank"
                rel="noreferrer"
                className="group rounded-xl overflow-hidden ring-1 ring-white/10 bg-white/5 hover:bg-white/10 transition block"
                title={v.title}
              >
                <div className="relative aspect-video bg-black">
                  <img src={v.thumb} alt={v.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-3">
                  <div className="line-clamp-2 text-sm font-semibold text-white/90 group-hover:text-white">{v.title}</div>
                  <div className="mt-1 text-[11px] text-white/60">YouTube</div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}

      {!!items && items.length === 0 && failed && (
        <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black">
          <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
            <iframe
              title="Uploads"
              src={`https://www.youtube-nocookie.com/embed?listType=playlist&list=${"UU" + channelId.slice(2)}`}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------- Brand Card ---------- */
function FancyStat({ label, value, icon: Icon, accent }: { label: string; value: string; icon: React.ElementType; accent: string; }) {
  return (
    <div className="relative overflow-hidden rounded-2xl px-3 py-2 text-white ring-1 backdrop-blur shadow-[0_6px_18px_rgba(0,0,0,.28)]" style={{ minHeight:74, background:"linear-gradient(180deg, rgba(15,23,42,.86) 0%, rgba(15,23,42,.78) 100%)", borderColor:"rgba(255,255,255,.08)" }}>
      <span aria-hidden className="absolute left-2 right-2 top-0 h-[3px]" style={{ background:`linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center leading-tight">
        <Icon className="h-4 w-4 text-white/85" />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">{label}</p>
        <p className="text-sm font-extrabold text-white">{value}</p>
      </div>
    </div>
  );
}
function StatTile({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent: string; }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl p-3.5 transition bg-white/5 ring-1 ring-white/10 shadow-[0_2px_10px_rgba(15,23,42,0.06)] focus-within:ring-2 focus-within:ring-rose-400/60" style={{ backgroundImage:"radial-gradient(120% 100% at 10% 0%, rgba(148,163,184,0.10) 0%, rgba(255,255,255,0) 60%)" }}>
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background:`linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="flex items-center gap-2 text-white/70">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg ring-1 ring-white/10" style={{ background:`${accent}14` }}>
          <Icon className="h-3.5 w-3.5 text-white/90" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1.5 text-2xl font-extrabold leading-none text-white">{value}</div>
    </div>
  );
}
function BrandPill({ logo, name }: { logo?: string; name: string }) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-30">
      <div className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 ring-1 ring-black/10 shadow-md">
        {logo ? <img src={logo} alt={name} className="h-5 w-5 rounded-sm object-contain" /> : null}
        <span className="text-sm font-bold text-slate-900">{name}</span>
      </div>
    </div>
  );
}
function BrandCard({ b }: { b: Brand }) {
  const { t } = useLang();
  const [flip, setFlip] = useState(false);
  const CARD_H = 400;
  const base = tagVisual(b.tag);
  const acc  = b.theme?.accent ?? base.accent;
  const shadow = b.theme?.shadow ?? rgba(acc, 0.35);
  const methods = b.payments && b.payments.length ? b.payments : ["btc","mbw","mb","visa","mc"];

  return (
    <Card className="relative rounded-3xl bg-white/70 backdrop-blur-sm ring-1 ring-white/10" style={{ height:CARD_H, perspective:"1200px", overflow:"visible", boxShadow:`0 14px 40px ${shadow}` }}>
      <BrandPill logo={b.logo} name={b.name} />
      <div className="absolute inset-0 transition-transform duration-500" style={{ transformStyle:"preserve-3d", transform: flip ? "rotateY(180deg)" : "none" }}>
        {/* FRONT */}
        <div className="absolute inset-0" style={{ backfaceVisibility:"hidden" }}>
          <TagBadge tag={b.tag} accent={acc} />
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <img src={b.image} alt={b.name} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: b.imagePos ?? "center" }} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/0 to-black/50" />
            <div className="absolute right-4 top-4 z-10">
              <button onClick={()=>setFlip(true)} className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 ring-1 ring-black/10 backdrop-blur hover:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/60">
                {t.card.showMore}
              </button>
            </div>

            <div className="absolute inset-x-4 bottom-4">
              <div className="relative rounded-2xl bg-black/35 p-3 backdrop-blur-md ring-1 ring-white/10 overflow-visible">
                <PaymentRibbon methods={methods} />
                <div className="pointer-events-none absolute left-6 right-6 -top-2 h-2 rounded-b-xl bg-gradient-to-b from-black/40 to-transparent" />
                <div className="grid grid-cols-4 gap-2">
                  <FancyStat icon={Coins} label={t.card.min} value={b.minDep} accent={acc} />
                  <FancyStat icon={Percent} label={t.card.bonus} value={b.bonus} accent={acc} />
                  <FancyStat icon={TrendingUp} label={t.card.cashback} value={b.cashback} accent={acc} />
                  <FancyStat icon={Sparkles} label={t.card.spins} value={b.freeSpins} accent={acc} />
                </div>
                <div className="pt-2 pb-1 text-[11px] font-semibold tracking-wide text-white/75 text-center">{t.card.terms}</div>
                <div className="pt-1"><FancyCTA href={b.link} label={t.card.go} accent={acc} /></div>
              </div>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div className="absolute inset-0" style={{ backfaceVisibility:"hidden", transform:"rotateY(180deg)" }}>
          <div className="relative flex h-full flex-col rounded-3xl bg-[linear-gradient(180deg,rgba(28,28,28,.85),rgba(28,28,28,.78))] p-5 overflow-hidden ring-1 ring-white/8" style={{ boxShadow:`0 16px 40px ${shadow}` }}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-bold text-white">{t.card.moreInfo}</span>
                <span className="h-1 w-14 rounded-full" style={{ background:acc }} />
              </div>
              <TagBadge tag={b.tag} inline accent={acc} />
            </div>

            <div className="space-y-3 text-white/90">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <StatTile icon={Coins} label="MIN. DEP." value={b.minDep} accent={acc} />
                <StatTile icon={Percent} label="BÓNUS" value={b.bonus} accent={acc} />
                <StatTile icon={TrendingUp} label="CASHBACK" value={b.cashback} accent={acc} />
                <StatTile icon={Sparkles} label="FREE SPINS" value={b.freeSpins} accent={acc} />
              </div>

              <div className="grid grid-cols-[1fr,auto] items-center gap-3">
                <div className="h-11 rounded-xl bg-white/5 ring-1 ring-white/10 px-3 flex items-center text-sm text-white/90">
                  <span className="text-white/60">{t.card.code}</span>
                  <span className="ml-2 font-semibold tracking-wide">{b.code}</span>
                </div>
                <button onClick={async()=>{ try{ await navigator.clipboard.writeText(b.code);}catch{} }} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white/5 ring-1 ring-white/10 px-4 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-rose-400/60">
                  <Copy className="h-4 w-4" />
                  {t.card.copy}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="grid grid-cols-2 items-stretch gap-3">
                <Button className="h-11 rounded-2xl bg-white/8 ring-1 ring-white/12 hover:bg-white/12 text-sm text-white" onClick={()=>setFlip(false)}>{t.card.back}</Button>
                <a href={b.link} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-rose-400/60" style={{ background:`linear-gradient(135deg, ${acc}, ${rgba(acc,0.85)})`, boxShadow:`0 8px 20px ${rgba(acc,0.35)}` }}>
                  {t.card.visit}
                </a>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl opacity-60 blur-2xl" style={{ background:`radial-gradient(80% 60% at 10% 0%, ${rgba(acc,0.13)} 0%, transparent 60%)` }} />
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Página Betify ---------- */
function BetifyLanding({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="rounded-3xl p-6 sm:p-8 ring-1 ring-white/10 shadow-[0_16px_60px_rgba(0,0,0,.35)] text-white"
        style={{ background: "linear-gradient(180deg,#5b21b6 0%, #4c1d95 50%, #3b0764 100%)" }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="https://www.ce-at.fr/img/logo.webp" alt="Betify" className="h-9 w-9 rounded bg-white/90 ring-1 ring-black/10 object-contain" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Betify</h1>
              <p className="text-white/80 text-sm">How to play at Betify and unlock the best VIP program</p>
            </div>
          </div>
          <Button onClick={onBack} className="bg-white/10 text-white hover:bg-white/15 ring-1 ring-white/20"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-[1.2fr,.8fr]">
          <div className="rounded-2xl bg-white/10 ring-1 ring-white/15 p-5">
            <div className="text-lg font-extrabold mb-3">Sign up with code <span className="text-lime-300">K0MPA</span></div>
            <ol className="space-y-3 text-sm">
              <li><span className="font-bold">1.</span> Create an account at Betify.</li>
              <li><span className="font-bold">2.</span> Use the promo code <span className="font-bold">K0MPA</span> when registering.</li>
              <li><span className="font-bold">3.</span> Enjoy all promotions, cashback and free spins.</li>
            </ol>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a href={BETIFY_SIGNUP_URL} target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white bg-lime-600 hover:brightness-110 ring-1 ring-white/10">
                REGISTAR AGORA <ExternalLink className="h-4 w-4" />
              </a>
              <a href={BETIFY_PROMO_URL} target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/15 ring-1 ring-white/15">
                VER PROMOÇÕES
              </a>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden ring-1 ring-white/15 bg-black/40">
            <div className="relative w-full" style={{ paddingTop: "100%" }}>
              <img src="https://altacdn.com/bf/img/sliders/ca/150746_bf_website_banner_wsb.webp" alt="Betify preview" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </div>
        </div>

        {/* cards pequenos */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl p-5 bg-white/10 ring-1 ring-white/15">
            <div className="text-sm font-semibold text-white/80 mb-2">Cashback</div>
            <div className="text-2xl font-extrabold">Até 20%</div>
            <p className="text-white/70 text-sm mt-1">Recebe cashback semanal nas tuas apostas.</p>
          </div>
          <div className="rounded-2xl p-5 bg-white/10 ring-1 ring-white/15">
            <div className="text-sm font-semibold text-white/80 mb-2">Free Spins</div>
            <div className="text-2xl font-extrabold">Até 100FS</div>
            <p className="text-white/70 text-sm mt-1">Campanhas com giros grátis nas melhores slots.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- Footer ---------- */
function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();
  return (
    <footer className="mx-auto w-full max-w-7xl px-6 sm:px-8 pb-8">
      <div className="rounded-2xl bg-black/35 backdrop-blur-md ring-1 ring-white/10 text-white/80 px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,.28)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold tracking-tight text-white">K0MPA</span>
            <span className="text-xs text-white/60">© {year}</span>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-semibold">
            <span aria-disabled="true" className="text-white/65 cursor-not-allowed select-none">Termos & Condições</span>
            <span aria-disabled="true" className="text-white/65 cursor-not-allowed select-none">Política de Privacidade</span>
            <span aria-disabled="true" className="text-white/65 cursor-not-allowed select-none">Política de Cookies</span>
          </nav>
          <a href="https://www.begambleaware.org/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs hover:text-white/90" title="BeGambleAware.org">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur text-[11px] leading-none font-bold select-none">18+</span>
            BeGambleAware.org
          </a>
        </div>
        <div className="my-3 h-px bg-white/10" />
        <p className="text-[12px] leading-snug text-white/55">{t.footer.rg_paragraph}</p>
      </div>
    </footer>
  );
}

/* ---------- Idioma ---------- */
function LanguageToggle({ lang, onChange }: { lang:"PT"|"EN"; onChange:(l:"PT"|"EN")=>void; }) {
  const base = "text-sm font-semibold tracking-wide transition-colors";
  const inactive = "text-white/70 hover:text-white/90";
  const active = "text-white border-b-2 border-[#9146FF] pb-0.5";
  return (
    <div className="inline-flex items-center gap-3">
      <button type="button" aria-selected={lang==="PT"} onClick={()=>onChange("PT")} className={`${base} ${lang==="PT"?active:inactive}`}>PT</button>
      <button type="button" aria-selected={lang==="EN"} onClick={()=>onChange("EN")} className={`${base} ${lang==="EN"?active:inactive}`}>EN</button>
    </div>
  );
}

/* ---------- Background ---------- */
function BackgroundLayer() {
  return (
    <div className="absolute inset-0 -z-10 pointer-events-none"
      style={{ background: "linear-gradient(180deg, #14070a 0%, #10060a 45%, #0b0507 100%)" }}>
      <div aria-hidden
        style={{
          position: "absolute", inset: 0,
          background:
            "radial-gradient(60% 40% at 15% 5%, rgba(244,63,94,.28) 0%, rgba(244,63,94,0) 70%)," +
            "radial-gradient(55% 45% at 85% 95%, rgba(244,63,94,.22) 0%, rgba(244,63,94,0) 75%)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}

/* ---------- Root ---------- */
type Route = "home" | "betify";

export default function CasinoPartnerHub() {
  const [lang, setLang] = useState<Lang>("PT");
  const t = useMemo(() => messages[lang], [lang]);
  const isLive = useLiveAutoTwitch(TWITCH_CHANNEL, 60_000);
  const [showOverlay, setShowOverlay] = useState(false);

  const [route, setRoute] = useState<Route>("home");

  useEffect(() => {
    if ((import.meta as any)?.env?.DEV && brands.length < 1) console.warn("[TEST] expected >=1 brand");
  }, []);

  return (
    <LangCtx.Provider value={{ lang, setLang, t }}>
      <div className="relative min-h-screen isolation-isolate text-slate-900 flex flex-col overflow-x-clip">
        <BackgroundLayer />
        <div style={{ height: "var(--hdr-offset, 68px)" }} aria-hidden />
        <HeaderBar isLive={isLive} />

        <div className="flex-1">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-6 py-8 sm:px-8 md:grid-cols-[240px,1fr] items-start">
            <Sidebar
              onOpenStream={() => setShowOverlay(true)}
              onOpenBetify={() => setRoute("betify")}
            />

            <main className="space-y-10">
              {route === "home" ? (
                <>
                  <StreamHero channel={TWITCH_CHANNEL} />
                  <div className="grid gap-8 lg:gap-10 md:grid-cols-2">
                    {brands.map((b, i) => (
                      <React.Fragment key={b.name + i}>
                        <BrandCard b={b} />
                      </React.Fragment>
                    ))}
                  </div>
                  <YouTubeGrid channelId={YT_CHANNEL_ID} limit={8} />
                </>
              ) : (
                <BetifyLanding onBack={() => setRoute("home")} />
              )}
            </main>
          </div>
        </div>

        <Footer />
        {showOverlay && <StreamOverlay channel={TWITCH_CHANNEL} onClose={() => setShowOverlay(false)} />}
      </div>
    </LangCtx.Provider>
  );
}
