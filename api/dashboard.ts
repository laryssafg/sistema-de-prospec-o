import { VercelRequest, VercelResponse } from '@vercel/node';
import { validateToken } from '../src/lib/serverless-auth';
import { getSupabase } from '../src/lib/backend-logic';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.headers['authorization'] || req.headers['x-session-id'] || req.cookies?.['technova.sid'];
  if (!validateToken(token)) return res.status(401).json({ error: 'Unauthorized' });

  const defaultDashboard = {
    totalSearches: 0,
    totalLeads: 0,
    leadsInContact: 0,
    leadsInNegotiation: 0,
    convertedClients: 0,
    conversionRate: 0
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const countSafely = async (table: string, filter?: { col: string, val: string }) => {
        let query = supabase.from(table).select('*', { count: 'exact', head: true });
        if (filter) query = query.eq(filter.col, filter.val);
        const { count } = await query;
        return count || 0;
      };

      const totalSearches = await countSafely('searches');
      const totalLeads = await countSafely('leads');
      const leadsInContact = await countSafely('leads', { col: 'prospect_status', val: 'Em contato' });
      const leadsInNegotiation = await countSafely('leads', { col: 'prospect_status', val: 'Negociação' });
      const convertedClients = await countSafely('leads', { col: 'prospect_status', val: 'Cliente' });

      const conversionRate = totalLeads ? (Number(convertedClients) / Number(totalLeads)) * 100 : 0;

      return res.json({
        totalSearches,
        totalLeads,
        leadsInContact,
        leadsInNegotiation,
        convertedClients,
        conversionRate: parseFloat(conversionRate.toFixed(1))
      });
    } catch (e: any) {
      return res.json(defaultDashboard);
    }
  }

  res.json(defaultDashboard);
}
