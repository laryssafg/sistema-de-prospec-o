import { VercelRequest, VercelResponse } from '@vercel/node';
import { validateToken } from '../../src/lib/serverless-auth';
import { supabase } from '../../src/lib/backend-logic';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.headers['x-session-id'] || req.cookies?.['technova.sid'];
  if (!validateToken(token)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    if (supabase) {
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data || []);
    }
    return res.json([]);
  }

  if (req.method === 'POST') {
    const leadData = { ...req.body, created_at: new Date().toISOString(), prospect_status: 'Novo' };
    if (supabase) {
      const { data, error } = await supabase.from('leads').insert(leadData).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }
    return res.json(leadData); 
  }

  res.status(405).json({ error: 'Method not allowed' });
}
