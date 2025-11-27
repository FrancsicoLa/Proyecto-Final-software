import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { VoteView } from './components/VoteView';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('is_admin_auth') === 'true';
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('is_admin_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('is_admin_auth');
  };

  return (
    <HashRouter>
      <Routes>
        {/* Ruta raíz redirige a admin login */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
        
        {/* Rutas Admin */}
        <Route 
          path="/admin" 
          element={
            isAuthenticated ? (
              <AdminDashboard onLogout={handleLogout} />
            ) : (
              <AdminLogin onLogin={handleLogin} />
            )
          } 
        />

        {/* Ruta Pública para Votar */}
        <Route path="/vote/:id" element={<VoteView />} />
      </Routes>
    </HashRouter>
  );
};

export default App;