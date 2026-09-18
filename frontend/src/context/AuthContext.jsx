import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('darukaa_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('darukaa_token')));

  const logout = useCallback(() => {
    localStorage.removeItem('darukaa_token');
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await apiClient.get('/auth/me');
      setUser(response.data);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    }
  }, [token, fetchCurrentUser]);

  const login = async (email, password) => {
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
