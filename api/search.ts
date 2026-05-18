import { VercelRequest, VercelResponse } from '@vercel/node';
import { validateToken } from '../src/lib/serverless-auth';
import { performSearch, getSupabase } from '../src/lib/backend-logic';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const token = req.headers['authorization'] || req.headers['x-session-id'] || req.cookies?.['technova.sid'];
  if (!validateToken(token)) return res.status(401).json({ error: 'Unauthorized' });

  const { keyword, location } = req.body;
  
  try {
    const results = await performSearch(keyword, location);
    
    // Save to history if supabase is ready
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('searches').insert({
        user_id: 'admin-1',
        keyword,
        location,
        results_count: results.length
      });
    }

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: 'Search failed' });
  }
}
