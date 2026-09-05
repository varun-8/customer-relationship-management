import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Always require fresh login when app is opened
  useEffect(() => {
    localStorage.removeItem('vasantham_crm_token');
    setUser(null);
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      if (res.success && res.data) {
        localStorage.setItem('vasantham_crm_token', res.data.token);
        setUser(res.data);
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (targetRole) => {
    if (targetRole === 'owner') {
      await login('owner@vasantham.com', 'admin123');
    } else {
      await login('employee@vasantham.com', 'employee123');
    }
  };

  const logout = () => {
    localStorage.removeItem('vasantham_crm_token');
    setUser(null);
  };

  const isOwner = user?.role === 'owner' || user?.role === 'admin';
  const isEmployee = user?.role === 'employee';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        switchRole,
        isOwner,
        isEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
