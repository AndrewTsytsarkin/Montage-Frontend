export interface User {
  id: number;
  login: string;
  role: 'Admin' | 'Worker';
}

export interface ProjectObject {
  id: number;
  name: string;
  address: string;
  status: string;
}

export interface JwtPayload {
  sub: string;
  nameid: string;
  Login?: string;
  role: 'Admin' | 'Worker';
  exp: number;
  iat: number;
}

export interface AuthContextType {
  user: User | null;
  login: (login: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  loading: boolean;
}