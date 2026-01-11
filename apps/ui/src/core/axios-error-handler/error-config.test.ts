import { describe, it, expect, vi } from 'vitest';
import axios, { AxiosError } from 'axios';
import { getErrorConfig } from './error-config';

describe('getErrorConfig', () => {
    describe('cancelled requests', () => {
        it('should return silent config for cancelled requests', () => {
            const error = {
                ...new Error('Request cancelled'),
                isCancel: true,
            } as AxiosError;
            
            vi.spyOn(axios, 'isCancel').mockReturnValue(true);
            
            const config = getErrorConfig(error, false);
            
            expect(config.severity).toBe('silent');
            expect(config.title).toBe('');
            expect(config.description).toBe('');
            expect(config.duration).toBe(0);
            expect(config.retryable).toBe(false);
        });
    });

    describe('network errors', () => {
        it('should return offline config when offline', () => {
            const error = {
                message: 'Network Error',
                request: {},
            } as AxiosError;
            
            vi.spyOn(axios, 'isCancel').mockReturnValue(false);
            
            const config = getErrorConfig(error, true);
            
            expect(config.severity).toBe('toast');
            expect(config.title).toBe('Offline');
            expect(config.description).toBe('You appear to be offline. Please check your connection.');
            expect(config.duration).toBe(8000);
            expect(config.retryable).toBe(true);
        });

        it('should return network error config when online', () => {
            const error = {
                message: 'Network Error',
                request: {},
            } as AxiosError;
            
            vi.spyOn(axios, 'isCancel').mockReturnValue(false);
            
            const config = getErrorConfig(error, false);
            
            expect(config.severity).toBe('toast');
            expect(config.title).toBe('Network Error');
            expect(config.description).toBe('Network Error');
            expect(config.duration).toBe(8000);
            expect(config.retryable).toBe(true);
        });

        it('should return request error config when no request made', () => {
            const error = {
                message: 'Request setup failed',
            } as AxiosError;
            
            vi.spyOn(axios, 'isCancel').mockReturnValue(false);
            
            const config = getErrorConfig(error, false);
            
            expect(config.severity).toBe('toast');
            expect(config.title).toBe('Request Error');
            expect(config.description).toBe('Request setup failed');
            expect(config.duration).toBe(5000);
            expect(config.retryable).toBe(false);
        });
    });

    describe('HTTP status codes', () => {
        const createError = (status: number, data?: unknown): AxiosError => {
            return {
                message: `Request failed with status ${status}`,
                response: {
                    status,
                    data,
                },
            } as AxiosError;
        };

        it('should handle 401 Unauthorized', () => {
            const error = createError(401);
            vi.spyOn(axios, 'isCancel').mockReturnValue(false);
            
            const config = getErrorConfig(error, false);
            
            expect(config.severity).toBe('toast');
            expect(config.title).toBe('Unauthorized');
            expect(config.duration).toBe(6000);
            expect(config.retryable).toBe(false);
        });

        it('should handle 403 Forbidden', () => {
            const error = createError(403);
            vi.spyOn(axios, 'isCancel').mockReturnValue(false);
            
            const config = getErrorConfig(error, false);
            
            expect(config.severity).toBe('toast');
            expect(config.title).toBe('Forbidden');
            expect(config.duration).toBe(5000);
            expect(config.retryable).toBe(false);
        });

        it('should handle 404 Not Found as silent', () => {
            const error = createError(404);
            vi.spyOn(axios, 'isCancel').mockReturnValue(false);
            
            const config = getErrorConfig(error, false);
            
            expect(config.severity).toBe('silent');
            expect(config.title).toBe('');
            expect(config.description).toBe('');
            expect(config.duration).toBe(0);
            expect(config.retryable).toBe(false);
        });

        it('should handle 429 Too Many Requests', () => {
            const error = createError(429);
            vi.spyOn(axios, 'isCancel').mockReturnValue(false);
            
            const config = getErrorConfig(error, false);
            
            expect(config.severity).toBe('toast');
            expect(config.title).toBe('Too Many Requests');
            expect(config.duration).toBe(5000);
            expect(config.retryable).toBe(true);
        });

        it('should handle 500 Internal Server Error', () => {
            const error = createError(500);
            vi.spyOn(axios, 'isCancel').mockReturnValue(false);
            
            const config = getErrorConfig(error, false);
            
            expect(config.severity).toBe('toast');
            expect(config.title).toBe('Server Error');
            expect(config.duration).toBe(6000);
            expect(config.retryable).toBe(true);
        });

        it('should handle 502 Bad Gateway', () => {
            const error = createError(502);
            vi.spyOn(axios, 'isCancel').mockReturnValue(false);
            
            const config = getErrorConfig(error, false);
            
            expect(config.severity).toBe('toast');
            expect(config.title).toBe('Service Unavailable');
            expect(config.duration).toBe(6000);
            expect(config.retryable).toBe(true);
        });

        it('should handle 503 Service Unavailable', () => {
            const error = createError(503);
            vi.spyOn(axios, 'isCancel').mockReturnValue(false);
            
            const config = getErrorConfig(error, false);
            
            expect(config.severity).toBe('toast');
            expect(config.title).toBe('Service Unavailable');
            expect(config.duration).toBe(6000);
            expect(config.retryable).toBe(true);
        });

        it('should handle 504 Gateway Timeout', () => {
            const error = createError(504);
            vi.spyOn(axios, 'isCancel').mockReturnValue(false);
            
            const config = getErrorConfig(error, false);
            
            expect(config.severity).toBe('toast');
            expect(config.title).toBe('Service Unavailable');
            expect(config.duration).toBe(6000);
            expect(config.retryable).toBe(true);
        });

        it('should handle unknown status codes', () => {
            const error = createError(418);
            vi.spyOn(axios, 'isCancel').mockReturnValue(false);
            
            const config = getErrorConfig(error, false);
            
            expect(config.severity).toBe('toast');
            expect(config.title).toBe('Request Failed');
            expect(config.duration).toBe(5000);
            expect(config.retryable).toBe(false);
        });

        it('should mark 5xx errors as retryable', () => {
            const error = createError(599);
            vi.spyOn(axios, 'isCancel').mockReturnValue(false);
            
            const config = getErrorConfig(error, false);
            
            expect(config.retryable).toBe(true);
        });
    });

    describe('error message extraction', () => {
        it('should extract message from response data', () => {
            const error = {
                message: 'Request failed',
                response: {
                    status: 400,
                    data: {
                        message: 'Custom error message',
                    },
                },
            } as AxiosError;
            
            vi.spyOn(axios, 'isCancel').mockReturnValue(false);
            
            const config = getErrorConfig(error, false);
            
            expect(config.description).toBe('Custom error message');
        });

        it('should fallback to error message when data.message is missing', () => {
            const error = {
                message: 'Request failed',
                response: {
                    status: 400,
                    data: {},
                },
            } as AxiosError;
            
            vi.spyOn(axios, 'isCancel').mockReturnValue(false);
            
            const config = getErrorConfig(error, false);
            
            expect(config.description).toBe('Request failed');
        });

        it('should use default message when no message available', () => {
            const error = {
                response: {
                    status: 400,
                    data: {},
                },
            } as AxiosError;
            
            vi.spyOn(axios, 'isCancel').mockReturnValue(false);
            
            const config = getErrorConfig(error, false);
            
            expect(config.description).toContain('Request failed with status 400');
        });
    });
});
