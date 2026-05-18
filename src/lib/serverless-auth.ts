import { VercelRequest, VercelResponse } from '@vercel/node';
import { adminEmail, adminPassword } from './backend-logic';

export const validateToken = (token: string | string[] | undefined) => {
  // If we had a real session store with DB, we'd check it here.
  // For now, since it's a single admin user, we can treat any non-empty token
  // as the admin session if it matches what was issued during login.
  // In a real app, this would be a JWT.
  return token === 'admin-session-2026';
};

export const requireAuth = (req: VercelRequest, res: VercelResponse, next: () => void) => {
  const token = req.headers['x-session-id'] || req.cookies?.['technova.sid'];
  if (validateToken(token)) {
    next();
  } else {
    res.status(401).json({ error: 'Não autorizado' });
  }
};
