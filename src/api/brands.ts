// api/brands.ts
import type { IncomingMessage, ServerResponse } from 'http';
import { list, put, head, del } from '@vercel/blob';

type Brand = {
  name: string; tag: "HOT" | "NEW" | "TOP"; logo: string; image: string;
  imagePos?: string;
  minDep: string; bonus: string; cashback: string; freeSpins: string; code: string; link: string;
  theme?: { accent: string; shadow: string; ring?: string; };
  payments?: Array<'btc'|'mb'|'mbw'|'visa'|'mc'>;
};

const FILE_NAME = 'brands.json';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''; // define em Vercel

function isBrandArray(x: any): x is Brand[] {
  return Array.isArray(x) && x.every(b => typeof b?.name === 'string' && typeof b?.tag === 'string');
}

export default async function handler(req: IncomingMessage & { method?: string; body?: any; headers: any; }, res: ServerResponse & { status: (n: number) => any; setHeader: (k: string,v:any)=>any; end: (b?:any)=>any; json?: (b:any)=>any; }) {
  try {
    if (req.method === 'GET') {
      // tenta encontrar brands.json no Blob
      const files = await list();
     const file = files.blobs.find((b: any) => b.pathname.endsWith('/' + FILE_NAME))
  || files.blobs.find((b: any) => b.pathname === FILE_NAME);

      if (!file) {
        // nada gravado ainda -> devolve vazio
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
        return res.status(200).json([]);
      }
      // redireciona (ou faz fetch server-side se preferires)
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
      return res.redirect(302, file.url); // deixa a CDN servir o JSON
    }

    if (req.method === 'PUT') {
      const auth = (req.headers['authorization'] || '').toString();
      if (!ADMIN_TOKEN || auth !== `Bearer ${ADMIN_TOKEN}`) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!isBrandArray(body)) {
        return res.status(400).json({ error: 'Invalid payload' });
      }
      // apaga anterior (opcional) e grava novo
      // guardar sempre em FILE_NAME na raiz
      await put(FILE_NAME, JSON.stringify(body, null, 2), {
        access: 'public',
        contentType: 'application/json; charset=utf-8',
        cacheControlMaxAge: 0,
      });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).end('Method Not Allowed');
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}
