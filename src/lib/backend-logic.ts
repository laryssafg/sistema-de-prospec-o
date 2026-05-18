import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

console.log('[Backend] Initializing logic module...');
const getRawEnv = (key: string, fallback: string = '') => {
  const value = process.env[key];
  if (value === undefined || value === null || value === '') return fallback.trim();
  return value.trim().replace(/^["']|["']$/g, '');
};

export const checkEnvVars = () => {
  const vars = ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'GOOGLE_MAPS_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  return {
    missing: vars.filter(v => !process.env[v]),
    hasAll: vars.every(v => !!process.env[v]),
    details: vars.map(v => ({ name: v, exists: !!process.env[v] }))
  };
};

export const getAdminEmail = () => getRawEnv('ADMIN_EMAIL', 'laryssa.ferreira@technovasystems.com.br').toLowerCase();
export const getAdminPassword = () => getRawEnv('ADMIN_PASSWORD', 'technova_admin_2026');

export const adminEmail = getAdminEmail();
export const adminPassword = getAdminPassword();

let _supabaseInstance: any = null;

export const getSupabase = () => {
  if (_supabaseInstance) return _supabaseInstance;
  
  const supabaseUrl = getRawEnv('SUPABASE_URL');
  const supabaseKey = getRawEnv('SUPABASE_ANON_KEY');
  
  try {
    if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
      _supabaseInstance = createClient(supabaseUrl, supabaseKey);
    }
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
  }
  return _supabaseInstance;
};

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  maps_url?: string;
  city: string;
}

export const performSearch = async (keyword: string, location: string): Promise<SearchResult[]> => {
  const apiKey = getRawEnv('GOOGLE_MAPS_API_KEY');
  
  if (!apiKey || apiKey === 'MY_GOOGLE_MAPS_API_KEY' || apiKey === '') {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: `mock-${Date.now()}-${i}`,
      name: `${keyword} ${String.fromCharCode(65 + i)}`,
      address: `Rua Principal, ${100 + i}, ${location}`,
      phone: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      website: `https://${keyword.toLowerCase().replace(/\s/g, '')}-example-${i}.com.br`,
      rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
      user_ratings_total: Math.floor(Math.random() * 1000),
      business_status: 'OPERATIONAL',
      maps_url: 'https://maps.google.com',
      city: location
    }));
  }

  try {
    const textSearchUrl = `https://places.googleapis.com/v1/places:searchText`;
    const response = await axios.post(textSearchUrl, {
      textQuery: `${keyword} in ${location}`,
      languageCode: 'pt-BR',
      regionCode: 'BR'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.internationalPhoneNumber,places.googleMapsUri,places.businessStatus'
      },
      timeout: 10000
    });

    const results = response.data.places?.map((p: any) => ({
      id: p.id,
      name: p.displayName?.text || 'Sem nome',
      address: p.formattedAddress || 'Sem endereço',
      phone: p.internationalPhoneNumber || '',
      website: p.websiteUri || '',
      rating: p.rating || 0,
      user_ratings_total: p.userRatingCount || 0,
      business_status: p.businessStatus || 'UNKNOWN',
      maps_url: p.googleMapsUri || '',
      city: location
    })) || [];

    return results;
  } catch (error: any) {
    const errorBody = error.response?.data?.error || {};
    let failureReason = 'Ajuste sua Google API Key para buscar resultados reais';
    
    if (JSON.stringify(errorBody).includes('places.googleapis.com')) {
      failureReason = "ERRO: Ative a 'Places API (New)' no Console Google.";
    }

    return Array.from({ length: 3 }).map((_, i) => ({
      id: `demo-${i}`,
      name: `${keyword} (Modo Demo) ${i + 1}`,
      address: failureReason,
      phone: '(00) 0000-0000',
      website: '',
      rating: 5,
      user_ratings_total: 10,
      business_status: 'OPERATIONAL',
      maps_url: 'https://console.cloud.google.com/marketplace/product/google/places.googleapis.com',
      city: location
    }));
  }
};
