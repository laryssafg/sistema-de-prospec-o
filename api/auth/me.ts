import { VercelRequest, VercelResponse } from '@vercel/node';
import { validateToken } from '../../src/lib/serverless-auth';
import { adminEmail, checkEnvVars } from '../../src/lib/backend-logic';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] /api/auth/me [${method}] Start`);

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const envStatus = checkEnvVars();
    if (!envStatus.hasAll) {
      console.warn(`[${requestId}] Missing env vars:`, envStatus.missing.join(', '));
    }

    const sessionId = req.headers['authorization'] || req.headers['x-session-id'] || req.cookies?.['technova.sid'];
    console.log(`[${requestId}] Session detected: ${!!sessionId}`);

    if (validateToken(sessionId)) {
      console.log(`[${requestId}] Token valid. User: ${adminEmail}`);
      return res.status(200).json({ 
        authenticated: true, 
        user: { id: 'admin-1', email: adminEmail } 
      });
    }

    console.log(`[${requestId}] Authentication failed or missing.`);
    return res.status(401).json({ 
      authenticated: false, 
      user: null,
      error: 'Não autenticado' 
    });

  } catch (error: any) {
    console.error(`[${requestId}] Critical Error:`, error.message);
    return res.status(500).json({ 
      error: 'Erro interno ao validar autenticação', 
      details: error.message || 'Unknown error'
    });
  }
}
