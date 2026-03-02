import axios, {    AxiosError, type InternalAxiosRequestConfig } from 'axios';

// Убедитесь, что порт соответствует тому, на котором запускается .NET API
const API_URL = "/api"//||'https://localhost:7118/api'; 

const api = axios.create({
  baseURL: API_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Для отладки можно включить передачу кредитов (куки), 
  // но для JWT в заголовке это не обязательно
  withCredentials: false 
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('jwt_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;