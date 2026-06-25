import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5003';
axios.defaults.baseURL = apiBaseUrl;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('authUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('authUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('authUser');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('authToken', token);
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      localStorage.removeItem('authToken');
      delete axios.defaults.headers.common.Authorization;
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    const response = await axios.post('/api/auth/login', { email, password });
    setUser(response.data.user);
    setToken(response.data.token);
    setLoading(false);
    return response;
  };

  const register = async (name, email, password, role) => {
    setLoading(true);
    const response = await axios.post('/api/auth/register', { name, email, password, role });
    setLoading(false);
    return response;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
