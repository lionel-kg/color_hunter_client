import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../stores/auth";
import { SERVER_URL } from "../lib/config";

export const api = axios.create({
  baseURL: `${SERVER_URL}/api`,
  withCredentials: false,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const access = useAuthStore.getState().access;
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = (async () => {
            const refresh = useAuthStore.getState().refresh;
            if (!refresh) return null;
            const { data } = await axios.post("/api/auth/refresh", { refresh });
            useAuthStore.getState().setAccess(data.access);
            return data.access as string;
          })().finally(() => {
            refreshing = null;
          });
        }
        const newAccess = await refreshing;
        if (newAccess) {
          original.headers!.Authorization = `Bearer ${newAccess}`;
          return api.request(original);
        }
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(err);
  },
);
