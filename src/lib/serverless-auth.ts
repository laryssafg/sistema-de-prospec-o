import { VercelRequest, VercelResponse } from '@vercel/node';
import { adminEmail, adminPassword } from './backend-logic';

export const validateToken = (token: any) => {
  if (!token) return false;
  
  let cleanToken = Array.isArray(token) ? token[0] : token;
  if (typeof cleanToken !== 'string') return false;
  
  if (cleanToken.startsWith('Bearer ')) {
    cleanToken = cleanToken.substring(7);
  }
    
  return cleanToken === 'admin-session-2026';
};

export const requireAuth = (req: VercelRequest, res: VercelResponse, next: () => void) => {
  const token = req.headers['authorization'] || req.headers['x-session-id'] || req.cookies?.['technova.sid'];
  if (validateToken(token)) {
    next();
  } else {
    res.status(401).json({ authenticated: false, error: 'Não autorizado' });
  }
};
