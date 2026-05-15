import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Search as SearchIcon, 
  Users, 
  History, 
  LogOut, 
  Menu, 
  X,
  TrendingUp,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  userEmail: string;
}

const sidebarItems = [
  { path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: 'search', label: 'Nova Busca', icon: SearchIcon },
  { path: 'leads', label: 'Leads Salvos', icon: Users },
  { path: 'history', label: 'Histórico', icon: History },
];

export default function Layout({ children, activePath, onNavigate, onLogout, userEmail }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-tn-bg font-sans text-tn-text-main">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-[240px] bg-tn-navy text-white">
        <div className="p-6 pb-8 border-b border-white/10 mb-6">
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-xl tracking-tight text-white">
              TechNova<span className="text-tn-accent">Prospect</span>
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-0 py-0 space-y-0 text-sm">
          {sidebarItems.map((item) => (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-3 transition-all duration-200 border-r-[3px]",
                activePath === item.path 
                  ? "bg-white/5 text-tn-accent border-tn-accent font-semibold" 
                  : "text-white/70 hover:text-white hover:bg-white/5 border-transparent"
              )}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-tn-navy/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="w-[280px] h-full bg-tn-navy p-6 shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                   <h1 className="font-extrabold text-xl tracking-tight text-white">TechNova<span className="text-tn-accent">Prospect</span></h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/50 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 space-y-1">
                {sidebarItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      onNavigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all",
                      activePath === item.path 
                        ? "bg-white/10 text-tn-accent font-bold" 
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon size={20} />
                    <span className="text-[15px]">{item.label}</span>
                  </button>
                ))}
              </nav>
              <div className="pt-6 border-t border-white/10">
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-4 text-white/40 hover:text-white transition-colors"
                >
                  <LogOut size={20} />
                  <span className="text-[15px] font-medium">Sair da Conta</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-tn-border flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="md:hidden p-2 -ml-2 text-tn-text-muted hover:bg-gray-100 rounded-md"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="relative max-w-sm w-full hidden sm:block">
               <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-tn-text-muted" />
               <input 
                 type="text" 
                 placeholder="Buscar por leads ou empresas..." 
                 className="w-full bg-[#F1F5F9] rounded-md py-2 pl-11 pr-4 border-none text-sm focus:outline-none focus:ring-1 focus:ring-tn-blue/20"
               />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[13px] font-bold text-tn-text-main leading-tight">{userEmail.split('@')[0]}</p>
              <p className="text-[11px] text-tn-text-muted leading-tight uppercase tracking-wider">Administradora</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-tn-blue flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {userEmail.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
