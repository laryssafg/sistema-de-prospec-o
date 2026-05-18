import { VercelRequest, VercelResponse } from '@vercel/node';
import { validateToken } from '../../src/lib/serverless-auth';
import { supabase } from '../../src/lib/backend-logic';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT' && req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  
  const token = req.headers['x-session-id'] || req.cookies?.['technova.sid'];
  if (!validateToken(token)) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;
  const updates = req.body;

  if (updates.prospect_status === 'Cliente') {
    updates.conversion_date = new Date().toISOString();
  }

  if (supabase) {
    const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  res.status(404).json({ error: 'Database not available' });
}
