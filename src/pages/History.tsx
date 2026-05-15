import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { History as HistoryIcon, MapPin, Building2, Calendar, ChevronRight, BarChart3, Database } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDate } from '../lib/utils';
import { Search as SearchType } from '../types';

export default function History() {
  const [history, setHistory] = useState<SearchType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/search/history');
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-tn-navy rounded-2xl p-10 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-3">Histórico de Inteligência</h2>
          <p className="text-white/60 max-w-lg leading-relaxed">
            Acompanhe todas as buscas realizadas pela equipe para evitar duplicidade e mapear a cobertura de mercado da TechNova Systems.
          </p>
        </div>
        <HistoryIcon className="absolute right-[-20px] bottom-[-20px] text-white/5" size={240} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-tn-border overflow-hidden">
        <div className="p-6 border-b border-tn-border flex items-center justify-between bg-[#F8FAFC]">
          <h3 className="font-bold text-tn-text-main flex items-center gap-2">
            <Database size={18} className="text-tn-text-muted" />
            Buscas Registradas
          </h3>
          <span className="bg-white border border-tn-border text-tn-text-muted px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
            {history.length} Entradas
          </span>
        </div>

        <div className="divide-y divide-tn-border">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="p-8 animate-pulse flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : history.length === 0 ? (
            <div className="p-20 text-center text-tn-text-muted text-[13px] font-medium italic">Nenhuma busca realizada ainda.</div>
          ) : (
            history.map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={item.id} 
                className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 hover:bg-tn-bg transition-colors group"
              >
                <div className="bg-[#F8FAFC] text-tn-text-muted p-4 rounded-xl group-hover:bg-tn-navy group-hover:text-tn-accent transition-all border border-tn-border shadow-sm">
                  <BarChart3 size={24} />
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-tn-text-muted uppercase tracking-widest">Nicho / Termo</p>
                    <div className="flex items-center gap-2 font-bold text-tn-navy text-[15px]">
                      <Building2 size={16} className="text-tn-text-muted/50" />
                      {item.keyword}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-tn-text-muted uppercase tracking-widest">Localização</p>
                    <div className="flex items-center gap-2 font-semibold text-tn-text-main text-[13px]">
                      <MapPin size={16} className="text-tn-text-muted/50" />
                      {item.location}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-tn-text-muted uppercase tracking-widest">Resultados</p>
                    <p className="font-black text-tn-blue text-[15px]">{item.results_count || 0} empresas</p>
                  </div>
                </div>

                <div className="md:text-right space-y-1 min-w-[140px]">
                  <p className="text-[10px] font-bold text-tn-text-muted uppercase tracking-widest">Realizada em</p>
                  <div className="flex md:justify-end items-center gap-2 text-xs font-bold text-tn-navy">
                    <Calendar size={14} className="text-tn-blue" />
                    {formatDate(item.created_at)}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
