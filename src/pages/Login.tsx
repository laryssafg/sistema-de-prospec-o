import React, { useState } from 'react';
import api from '../lib/api';
import { toast } from 'react-hot-toast';
import { TrendingUp, Lock, Mail, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      
      // Save token for iframe session fallback
      if (response.data.token) {
        localStorage.setItem('technova_session_token', response.data.token);
      }
      
      onLogin(response.data);
      toast.success('Bem-vinda, Laryssa!');
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('API não encontrada (404). Verifique o servidor.');
      } else {
        const errorMsg = error.response?.data?.error;
        toast.error(typeof errorMsg === 'string' ? errorMsg : 'Erro ao realizar login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-tn-bg flex flex-col items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="bg-tn-navy p-5 rounded-3xl shadow-2xl mb-6">
            <TrendingUp size={48} className="text-tn-accent" />
          </div>
          <h1 className="text-3xl font-black text-tn-navy tracking-tight text-center">
            TechNova<span className="text-tn-blue">Prospect</span>
          </h1>
          <p className="text-tn-text-muted mt-2 text-center max-w-[320px] text-sm leading-relaxed">
            Painel de inteligência comercial e autogestão de prospecção para a TechNova Systems.
          </p>
        </div>

        <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-blue-900/5 border border-tn-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-tn-text-muted mb-2 px-1">
                Credencial de Acesso
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-[#F8FAFC] border border-tn-border focus:border-tn-blue focus:bg-white rounded-2xl outline-none transition-all text-[13px] text-tn-text-main"
                  placeholder="laryssa.ferreira@technovasystems.com.br"
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-tn-text-muted" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-tn-text-muted mb-2 px-1">
                Senha Operacional
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-4 bg-[#F8FAFC] border border-tn-border focus:border-tn-blue focus:bg-white rounded-2xl outline-none transition-all text-[13px] text-tn-text-main"
                  placeholder="••••••••"
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-tn-text-muted" size={18} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-tn-text-muted hover:text-tn-blue transition-colors outline-none"
                  aria-label={showPassword ? "Esconder senha" : "Ver senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-tn-blue text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] disabled:opacity-70 text-sm"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-tn-border text-center">
            <p className="text-[11px] text-tn-text-muted leading-relaxed uppercase tracking-wider font-semibold">
              © 2026 TechNova Systems <br/>Acesso Restrito
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
