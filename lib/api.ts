import axios from 'axios';
import { getMockResponse } from './mockData';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// All API calls go through Next.js rewrites (/api/v1/* → FastAPI backend).
// This avoids CORS issues and build-time URL baking problems.
const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Mock interceptor (dev/demo mode) ─────────────────────────────────────────
if (USE_MOCK) {
  api.interceptors.request.use((config) => {
    const url = config.url || '';
    const urlParams: Record<string, string> = {};
    const qIdx = url.indexOf('?');
    if (qIdx !== -1) {
      new URLSearchParams(url.slice(qIdx + 1)).forEach((v, k) => { urlParams[k] = v; });
    }
    if (config.params && typeof config.params === 'object') {
      for (const [k, v] of Object.entries(config.params as Record<string, unknown>)) {
        urlParams[k] = String(v);
      }
    }

    const cleanUrl = qIdx !== -1 ? url.slice(0, qIdx) : url;
    const mockData = getMockResponse(cleanUrl, urlParams);

    if (mockData !== null) {
      config.adapter = async () => ({
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config,
        request: {},
      });
    }

    return config;
  });
}

// ─── Auth token injection ─────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Queue of requests waiting for a token refresh
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function flushQueue(error: unknown, token: string | null = null) {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry && typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          '/api/v1/auth/refresh',
          null,
          { headers: { Authorization: `Bearer ${refreshToken}` } },
        );
        const newToken: string = res.data.access_token;
        localStorage.setItem('access_token', newToken);
        if (res.data.refresh_token) {
          localStorage.setItem('refresh_token', res.data.refresh_token);
        }
        flushQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
