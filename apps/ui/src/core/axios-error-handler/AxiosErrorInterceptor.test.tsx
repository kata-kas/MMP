import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { AxiosErrorInterceptor } from './AxiosErrorInterceptor';
import { setupAxiosErrorInterceptor } from './setup-axios-interceptor';
import { ToastProvider } from '../toast/ToastContext';
import { OfflineProvider } from '../offline/OfflineContext';

vi.mock('./setup-axios-interceptor');

describe('AxiosErrorInterceptor', () => {
    const mockCleanup = vi.fn();
    const mockShowErrorToast = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(setupAxiosErrorInterceptor).mockReturnValue(mockCleanup);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should setup interceptor on mount using context values', () => {
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: true,
        });

        render(
            <ToastProvider>
                <OfflineProvider>
                    <AxiosErrorInterceptor />
                </OfflineProvider>
            </ToastProvider>
        );

        expect(setupAxiosErrorInterceptor).toHaveBeenCalledWith(
            expect.any(Function),
            false
        );
    });

    it('should cleanup interceptor on unmount', () => {
        const { unmount } = render(
            <ToastProvider>
                <OfflineProvider>
                    <AxiosErrorInterceptor />
                </OfflineProvider>
            </ToastProvider>
        );

        unmount();

        expect(mockCleanup).toHaveBeenCalled();
    });

    it('should use injected showErrorToast when provided', () => {
        render(
            <ToastProvider>
                <OfflineProvider>
                    <AxiosErrorInterceptor showErrorToast={mockShowErrorToast} />
                </OfflineProvider>
            </ToastProvider>
        );

        expect(setupAxiosErrorInterceptor).toHaveBeenCalledWith(
            mockShowErrorToast,
            false
        );
    });

    it('should use injected isOffline when provided', () => {
        render(
            <ToastProvider>
                <OfflineProvider>
                    <AxiosErrorInterceptor isOffline={true} />
                </OfflineProvider>
            </ToastProvider>
        );

        expect(setupAxiosErrorInterceptor).toHaveBeenCalledWith(
            expect.any(Function),
            true
        );
    });

    it('should re-setup interceptor when dependencies change', () => {
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: true,
        });

        const { rerender } = render(
            <ToastProvider>
                <OfflineProvider>
                    <AxiosErrorInterceptor />
                </OfflineProvider>
            </ToastProvider>
        );

        vi.clearAllMocks();

        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: false,
        });

        act(() => {
            window.dispatchEvent(new Event('offline'));
        });

        rerender(
            <ToastProvider>
                <OfflineProvider>
                    <AxiosErrorInterceptor />
                </OfflineProvider>
            </ToastProvider>
        );

        expect(setupAxiosErrorInterceptor).toHaveBeenCalled();
    });
});
