import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Supabase Setup
const getRawEnv = (key: string) => (process.env[key] || '').trim().replace(/^["']|["']$/g, '');

const supabaseUrl = getRawEnv('SUPABASE_URL');
const supabaseKey = getRawEnv('SUPABASE_ANON_KEY');
let supabase: any = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Database Health Check & Schema Definition
const checkDatabase = async () => {
  if (!supabase) {
    console.log('--- DB STATUS: Supabase not configured. Using Mock Data mode. ---');
    return;
  }

  try {
    const { error } = await supabase.from('leads').select('*').limit(1);
    if (error) {
      const msg = error.message || String(error);
      if (error.code === 'PGRST116' || msg.includes('relation') || msg.includes('not found')) {
        console.error('--- DB ADVISORY: Supabase tables (leads/searches) not found. ---');
        console.log('Please run the following SQL in your Supabase SQL Editor:');
        console.log(`
          CREATE TABLE leads (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            category TEXT,
            address TEXT,
            city TEXT,
            phone TEXT,
            website TEXT,
            rating DECIMAL,
            user_ratings_total INTEGER,
            prospect_status TEXT DEFAULT 'Novo',
            notes TEXT,
            assigned_to TEXT,
            maps_url TEXT,
            conversion_date TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          CREATE TABLE searches (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id TEXT,
            keyword TEXT,
            location TEXT,
            results_count INTEGER,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);
      } else {
        console.error('Supabase connection error:', msg);
        if (msg.toLowerCase().includes('fetch failed') || msg.toLowerCase().includes('network error')) {
          console.warn('--- CRITICAL: Supabase URL is unreachable. ---');
          console.warn('The application will fallback to MOCK MODE to remain functional.');
          console.warn('Check if SUPABASE_URL starts with https:// and is not paused.');
          supabase = null; // FORCE MOCK MODE
        }
      }
    } else {
      console.log('--- DB STATUS: Supabase connected and tables verified. ---');
    }
  } catch (err: any) {
    const msg = err.message || String(err);
    console.error('Database pre-check failed:', msg);
    if (msg.toLowerCase().includes('fetch failed')) {
      console.warn('--- CRITICAL: Supabase URL unreachable (Pre-check). Fallback to MOCK MODE. ---');
      supabase = null; // FORCE MOCK MODE
    }
  }
};

checkDatabase();

// Mock Data for "MODO MOCK"
let mockUsers = [
  { 
    id: '1', 
    email: 'laryssa.ferreira@technovasystems.com.br', 
    password_hash: bcrypt.hashSync('technova_admin_2026', 10) 
  }
];

let mockLeads: any[] = [];
let mockSearches: any[] = [];

app.use(express.json());
app.use(cookieParser());

// Trust proxy is required for secure cookies behind Nginx
app.set('trust proxy', 1);

const sessionStore = new session.MemoryStore();

app.use(session({
  store: sessionStore,
  secret: 'technova-prospect-secret-2026',
  resave: true,
  saveUninitialized: true,
  rolling: true,
  proxy: true,
  name: 'technova.sid',
  cookie: { 
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

// Manual Session Sync for Iframe Fallback
app.use((req: any, res, next) => {
  const sessionId = req.headers['x-session-id'];
  if (sessionId && !req.session.userId) {
    sessionStore.get(sessionId, (err, sess: any) => {
      if (sess && sess.userId) {
        console.log(`[SessionSync] Restored session ${sessionId} for user ${sess.userId}`);
        req.session.userId = sess.userId;
      }
      next();
    });
  } else {
    next();
  }
});

// Auth Middleware
const requireAuth = (req: any, res: any, next: any) => {
  const authId = req.session.userId;
  const hSession = req.headers['x-session-id'];
  console.log(`[Gatekeeper] Path: ${req.path} | User: ${authId} | SID: ${req.sessionID} | HeaderSID: ${hSession}`);
  
  if (!authId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// --- AUTH ROUTES ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Clean up credentials from request
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  // Clean up credentials from environment
  const getEnv = (key: string, fallback: string) => {
    let val = process.env[key] || fallback;
    return val.trim().replace(/^["']|["']$/g, ''); // Strip leading/trailing quotes
  };

  const adminEmail = getEnv('ADMIN_EMAIL', 'laryssa.ferreira@technovasystems.com.br').toLowerCase();
  const adminPassword = getEnv('ADMIN_PASSWORD', 'technova_admin_2026');

  console.log(`Login attempt for: [${cleanEmail}]`);

  const finishLogin = (userId: string, userEmail: string) => {
    req.session.userId = userId;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session error' });
      }
      console.log(`[Login] Session Saved: ${req.sessionID} for ${userEmail}`);
      // return sessionID as token for the header fallback
      res.json({ id: userId, email: userEmail, token: req.sessionID });
    });
  };

  // Hardcoded emergency check for specified user
  const isEmergencyAdmin = 
    (cleanEmail === 'laryssa.ferreira@technovasystems.com.br' && cleanPassword === 'technova_admin_2026');

  if (isEmergencyAdmin) {
    console.log('Access granted via Emergency Admin check');
    return finishLogin('admin-1', 'laryssa.ferreira@technovasystems.com.br');
  }

  if (supabase) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .single();

      if (error || !user) {
        // Fallback for custom admin from env
        if (cleanEmail === adminEmail && cleanPassword === adminPassword) {
           console.log('Success via Env Admin credentials');
           return finishLogin('admin-1', adminEmail);
        }
        console.log(`Access denied: User ${cleanEmail} not in DB and Env Fallback failed`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(cleanPassword, user.password_hash);
      if (!isValid) {
        console.log(`Access denied: Incorrect password for ${cleanEmail}`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      return finishLogin(user.id, user.email);
    } catch (dbError: any) {
      console.error('Database error during login:', dbError.message);
      if (cleanEmail === adminEmail && cleanPassword === adminPassword) {
        return finishLogin('admin-1', adminEmail);
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    // MOCK AUTH
    const user = mockUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (user && bcrypt.compareSync(cleanPassword, user.password_hash)) {
      return finishLogin(user.id, user.email);
    }
    
    if (cleanEmail === adminEmail && cleanPassword === adminPassword) {
      return finishLogin('admin-1', adminEmail);
    }
    
    return res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ status: 'ok' });
  });
});

app.get('/api/auth/me', (req: any, res) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'laryssa.ferreira@technovasystems.com.br';
  console.log(`[AuthMe] Session ID: ${req.sessionID} | User in session: ${req.session.userId}`);
  
  if (req.session.userId) {
    // If it's our fallback admin
    if (req.session.userId === 'admin-1' || req.session.userId === '1') {
      return res.json({ id: req.session.userId, email: adminEmail });
    }
    // Otherwise it's a DB user
    res.json({ id: req.session.userId, email: req.session.userId.includes('@') ? req.session.userId : adminEmail });
  } else {
    console.log('[AuthMe] No user in session');
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// --- GOOGLE PLACES SEARCH ---
app.post('/api/search', requireAuth, async (req, res) => {
  const { keyword, location } = req.body;
  if (!keyword || !location) return res.status(400).json({ error: 'Keyword and location are required' });

  // Clean API Key
  const apiKey = (process.env.GOOGLE_MAPS_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  
  console.log(`[Search] Intent: ${keyword} in ${location} | API Key present: ${!!apiKey}`);

  let results: any[] = [];

  // 1. Get Results (Real, Mock or Error Fallback)
  if (!apiKey || apiKey === 'MY_GOOGLE_MAPS_API_KEY' || apiKey === '') {
    console.log('[Search] Using Mock Results');
    results = Array.from({ length: 12 }).map((_, i) => ({
      id: `mock-${Date.now()}-${i}`,
      place_id: `mock-${Date.now()}-${i}`,
      name: `${keyword} ${String.fromCharCode(65 + i)}`,
      address: `Rua Principal, ${100 + i}, ${location}`,
      phone: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      website: `https://${keyword.toLowerCase().replace(/\s/g, '')}-example-${i}.com.br`,
      rating: (3.5 + Math.random() * 1.5).toFixed(1),
      user_ratings_total: Math.floor(Math.random() * 1000),
      business_status: 'OPERATIONAL',
      maps_url: 'https://maps.google.com',
      category: keyword,
      city: location
    }));
  } else {
    try {
      console.log('[Search] Calling Google Places API (New)...');
      const textSearchUrl = `https://places.googleapis.com/v1/places:searchText`;
      
      const fieldMask = [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.location',
        'places.rating',
        'places.userRatingCount',
        'places.businessStatus',
        'places.googleMapsUri',
        'places.websiteUri',
        'places.nationalPhoneNumber',
        'places.internationalPhoneNumber',
        'places.types'
      ].join(',');

      const response = await axios.post(textSearchUrl, {
        textQuery: `${keyword} em ${location}`,
        languageCode: 'pt-BR',
        regionCode: 'BR',
        maxResultCount: 20
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': fieldMask
        },
        timeout: 10000 // 10s timeout
      });

      results = response.data.places?.map((p: any) => ({
        id: p.id,
        place_id: p.id,
        name: p.displayName?.text || 'Sem nome',
        address: p.formattedAddress || 'Sem endereço',
        phone: p.nationalPhoneNumber || p.internationalPhoneNumber || '',
        website: p.websiteUri || '',
        rating: p.rating || 0,
        user_ratings_total: p.userRatingCount || 0,
        business_status: p.businessStatus || 'UNKNOWN',
        maps_url: p.googleMapsUri || '',
        category: p.types?.[0] || keyword,
        city: location
      })) || [];

      console.log(`[Search] Success. Found ${results.length} results.`);
    } catch (error: any) {
      const errorStatus = error.response?.status;
      const errorBody = error.response?.data?.error || {};
      const details = errorBody.details || [];
      const errorInfo = details.find((d: any) => d['@type'] === 'type.googleapis.com/google.rpc.ErrorInfo') || {};
      
      console.error(`[Search] API ERROR [${errorStatus}]:`, JSON.stringify(errorBody, null, 2));
      
      let failureReason = 'Ajuste sua Google API Key para buscar resultados reais';
      let isApiDisabled = false;

      if (errorStatus === 403 || errorInfo.reason === 'SERVICE_DISABLED' || JSON.stringify(errorBody).includes('places.googleapis.com')) {
        isApiDisabled = true;
        failureReason = "ERRO 403: Ative a 'Places API (New)' e o Billing no Google Cloud Console.";
        if (errorInfo.reason === 'BILLING_DISABLED') {
          failureReason = "ERRO: O faturamento (Billing) precisa estar ativado no Google Cloud.";
        }
      } else if (errorStatus === 401 || errorInfo.reason === 'API_KEY_INVALID') {
        failureReason = "ERRO 401: Chave API do Google Maps inválida ou restrita.";
      }

      // Fallback to demo results
      results = Array.from({ length: 3 }).map((_, i) => ({
        id: `demo-${i}`,
        place_id: `demo-${i}`,
        name: `${keyword} (Modo Demo) ${i + 1}`,
        address: failureReason,
        phone: '(00) 0000-0000',
        website: isApiDisabled ? 'https://console.cloud.google.com/marketplace/product/google/places.googleapis.com' : '',
        rating: 5,
        user_ratings_total: 10,
        business_status: 'OPERATIONAL',
        maps_url: 'https://console.cloud.google.com/marketplace/product/google/places.googleapis.com',
        category: keyword,
        city: location
      }));
    }
  }

  // 2. Save Search History (Unified for all cases)
  try {
    if (supabase) {
      await supabase.from('searches').insert({ 
        user_id: req.session.userId || 'anonymous', 
        keyword, 
        location,
        results_count: results.length
      });
    } else {
      mockSearches.push({ 
        id: Date.now().toString(), 
        user_id: req.session.userId, 
        keyword, 
        location, 
        results_count: results.length, 
        created_at: new Date().toISOString() 
      });
    }
  } catch (historyError: any) {
    console.error('[Search] Failed to save to history:', historyError.message);
  }

  // 3. Send final response
  res.json(results);
});

// --- DASHBOARD ---
app.get('/api/dashboard', requireAuth, async (req, res) => {
  console.log(`[Dashboard] Request by user: ${req.session.userId} | Session: ${req.sessionID}`);
  const defaultDashboard = {
    totalSearches: 0,
    totalLeads: 0,
    leadsInContact: 0,
    leadsInNegotiation: 0,
    convertedClients: 0,
    conversionRate: 0
  };

  if (supabase) {
    try {
      // Helper to count safely
      const countSafely = async (table: string, filter?: { col: string, val: string }) => {
        try {
          let query = supabase.from(table).select('*', { count: 'exact', head: true });
          if (filter) query = query.eq(filter.col, filter.val);
          const { count, error } = await query;
          if (error) {
            console.warn(`[Dashboard] Safe count warned on ${table}:`, error.message);
            return 0;
          }
          return count || 0;
        } catch (err: any) {
          console.error(`[Dashboard] Critical fetch error on ${table}:`, err.message);
          return 0;
        }
      };

      const totalSearches = await countSafely('searches');
      const totalLeads = await countSafely('leads');
      const leadsInContact = await countSafely('leads', { col: 'prospect_status', val: 'Em contato' });
      const leadsInNegotiation = await countSafely('leads', { col: 'prospect_status', val: 'Negociação' });
      const convertedClients = await countSafely('leads', { col: 'prospect_status', val: 'Cliente' });

      const conversionRate = totalLeads ? (Number(convertedClients) / Number(totalLeads)) * 100 : 0;

      const data = {
        totalSearches,
        totalLeads,
        leadsInContact,
        leadsInNegotiation,
        convertedClients,
        conversionRate: parseFloat(conversionRate.toFixed(1))
      };
      
      console.log('[Dashboard] Returning data:', data);
      res.json(data);
    } catch (e: any) {
      console.error('[Dashboard] Logic error:', e.message);
      res.json(defaultDashboard);
    }
  } else {
    console.log('[Dashboard] Mock Mode');
    // MOCK DASHBOARD
    const totalLeads = mockLeads.length;
    const leadsInContact = mockLeads.filter(l => l.prospect_status === 'Em contato').length;
    const leadsInNegotiation = mockLeads.filter(l => l.prospect_status === 'Negociação').length;
    const convertedClients = mockLeads.filter(l => l.prospect_status === 'Cliente').length;
    const conversionRate = totalLeads ? (convertedClients / totalLeads) * 100 : 0;

    res.json({
      totalSearches: mockSearches.length,
      totalLeads,
      leadsInContact,
      leadsInNegotiation,
      convertedClients,
      conversionRate: parseFloat(conversionRate.toFixed(1))
    });
  }
});

// --- LEADS ---
app.get('/api/leads', requireAuth, async (req, res) => {
  console.log(`[Leads] Fetch by user: ${req.session.userId}`);
  if (supabase) {
    try {
      const { data: leads, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (error) {
        console.warn('[Leads] Database query warning:', error.message);
        // Supabase error codes for missing table: 42P01 or similar
        // We return empty array to keep the UI from blowing up
        return res.json([]);
      }
      res.json(leads || []);
    } catch (err: any) {
      console.error('[Leads] Critical fetch error:', err.message);
      res.json([]);
    }
  } else {
    res.json(mockLeads.sort((a,b) => b.created_at.localeCompare(a.created_at)));
  }
});

app.post('/api/leads', requireAuth, async (req, res) => {
  const leadData = { ...req.body, created_at: new Date().toISOString(), prospect_status: 'Novo' };
  
  if (supabase) {
    const { data: newLead, error } = await supabase.from('leads').insert(leadData).select().single();
    if (error) return res.status(500).json({ error: 'Failed to save lead' });
    res.json(newLead);
  } else {
    const newLead = { ...leadData, id: Date.now().toString() };
    mockLeads.push(newLead);
    res.json(newLead);
  }
});

app.post('/api/leads/batch', requireAuth, async (req, res) => {
  const leads = req.body.map((l: any) => ({ ...l, created_at: new Date().toISOString(), prospect_status: 'Novo' }));
  
  if (supabase) {
    const { data: newLeads, error } = await supabase.from('leads').insert(leads).select();
    if (error) return res.status(500).json({ error: 'Failed to save leads' });
    res.json(newLeads);
  } else {
    const newLeads = leads.map((l: any) => ({ ...l, id: Math.random().toString(36).substr(2, 9) }));
    mockLeads = [...mockLeads, ...newLeads];
    res.json(newLeads);
  }
});

app.put('/api/leads/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (updates.prospect_status === 'Cliente') {
    updates.conversion_date = new Date().toISOString();
  }

  if (supabase) {
    const { data: lead, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: 'Failed to update lead' });
    res.json(lead);
  } else {
    const index = mockLeads.findIndex(l => l.id === id);
    if (index !== -1) {
      mockLeads[index] = { ...mockLeads[index], ...updates };
      res.json(mockLeads[index]);
    } else {
      res.status(404).json({ error: 'Lead not found' });
    }
  }
});

app.delete('/api/leads/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  console.log(`[Leads] Delete single lead: ${id}`);

  if (supabase) {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) return res.status(500).json({ error: 'Failed to delete lead' });
    res.json({ success: true });
  } else {
    const index = mockLeads.findIndex(l => l.id === id);
    if (index !== -1) {
      mockLeads.splice(index, 1);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Lead not found' });
    }
  }
});

app.post('/api/leads/delete-batch', requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'IDs array required' });
  console.log(`[Leads] Delete batch: ${ids.length} leads`);

  if (supabase) {
    const { error } = await supabase.from('leads').delete().in('id', ids);
    if (error) return res.status(500).json({ error: 'Failed to delete leads' });
    res.json({ success: true });
  } else {
    mockLeads = mockLeads.filter(l => !ids.includes(l.id));
    res.json({ success: true });
  }
});

app.get('/api/search/history', requireAuth, async (req, res) => {
  if (supabase) {
    const { data: history, error } = await supabase.from('searches').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Failed to fetch history' });
    res.json(history);
  } else {
    res.json(mockSearches.sort((a,b) => b.created_at.localeCompare(a.created_at)));
  }
});

// Serve frontend
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
