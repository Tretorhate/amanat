import axios, { AxiosInstance } from 'axios';
import { authStore } from '@/lib/store/authStore';

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = authStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // In Telegram WebApp context, try re-auth instead of redirecting to login
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData) {
        const initData = window.Telegram.WebApp.initData;
        try {
          const res = await axios.post(
            `${api.defaults.baseURL}/accounts/telegram-auth/`,
            { init_data: initData }
          );
          const { access, user } = res.data;
          authStore.getState().login(access, user);
          // Retry the original request with new token
          error.config.headers.Authorization = `Bearer ${access}`;
          return axios(error.config);
        } catch {
          // Re-auth failed, just reject
        }
      } else {
        authStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/ru/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
