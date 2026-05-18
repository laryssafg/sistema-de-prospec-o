import { VercelRequest, VercelResponse } from '@vercel/node';
import { checkEnvVars } from '../src/lib/backend-logic';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const envStatus = checkEnvVars();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    envVars: envStatus.details,
    headers: req.headers
  });
}
