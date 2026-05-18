import { VercelRequest, VercelResponse } from '@vercel/node';
import { validateToken } from '../../src/lib/serverless-auth';
import { getSupabase } from '../../src/lib/backend-logic';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const token = req.headers['authorization'] || req.headers['x-session-id'] || req.cookies?.['technova.sid'];
  if (!validateToken(token)) return res.status(401).json({ error: 'Unauthorized' });

  const leads = req.body.map((l: any) => ({ ...l, created_at: new Date().toISOString(), prospect_status: 'Novo' }));
  
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from('leads').insert(leads).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  res.json(leads.map((l: any) => ({ ...l, id: Math.random().toString(36).substr(2, 9) })));
}
