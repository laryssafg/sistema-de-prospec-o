import React, { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Phone, 
  Globe, 
  MapPin, 
  Calendar,
  CheckCircle2,
  Trash2,
  FileDown,
  ChevronRight,
  User,
  ExternalLink,
  MessageSquare,
  ArrowUpRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { Lead, ProspectStatus } from '../types';
import { cn, formatDate } from '../lib/utils';

const statusColors: Record<ProspectStatus, string> = {
  'Novo': 'status-badge new',
  'Em contato': 'status-badge contact',
  'Respondeu': 'status-badge contact', // Map similar statuses to same theme colors
  'Sem resposta': 'status-badge contact opacity-70',
  'Negociação': 'status-badge contact font-bold',
  'Cliente': 'status-badge client',
  'Perdido': 'bg-gray-100 text-gray-600 border-gray-200 border status-badge',
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/leads');
      setLeads(response.data);
    } catch (error) {
      toast.error('Erro ao buscar leads');
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           l.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || l.prospect_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchTerm, statusFilter]);

  const updateLeadStatus = async (id: string, newStatus: ProspectStatus) => {
    try {
      const response = await api.put(`/api/leads/${id}`, { prospect_status: newStatus });
      setLeads(leads.map(l => l.id === id ? response.data : l));
      if (selectedLead?.id === id) setSelectedLead(response.data);
      toast.success(`Status atualizado para ${newStatus}`);
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const updateLeadNotes = async (id: string, notes: string) => {
    try {
      const response = await api.put(`/api/leads/${id}`, { notes });
      setLeads(leads.map(l => l.id === id ? response.data : l));
      toast.success('Observações salvas');
    } catch (error) {
      toast.error('Erro ao salvar observações');
    }
  };

  const exportToExcel = () => {
    const data = filteredLeads.map(l => ({
      Nome: l.name,
      Nicho: l.category,
      Endereço: l.address,
      Cidade: l.city,
      Telefone: l.phone,
      Website: l.website,
      Status: l.prospect_status,
      Rating: l.rating,
      Avaliações: l.user_ratings_total,
      Criado_em: formatDate(l.created_at),
      Conversão: l.conversion_date ? formatDate(l.conversion_date) : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    XLSX.writeFile(workbook, `leads_technova_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Leads exportados para Excel');
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white p-5 rounded-xl border border-tn-border shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tn-text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por leads ou empresas..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F1F5F9] border border-transparent focus:border-tn-blue focus:bg-white rounded-lg outline-none transition-all text-[13px]"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto pl-4 pr-10 py-2.5 bg-[#F1F5F9] border border-transparent focus:border-tn-blue focus:bg-white rounded-lg outline-none transition-all text-xs font-semibold uppercase tracking-wider appearance-none cursor-pointer"
          >
            <option value="all">Filtro: Todos</option>
            <option value="Novo">Status: Novo</option>
            <option value="Em contato">Status: Em contato</option>
            <option value="Cliente">Status: Cliente</option>
            <option value="Perdido">Status: Perdido</option>
          </select>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button 
            onClick={exportToExcel}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-tn-border text-tn-text-muted rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors uppercase tracking-widest"
          >
            <FileDown size={16} />
            Exportar XLSX
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-tn-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-tn-border">
                <th className="px-6 py-3.5 text-[11px] font-bold text-tn-text-muted uppercase tracking-widest">Empresa</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-tn-text-muted uppercase tracking-widest">Cidade</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-tn-text-muted uppercase tracking-widest">Telefone</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-tn-text-muted uppercase tracking-widest">Status</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-tn-text-muted uppercase tracking-widest">Responsável</th>
                <th className="px-6 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tn-border">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8"><div className="h-4 bg-gray-100 rounded w-1/2"></div></td>
                  </tr>
                ))
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400">Nenhum lead encontrado com os filtros atuais.</td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-tn-bg transition-colors cursor-pointer group"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-tn-text-main text-[13px]">{lead.name}</span>
                        <span className="text-[11px] text-tn-text-muted uppercase tracking-wider font-semibold">{lead.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[13px] text-tn-text-muted">
                        {lead.city}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-tn-text-muted">
                       {lead.phone || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={statusColors[lead.prospect_status]}>
                        {lead.prospect_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[11px] text-tn-text-muted font-bold uppercase tracking-wider">
                        <div className="w-6 h-6 rounded-full bg-tn-blue text-white flex items-center justify-center font-bold text-[10px]">
                          {(lead.assigned_to || 'L')[0]}
                        </div>
                        {(lead.assigned_to || 'Laryssa Ferreira').split(' ')[0]}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 text-gray-300 hover:text-[#141414] hover:bg-white rounded-lg transition-all group-hover:scale-110">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedLead(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[24px] shadow-2xl overflow-hidden relative flex flex-col border border-tn-border"
            >
              {/* Header */}
              <div className="p-8 border-b border-tn-border flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={statusColors[selectedLead.prospect_status]}>
                      {selectedLead.prospect_status}
                    </span>
                    <span className="text-[11px] font-bold text-tn-text-muted uppercase tracking-widest">ID: {selectedLead.id.slice(-6)}</span>
                  </div>
                  <h2 className="text-2xl font-black text-tn-navy tracking-tight uppercase">{selectedLead.name}</h2>
                </div>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="p-2 hover:bg-[#F1F5F9] rounded-full transition-colors"
                >
                  <X size={20} className="text-tn-text-muted" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-12 gap-10 bg-white">
                {/* Left Column: Info */}
                <div className="md:col-span-7 space-y-8">
                   <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-1">
                       <label className="text-[11px] font-bold text-tn-text-muted uppercase tracking-widest">Localização</label>
                       <p className="text-tn-text-main font-bold text-[13px]">{selectedLead.city}</p>
                     </div>
                     <div className="space-y-1">
                       <label className="text-[11px] font-bold text-tn-text-muted uppercase tracking-widest">Data Cadastro</label>
                       <p className="text-tn-text-main font-bold text-[13px]">{formatDate(selectedLead.created_at)}</p>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <label className="text-[11px] font-bold text-tn-text-muted uppercase tracking-widest">Endereço</label>
                     <div className="bg-[#F8FAFC] p-5 rounded-xl border border-tn-border">
                       <p className="text-[13px] text-tn-text-main leading-relaxed font-medium">{selectedLead.address}</p>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     {selectedLead.phone && (
                       <a href={`tel:${selectedLead.phone}`} className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl border border-tn-border hover:border-tn-blue transition-all group">
                         <div className="bg-white p-2 rounded shadow-sm border border-tn-border">
                           <Phone size={16} className="text-tn-text-muted" />
                         </div>
                         <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-tn-text-muted uppercase tracking-widest">Telefone</span>
                           <span className="text-[13px] font-bold text-tn-navy">{selectedLead.phone}</span>
                         </div>
                       </a>
                     )}
                     {selectedLead.website && (
                       <a href={selectedLead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl border border-tn-border hover:border-tn-blue transition-all group">
                         <div className="bg-white p-2 rounded shadow-sm border border-tn-border">
                           <Globe size={16} className="text-tn-text-muted" />
                         </div>
                         <div className="flex flex-col overflow-hidden">
                           <span className="text-[10px] font-bold text-tn-text-muted uppercase tracking-widest">Website</span>
                           <span className="text-[13px] font-bold text-tn-navy truncate">Link oficial</span>
                         </div>
                       </a>
                     )}
                   </div>

                   <div className="space-y-4 pt-4 border-t border-tn-border">
                     <label className="text-[11px] font-bold text-tn-text-muted uppercase tracking-widest flex items-center gap-2">
                       <MessageSquare size={14} />
                       Observações Comerciais
                     </label>
                     <textarea 
                        defaultValue={selectedLead.notes}
                        onBlur={(e) => updateLeadNotes(selectedLead.id, e.target.value)}
                        placeholder="Adicione notas sobre negociações ou contatos..."
                        className="w-full h-32 p-4 bg-[#F8FAFC] border border-tn-border focus:border-tn-blue focus:bg-white rounded-xl outline-none transition-all text-[13px] resize-none"
                     />
                   </div>
                </div>

                {/* Right Column: Actions */}
                <div className="md:col-span-5 bg-[#F8FAFC] rounded-24 p-8 space-y-8 border-[6px] border-white shadow-inner">
                   <div className="space-y-4">
                     <h4 className="text-[11px] font-bold text-tn-text-muted uppercase tracking-widest">Estágio do Lead</h4>
                     <div className="grid grid-cols-1 gap-2">
                       {(['Em contato', 'Negociação', 'Perdido'] as ProspectStatus[]).map(status => (
                         <button 
                           key={status}
                           onClick={() => updateLeadStatus(selectedLead.id, status)}
                           className={cn(
                             "w-full text-left px-5 py-3 rounded-lg text-xs font-bold border transition-all uppercase tracking-wider",
                             selectedLead.prospect_status === status 
                               ? "bg-tn-navy text-white border-tn-navy shadow-lg" 
                               : "bg-white text-tn-text-muted border-tn-border hover:border-tn-blue"
                           )}
                         >
                           {status}
                         </button>
                       ))}
                     </div>
                   </div>

                   <div className="pt-6 border-t border-tn-border">
                     <button 
                        disabled={selectedLead.prospect_status === 'Cliente'}
                        onClick={() => updateLeadStatus(selectedLead.id, 'Cliente')}
                        className={cn(
                          "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl text-sm",
                          selectedLead.prospect_status === 'Cliente'
                           ? "bg-emerald-500 text-white cursor-default"
                           : "bg-tn-blue text-white hover:bg-blue-600 active:scale-[0.98]"
                        )}
                     >
                       {selectedLead.prospect_status === 'Cliente' ? <CheckCircle2 size={18} /> : <ArrowUpRight size={18} />}
                       {selectedLead.prospect_status === 'Cliente' ? 'CLIENTE CONVERTIDO' : 'CONVERTER EM CLIENTE'}
                     </button>
                     {selectedLead.conversion_date && (
                       <p className="text-center text-[10px] font-bold text-emerald-600 mt-4 uppercase tracking-widest bg-emerald-50 py-2 rounded-lg">
                         Convertido em {formatDate(selectedLead.conversion_date)}
                       </p>
                     )}
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
