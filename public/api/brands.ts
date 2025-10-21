// api/brands.ts - Vercel Serverless Function (Node.js)
/**
 * ENV necessários:
 * - ADMIN_PASS        -> a tua password fixa
 * - GH_TOKEN          -> GitHub PAT com repo scope
 * - GH_REPO           -> "owner/repo" (ex: "k0mpa/site")
 * - GH_BRANCH         -> branch (ex: "main")
 * - GH_FILE_PATH      -> caminho do ficheiro (ex: "public/api/brands.json")
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GH_API = 'https://api.github.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, headers } = req;
  const adminKey = headers['x-admin-key'];
  const ADMIN_PASS = process.env.ADMIN_PASS || '';
  const GH_TOKEN   = process.env.GH_TOKEN   || '';
  const GH_REPO    = process.env.GH_REPO    || '';
  const GH_BRANCH  = process.env.GH_BRANCH  || 'main';
  const GH_FILE    = process.env.GH_FILE_PATH || 'public/api/brands.json';

  if (method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
    res.status(204).end(); return;
  }
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!GH_TOKEN || !GH_REPO) return res.status(500).json({ error: 'Server not configured' });

  if (method === 'GET') {
    // Lê o ficheiro atual do GitHub
    const r = await fetch(`${GH_API}/repos/${GH_REPO}/contents/${encodeURIComponent(GH_FILE)}?ref=${GH_BRANCH}`, {
      headers: { Authorization: `Bearer ${GH_TOKEN}`, 'User-Agent': 'brands-api' },
    });
    if (!r.ok) return res.status(r.status).json({ error: `GitHub GET failed (${r.status})` });
    const j:any = await r.json();
    const content = Buffer.from(j.content || '', 'base64').toString('utf8');
    return res.status(200).json(JSON.parse(content || '[]'));
  }

  if (method === 'PUT') {
    if (adminKey !== ADMIN_PASS) return res.status(401).json({ error: 'Unauthorized' });

    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? []);
    // 1) obter SHA atual
    const get = await fetch(`${GH_API}/repos/${GH_REPO}/contents/${encodeURIComponent(GH_FILE)}?ref=${GH_BRANCH}`, {
      headers: { Authorization: `Bearer ${GH_TOKEN}`, 'User-Agent': 'brands-api' },
    });
    const existing:any = get.ok ? await get.json() : null;
    const sha = existing?.sha;

    // 2) update
    const update = await fetch(`${GH_API}/repos/${GH_REPO}/contents/${encodeURIComponent(GH_FILE)}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        'User-Agent': 'brands-api',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Update brands.json via Moderator',
        content: Buffer.from(body, 'utf8').toString('base64'),
        sha,
        branch: GH_BRANCH,
      }),
    });
    if (!update.ok) {
      const txt = await update.text();
      return res.status(update.status).json({ error: `GitHub PUT failed (${update.status}): ${txt}` });
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
