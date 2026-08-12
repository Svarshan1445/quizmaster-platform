import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Strictly disable auto-login on application startup
  useEffect(() => {
    localStorage.removeItem('quiz_token');
    localStorage.removeItem('quiz_user');
    sessionStorage.removeItem('quiz_token');
    sessionStorage.removeItem('quiz_user');
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    sessionStorage.setItem('quiz_token', newToken);
    sessionStorage.setItem('quiz_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { token: newToken, user: newUser } = res.data;
    sessionStorage.setItem('quiz_token', newToken);
    sessionStorage.setItem('quiz_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('quiz_token');
    localStorage.removeItem('quiz_user');
    sessionStorage.removeItem('quiz_token');
    sessionStorage.removeItem('quiz_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin: user?.role === 'ADMIN', isStudent: user?.role === 'STUDENT' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
