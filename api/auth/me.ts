import { VercelRequest, VercelResponse } from '@vercel/node';
import { validateToken } from '../../src/lib/serverless-auth';
import { adminEmail } from '../../src/lib/backend-logic';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.headers['x-session-id'] || req.cookies?.['technova.sid'];
  
  if (validateToken(token)) {
    return res.json({ id: 'admin-1', email: adminEmail });
  }

  res.status(401).json({ error: 'Não autenticado' });
}
