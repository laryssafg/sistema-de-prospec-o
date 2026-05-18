import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const getRawEnv = (key: string, fallback: string = '') => 
  (process.env[key] || fallback).trim().replace(/^["']|["']$/g, '');

const supabaseUrl = getRawEnv('SUPABASE_URL');
const supabaseKey = getRawEnv('SUPABASE_ANON_KEY');

export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export const adminEmail = getRawEnv('ADMIN_EMAIL', 'laryssa.ferreira@technovasystems.com.br').toLowerCase();
export const adminPassword = getRawEnv('ADMIN_PASSWORD', 'technova_admin_2026');
