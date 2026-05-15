/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Search {
  id: string;
  user_id: string;
  keyword: string;
  location: string;
  created_at: string;
  results_count?: number;
}

export type ProspectStatus = 
  | 'Novo'
  | 'Em contato'
  | 'Respondeu'
  | 'Sem resposta'
  | 'Negociação'
  | 'Cliente'
  | 'Perdido';

export interface Lead {
  id: string;
  search_id?: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  user_ratings_total: number;
  maps_url: string;
  business_status: string;
  city: string;
  notes: string;
  prospect_status: ProspectStatus;
  assigned_to: string;
  first_contact_date?: string;
  conversion_date?: string;
  created_at: string;
}

export interface DashboardStats {
  totalSearches: number;
  totalLeads: number;
  leadsInContact: number;
  leadsInNegotiation: number;
  convertedClients: number;
  conversionRate: number;
}
