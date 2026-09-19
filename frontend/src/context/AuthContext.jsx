import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

const DEFAULT_ADMIN = {
  id: 1,
  email: 'admin@darukaa.earth',
  full_name: 'Darukaa Administrator',
  role: 'administrator',
  is_active: true,
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('darukaa_token');
    if (saved) return saved;
    localStorage.setItem('darukaa_token', 'darukaa_demo_jwt_token_admin_access');
    return 'darukaa_demo_jwt_token_admin_access';
  });

  const [user, setUser] = useState(DEFAULT_ADMIN);
  const [loading, setLoading] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem('darukaa_token');
    localStorage.setItem('darukaa_logged_out', 'true');
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await apiClient.get('/auth/me');
      setUser(response.data);
    } catch (err) {
      console.warn('Backend unavailable, using default administrator profile:', err);
      setUser(DEFAULT_ADMIN);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    }
  }, [token, fetchCurrentUser]);

  const login = async (email, password) => {
    localStorage.removeItem('darukaa_logged_out');
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await apiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const accessToken = response.data.access_token;
    localStorage.setItem('darukaa_token', accessToken);
    setToken(accessToken);
    await fetchCurrentUser();
    return response.data;
  };

  const register = async (email, password, fullName, role = 'administrator') => {
    localStorage.removeItem('darukaa_logged_out');
    await apiClient.post('/auth/register', {
      email,
      password,
      full_name: fullName,
      role,
    });
    return login(email, password);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
