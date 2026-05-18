import { VercelRequest, VercelResponse } from '@vercel/node';
import { adminEmail, adminPassword } from '../../src/lib/backend-logic';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] /api/auth/login [${method}] Start`);

  if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { email, password } = req.body;
    
    // Normalização dos valores recebidos
    const receivedEmail = (email || '').toString().trim().toLowerCase();
    const receivedPassword = (password || '').toString().trim();

    // Normalização dos valores do ambiente
    const envEmail = (process.env.ADMIN_EMAIL || adminEmail).trim().toLowerCase();
    const envPassword = (process.env.ADMIN_PASSWORD || adminPassword).trim();

    console.log(`[${requestId}] Debug Info:`);
    console.log(`[${requestId}] - ADMIN_EMAIL set: ${!!process.env.ADMIN_EMAIL}`);
    console.log(`[${requestId}] - ADMIN_PASSWORD set: ${!!process.env.ADMIN_PASSWORD}`);
    console.log(`[${requestId}] - Email recebido: "${receivedEmail}"`);
    console.log(`[${requestId}] - Matched Email: ${receivedEmail === envEmail}`);
    console.log(`[${requestId}] - Matched Password: ${receivedPassword === envPassword}`);

    // Verificação de existência das variáveis críticas
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
       console.error(`[${requestId}] Erro: ADMIN_EMAIL ou ADMIN_PASSWORD ausentes no environment.`);
       return res.status(500).json({ 
         error: 'Variáveis ADMIN_EMAIL ou ADMIN_PASSWORD ausentes na Vercel',
         details: {
           adminEmailSet: !!process.env.ADMIN_EMAIL,
           adminPasswordSet: !!process.env.ADMIN_PASSWORD
         }
       });
    }

    if (receivedEmail === envEmail && receivedPassword === envPassword) {
      console.log(`[${requestId}] Login realizado com sucesso para: ${receivedEmail}`);
      return res.status(200).json({ 
        success: true,
        token: 'admin-session-2026', 
        user: { 
          id: 'admin-1', 
          email: envEmail 
        } 
      });
    }

    console.warn(`[${requestId}] Falha na autenticação: Credenciais incorretas`);
    return res.status(401).json({ error: 'Credenciais inválidas' });

  } catch (error: any) {
    console.error(`[${requestId}] Erro crítico no login:`, error.message);
    return res.status(500).json({ 
      error: 'Erro no servidor durante login', 
      details: error.message 
    });
  }
}
