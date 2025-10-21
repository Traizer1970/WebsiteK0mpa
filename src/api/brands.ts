// src/api/brands.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { list, put, del } from '@vercel/blob';

const BUCKET_PREFIX = 'streamer-site';
const FILE_NAME = 'brands.json';

/** default (arranca com o que já tens no cliente) */
const DEFAULT_BRANDS = [
  {
    name:"Betify", tag:"HOT",
    logo:"https://www.ce-at.fr/img/logo.webp",
    image:"https://betify.org/wp-content/uploads/2025/02/betify-app-login.webp",
    imagePos:"left",
    minDep:"20€", bonus:"100%", cashback:"20%", freeSpins:"100FS", code:"K0MPA",
    link: "https://record.betify.partners/_8zlSykIFj1eu11z-n_bVh2Nd7ZgqdRLk/1/",
    theme:{ accent:"#22c55e", shadow:"rgba(34,197,94,0.45)", ring:"rgba(34,197,94,.45)" },
    payments:["mb","mbw","visa","mc","btc"]
  },
  {
    name:"Ignibet", tag:"NEW",
    logo:"https://ignibet.io/assets/images/logo-EfuPTlMq.webp",
    image:"https://thumbs.dreamstime.com/b/red-dice-poker-chips-smartphone-blurry-casino-background-ai-generated-image-381975267.jpg",
    imagePos:"center",
    minDep:"20€", bonus:"665%", cashback:"30%", freeSpins:"750FS", code:"KMPA",
    link:"https://record.ignibet.partners/_ZoU5ocbGidEWqcfzuvZcQGNd7ZgqdRLk/1/",
    theme:{ accent:"#0ea5e9", shadow:"rgba(14,165,233,.45)", ring:"rgba(14,165,233,.45)"},
    payments:["mb","mbw","visa","mc","btc"]
  }
];

const ok = (res: VercelResponse, body: any) =>
  res.status(200).json(body);

const cors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // procura ficheiro
    const files = await list({ prefix: `${BUCKET_PREFIX}/` });
    const file = files.blobs.find(b => b.pathname.endsWith('/' + FILE_NAME))
            || files.blobs.find(b => b.pathname === FILE_NAME);

    if (req.method === 'GET') {
      if (!file) {
        // cria com defaults na primeira vez
        const { url } = await put(`${BUCKET_PREFIX}/${FILE_NAME}`, JSON.stringify(DEFAULT_BRANDS, null, 2), {
          access: 'public',
          contentType: 'application/json',
        });
        return ok(res, { url, data: DEFAULT_BRANDS });
      }
      const json = await fetch(file.url, { cache: 'no-store' }).then(r => r.json());
      return ok(res, { url: file.url, data: json });
    }

    if (req.method === 'PUT') {
      const key = String(req.headers['x-admin-key'] || '');
      if (!process.env.ADMIN_PASSWORD || key !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!Array.isArray(body)) {
        return res.status(400).json({ error: 'Body must be an array of brands' });
      }

      // validações mínimas
      body.forEach((b, i) => {
        ['name','tag','logo','image','minDep','bonus','cashback','freeSpins','code','link']
          .forEach(k => { if (!(k in b)) throw new Error(`Brand[${i}] missing ${k}`); });
      });

      // recria ficheiro (idempotente)
      if (file) await del(file.url);
      const { url } = await put(`${BUCKET_PREFIX}/${FILE_NAME}`, JSON.stringify(body, null, 2), {
        access: 'public',
        contentType: 'application/json',
      });
      return ok(res, { ok: true, url });
    }

    res.setHeader('Allow', 'GET, PUT, OPTIONS');
    return res.status(405).end('Method Not Allowed');
  } catch (e:any) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}
