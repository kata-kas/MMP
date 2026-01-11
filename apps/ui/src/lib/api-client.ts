import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { useContext, useMemo } from 'react';
import { SettingsContext } from '@/core/settings/settingsContext';
import { logger } from './logger';
import { toast } from 'sonner';

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        return config;
      },
      (error) => {
        logger.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        const code = (error as { code?: string }).code;
        
        if (code !== 'ERR_CANCELED') {
          logger.error('API error:', error);
          
          let message = 'An error occurred';
          if (error.response) {
            const status = error.response.status;
            message = error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data
              ? (error.response.data as { message: string }).message
              : error.message || `Request failed with status ${status}`;
          } else if (error.request) {
            message = error.message || 'Network error - no response received';
          } else {
            message = error.message || 'Request setup error';
          }
          
          toast.error('Ops... An error occurred!', {
            description: message,
            duration: Infinity,
          });
        }
        
        return Promise.reject(error);
      }
    );
  }

  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config);
  }

  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }
}

const clientCache = new Map<string, ApiClient>();

export function useApiClient(): ApiClient {
  const { settings, ready } = useContext(SettingsContext);
  
  return useMemo(() => {
    const baseURL = ready && settings?.localBackend ? settings.localBackend : '/api';
    if (!clientCache.has(baseURL)) {
      clientCache.set(baseURL, new ApiClient(baseURL));
    }
    return clientCache.get(baseURL)!;
  }, [settings?.localBackend, ready]);
}
