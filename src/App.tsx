import React, { useState, useEffect } from 'react';
import api from './lib/api';
import { Toaster, toast } from 'react-hot-toast';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Leads from './pages/Leads';
import History from './pages/History';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePath, setActivePath] = useState('dashboard');

  useEffect(() => {
    checkAuth();
  }, []); // Only check auth on mount

  useEffect(() => {
    // Add interceptor for 401 errors
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Only clear user if they WERE logged in
          setUser((prevUser) => {
            if (prevUser) {
              // Clear fallback token
              localStorage.removeItem('technova_session_token');
              // If we were on a restricted page, toast about it
              if (activePath !== 'dashboard') {
                toast.error('Sessão expirada. Faça login novamente.');
              }
              return null;
            }
            return null;
          });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [activePath]);

  const checkAuth = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setActivePath('dashboard');
  };

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
      localStorage.removeItem('technova_session_token');
      setUser(null);
      toast.success('Desconectado com sucesso');
    } catch (error) {
      toast.error('Erro ao sair');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-tn-bg">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-tn-blue border-r-2 border-r-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster position="top-right" />
      </>
    );
  }

  const renderContent = () => {
    switch (activePath) {
      case 'dashboard': return <Dashboard />;
      case 'search': return <Search />;
      case 'leads': return <Leads />;
      case 'history': return <History />;
      default: return <Dashboard />;
    }
  };

  return (
    <>
      <Layout 
        activePath={activePath} 
        onNavigate={setActivePath} 
        onLogout={handleLogout}
        userEmail={user.email}
      >
        {renderContent()}
      </Layout>
      <Toaster position="top-right" />
    </>
  );
}
