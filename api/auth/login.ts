import { VercelRequest, VercelResponse } from '@vercel/node';
import { adminEmail, adminPassword } from '../../src/lib/backend-logic';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { email, password } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (cleanEmail === adminEmail && cleanPassword === adminPassword) {
    return res.json({ 
      id: 'admin-1', 
      email: adminEmail, 
      token: 'admin-session-2026' 
    });
  }

  res.status(401).json({ error: 'Credenciais inválidas' });
}
