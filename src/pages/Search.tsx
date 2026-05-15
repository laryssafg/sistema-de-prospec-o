import React, { useState } from 'react';
import api from '../lib/api';
import { 
  Search as SearchIcon, 
  MapPin, 
  Building2, 
  Star, 
  Globe, 
  Phone, 
  Save, 
  CheckCircle,
  ExternalLink,
  Loader2,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

interface SearchResult {
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

export default function Search() {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const hasError = results.some(r => r.address.startsWith('ERRO:'));

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Extract values directly from form to avoid state synchronization race conditions
    const formData = new FormData(e.currentTarget);
    const searchKeyword = (formData.get('keyword') as string || '').trim();
    const searchLocation = (formData.get('location') as string || '').trim();

    if (!searchKeyword || !searchLocation) {
      toast.error('Preencha o nicho e a cidade.');
      return;
    }

    // Sync state for UI consistency
    setKeyword(searchKeyword);
    setLocation(searchLocation);

    setIsSearching(true);
    setResults([]);
    setSelectedIds(new Set());
    
    try {
      const response = await api.post('/api/search', { 
        keyword: searchKeyword, 
        location: searchLocation 
      });
      setResults(response.data);
      if (response.data.length === 0) {
        toast('Nenhum resultado encontrado.', { icon: 'ℹ️' });
      } else {
        toast.success(`${response.data.length} empresas encontradas!`);
      }
    } catch (error: any) {
      console.error('Frontend Search Error:', error.response?.data || error.message);
      if (error.response?.status !== 401) {
        toast.error('Ocorreu um erro na busca. Verifique os logs.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map(r => r.id)));
    }
  };

  const saveLeads = async (leadsToSave: SearchResult[]) => {
    const loadingToast = toast.loading('Salvando leads...');
    try {
      await api.post('/api/leads/batch', leadsToSave.map(l => ({
        name: l.name,
        category: keyword, // Using state is fine here as it's synced above, but we could also use result data if we had it
        address: l.address,
        phone: l.phone || '',
        website: l.website || '',
        rating: l.rating || 0,
        user_ratings_total: l.user_ratings_total || 0,
        maps_url: l.maps_url || '',
        business_status: l.business_status || '',
        city: l.city, // CRITICAL: Use the city from the result, not the current input state
        assigned_to: 'Laryssa Ferreira',
        prospect_status: 'Novo'
      })));
      
      const newSavedIds = new Set(savedIds);
      leadsToSave.forEach(l => newSavedIds.add(l.id));
      setSavedIds(newSavedIds);
      setSelectedIds(new Set());
      
      toast.dismiss(loadingToast);
      toast.success(`${leadsToSave.length} leads salvos com sucesso!`);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Erro ao salvar leads.');
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      {/* Search Header */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-tn-border">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-5">
            <label className="block text-[11px] font-bold text-tn-text-muted uppercase tracking-widest mb-3 px-1">Nicho / Segmento</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-tn-text-muted" size={18} />
              <input 
                type="text" 
                name="keyword"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="Ex: Barbearia, Dentista, Academia..."
                autoComplete="off"
                spellCheck={false}
                className="w-full pl-12 pr-4 py-3.5 bg-[#F1F5F9] border border-transparent focus:border-tn-blue focus:bg-white rounded-xl outline-none transition-all text-[13px]"
              />
            </div>
          </div>
          <div className="md:col-span-5">
            <label className="block text-[11px] font-bold text-tn-text-muted uppercase tracking-widest mb-3 px-1">Cidade / Região</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-tn-text-muted" size={18} />
              <input 
                type="text" 
                name="location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Ex: São Paulo, SP"
                autoComplete="off"
                spellCheck={false}
                className="w-full pl-12 pr-4 py-3.5 bg-[#F1F5F9] border border-transparent focus:border-tn-blue focus:bg-white rounded-xl outline-none transition-all text-[13px]"
              />
            </div>
          </div>
          <div className="md:col-span-2 self-end">
            <button 
              type="submit"
              disabled={isSearching}
              className="w-full h-[52px] bg-tn-blue text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/10 text-sm"
            >
              {isSearching ? <Loader2 className="animate-spin" size={18} /> : <SearchIcon size={18} />}
              Buscar
            </button>
          </div>
        </form>
      </div>

      {/* Error Alert */}
      {hasError && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6"
        >
          <div className="bg-red-100 p-3 rounded-xl">
            <Navigation className="text-red-600 rotate-45" size={24} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-red-900 font-bold mb-1">Configuração da API Necessária</h3>
            <p className="text-red-700 text-sm">
              Sua chave do Google Maps não pôde completar a busca real. Os resultados abaixo são demonstrações técnicas.
            </p>
          </div>
          <a 
            href="https://console.cloud.google.com/marketplace/product/google/places.googleapis.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
          >
            Ativar Places API (New)
          </a>
        </motion.div>
      )}

      {/* Results Controls */}
      {results.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={selectAll}
              className="text-xs font-bold text-tn-text-muted hover:text-tn-navy flex items-center gap-2 transition-colors uppercase tracking-wider"
            >
               <input 
                type="checkbox" 
                checked={selectedIds.size === results.length && results.length > 0} 
                onChange={() => {}} // Controlled by button
                className="rounded border-tn-border pointer-events-none"
              />
              Selecionar Todos ({results.length})
            </button>
          </div>
          <div className="flex gap-3">
            <button 
              disabled={selectedIds.size === 0}
              onClick={() => saveLeads(results.filter(r => selectedIds.has(r.id)))}
              className="bg-tn-navy text-white px-6 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-black transition-all disabled:opacity-20 shadow-md"
            >
              <Save size={16} />
              Salvar Selecionados ({selectedIds.size})
            </button>
          </div>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {results.map((result, idx) => {
            const isSaved = savedIds.has(result.id);
            const isSelected = selectedIds.has(result.id);

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={result.id}
                className={cn(
                  "group bg-white rounded-2xl border transition-all duration-300 overflow-hidden",
                  isSelected ? "border-tn-blue ring-1 ring-tn-blue/20 shadow-lg shadow-blue-500/5" : "border-tn-border hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5"
                )}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div 
                      className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors",
                        isSelected ? "bg-tn-blue border-tn-blue" : "border-tn-border bg-[#F8FAFC] group-hover:border-blue-300"
                      )}
                      onClick={() => !isSaved && toggleSelect(result.id)}
                    >
                      {isSelected && <CheckCircle size={12} className="text-white" />}
                    </div>
                    {isSaved ? (
                      <span className="status-badge client">Salvo</span>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-2 py-1 rounded-md border border-tn-border">
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                        <span className="text-[13px] font-bold text-tn-text-main">{result.rating || 'N/A'}</span>
                        <span className="text-[10px] text-tn-text-muted mt-0.5">({result.user_ratings_total})</span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-[15px] text-tn-text-main leading-tight mb-2 line-clamp-1">{result.name}</h3>
                  <div className="flex items-start gap-2 text-tn-text-muted text-[13px] mb-6 min-h-[40px]">
                    <MapPin size={15} className={`shrink-0 mt-0.5 ${result.address.startsWith('ERRO:') ? 'text-red-500' : ''}`} />
                    <span className={cn("line-clamp-2", result.address.startsWith('ERRO:') && "text-red-600 font-bold")}>
                      {result.address}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {result.phone && (
                      <div className="flex items-center gap-2 text-[12px] font-medium text-tn-text-muted">
                        <Phone size={14} className="text-tn-text-muted/60" />
                        {result.phone}
                      </div>
                    )}
                    {result.website && (
                      <div className="flex items-center gap-2 text-[12px] font-medium text-tn-blue hover:underline">
                        <Globe size={14} className="text-tn-blue/60" />
                        <a href={result.website} target="_blank" rel="noopener noreferrer" className="truncate">
                          {result.address.startsWith('ERRO:') ? 'Ativar no Google Cloud' : 'Ver Site Oficial'}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 bg-[#F8FAFC] border-t border-tn-border flex items-center justify-between">
                  <a 
                    href={result.maps_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[10px] font-bold text-tn-text-muted uppercase tracking-widest hover:text-tn-blue flex items-center gap-1 transition-colors"
                  >
                    Abrir no Maps
                    <ExternalLink size={12} />
                  </a>
                  {!isSaved && (
                    <button 
                      onClick={() => saveLeads([result])}
                      className="bg-white border border-tn-border hover:border-tn-blue hover:text-tn-blue px-4 py-2 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                    >
                      Salvar Lead
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {results.length === 0 && !isSearching && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-gray-100 p-8 rounded-full mb-6">
              <Navigation size={48} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Pronta para buscar?</h3>
            <p className="text-gray-500 max-w-sm">
              Defina o segmento e a cidade acima para encontrar novos leads qualificados via Google Places.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
