import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Users, 
  Search, 
  UserPlus, 
  BarChart3, 
  Target, 
  TrendingUp,
  Clock,
  Briefcase
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion } from 'motion/react';
import { DashboardStats } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/dashboard');
      setStats(response.data);
    } catch (error: any) {
      console.error('Full Dashboard Error Context:', error.response?.data || error.message);
      
      // If it's a 401, App.tsx interceptor handles it. 
      // Only toast for other systematic errors
      if (error.response?.status !== 401) {
        toast.error('Não foi possível carregar os dados do painel.');
      }

      // Set empty stats to avoid infinite loading pulse
      setStats({
        totalSearches: 0,
        totalLeads: 0,
        leadsInContact: 0,
        leadsInNegotiation: 0,
        convertedClients: 0,
        conversionRate: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[400px] bg-gray-200 rounded-2xl"></div>
          <div className="h-[400px] bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: 'Contatados', value: stats.leadsInContact, color: '#38BDF8' },
    { name: 'Negociação', value: stats.leadsInNegotiation, color: '#2563EB' },
    { name: 'Convertidos', value: stats.convertedClients, color: '#10b981' },
    { name: 'Novos', value: stats.totalLeads - (stats.leadsInContact + stats.leadsInNegotiation + stats.convertedClients), color: '#94a3b8' }
  ].filter(d => d.value > 0);

  const statCards = [
    { label: 'Total de Leads', value: stats.totalLeads, icon: Users, color: 'text-tn-blue', detail: '↑ 12% este mês' },
    { label: 'Em Contato', value: stats.leadsInContact, icon: Clock, color: 'text-tn-navy', detail: 'Ativos no pipeline' },
    { label: 'Em Negociação', value: stats.leadsInNegotiation, icon: Briefcase, color: 'text-tn-navy', detail: 'Oportunidades quentes' },
    { label: 'Convertidos', value: stats.convertedClients, icon: UserPlus, color: 'text-emerald-500', detail: `${stats.conversionRate}% Taxa de Conv.`, border: 'border-b-4 border-emerald-500' },
  ];

  return (
    <div className="space-y-10">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "bg-white p-6 rounded-xl shadow-sm border border-tn-border flex flex-col",
              stat.border
            )}
          >
            <p className="text-[12px] font-semibold text-tn-text-muted uppercase tracking-wider mb-2">{stat.label}</p>
            <h3 className="text-3xl font-bold text-tn-navy mb-1">{stat.value}</h3>
            {stat.detail && <p className={cn("text-[11px]", stat.label === 'Total de Leads' || stat.label === 'Convertidos' ? 'text-emerald-500 font-semibold' : 'text-tn-text-muted')}>{stat.detail}</p>}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white p-8 rounded-2xl border border-tn-border shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-tn-text-main">Performance Comercial</h3>
              <p className="text-sm text-tn-text-muted">Distribuição de leads por estágio do funil</p>
            </div>
            <BarChart3 className="text-tn-border" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 600, fill: '#64748B' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Funnel Distribution pie */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-2xl border border-tn-border shadow-sm"
        >
          <h3 className="text-lg font-bold text-tn-text-main mb-8">Participação de Conversão</h3>
          <div className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-tn-navy">{stats.conversionRate}%</span>
              <span className="text-[10px] font-semibold text-tn-text-muted uppercase tracking-widest">Conversão</span>
            </div>
          </div>
          <div className="mt-8 space-y-3">
             {chartData.map((item) => (
               <div key={item.name} className="flex items-center justify-between text-[13px]">
                 <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                   <span className="text-tn-text-muted font-medium">{item.name}</span>
                 </div>
                 <span className="font-bold text-tn-text-main">{item.value}</span>
               </div>
             ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions / Recent Activity Placeholder */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-tn-navy text-white p-10 rounded-2xl overflow-hidden relative shadow-xl"
      >
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-2xl font-bold mb-3">Expanda sua base comercial hoje.</h3>
          <p className="text-white/60 text-base mb-8 leading-relaxed">
            Nossa integração com o Google Maps permite encontrar empresas em qualquer lugar do mundo com precisão técnica e dados atualizados.
          </p>
          <button className="bg-tn-blue text-white px-8 py-3.5 rounded-lg font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/10 text-sm">
            Iniciar Nova Prospecção
          </button>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none transform translate-x-1/4 scale-150">
          <TrendingUp size={400} />
        </div>
      </motion.div>
    </div>
  );
}

// Re-using helper because I can't import from another file easily in this flow without risking issues
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
