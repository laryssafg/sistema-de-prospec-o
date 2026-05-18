import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase, adminEmail, adminPassword } from './server-config';

export const handleLogin = async (req: any, res: Response) => {
  const { email, password } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  const finishLogin = (userId: string, userEmail: string) => {
    // In serverless, we might not have standard sessions, so we return a token
    // If the user uses the Express server, req.session will work.
    if (req.session) {
      req.session.userId = userId;
      req.session.save();
    }
    res.json({ id: userId, email: userEmail, token: req.sessionID || 'no-session-in-serverless' });
  };

  if (cleanEmail === adminEmail && cleanPassword === adminPassword) {
     return finishLogin('admin-1', adminEmail);
  }

  if (supabase) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .single();

      if (!error && user && await bcrypt.compare(cleanPassword, user.password_hash)) {
        return finishLogin(user.id, user.email);
      }
    } catch (e) {}
  }
  
  res.status(401).json({ error: 'Credenciais inválidas' });
};

export const handleMe = (req: any, res: Response) => {
  if (req.session?.userId) {
    res.json({ id: req.session.userId, email: adminEmail });
  } else {
    res.status(401).json({ error: 'Não autenticado' });
  }
};
