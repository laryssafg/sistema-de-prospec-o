import { VercelRequest, VercelResponse } from '@vercel/node';
import { adminEmail, adminPassword } from '../../src/lib/backend-logic';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] /api/auth/login [${method}] Start`);

  if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    console.log(`[${requestId}] Login attempt for: ${cleanEmail}`);

    if (cleanEmail === adminEmail && cleanPassword === adminPassword) {
      console.log(`[${requestId}] Login success`);
      return res.json({ 
        id: 'admin-1', 
        email: adminEmail, 
        token: 'admin-session-2026' 
      });
    }

    console.warn(`[${requestId}] Invalid credentials`);
    return res.status(401).json({ error: 'Credenciais inválidas' });
  } catch (error: any) {
    console.error(`[${requestId}] Login error:`, error.message);
    res.status(500).json({ error: 'Erro no servidor durante login' });
  }
}
