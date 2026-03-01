import { createContext, useState, useContext, useEffect, type ReactNode  } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axios';
import { AxiosError } from 'axios';
import type { AuthContextType, JwtPayload, User } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      try {
        const decoded: JwtPayload = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser({
            id: Number(decoded.nameid),
            login: decoded.Login || decoded.sub,
            role: decoded.role,fullName:""
          });
        }
      } catch {
        logout();
      }
    }
    setLoading(false);
  }, []);

const login = async (login: string, password: string) => {
  try {
    const response = await api.post<{ token: string }>('/auth/login', { login, password });
    const { token } = response.data;
    localStorage.setItem('jwt_token', token);
    const decoded: JwtPayload = jwtDecode(token);
    setUser({
      id: Number(decoded.nameid),
      login: decoded.Login || decoded.sub,
      role: decoded.role,
      fullName: (decoded  )?.FullName ??"" // ✅ Если добавите FullName в JWT claims
    });
    return { success: true };
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return { success: false, message: axiosError.response?.data?.message || 'Ошибка' };
  }
};

  const logout = () => {
    localStorage.removeItem('jwt_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};