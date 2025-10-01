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
const BETIFY_PROMO_URL  = "https://record.betify.partners/_8zlSykIFj1eu11z-n_bVh2Nd7ZgqdRLk/1/";       // <- altera

/* ---------- utils ---------- */
function cn(...a: Array<string | false | undefined>) { return a.filter(Boolean).join(" "); }
function hexToRgb(hex: string) {
  const c = hex.replace("#", "");
  const n = parseInt(c.length === 3 ? c.split("").map(x=>x+x).join("") : c, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgba(hex: string, a: number) { const { r, g, b } = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
const TWITCH_PURPLE = "#9146FF";

/* ---------- Betify: duas promoções ---------- */
type Promo = {
  id: "every-dep" | "fs-monthly";
  icon: React.ElementType;
  href: string;
};

const betifyPromos: Promo[] = [
  { id: "every-dep", icon: Percent, href: BETIFY_PROMO_URL },
  { id: "fs-monthly", icon: Sparkles, href: BETIFY_PROMO_URL },
];

/* links das redes */
const SOCIAL_LINKS = {
  youtube:  "https://youtube.com/@k0mpa",
  instagram:"https://www.instagram.com/k0mpa_",
  twitch:   "https://twitch.tv/k0mpa",
  telegram: "https://t.me/+L7INF90tYokwMDY0",
  discord:  "https://discord.gg/JMe6xxU",
  tiktok:        "https://www.tiktok.com/@k0mpa_",
  tiktokValorant:"https://www.tiktok.com/@k0mpavalorant",
  x:             "https://x.com/k0mpafps",
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

  /* NOVO */
  latestVideos: string;

  betify: {
    title: string; subtitle: string;
    steps: { one: string; two_prefix: string; two_code: string; two_suffix: string; three: string; };
    cta_signup: string; cta_promos: string; promo_label: string;
    promos: {
      "every-dep": { title: string; blurb: string; highlight: string; };
      "fs-monthly": { title: string; blurb: string; highlight: string; };
    };
  };
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
             rg_site:"BeGambleAware.org" },latestVideos: "Últimos vídeos",


betify: {
  title: "Betify",
  subtitle: "Como jogar na Betify e desbloquear o melhor VIP",
  steps: {
    one: "Cria conta na Betify.",
    two_prefix: "Usa o código",
    two_code: "K0MPA",
    two_suffix: "no registo.",
    three: "Aproveita promoções, cashback e free spins."
  },
  cta_signup: "REGISTAR AGORA",
  cta_promos: "VER PROMOÇÕES",
  promo_label: "Promo",
  promos: {
    "every-dep": {
      title: "Campanhas e Free Spins",
      blurb: "Betify (Depósito Mínimo 20€ — 40FS sem wager na Shaolin Panda).",
      highlight: "Até 40FS"
    },
    "fs-monthly": {
      title: "Campanhas e Free Spins",
      blurb: "Betify (Depósito 50€ — 100FS sem wager na Shaolin Panda).",
      highlight: "Até 100FS"
    }
  }
}
  },

  EN: {
    brand:"K0MPA", search:"Search…",
    nav:{ menu:"Menu", casinos:"Casinos", offers:"Offers", betify:"Betify", shop:"Shop", community:"Community", slots:"Slots", stream:"Stream", minigames:"Mini Games", new:"NEW" },
    promo:{ lootbox:"Lootbox", everyDep:"Every Dep.", bonus:"5% Bonus", giveaways:"Giveaways", monthly:"Monthly", depcode:"Dep. Code", claim:"Claim Bonus" },
    card:{ min:"Min. Dep.", bonus:"Bonus", cashback:"Cashback", spins:"Free Spins", code:"Code:", terms:"+18 | T&C apply", showMore:"More", back:"Back", moreInfo:"More information", visit:"Visit brand", go:"CLAIM BONUS", copy:"Copy" },
    social:{ title:"Socials", youtube:"YouTube", instagram:"Instagram", twitch:"Twitch", telegram:"Telegram", tiktok:"TikTok", tiktok_val:"TikTok2", x:"X", copyright:(y)=>`Copyright © ${y} K0MPA` },
    footer:{ terms:"Terms & Conditions", privacy:"Privacy Policy", cookies:"Cookie Policy",
             rg_paragraph:"18+ | Play responsibly. Most people play for fun and enjoyment. Don’t think of gambling as a way to make money. Only play with money you can afford to lose. Set time and money limits in advance. Never chase losses. Don’t use gambling to escape everyday problems.",
             rg_site:"BeGambleAware.org" },latestVideos: "Latest videos",


betify: {
  title: "Betify",
  subtitle: "How to play on Betify and unlock the best VIP",
  steps: {
    one: "Create an account on Betify.",
    two_prefix: "Use the code",
    two_code: "K0MPA",
    two_suffix: "during signup.",
    three: "Enjoy promotions, cashback and free spins."
  },
  cta_signup: "SIGN UP NOW",
  cta_promos: "SEE PROMOTIONS",
  promo_label: "Promo",
  promos: {
    "every-dep": {
      title: "Campaigns & Free Spins",
      blurb: "Betify (Min. deposit €20 — 40FS no wager on Shaolin Panda).",
      highlight: "Up to 40FS"
    },
    "fs-monthly": {
      title: "Campaigns & Free Spins",
      blurb: "Betify (Deposit €50 — 100FS no wager on Shaolin Panda).",
      highlight: "Up to 100FS"
    }
  }
}
  }
};const LangCtx = createContext<{lang:Lang; setLang:(l:Lang)=>void; t:Translations}>({lang:"PT", setLang:()=>{}, t:messages.PT});
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
    logo:"https://www.ce-at.fr/img/logo.webp",
    image:"https://betify.org/wp-content/uploads/2025/02/betify-app-login.webp",
    imagePos:"left",
    minDep:"20€", bonus:"100%", cashback:"20%",     freeSpins:"100FS", code:"K0MPA", link: BETIFY_PROMO_URL,
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
<span className="brand-font text-white text-[22px] leading-none" title={t.brand}>
  {t.brand}
</span>
  {isLive && (
    <a href={SOCIAL_LINKS.twitch} target="_blank" rel="noreferrer" title="Live na Twitch">
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

function DiscordIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 199" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M216.856 16.597A208.625 208.625 0 0 0 172.135 0l-2.04 4.257c20.272 5.016 34.997 12.26 46.67 20.341-19.734-10.2-39.13-17.03-58.75-20.341-14.003-2.404-27.39-2.404-40.566 0-17.95 3.1-35.17 9.32-58.75 20.34 11.23-8.08 26.39-15.325 46.67-20.34L103.33 0a208.84 208.84 0 0 0-44.72 16.597C18.64 60.842 12.04 103.02 15.57 144.61c18.735 13.977 36.84 22.58 54.69 28.14l11.72-18.9c-6.44-2.48-12.66-5.54-18.61-9.19 1.55-1.14 3.07-2.33 4.56-3.58 36.04 16.86 75.2 16.86 111.24 0 1.49 1.25 3.01 2.44 4.56 3.58-5.95 3.65-12.17 6.71-18.6 9.19l11.71 18.9c17.86-5.56 35.96-14.16 54.7-28.14 4.36-50.71-7.52-92.73-35.68-128.01ZM95.71 128.76c-10.6 0-19.26-9.92-19.26-22.15 0-12.22 8.49-22.17 19.26-22.17s19.33 9.95 19.26 22.17c0 12.23-8.66 22.15-19.26 22.15Zm64.58 0c-10.6 0-19.26-9.92-19.26-22.15 0-12.22 8.49-22.17 19.26-22.17 10.78 0 19.26 9.95 19.26 22.17 0 12.23-8.66 22.15-19.26 22.15Z"
      />
    </svg>
  );
}


/* ---------- Sidebar ---------- */
function Sidebar({
  onOpenStream,
  onOpenBetify,
  onGoHome,
  onOpenCommunity, // ⬅️ novo
}: {
  onOpenStream: () => void;
  onOpenBetify: () => void;
  onGoHome: () => void;
  onOpenCommunity: () => void; // ⬅️ novo
}) {
  const { t, lang } = useLang();

  return (
    <aside
      className="hidden md:block w-[240px] mx-auto"
      style={{ position: "sticky", top: "var(--sticky-top,112px)" }}
    >
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
            {/* Ofertas -> vai para HOME */}
            <button
              type="button"
              onClick={onGoHome}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-rose-400/60"
            >
              <span className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                {t.nav.offers}
              </span>
              <Badge className="text-white" style={{ background: "#9146FF" }}>
                {t.nav.new}
              </Badge>
            </button>

            {/* Betify */}
            <button
              type="button"
              onClick={onOpenBetify}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-rose-400/60"
            >
              <span className="flex items-center gap-2">
                <span
                  className="inline-block w-4 h-4 rounded-sm opacity-0 ring-1 ring-white/15"
                  aria-hidden
                />
                <span className="font-extrabold text-white">{t.nav.betify}</span>
              </span>
              <Badge className="text-white" style={{ background: "#16a34a" }}>
                {t.betify.promo_label}
              </Badge>
            </button>

            <div className="my-3 h-px bg-white/10" />

            {/* Loja (disabled) */}
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/45 pointer-events-none select-none"
              aria-disabled="true"
              title={lang === "PT" ? "Em breve" : "Coming soon"}
            >
              <Store className="h-4 w-4 opacity-70" />
              <span>{t.nav.shop}</span>
              <span className="ml-auto text-[10px] text-white/35">
                {lang === "PT" ? "em breve" : "coming soon"}
              </span>
            </div>

            {/* Comunidade -> abre modal */}
            <button
              type="button"
              onClick={onOpenCommunity}
              className="w-full text-left flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-rose-400/60"
            >
              <Users className="h-4 w-4" />
              <span>{t.nav.community}</span>
            </button>

            {/* Stream (overlay) */}
            <button
              type="button"
              onClick={onOpenStream}
              className="w-full text-left flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-rose-400/60"
            >
              <Tv className="h-4 w-4" />
              <span>{t.nav.stream}</span>
            </button>

            {/* Instant Gaming */}
            <a
              href={SOCIAL_LINKS.instantGaming}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-rose-400/60"
            >
              <Sparkles className="h-4 w-4" />
              <span>Instant Gaming</span>
            </a>
          </nav>
        </div>

        <div className="flex-1" />

        {/* Redes */}
        <footer className="pt-4 border-t border-white/10">
          <div className="mb-2 text-xs font-semibold text-white/80 tracking-wide">
            {t.social.title}
          </div>
          <ul className="grid grid-cols-2 md:grid-cols-2 gap-x-5 gap-y-3 text-sm">
            <li>
              <a
                href={SOCIAL_LINKS.twitch}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                <TwitchIcon className="h-5 w-5" />
                Twitch
              </a>
            </li>
            <li>
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                <Instagram className="h-5 w-5" />
                Instagram
              </a>
            </li>
            <li>
              <a
                href={SOCIAL_LINKS.tiktok}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                <TikTokIcon className="h-5 w-5" />
                TikTok
              </a>
            </li>
            <li>
              <a
                href={SOCIAL_LINKS.tiktokValorant}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                <TikTokIcon className="h-5 w-5" />
                TikTok2
              </a>
            </li>
            <li>
              <a
                href={SOCIAL_LINKS.telegram}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                <Send className="h-5 w-5" />
                Telegram
              </a>
            </li>
            <li>
              <a
                href={SOCIAL_LINKS.discord}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                <DiscordIcon className="h-5 w-5" />
                Discord
              </a>
            </li>
            <li>
              <a
                href={SOCIAL_LINKS.youtube}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                <Youtube className="h-5 w-5" />
                Youtube
              </a>
            </li>
            <li>
              <a
                href={SOCIAL_LINKS.x}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                <TwitterIcon className="h-5 w-5" />
                Twitter
              </a>
            </li>
          </ul>

 <div className="mt-3 text-center text-[12px] text-white/55">
   Copyright © {new Date().getFullYear()} <span className="brand-font">K0MPA</span>
 </div>
        </footer>
      </div>
    </aside>
  );
}


/* ---------- helpers ---------- */
function cap(value: string, lang: Lang) {
  const prefix = lang === "PT" ? "Até" : "Up to";
  // se o valor já vier com "até"/"up to", não duplica
  if (/^\s*(até|up to)\b/i.test(value)) return value;
  return `${prefix} ${value}`;
}

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
// Discord (usa o SVG oficial via URL)
function DiscordIconImg(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/9/98/Discord_logo.svg"
      alt="Discord"
      {...props}
      className={cn("h-5 w-5 object-contain", props.className)}
      draggable={false}
      loading="lazy"
      decoding="async"
    />
  );
}

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
function CommunityModal({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [onClose]);

  const content = (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white/10 ring-1 ring-white/15 text-white shadow-[0_20px_80px_rgba(0,0,0,.6)] p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{t.nav.community}</h3>
          <button onClick={onClose} className="rounded-md px-3 py-1 text-sm font-semibold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-rose-400/60">
            Fechar
          </button>
        </div>

        <p className="mt-1 text-sm text-white/70">Escolhe onde queres entrar:</p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={SOCIAL_LINKS.discord}
            target="_blank" rel="noreferrer"
            className="group flex items-center gap-3 rounded-xl bg-white/10 ring-1 ring-white/15 px-4 py-3 hover:bg-white/15"
          >
            <DiscordIcon className="h-5 w-5" />
            <div className="flex-1">
              <div className="text-sm font-bold">Discord</div>
              <div className="text-xs text-white/60">Chats, roles e anúncios</div>
            </div>
            <ExternalLink className="h-4 w-4 opacity-70 group-hover:opacity-100" />
          </a>

          <a
            href={SOCIAL_LINKS.telegram}
            target="_blank" rel="noreferrer"
            className="group flex items-center gap-3 rounded-xl bg-white/10 ring-1 ring-white/15 px-4 py-3 hover:bg-white/15"
          >
            <Send className="h-5 w-5" />
            <div className="flex-1">
              <div className="text-sm font-bold">Telegram</div>
              <div className="text-xs text-white/60">Canal rápido de updates</div>
            </div>
            <ExternalLink className="h-4 w-4 opacity-70 group-hover:opacity-100" />
          </a>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(content, document.body) : null;
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
/* ---------- Embeds pequenos lado a lado ---------- */
function TwitchEmbedMini({ channel }: { channel: string }) {
  const src = buildTwitchEmbedUrl(channel);
  return (
    <section className="min-w-0 rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-[0_8px_26px_rgba(0,0,0,.35)] bg-black">
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <iframe
          title={`twitch-${channel}-mini`}
          src={src}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          frameBorder="0"
          scrolling="no"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    </section>
  );
}

function YouTubeLastMini({ channelId }: { channelId: string }) {
  const [vid, setVid] = React.useState<{ id: string; title: string } | null>(null);
  const [failed, setFailed] = React.useState(false);
  const isShorts = (s: string) => /\bshorts\b|#shorts/i.test(s);

React.useEffect(() => {
  let cancelled = false;
  const url = `https://r.jina.ai/http://www.youtube.com/channel/${encodeURIComponent(channelId)}/videos`;
  (async () => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      const html = await res.text();

      const re = /href="\/watch\?v=([a-zA-Z0-9_-]{11})"[^>]*\s+title="([^"]+)"/g;
      let m: RegExpExecArray | null, found: { id: string; title: string } | null = null;

      while ((m = re.exec(html))) {
        const id = m[1], title = m[2];
        if (!isShorts(title)) { found = { id, title }; break; }  // ⬅️ ignora Shorts
      }

      if (!cancelled) setVid(found);
      if (!cancelled && !found) setFailed(true);
    } catch {
      if (!cancelled) setFailed(true);
    }
  })();
  return () => { cancelled = true; };
}, [channelId]);

  // uploads playlist id = "UU" + channel id sem "UC"
  const uploadsPlaylist = "UU" + channelId.slice(2);

  return (
    <section className="min-w-0 rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-[0_8px_26px_rgba(0,0,0,.35)] bg-black">
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        {vid ? (
          <iframe
            title={vid.title}
            src={`https://www.youtube-nocookie.com/embed/${vid.id}`}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            loading="lazy"
          />
        ) : failed ? (
          <iframe
            title="Uploads"
            src={`https://www.youtube-nocookie.com/embed?listType=playlist&list=${uploadsPlaylist}`}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-white/5 animate-pulse" />
        )}
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
function BrandCard({ b }: { b: Brand }) {
  const { t, lang } = useLang();
  const [flip, setFlip] = useState(false);
  const CARD_H = 400;
  const base = tagVisual(b.tag);
  const acc  = b.theme?.accent ?? base.accent;
  const shadow = b.theme?.shadow ?? rgba(acc, 0.35);
  const methods = b.payments && b.payments.length ? b.payments : ["btc","mbw","mb","visa","mc"];

  return (
    <Card className="relative rounded-3xl bg-white/70 backdrop-blur-sm ring-1 ring-white/10" style={{ height:CARD_H, perspective:"1200px", overflow:"visible", boxShadow:`0 14px 40px ${shadow}` }}>
      <div className="absolute inset-0 transition-transform duration-500" style={{ transformStyle:"preserve-3d", transform: flip ? "rotateY(180deg)" : "none" }}>
        {/* FRONT */}
        <div className="absolute inset-0" style={{ backfaceVisibility:"hidden" }}>
          <TagBadge tag={b.tag} accent={acc} />
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <img
  src={b.image}
  alt={b.name}
  className="absolute inset-0 h-full w-full object-cover"
  style={{
    // bleed extra para tapar quaisquer 1px brancos nas bordas
    right: "-3px",
    width: "calc(100% + 6px)",

    // manter a imagem 10px para a esquerda (podes afinar -8/-12)
    objectPosition: b.imagePos === "left" ? "-10px center" : (b.imagePos ?? "center"),

    // evita linhas por sub-pixel em alguns browsers
    transform: "translateZ(0)"
  }}
/>

            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/0 to-black/50" />
            <div className="absolute right-4 top-4 z-10">
              <button onClick={()=>setFlip(true)} className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 ring-1 ring-black/10 backdrop-blur hover:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/60">
                {t.card.showMore}
              </button>
            </div>

            <div className="absolute inset-x-4 bottom-4">
              <div className="relative rounded-2xl bg-black/35 p-4 backdrop-blur-md ring-1 ring-white/10 overflow-visible">
                <PaymentRibbon methods={methods} />
                <div className="pointer-events-none absolute left-6 right-6 -top-2 h-2 rounded-b-xl bg-gradient-to-b from-black/40 to-transparent" />
                <div className="grid grid-cols-4 gap-2">
                  <FancyStat icon={Coins} label={t.card.min} value={b.minDep} accent={acc} />
                  <FancyStat icon={Percent} label={t.card.bonus} value={b.bonus} accent={acc} />
                  <FancyStat icon={TrendingUp} label={t.card.cashback} value={cap(b.cashback, lang)} accent={acc} />
                  <FancyStat icon={Sparkles}   label={t.card.spins}    value={cap(b.freeSpins, lang)} accent={acc} />
                </div>
                 <div className="py-2 text-[11px] font-semibold tracking-wide text-white/75 text-center">
    {t.card.terms}
  </div>
  <div className="pt-1">
    <FancyCTA href={b.link} label={t.card.go} accent={acc} />
  </div>
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
  <StatTile icon={Coins}      label={t.card.min}      value={b.minDep}    accent={acc} />
  <StatTile icon={Percent}    label={t.card.bonus}    value={b.bonus}     accent={acc} />
  <StatTile icon={TrendingUp} label={t.card.cashback} value={cap(b.cashback, lang)}  accent={acc} />
  <StatTile icon={Sparkles}   label={t.card.spins}    value={cap(b.freeSpins, lang)} accent={acc} />
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

<div className="mt-5">
  {/* células com a MESMA altura/ocupação */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
    {/* Secundário */}
    <button
      type="button"
      onClick={() => setFlip(false)}
      className="h-12 w-full rounded-2xl px-4 text-sm font-semibold
                 text-white/90 bg-white/6 hover:bg-white/10
                 ring-1 ring-white/12
                 focus:outline-none focus-visible:outline-none
                 focus:ring-2 focus:ring-rose-400/60"
    >
      {t.card.back}
    </button>

    {/* Primário (sem shadow externo) */}
    <a
      href={b.link}
      target="_blank"
      rel="noreferrer"
      className="h-12 w-full inline-flex items-center justify-center rounded-2xl px-5
                 text-sm font-extrabold text-white ring-1 ring-white/10 transition
                 hover:brightness-110 focus:outline-none focus-visible:outline-none
                 focus:ring-2 focus:ring-rose-400/60"
      style={{
        background: `linear-gradient(135deg, ${acc}, ${rgba(acc, .88)})`,
        // sombra interna subtil para manter “peso” sem alterar o preenchimento inferior
        boxShadow: `inset 0 -1px 0 ${rgba('#000', .25)}`
      }}
    >
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
function PromoCard({ p }: { p: Promo }) {
  const { t } = useLang();
  const copy = t.betify.promos[p.id];

  return (
    <div className="rounded-3xl p-5 sm:p-6 ring-1 ring-white/12 text-white/90 bg-white/[.06] backdrop-blur-md shadow-[0_14px_50px_rgba(0,0,0,.35)] relative overflow-hidden">
      <span aria-hidden className="absolute inset-x-4 top-0 h-[3px] rounded-b-xl" style={{background:"linear-gradient(90deg,#22c55e,transparent)"}}/>
      <div className="flex items-start gap-3 relative">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
          <p.icon className="h-5 w-5 text-white" />
        </span>
        <div className="flex-1">
          <div className="text-xs font-semibold text-white/60 uppercase">{t.betify.promo_label}</div>
          <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">{copy.title}</h3>
          <div className="mt-1.5 text-[13px] text-white/75">{copy.blurb}</div>

          {/* destaque do benefício — sem quebra de linha */}
          <div className="mt-4">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 ring-1 ring-white/15 px-3 py-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-extrabold text-white whitespace-nowrap">
                {copy.highlight}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={p.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold text-white ring-1 ring-white/10 bg-[linear-gradient(135deg,#22c55e,#16a34a)] shadow-[0_10px_26px_rgba(34,197,94,.25)] hover:brightness-110"
            >
              {t.card.go}
              <ExternalLink className="h-4 w-4" />
            </a>
            <span className="text-[11px] text-white/60 self-center">{t.card.terms}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ---------- Página Betify ---------- */
function BetifyLanding({ onBack }: { onBack: () => void }) {
  const { t } = useLang();

  const scrollToPromos = () =>
    document.getElementById("betify-promos")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section
        className="rounded-3xl p-6 sm:p-8 ring-1 ring-white/10 text-white shadow-[0_16px_60px_rgba(0,0,0,.35)] relative overflow-hidden bg-[#0f1013]"
      >
        {/* glow/pattern */}
        <div aria-hidden className="pointer-events-none absolute inset-0"
             style={{background:
               "radial-gradient(60% 80% at 10% 0%, rgba(139,92,246,.18) 0%, rgba(139,92,246,0) 55%)," +
               "radial-gradient(50% 60% at 85% 100%, rgba(34,197,94,.16) 0%, rgba(34,197,94,0) 60%)",
               mixBlendMode:"screen"}} />
        <div aria-hidden className="absolute inset-0 opacity-[.06] bg-[url('data:image/svg+xml;utf8,\
          <svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 32 32\\' fill=\\'none\\'>\
          <path d=\\'M0 31h32M0 15h32\\' stroke=\\'#fff\\' stroke-opacity=\\'.6\\'/>\
          <path d=\\'M1 0v32M17 0v32\\' stroke=\\'#fff\\' stroke-opacity=\\'.4\\'/>\
          </svg>')]" />

        {/* header hero */}
        <div className="flex items-center justify-between gap-4 relative">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t.betify.title}</h1>
              <p className="text-white/70 text-sm">{t.betify.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-[1.15fr,.85fr]">
          {/* steps */}
          <div className="rounded-2xl bg-white/[.06] ring-1 ring-white/12 p-5 backdrop-blur-md">
            <div className="text-lg font-extrabold mb-3">
              {t.betify.steps.two_prefix} <span className="text-emerald-300">{t.betify.steps.two_code}</span>
            </div>
            <ol className="space-y-3 text-sm text-white/90">
              <li><span className="font-bold">1.</span> {t.betify.steps.one}</li>
              <li><span className="font-bold">2.</span> {t.betify.steps.two_prefix} <span className="font-bold">{t.betify.steps.two_code}</span> {t.betify.steps.two_suffix}</li>
              <li><span className="font-bold">3.</span> {t.betify.steps.three}</li>
            </ol>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href={BETIFY_SIGNUP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white ring-1 ring-white/10 shadow-[0_10px_26px_rgba(34,197,94,.25)] hover:brightness-110 transition bg-[linear-gradient(180deg,#22c55e,#16a34a)]"
              >
                {t.betify.cta_signup} <ExternalLink className="h-4 w-4" />
              </a>

              {/* 👉 agora rola para a secção de promos */}
              <button
                type="button"
                onClick={scrollToPromos}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white bg-white/8 hover:bg-white/12 ring-1 ring-white/15"
              >
                {t.betify.cta_promos}
              </button>
            </div>
          </div>

          {/* visual */}
          <div className="rounded-2xl overflow-hidden ring-1 ring-white/12 bg-black/40">
            <div className="relative w-full" style={{ paddingTop: "100%" }}>
              <img
                src="https://altacdn.com/bf/img/sliders/ca/150746_bf_website_banner_wsb.webp"
                alt="Betify preview"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* promos */}
        <div id="betify-promos" className="mt-6 grid gap-4 sm:grid-cols-2">
          {betifyPromos.map((p) => (<PromoCard key={p.id} p={p} />))}
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
        {/* TOPO: tudo numa linha, **centrado** e sem quebra */}
{/* TOPO: tudo numa linha, sem quebra */}
<div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap max-w-full">
  {/* ESQUERDA */}
  <div className="shrink-0 whitespace-nowrap flex items-center gap-2">
    <span className="brand-font text-white text-[18px] leading-none">K0MPA</span>
    <span className="text-xs text-white/60">© {year}</span>
  </div>

  {/* CENTRO */}
<nav className="shrink-0 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-semibold max-w-full">

  <span aria-disabled="true" className="text-white/65 cursor-not-allowed select-none whitespace-nowrap">
    {t.footer.terms}
  </span>
  <span aria-disabled="true" className="text-white/65 cursor-not-allowed select-none whitespace-nowrap">
    {t.footer.privacy}
  </span>
  <span aria-disabled="true" className="text-white/65 cursor-not-allowed select-none whitespace-nowrap">
    {t.footer.cookies}
  </span>
</nav>


  {/* DIREITA */}
  <a
    href="https://www.begambleaware.org/"
    target="_blank"
    rel="noreferrer"
    className="shrink-0 whitespace-nowrap inline-flex items-center gap-2 text-xs hover:text-white/90"
    title="BeGambleAware.org"
  >
    <span className="text-xs font-bold select-none">18+</span>
    BeGambleAware.org
  </a>
</div>

        <div className="my-3 h-px bg-white/10" />
        <p className="text-[12px] leading-snug text-white/55 text-center whitespace-normal break-words max-w-full">

  {t.footer.rg_paragraph}
</p>
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
/* BackgroundLayer */
function BackgroundLayer() {
  return (
    <div
      className="pointer-events-none fixed -z-10"
      // dá bleed para não cortar em nenhum breakpoint
      style={{
        inset: "-30vh -12vw -30vh -12vw",
        background: "linear-gradient(180deg, #14070a 0%, #10060a 45%, #0b0507 100%)",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
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
  const [lang, setLang] = useState<Lang>(() => {
  // tenta recuperar a escolha anterior
  const saved = (typeof window !== "undefined"
    ? (localStorage.getItem("lang") as Lang | null)
    : null);
  if (saved === "PT" || saved === "EN") return saved;

  // auto-deteta; default = PT como pediste
  const nav = typeof navigator !== "undefined" ? navigator.language || "" : "";
  return nav.toLowerCase().startsWith("pt") ? "PT" : "PT";
});

// guarda sempre que muda
useEffect(() => {
  try { localStorage.setItem("lang", lang); } catch {}
}, [lang]);

  const t = useMemo(() => messages[lang], [lang]);
  const isLive = useLiveAutoTwitch(TWITCH_CHANNEL, 60_000);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false); // ⬅️ novo

  const [route, setRoute] = useState<Route>("home");

  useEffect(() => {
    if ((import.meta as any)?.env?.DEV && brands.length < 1) console.warn("[TEST] expected >=1 brand");
  }, []);

  return (
    <LangCtx.Provider value={{ lang, setLang, t }}>
      <div className="relative min-h-screen isolation-isolate text-slate-900 flex flex-col overflow-x-hidden">
        <div style={{ height: "var(--hdr-offset, 68px)" }} aria-hidden />
        <HeaderBar isLive={isLive} />

        <div className="flex-1">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-6 py-8 sm:px-8 md:grid-cols-[240px,1fr] items-start">
            <Sidebar
              onOpenStream={() => setShowOverlay(true)}
              onOpenBetify={() => setRoute("betify")}
              onGoHome={() => setRoute("home")}
              onOpenCommunity={() => setShowCommunity(true)}   // ⬅️ adiciona isto
            />

<main className="space-y-10">
  {route === "home" ? (
    <>
      {/* 1) CARDS NO TOPO */}
      <div className="grid gap-8 lg:gap-10 md:grid-cols-2">
        {brands.map((b, i) => (
          <React.Fragment key={b.name + i}>
            <BrandCard b={b} />
          </React.Fragment>
        ))}
      </div>

      {/* 2) TWITCH + YOUTUBE REDUZIDOS LADO A LADO */}
      <div className="grid gap-6 sm:grid-cols-2">
        <TwitchEmbedMini channel={TWITCH_CHANNEL} />
        <YouTubeLastMini channelId={YT_CHANNEL_ID} />
      </div>
    </>
  ) : (
    <BetifyLanding onBack={() => setRoute("home")} />
  )}
</main>

          </div>
        </div>

        <Footer />
{showOverlay && (
  <StreamOverlay channel={TWITCH_CHANNEL} onClose={() => setShowOverlay(false)} />
)}
{showCommunity && (
  <CommunityModal onClose={() => setShowCommunity(false)} />   // ⬅️ adiciona isto
)}

        {showOverlay && <StreamOverlay channel={TWITCH_CHANNEL} onClose={() => setShowOverlay(false)} />}
      </div>
    </LangCtx.Provider>
  );
}
