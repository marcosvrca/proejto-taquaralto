import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
});

let onUnauthorized: (() => void) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const res = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
    const { token, refreshToken: newRefresh, user } = res.data;
    localStorage.setItem('token', token);
    if (newRefresh) localStorage.setItem('refreshToken', newRefresh);
    if (user) localStorage.setItem('user', JSON.stringify(user));
    return token;
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const url = original?.url || '';

    const isAuthRoute =
      url.includes('/api/auth/login') ||
      url.includes('/api/auth/register') ||
      url.includes('/api/auth/refresh');

    if (status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }

      if (onUnauthorized) onUnauthorized();
    } else if (status === 401 && onUnauthorized && !isAuthRoute) {
      onUnauthorized();
    }

    return Promise.reject(error);
  }
);

export default api;
